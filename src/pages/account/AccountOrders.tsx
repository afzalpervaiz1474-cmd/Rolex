import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Order } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { usePrice } from '../../contexts/SettingsContext';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import ProductImage from '../../components/ui/ProductImage';

export default function AccountOrders() {
  const fmt = usePrice();
  const { data, loading, error, refetch: load } = useQuery(() => api<Order[]>('/api/orders'), []);
  const orders = data ?? [];

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">History</p>
        <h2 className="mt-2 font-display text-3xl">Your orders</h2>
      </div>
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package size={22} />} title="No orders yet" description="When you acquire your first object, it will appear here." action={<Button to="/shop">Explore the catalogue</Button>} />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/account/orders/${o.id}`} className="glass card-hover flex flex-col gap-5 rounded-md p-5 hover:border-gold/40 md:flex-row md:items-center">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((it, i) => (
                    <div key={`${it.product_id}-${i}`} className="h-16 w-14 overflow-hidden rounded-sm border border-edge bg-surface">
                      <ProductImage src={it.image} alt={it.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {o.items.length > 3 && (
                    <div className="flex h-16 w-14 items-center justify-center rounded-sm border border-edge bg-surface font-mono text-xs text-muted">+{o.items.length - 3}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-gold">{o.order_number}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(o.created_at)} · {o.items.reduce((s, i) => s + i.quantity, 0)} object{o.items.reduce((s, i) => s + i.quantity, 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <StatusBadge status={o.status} />
                  <span className="font-display text-2xl">{fmt(o.total)}</span>
                  <ChevronRight size={16} className="text-dim" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
