import type { Settings } from './types';

export const round = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShipping: boolean;
}

export function computeTotals(subtotal: number, discount: number, settings: Settings): Totals {
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
    freeShipping,
  };
}
