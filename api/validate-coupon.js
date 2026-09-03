import supabase from './db-client.js';
import { cors, parseBody } from './_auth.js';
import { evaluateCoupon } from './_pricing.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = parseBody(req);
    const code = String(body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;
    if (!code) return res.status(400).json({ error: 'Enter a code' });
    const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    const result = evaluateCoupon(coupon, subtotal);
    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: result.discount,
    });
  } catch (err) {
    console.error('validate-coupon API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
