import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Package } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useQuery } from '../lib/useQuery';
import type { Order } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import { formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import LoadingScreen from '../components/ui/LoadingScreen';
import { ErrorState } from '../components/ui/EmptyState';
import { OrderItemsList, OrderTotals, AddressBlock } from '../components/store/OrderSummaryCard';

export default function OrderConfirmation() {
  const { number = '' } = useParams();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  useSEO(`Order ${number}`, 'Your AETHER order confirmation.');

  let email = params.get('email') ?? '';
  if (!email) {
    try {
      const stored = sessionStorage.getItem('aether-last-order');
      if (stored) {
        const parsed = JSON.parse(stored) as { number?: string; email?: string };
        if (parsed.number === number && parsed.email) email = parsed.email;
      }
    } catch {
      /* ignore */
    }
  }

  const { data: order, loading, error } = useQuery(() => api<Order>(`/api/orders${qs({ number, email })}`), [number, email, user?.id], !authLoading);

  if (loading || authLoading) return <div className="pt-40"><LoadingScreen label="Retrieving your order" /></div>;

  if (error || !order) {
    return (
      <div className="wrap pb-24 pt-40">
        <ErrorState message={error ?? 'Order not found.'} />
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/shop" variant="secondary">Continue shopping</Button>
          {!user && <Button to="/login">Sign in to view orders</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-4xl">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.2 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold bg-gold/10 text-gold shadow-glow"
          >
            <Check size={32} />
          </motion.div>
          <p className="eyebrow mt-8">Order confirmed</p>
          <h1 className="mt-4 font-display text-5xl font-light md:text-7xl">Thank you, {order.shipping_address.full_name.split(' ')[0]}.</h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted md:text-base">
            Your order <span className="font-mono text-gold">{order.order_number}</span> has been received. A confirmation has been sent to{' '}
            <span className="text-ivory">{order.email}</span>. Your objects will be prepared by the atelier and dispatched within 48 hours.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="glass rounded-sm p-6">
            <p className="eyebrow">Status</p>
            <div className="mt-3">
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-3 text-xs text-dim">Placed {formatDate(order.created_at, true)}</p>
          </div>
          <div className="glass rounded-sm p-6">
            <p className="eyebrow">Delivering to</p>
            <div className="mt-3">
              <AddressBlock address={order.shipping_address} />
            </div>
          </div>
          <div className="glass rounded-sm p-6">
            <p className="eyebrow">Payment</p>
            <p className="mt-3 text-sm text-ivory">Card ending •••• {order.payment_last4}</p>
            <p className="mt-1 text-xs text-dim">Demo transaction — no charge made</p>
            {order.notes && <p className="mt-3 text-xs text-muted">Note: {order.notes}</p>}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="glass rounded-sm p-6 lg:col-span-7">
            <p className="eyebrow mb-2">Objects</p>
            <OrderItemsList items={order.items} />
          </div>
          <div className="glass rounded-sm p-6 lg:col-span-5">
            <p className="eyebrow mb-5">Totals</p>
            <OrderTotals order={order} />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Button to={`/account/orders/${order.id}`} variant="secondary" icon={<Package size={14} />}>
              Track in my account
            </Button>
          ) : (
            <Button to="/register" variant="secondary">
              Create an account to track orders
            </Button>
          )}
          <Button to="/shop" iconRight={<ArrowRight size={14} />}>
            Continue exploring
          </Button>
        </div>
        <p className="mt-8 text-center text-xs text-dim">
          Questions? <Link to="/contact" className="text-gold hover:underline">Contact the concierge</Link>.
        </p>
      </motion.div>
    </div>
  );
}
