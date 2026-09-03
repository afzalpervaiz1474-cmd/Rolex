import supabase from './db-client.js';
import { cors, requireAdmin, parseBody } from './_auth.js';
import { getSettings, DEFAULT_SETTINGS } from './_pricing.js';

const ALLOWED = Object.keys(DEFAULT_SETTINGS);

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const settings = await getSettings();
      return res.status(200).json(settings);
    }

    if (req.method === 'PUT') {
      const auth = await requireAdmin(req, res);
      if (!auth) return;
      const body = parseBody(req);
      const entries = Object.entries(body).filter(([k]) => ALLOWED.includes(k));
      if (!entries.length) return res.status(400).json({ error: 'No valid settings provided' });
      for (const [k, v] of entries) {
        if (['tax_rate', 'shipping_flat', 'free_shipping_threshold'].includes(k)) {
          const n = Number(v);
          if (Number.isNaN(n) || n < 0) return res.status(400).json({ error: `${k.replace(/_/g, ' ')} must be a non-negative number` });
          if (k === 'tax_rate' && n > 1) return res.status(400).json({ error: 'Tax rate must be a decimal between 0 and 1 (e.g. 0.08)' });
        }
        if (k === 'currency' && !/^[A-Z]{3}$/.test(String(v))) return res.status(400).json({ error: 'Currency must be a 3-letter ISO code' });
      }
      const { data: existing } = await supabase.from('settings').select('id,key');
      const existingKeys = new Map((existing || []).map((r) => [r.key, r.id]));
      for (const [k, v] of entries) {
        const value = String(v ?? '');
        if (existingKeys.has(k)) {
          const { error } = await supabase.from('settings').update({ value }).eq('id', existingKeys.get(k));
          if (error) throw error;
        } else {
          const { error } = await supabase.from('settings').insert({ key: k, value });
          if (error) throw error;
        }
      }
      return res.status(200).json(await getSettings());
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('settings API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
