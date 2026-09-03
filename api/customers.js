import supabase from './db-client.js';
import { cors, requireAdmin, parseBody } from './_auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const [{ data: profiles, error }, { data: orders }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('user_id,email,total,status,created_at'),
      ]);
      if (error) throw error;
      const stats = new Map();
      (orders || []).forEach((o) => {
        const keys = [o.user_id, (o.email || '').toLowerCase()].filter(Boolean);
        keys.forEach((k) => {
          const s = stats.get(k) || { order_count: 0, total_spent: 0, last_order_at: null, seen: new Set() };
          stats.set(k, s);
        });
        const id = `${o.user_id || ''}|${o.email}|${o.created_at}`;
        keys.forEach((k) => {
          const s = stats.get(k);
          if (s.seen.has(id)) return;
          s.seen.add(id);
          s.order_count += 1;
          if (o.status !== 'cancelled') s.total_spent += Number(o.total) || 0;
          if (!s.last_order_at || o.created_at > s.last_order_at) s.last_order_at = o.created_at;
        });
      });
      const rows = (profiles || []).map((p) => {
        const byId = stats.get(p.id);
        const byEmail = stats.get((p.email || '').toLowerCase());
        const merged = { order_count: 0, total_spent: 0, last_order_at: null, seen: new Set() };
        [byId, byEmail].filter(Boolean).forEach((s) => {
          s.seen.forEach((k) => merged.seen.add(k));
          if (!merged.last_order_at || (s.last_order_at && s.last_order_at > merged.last_order_at)) merged.last_order_at = s.last_order_at;
        });
        // Recount using union of order ids to avoid double counting
        let count = 0;
        let spent = 0;
        (orders || []).forEach((o) => {
          const id = `${o.user_id || ''}|${o.email}|${o.created_at}`;
          if (merged.seen.has(id)) {
            count += 1;
            if (o.status !== 'cancelled') spent += Number(o.total) || 0;
          }
        });
        return { ...p, order_count: count, total_spent: Math.round(spent * 100) / 100, last_order_at: merged.last_order_at };
      });
      return res.status(200).json(rows);
    }

    if (req.method === 'PUT') {
      const body = parseBody(req);
      const id = String(body.id || '');
      const role = String(body.role || '');
      if (!id) return res.status(400).json({ error: 'Customer id is required' });
      if (!['customer', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
      if (id === auth.user.id && role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own admin access' });
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('customers API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
