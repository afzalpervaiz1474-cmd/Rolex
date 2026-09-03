import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { AdminStats } from '../../lib/types';
import { usePrice } from '../../contexts/SettingsContext';
import { formatDate } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard, Stat, Table } from '../../components/admin/AdminPage';
import { StatusBadge } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import ProductImage from '../../components/ui/ProductImage';

function Growth({ v }: { v: number }) {
  return (
    <span className={`inline-flex items-center gap-1 ${v >= 0 ? 'text-success' : 'text-danger'}`}>
      {v >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(v)}% vs prior 30d
    </span>
  );
}

export default function AdminDashboard() {
  useSEO('Admin overview');
  const fmt = usePrice();
  const { data: stats, loading, error, refetch: load } = useQuery(() => api<AdminStats>('/api/admin-stats'), []);

  const maxDay = stats ? Math.max(1, ...stats.revenue_by_day.map((d) => d.revenue)) : 1;

  return (
    <AdminPage eyebrow="Overview" title="Atelier dashboard" description="A live view of revenue, orders, inventory and customer activity.">
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
          <Skeleton className="h-72 sm:col-span-2 xl:col-span-4" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total revenue" value={fmt(stats.revenue)} tone="gold" sub={<Growth v={stats.revenue_growth} />} />
            <Stat label="Orders" value={String(stats.orders_count)} sub={<Growth v={stats.orders_growth} />} />
            <Stat label="Average order" value={fmt(stats.average_order)} sub={`${stats.orders_30d} orders in last 30d`} />
            <Stat label="Customers" value={String(stats.customers_count)} sub={`${stats.active_products} of ${stats.products_count} objects live`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/admin/orders?status=pending" className="glass card-hover flex items-center justify-between rounded-md p-5 hover:border-gold/40">
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-dim">Pending orders</p>
                <p className="mt-2 font-display text-3xl">{stats.pending_orders}</p>
              </div>
              <ArrowUpRight size={16} className="text-gold" />
            </Link>
            <Link to="/admin/reviews?status=pending" className="glass card-hover flex items-center justify-between rounded-md p-5 hover:border-gold/40">
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-dim">Reviews awaiting moderation</p>
                <p className="mt-2 font-display text-3xl">{stats.pending_reviews}</p>
              </div>
              <ArrowUpRight size={16} className="text-gold" />
            </Link>
            <Link to="/admin/messages" className="glass card-hover flex items-center justify-between rounded-md p-5 hover:border-gold/40">
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-dim">New messages</p>
                <p className="mt-2 font-display text-3xl">{stats.new_messages}</p>
              </div>
              <ArrowUpRight size={16} className="text-gold" />
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <AdminCard title="Revenue — last 14 days" className="xl:col-span-2">
              <div className="px-5 pb-5 pt-6">
                <div className="flex h-48 items-end gap-1.5 sm:gap-2">
                  {stats.revenue_by_day.map((d) => (
                    <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" title={`${formatDate(d.date)}: ${fmt(d.revenue)}`}>
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-gold-dim to-gold transition-all duration-500 group-hover:to-gold-bright"
                        style={{ height: `${Math.max(2, (d.revenue / maxDay) * 100)}%` }}
                      />
                      <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-void px-2 py-1 font-mono text-[0.55rem] text-gold group-hover:block">{fmt(d.revenue)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between font-mono text-[0.55rem] uppercase tracking-[0.2em] text-dim">
                  <span>{formatDate(stats.revenue_by_day[0]?.date)}</span>
                  <span>{formatDate(stats.revenue_by_day[stats.revenue_by_day.length - 1]?.date)}</span>
                </div>
              </div>
            </AdminCard>

            <AdminCard title="Low stock" action={<Link to="/admin/products" className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-gold">Manage</Link>}>
              {stats.low_stock.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Inventory is healthy.</p>
              ) : (
                <ul className="divide-y divide-edge">
                  {stats.low_stock.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-10 w-9 overflow-hidden rounded-sm border border-edge">
                        <ProductImage src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <Link to={`/admin/products/${p.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-gold">
                        {p.name}
                      </Link>
                      <span className={`flex items-center gap-1 font-mono text-xs ${p.stock === 0 ? 'text-danger' : 'text-warning'}`}>
                        <AlertTriangle size={12} /> {p.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <AdminCard title="Recent orders" className="xl:col-span-2" action={<Link to="/admin/orders" className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-gold">All orders</Link>}>
              {stats.recent_orders.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
              ) : (
                <Table head={<><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></>} minWidth={600}>
                  {stats.recent_orders.map((o) => (
                    <tr key={o.id} className="transition hover:bg-white/[0.02]">
                      <td>
                        <Link to={`/admin/orders/${o.id}`} className="font-mono text-xs text-gold hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="text-muted">{o.email}</td>
                      <td className="text-muted">{formatDate(o.created_at)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="text-right font-mono">{fmt(o.total)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </AdminCard>

            <AdminCard title="Top objects">
              {stats.top_products.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No sales recorded yet.</p>
              ) : (
                <ul className="divide-y divide-edge">
                  {stats.top_products.map((p, i) => (
                    <li key={p.product_id} className="flex items-center gap-3 px-5 py-3">
                      <span className="font-mono text-[0.6rem] text-dim">{String(i + 1).padStart(2, '0')}</span>
                      <div className="h-10 w-9 overflow-hidden rounded-sm border border-edge">
                        <ProductImage src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{p.name}</p>
                        <p className="font-mono text-[0.58rem] text-dim">{p.quantity} sold</p>
                      </div>
                      <span className="font-mono text-xs text-gold">{fmt(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
