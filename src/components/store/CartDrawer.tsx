import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { usePrice, useSettings } from '../../contexts/SettingsContext';
import ProductImage from '../ui/ProductImage';
import Button from '../ui/Button';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, count } = useCart();
  const { settings } = useSettings();
  const fmt = usePrice();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeCart]);

  const threshold = Number(settings.free_shipping_threshold) || 0;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="glass-strong absolute inset-y-0 right-0 flex w-full max-w-md flex-col shadow-deep"
          >
            <div className="flex items-center justify-between border-b border-edge px-6 py-5">
              <div>
                <p className="eyebrow">Your selection</p>
                <h2 className="mt-1 font-display text-2xl">
                  Cart <span className="text-muted">({count})</span>
                </h2>
              </div>
              <button type="button" onClick={closeCart} className="rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-ivory" aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 text-gold">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="font-display text-2xl">Your cart is empty</h3>
                <p className="max-w-xs text-sm text-muted">Begin with an object that will outlast its era.</p>
                <Button variant="outline" onClick={() => { closeCart(); navigate('/shop'); }}>
                  Explore the catalogue
                </Button>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                  {items.map((item) => (
                    <li key={item.product_id} className="flex gap-4">
                      <Link to={`/products/${item.slug}`} onClick={closeCart} className="h-28 w-24 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface">
                        <ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="eyebrow text-[0.55rem]">{item.collection}</p>
                        <Link to={`/products/${item.slug}`} onClick={closeCart} className="mt-1 font-display text-lg leading-tight hover:text-gold">
                          {item.name}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-gold">{fmt(item.price)}</p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center rounded-sm border border-edge">
                            <button
                              type="button"
                              onClick={() => (item.quantity <= 1 ? removeItem(item.product_id) : updateQuantity(item.product_id, item.quantity - 1))}
                              className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-ivory"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-mono text-xs" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-ivory disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id)}
                            className="rounded p-1.5 text-dim transition hover:text-danger"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-edge px-6 py-6">
                  {threshold > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-xs text-muted">
                        {remaining > 0 ? (
                          <>
                            Add <span className="text-gold">{fmt(remaining)}</span> for complimentary delivery
                          </>
                        ) : (
                          <span className="text-success">Complimentary delivery unlocked</span>
                        )}
                      </p>
                      <div className="h-px w-full bg-white/10">
                        <motion.div className="h-px bg-gold" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted">Subtotal</span>
                    <span className="font-display text-2xl">{fmt(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-dim">Shipping and taxes calculated at checkout.</p>
                  <div className="mt-5 flex flex-col gap-3">
                    <Button full size="lg" iconRight={<ArrowRight size={14} />} onClick={() => { closeCart(); navigate('/checkout'); }}>
                      Checkout
                    </Button>
                    <Button full variant="ghost" onClick={() => { closeCart(); navigate('/cart'); }}>
                      View full cart
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
