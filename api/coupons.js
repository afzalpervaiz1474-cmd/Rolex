import supabase from './db-client.js';
import { cors, requireAdmin, parseBody } from './_auth.js';

function normalize(body, partial) {
  const out = {};
  const errors = [];
  if (body.code !== undefined) {
    out.code = String(body.code).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!out.code) errors.push('Code is required');
  } else if (!partial) errors.push('Code is required');

  if (body.type !== undefined) {
    out.type = String(body.type);
    if (!['percent', 'fixed'].includes(out.type)) errors.push('Type must be percent or fixed');
  } else if (!partial) errors.push('Type is required');

  if (body.value !== undefined) {
    const v = Number(body.value);
    if (Number.isNaN(v) || v <= 0) errors.push('Value must be greater than zero');
    else out.value = v;
  } else if (!partial) errors.push('Value is required');

  if (body.min_subtotal !== undefined) {
    const v = body.min_subtotal === '' || body.min_subtotal === null ? 0 : Number(body.min_subtotal);
    if (Number.isNaN(v) || v < 0) errors.push('Minimum subtotal must be zero or more');
    else out.min_subtotal = v;
  }
  if (body.max_uses !== undefined) {
    if (body.max_uses === '' || body.max_uses === null) out.max_uses = null;
    else {
      const v = Number(body.max_uses);
      if (!Number.isInteger(v) || v < 1) errors.push('Max uses must be a whole number of at least 1');
      else out.max_uses = v;
    }
  }
  if (body.expires_at !== undefined) {
    if (!body.expires_at) out.expires_at = null;
    else {
      const d = new Date(body.expires_at);
      if (Number.isNaN(d.getTime())) errors.push('Expiry date is invalid');
      else out.expires_at = d.toISOString();
    }
  }
  if (body.active !== undefined) out.active = Boolean(body.active);
  const type = out.type;
  if (type === 'percent' && out.value !== undefined && out.value > 100) errors.push('Percent value cannot exceed 100');
  return { out, errors };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    const body = parseBody(req);

    if (req.method === 'POST') {
      const { out, errors } = normalize(body, false);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const { data: dupe } = await supabase.from('coupons').select('id').eq('code', out.code).maybeSingle();
      if (dupe) return res.status(400).json({ error: 'A coupon with this code already exists' });
      const row = { min_subtotal: 0, max_uses: null, used_count: 0, expires_at: null, active: true, ...out };
      const { data, error } = await supabase.from('coupons').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Coupon id is required' });
      const { out, errors } = normalize(body, true);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      if (out.code) {
        const { data: dupe } = await supabase.from('coupons').select('id').eq('code', out.code).neq('id', id).maybeSingle();
        if (dupe) return res.status(400).json({ error: 'A coupon with this code already exists' });
      }
      const { data, error } = await supabase.from('coupons').update(out).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const id = Number(body.id || req.query?.id);
      if (!id) return res.status(400).json({ error: 'Coupon id is required' });
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('coupons API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
