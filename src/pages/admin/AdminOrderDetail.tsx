import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Mail } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Order, OrderStatus } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard } from '../../components/admin/AdminPage';
import { StatusBadge } from '../../components/ui/Badge';
import { Select, Textarea } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { OrderItemsList, OrderTotals, AddressBlock } from '../../components/store/OrderSummaryCard';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  useSEO('Order — Admin');
  const { data: order, loading, error, refetch: load, setData: setOrder } = useQuery(() => api<Order>(`/api/orders?id=${id}`), [id]);

  if (loading) return <TableSkeleton rows={6} />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={load} />;

  return (
    <AdminPage
      eyebrow="Order"
      title={order.order_number}
      description={`Placed ${formatDate(order.created_at, true)} · Updated ${formatDate(order.updated_at, true)}`}
      actions={
        <>
          <Button variant="ghost" to="/admin/orders" icon={<ChevronLeft size={14} />}>All orders</Button>
          <Button href={`mailto:${order.email}?subject=Your AETHER order ${order.order_number}`} variant="secondary" icon={<Mail size={14} />}>Email customer</Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title="Objects">
            <div className="px-5"><OrderItemsList items={order.items} /></div>
          </AdminCard>
          <FulfilmentForm key={`${order.id}-${order.updated_at}`} order={order} onSaved={setOrder} />
        </div>
        <div className="space-y-6">
          <AdminCard title="Totals"><div className="p-5"><OrderTotals order={order} /></div></AdminCard>
          <AdminCard title="Customer">
            <div className="space-y-4 p-5 text-sm">
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-dim">Email</p>
                <a href={`mailto:${order.email}`} className="mt-1 block text-ivory hover:text-gold">{order.email}</a>
                {order.user_id ? <Link to="/admin/customers" className="mt-1 block font-mono text-[0.58rem] uppercase tracking-wider text-gold">Registered customer</Link> : <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-wider text-dim">Guest checkout</p>}
              </div>
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-dim">Delivery address</p>
                <div className="mt-1"><AddressBlock address={order.shipping_address} /></div>
              </div>
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-dim">Payment</p>
                <p className="mt-1 text-ivory">Card •••• {order.payment_last4}</p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPage>
  );
}

function FulfilmentForm({ order, onSaved }: { order: Order; onSaved: (o: Order) => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [notes, setNotes] = useState(order.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api<Order>('/api/orders', { method: 'PUT', body: { id: order.id, status, notes } });
      onSaved(updated);
      toast.success('Order updated', `${updated.order_number} is now ${updated.status}`);
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard title="Fulfilment">
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-dim">Current</span>
          <StatusBadge status={order.status} />
        </div>
        <Select
          label="Update status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          hint={status === 'cancelled' && order.status !== 'cancelled' ? 'Cancelling will return reserved stock to the catalogue.' : undefined}
        />
        <Textarea label="Internal / customer notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" />
        <div className="flex justify-end">
          <Button onClick={save} loading={saving} disabled={status === order.status && notes === (order.notes || '')}>
            Save changes
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
