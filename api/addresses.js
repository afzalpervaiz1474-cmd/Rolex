import supabase from './db-client.js';
import { cors, requireUser, parseBody } from './_auth.js';

const REQUIRED = ['full_name', 'line1', 'city', 'state', 'postal_code', 'country'];
const FIELDS = ['label', 'full_name', 'line1', 'line2', 'city', 'state', 'postal_code', 'country', 'phone'];

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;
    const uid = auth.user.id;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', uid)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    const body = parseBody(req);

    if (req.method === 'POST' || req.method === 'PUT') {
      const out = {};
      FIELDS.forEach((f) => {
        if (body[f] !== undefined) out[f] = String(body[f] ?? '').trim();
      });
      if (req.method === 'POST') {
        for (const f of REQUIRED) if (!out[f]) return res.status(400).json({ error: `${f.replace('_', ' ')} is required` });
      } else {
        for (const f of REQUIRED) if (out[f] !== undefined && !out[f]) return res.status(400).json({ error: `${f.replace('_', ' ')} is required` });
      }
      const makeDefault = Boolean(body.is_default);

      if (req.method === 'POST') {
        const { data: existing } = await supabase.from('addresses').select('id').eq('user_id', uid);
        const isFirst = !existing || existing.length === 0;
        if (makeDefault) await supabase.from('addresses').update({ is_default: false }).eq('user_id', uid);
        const row = { label: '', line2: '', phone: '', ...out, user_id: uid, is_default: makeDefault || isFirst };
        const { data, error } = await supabase.from('addresses').insert(row).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Address id is required' });
      const { data: owned } = await supabase.from('addresses').select('id').eq('id', id).eq('user_id', uid).maybeSingle();
      if (!owned) return res.status(404).json({ error: 'Address not found' });
      if (body.is_default !== undefined) {
        if (makeDefault) await supabase.from('addresses').update({ is_default: false }).eq('user_id', uid);
        out.is_default = makeDefault;
      }
      const { data, error } = await supabase.from('addresses').update(out).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const id = Number(body.id || req.query?.id);
      if (!id) return res.status(400).json({ error: 'Address id is required' });
      const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', uid);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('addresses API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
