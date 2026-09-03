import supabase from './db-client.js';
import { cors, requireUser, parseBody } from './_auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    if (req.method === 'GET') return res.status(200).json(auth.profile);

    if (req.method === 'PUT') {
      const body = parseBody(req);
      const patch = {};
      if (body.full_name !== undefined) {
        patch.full_name = String(body.full_name).trim();
        if (patch.full_name.length > 80) return res.status(400).json({ error: 'Name is too long' });
      }
      if (body.phone !== undefined) {
        patch.phone = String(body.phone).trim();
        if (patch.phone && !/^[+\d\s()-]{6,24}$/.test(patch.phone)) return res.status(400).json({ error: 'Phone number looks invalid' });
      }
      if (body.avatar_url !== undefined) patch.avatar_url = String(body.avatar_url).trim();
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', auth.user.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
