import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { usePrice, useSettings } from '../contexts/SettingsContext';
import { computeTotals } from '../lib/pricing';
import { useSEO } from '../lib/useSEO';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import ProductImage from '../components/ui/ProductImage';
import EmptyState from '../components/ui/EmptyState';

export default function Cart() {
  useSEO('Cart', 'Review your AETHER selection.');
  const { items, updateQuantity, removeItem, subtotal, count, clearCart } = useCart();
  const { settings } = useSettings();
  const fmt = usePrice();
  const navigate = useNavigate();
  const totals = computeTotals(subtotal, 0, settings);

  return (
    <>
      <PageHeader
        eyebrow="Your selection"
        title={
          <>
            Cart <span className="italic text-muted">({count})</span>
          </>
        }
        crumbs={[{ label: 'Cart' }]}
      />
      <div className="wrap pb-24">
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title="Your cart is empty"
            description="Begin with an object that will outlast its era."
            action={<Button to="/shop">Explore the catalogue</Button>}
          />
        ) : (
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <ul className="divide-y divide-edge border-y border-edge">
                {items.map((item) => (
                  <li key={item.product_id} className="flex gap-5 py-6 sm:gap-8">
                    <Link to={`/products/${item.slug}`} className="h-36 w-28 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface sm:h-44 sm:w-36">
                      <ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="eyebrow text-[0.55rem]">{item.collection}</p>
                          <Link to={`/products/${item.slug}`} className="mt-1 block font-display text-2xl leading-tight hover:text-gold">
                            {item.name}
                          </Link>
                          <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">{item.sku}</p>
                        </div>
                        <p className="shrink-0 font-mono text-base text-gold">{fmt(item.price * item.quantity)}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                        <div className="flex items-center rounded-sm border border-edge">
                          <button
                            type="button"
                            onClick={() => (item.quantity <= 1 ? removeItem(item.product_id) : updateQuantity(item.product_id, item.quantity - 1))}
                            className="flex h-10 w-10 items-center justify-center text-muted transition hover:text-ivory"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-10 text-center font-mono text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="flex h-10 w-10 items-center justify-center text-muted transition hover:text-ivory disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-dim">{fmt(item.price)} each</span>
                          <button type="button" onClick={() => removeItem(item.product_id)} className="flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim transition hover:text-danger">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <Link to="/shop" className="link-underline font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted hover:text-ivory">
                  Continue browsing
                </Link>
                <button type="button" onClick={clearCart} className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim transition hover:text-danger">
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="glass sticky top-36 rounded-sm p-7">
                <p className="eyebrow">Summary</p>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="font-mono">{fmt(totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Estimated shipping</dt>
                    <dd className="font-mono">{totals.shipping === 0 ? 'Complimentary' : fmt(totals.shipping)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Estimated tax</dt>
                    <dd className="font-mono">{fmt(totals.tax)}</dd>
                  </div>
                </dl>
                <div className="hairline my-5" />
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted">Total</span>
                  <span className="font-display text-4xl">{fmt(totals.total)}</span>
                </div>
                <p className="mt-2 text-xs text-dim">Codes and final totals are applied at checkout.</p>
                <Button full size="lg" className="mt-6" iconRight={<ArrowRight size={14} />} onClick={() => navigate('/checkout')}>
                  Proceed to checkout
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
