import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Order, OrderStatus } from '../../lib/types';
import { formatDate, cn } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { OrderItemsList, OrderTotals, AddressBlock } from '../../components/store/OrderSummaryCard';

const STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function AccountOrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, error, refetch: load, setData: setOrder } = useQuery(() => api<Order>(`/api/orders?id=${id}`), [id]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await api<Order>('/api/orders', { method: 'PUT', body: { id: order.id, status: 'cancelled' } });
      setOrder(updated);
      toast.success('Order cancelled', 'Any reserved stock has been released.');
      setConfirmCancel(false);
    } catch (err) {
      toast.error('Could not cancel', errorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <TableSkeleton rows={5} />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={load} />;

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div>
      <Link to="/account/orders" className="mb-6 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted hover:text-ivory">
        <ChevronLeft size={12} /> All orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h2 className="mt-2 font-mono text-2xl text-gold">{order.order_number}</h2>
          <p className="mt-1 text-xs text-muted">Placed {formatDate(order.created_at, true)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {order.status === 'pending' && (
            <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      {order.status !== 'cancelled' && (
        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-2">
              <span className={cn('h-px w-full', i <= stepIndex ? 'bg-gold' : 'bg-edge')} aria-hidden="true" />
              <span className={cn('font-mono text-[0.58rem] uppercase tracking-[0.2em]', i <= stepIndex ? 'text-gold' : 'text-dim')}>{s}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="glass rounded-md p-6 lg:col-span-7">
          <p className="eyebrow mb-2">Objects</p>
          <OrderItemsList items={order.items} />
        </div>
        <div className="space-y-6 lg:col-span-5">
          <div className="glass rounded-md p-6">
            <p className="eyebrow mb-5">Totals</p>
            <OrderTotals order={order} />
          </div>
          <div className="glass rounded-md p-6">
            <p className="eyebrow mb-3">Delivering to</p>
            <AddressBlock address={order.shipping_address} />
            <p className="mt-4 border-t border-edge pt-4 text-xs text-muted">Card ending •••• {order.payment_last4}</p>
            {order.notes && <p className="mt-2 text-xs text-muted">Note: {order.notes}</p>}
          </div>
        </div>
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this order?" size="sm" description="This cannot be undone. Reserved objects will return to the catalogue.">
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
            Keep order
          </Button>
          <Button variant="danger" loading={cancelling} onClick={cancel}>
            Cancel order
          </Button>
        </div>
      </Modal>
    </div>
  );
}
