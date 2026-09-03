import supabase from './db-client.js';

export const DEFAULT_SETTINGS = {
  store_name: 'AETHER',
  tagline: 'Objects for the next century',
  announcement: 'Complimentary carbon-neutral delivery on orders over $500',
  currency: 'USD',
  tax_rate: '0.08',
  shipping_flat: '25',
  free_shipping_threshold: '500',
  contact_email: 'concierge@aether.store',
  contact_phone: '+1 (212) 555-0142',
  address: '88 Mercer Street, New York, NY 10012',
  hours: 'Monday – Saturday, 10:00 – 19:00 EST',
  instagram: 'https://instagram.com',
  twitter: 'https://x.com',
};

export const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function getSettings() {
  const { data } = await supabase.from('settings').select('key,value');
  const out = { ...DEFAULT_SETTINGS };
  (data || []).forEach((row) => {
    if (row.value !== null && row.value !== undefined) out[row.key] = String(row.value);
  });
  return out;
}

export function evaluateCoupon(coupon, subtotal) {
  if (!coupon) return { ok: false, error: 'We could not find that code' };
  if (!coupon.active) return { ok: false, error: 'This code is no longer active' };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'This code has expired' };
  }
  if (coupon.max_uses !== null && coupon.max_uses !== undefined && coupon.used_count >= coupon.max_uses) {
    return { ok: false, error: 'This code has reached its usage limit' };
  }
  if (coupon.min_subtotal && subtotal < coupon.min_subtotal) {
    return { ok: false, error: `A minimum order of $${coupon.min_subtotal} is required for this code` };
  }
  const discount =
    coupon.type === 'percent' ? (subtotal * Number(coupon.value)) / 100 : Math.min(Number(coupon.value), subtotal);
  return { ok: true, discount: round(discount) };
}

export function computeTotals({ subtotal, discount, settings }) {
  const taxRate = Number(settings.tax_rate) || 0;
  const flat = Number(settings.shipping_flat) || 0;
  const threshold = Number(settings.free_shipping_threshold);
  const net = Math.max(0, subtotal - discount);
  const freeShipping = Number.isFinite(threshold) && threshold > 0 && net >= threshold;
  const shipping = net === 0 ? 0 : freeShipping ? 0 : flat;
  const tax = round(net * taxRate);
  return {
    subtotal: round(subtotal),
    discount: round(discount),
    shipping: round(shipping),
    tax,
    total: round(net + shipping + tax),
  };
}
