import supabase from './db-client.js';
import { cors, parseBody, isEmail, requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const auth = await requireAdmin(req, res);
      if (!auth) return;
      const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const body = parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
      const { data: existing } = await supabase.from('subscribers').select('id').eq('email', email).maybeSingle();
      if (existing) return res.status(200).json({ ok: true, already: true });
      const { error } = await supabase.from('subscribers').insert({ email, source: String(body.source || 'footer') });
      if (error) throw error;
      return res.status(201).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('subscribe API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
