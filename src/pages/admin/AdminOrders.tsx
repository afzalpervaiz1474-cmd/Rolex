import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Order, OrderStatus } from '../../lib/types';
import { usePrice } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, cn } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard, Table } from '../../components/admin/AdminPage';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  useSEO('Orders — Admin');
  const fmt = usePrice();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const { data, loading, error, refetch: load, setData } = useQuery(() => api<Order[]>('/api/orders'), []);
  const orders = useMemo(() => data ?? [], [data]);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  const counts = useMemo(() => orders.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {}), [orders]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o) => (!status || o.status === status) && (!s || o.order_number.toLowerCase().includes(s) || o.email.toLowerCase().includes(s) || o.shipping_address?.full_name?.toLowerCase().includes(s)));
  }, [orders, status, search]);

  const changeStatus = async (o: Order, next: OrderStatus) => {
    if (next === o.status) return;
    setUpdating(o.id);
    try {
      const updated = await api<Order>('/api/orders', { method: 'PUT', body: { id: o.id, status: next } });
      setData((prev) => (prev ?? []).map((x) => (x.id === o.id ? updated : x)));
      toast.success('Status updated', `${o.order_number} → ${next}`);
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminPage title="Orders" description={`${orders.length} orders total`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={!status} onClick={() => setParams({})} label="All" count={orders.length} />
        {STATUSES.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setParams({ status: s })} label={s} count={counts[s] || 0} />
        ))}
      </div>
      <AdminCard>
        <div className="border-b border-edge p-4">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number, email or name" aria-label="Search orders" className="h-11 w-full rounded-sm border border-edge bg-white/[0.03] pl-9 pr-3 text-sm text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-4"><EmptyState title="No orders match" description="Try another status or search term." /></div>
        ) : (
          <Table head={<><th>Order</th><th>Customer</th><th>Items</th><th>Date</th><th>Status</th><th className="text-right">Total</th></>} minWidth={820}>
            {filtered.map((o) => (
              <tr key={o.id} className="transition hover:bg-white/[0.02]">
                <td>
                  <Link to={`/admin/orders/${o.id}`} className="font-mono text-xs text-gold hover:underline">{o.order_number}</Link>
                  {o.coupon_code && <p className="font-mono text-[0.55rem] uppercase tracking-wider text-dim">{o.coupon_code}</p>}
                </td>
                <td>
                  <p className="text-ivory">{o.shipping_address?.full_name}</p>
                  <p className="text-xs text-muted">{o.email}</p>
                </td>
                <td className="font-mono text-muted">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="text-muted">{formatDate(o.created_at)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <select
                      aria-label={`Change status for ${o.order_number}`}
                      value={o.status}
                      disabled={updating === o.id}
                      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                      className="h-8 rounded-sm border border-edge bg-surface px-2 font-mono text-[0.6rem] uppercase tracking-wider text-muted focus:border-gold/60 focus:outline-none disabled:opacity-40"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="text-right font-mono">{fmt(o.total)}</td>
              </tr>
            ))}
          </Table>
        )}
      </AdminCard>
    </AdminPage>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn('flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] transition', active ? 'border-gold bg-gold/10 text-gold' : 'border-edge text-muted hover:border-edge-strong hover:text-ivory')}>
      {label} <span className="text-dim">{count}</span>
    </button>
  );
}
