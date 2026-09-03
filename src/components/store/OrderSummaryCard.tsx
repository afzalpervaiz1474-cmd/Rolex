import type { Order } from '../../lib/types';
import { usePrice } from '../../contexts/SettingsContext';
import ProductImage from '../ui/ProductImage';
import { Link } from 'react-router-dom';

export function OrderItemsList({ items, linkable = true }: { items: Order['items']; linkable?: boolean }) {
  const fmt = usePrice();
  return (
    <ul className="divide-y divide-edge">
      {items.map((it) => (
        <li key={`${it.product_id}-${it.sku}`} className="flex items-center gap-4 py-4">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface">
            <ProductImage src={it.image} alt={it.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            {linkable ? (
              <Link to={`/products/${it.slug}`} className="font-display text-lg leading-tight hover:text-gold">
                {it.name}
              </Link>
            ) : (
              <p className="font-display text-lg leading-tight">{it.name}</p>
            )}
            <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">
              {it.sku} · Qty {it.quantity}
            </p>
          </div>
          <p className="font-mono text-sm text-gold">{fmt(it.price * it.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'font-mono text-success' : 'font-mono text-ivory'}>{value}</span>
    </div>
  );
}

export function OrderTotals({ order }: { order: Pick<Order, 'subtotal' | 'discount' | 'shipping' | 'tax' | 'total' | 'coupon_code'> }) {
  const fmt = usePrice();
  return (
    <div className="space-y-2.5">
      <Row label="Subtotal" value={fmt(order.subtotal)} />
      {order.discount > 0 && <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`} value={`−${fmt(order.discount)}`} accent />}
      <Row label="Shipping" value={order.shipping === 0 ? 'Complimentary' : fmt(order.shipping)} />
      <Row label="Tax" value={fmt(order.tax)} />
      <div className="hairline my-3" />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted">Total</span>
        <span className="font-display text-3xl">{fmt(order.total)}</span>
      </div>
    </div>
  );
}

export function AddressBlock({ address }: { address: Order['shipping_address'] }) {
  if (!address) return null;
  return (
    <address className="text-sm not-italic leading-relaxed text-muted">
      <p className="text-ivory">{address.full_name}</p>
      <p>{address.line1}</p>
      {address.line2 && <p>{address.line2}</p>}
      <p>
        {address.city}, {address.state} {address.postal_code}
      </p>
      <p>{address.country}</p>
      {address.phone && <p className="mt-1 font-mono text-xs">{address.phone}</p>}
    </address>
  );
}
