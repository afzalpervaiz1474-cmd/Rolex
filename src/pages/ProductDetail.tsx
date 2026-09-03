import { useState, type FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Zap, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import { api, errorMessage, qs } from '../lib/api';
import { useQuery } from '../lib/useQuery';
import type { Product, Review } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import { cn, formatDate } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { usePrice, useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumbs } from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Rating from '../components/ui/Rating';
import ProductImage from '../components/ui/ProductImage';
import Skeleton from '../components/ui/Skeleton';
import { Input, Textarea } from '../components/ui/Field';
import ProductGrid from '../components/store/ProductGrid';
import SectionHeading from '../components/ui/SectionHeading';
import { ErrorState } from '../components/ui/EmptyState';
import NotFound from './NotFound';

type Tab = 'description' | 'specs' | 'features';

export default function ProductDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const { settings } = useSettings();
  const fmt = usePrice();
  const toast = useToast();
  const { user } = useAuth();

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>('description');
  const [added, setAdded] = useState(false);

  const productQuery = useQuery(() => api<Product>(`/api/products?slug=${encodeURIComponent(slug)}`), [slug]);
  const product = productQuery.data;
  const loading = productQuery.loading;
  const error = productQuery.status === 404 ? null : productQuery.error;

  const extrasQuery = useQuery(
    async () => {
      if (!product) return { related: [] as Product[], reviews: [] as Review[] };
      const [related, reviews] = await Promise.all([
        product.collection
          ? api<Product[]>(`/api/products${qs({ collection: product.collection.slug, exclude: product.id, limit: 4 })}`)
          : api<Product[]>(`/api/products${qs({ exclude: product.id, limit: 4 })}`),
        api<Review[]>(`/api/reviews?product_id=${product.id}`),
      ]);
      return { related, reviews };
    },
    [product?.id],
    Boolean(product)
  );
  const related = extrasQuery.data?.related ?? [];
  const reviews = extrasQuery.data?.reviews ?? [];
  const reviewsLoading = Boolean(product) && extrasQuery.loading;

  useSEO(product?.name ?? 'Object', product?.short_description);

  if (productQuery.status === 404) return <NotFound />;

  const soldOut = !!product && product.stock <= 0;

  const handleAdd = (goToCheckout = false) => {
    if (!product) return;
    const res = addItem(product, qty);
    if (!res.ok) {
      toast.error('Unable to add', res.reason);
      return;
    }
    if (goToCheckout) {
      navigate('/checkout');
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    toast.success('Added to cart', `${qty} × ${product.name}`);
    openCart();
  };

  const freeThreshold = Number(settings.free_shipping_threshold) || 0;

  return (
    <>
      <div className="wrap pt-32 md:pt-40">
        <Breadcrumbs
          crumbs={[
            { label: 'Shop', to: '/shop' },
            ...(product?.collection ? [{ label: product.collection.name, to: `/collections/${product.collection.slug}` }] : []),
            { label: product?.name ?? '…' },
          ]}
        />

        {error ? (
          <ErrorState message={error} onRetry={productQuery.refetch} />
        ) : (
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* GALLERY */}
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-36">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-edge bg-surface sm:aspect-square lg:aspect-[4/5]">
                  {loading || !product ? (
                    <Skeleton className="absolute inset-0 rounded-none" />
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                      >
                        <ProductImage src={product.images[active]} alt={`${product.name} — view ${active + 1}`} loading="eager" className="h-full w-full object-cover" />
                      </motion.div>
                    </AnimatePresence>
                  )}
                  {product && (
                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                      {soldOut && <Badge tone="danger">Sold out</Badge>}
                      {!soldOut && product.stock <= 5 && <Badge tone="warning">Only {product.stock} left</Badge>}
                      {product.compare_at_price && product.compare_at_price > product.price && <Badge tone="gold">Private offer</Badge>}
                    </div>
                  )}
                </div>
                {product && product.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-5 gap-3" role="tablist" aria-label="Product images">
                    {product.images.map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        role="tab"
                        aria-selected={i === active}
                        aria-label={`View image ${i + 1}`}
                        onClick={() => setActive(i)}
                        className={cn(
                          'aspect-square overflow-hidden rounded-sm border transition',
                          i === active ? 'border-gold' : 'border-edge opacity-60 hover:opacity-100'
                        )}
                      >
                        <ProductImage src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* INFO */}
            <div className="lg:col-span-5">
              {loading || !product ? (
                <div className="space-y-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-14 w-3/4" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                  {product.collection && (
                    <Link to={`/collections/${product.collection.slug}`} className="eyebrow hover:text-gold-bright">
                      {product.collection.name}
                    </Link>
                  )}
                  <h1 className="mt-3 font-display text-5xl font-light leading-[0.95] md:text-6xl">{product.name}</h1>
                  <div className="mt-5 flex flex-wrap items-center gap-5">
                    <p className="font-mono text-2xl text-gold">{fmt(product.price)}</p>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <p className="font-mono text-sm text-dim line-through">{fmt(product.compare_at_price)}</p>
                    )}
                    <Rating value={product.rating} count={product.review_count} />
                  </div>
                  <p className="mt-6 text-base leading-relaxed text-muted">{product.short_description}</p>

                  <div className="mt-8 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.22em]">
                    <span className={cn('h-2 w-2 rounded-full', soldOut ? 'bg-danger' : product.stock <= 5 ? 'bg-warning' : 'bg-success')} aria-hidden="true" />
                    <span className="text-muted">{soldOut ? 'Currently sold out' : product.stock <= 5 ? `Limited — ${product.stock} remaining` : 'In stock, ships within 48 hours'}</span>
                    <span className="text-dim">· {product.sku}</span>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <div className="flex h-14 items-center rounded-sm border border-edge">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-full w-12 items-center justify-center text-muted transition hover:text-ivory" aria-label="Decrease quantity" disabled={soldOut}>
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-mono text-sm" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                        disabled={soldOut || qty >= product.stock}
                        className="flex h-full w-12 items-center justify-center text-muted transition hover:text-ivory disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <Button size="lg" className="flex-1" disabled={soldOut} onClick={() => handleAdd(false)} icon={added ? <Check size={16} /> : <ShoppingBag size={16} />}>
                      {soldOut ? 'Sold out' : added ? 'Added' : 'Add to cart'}
                    </Button>
                  </div>
                  {!soldOut && (
                    <Button size="lg" variant="secondary" full className="mt-3" onClick={() => handleAdd(true)} icon={<Zap size={15} />}>
                      Buy now
                    </Button>
                  )}

                  <ul className="mt-8 grid grid-cols-1 gap-3 border-t border-edge pt-6 text-xs text-muted sm:grid-cols-3">
                    <li className="flex items-center gap-2">
                      <Truck size={14} className="text-gold" /> {freeThreshold ? `Free delivery over ${fmt(freeThreshold)}` : 'Insured delivery'}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-gold" /> Lifetime guarantee
                    </li>
                    <li className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-gold" /> 30-day returns
                    </li>
                  </ul>

                  {/* TABS */}
                  <div className="mt-10">
                    <div role="tablist" aria-label="Product details" className="flex gap-6 border-b border-edge">
                      {(
                        [
                          ['description', 'Description'],
                          ['specs', 'Specifications'],
                          ['features', 'Features'],
                        ] as [Tab, string][]
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          role="tab"
                          type="button"
                          aria-selected={tab === key}
                          onClick={() => setTab(key)}
                          className={cn(
                            'relative pb-3 font-mono text-[0.62rem] uppercase tracking-[0.25em] transition',
                            tab === key ? 'text-gold' : 'text-muted hover:text-ivory'
                          )}
                        >
                          {label}
                          {tab === key && <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-px bg-gold" />}
                        </button>
                      ))}
                    </div>
                    <div role="tabpanel" className="pt-6">
                      {tab === 'description' && (
                        <div className="space-y-4 text-sm leading-relaxed text-muted">
                          {product.description.split('\n').filter(Boolean).map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                          {product.materials && (
                            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Materials — {product.materials}</p>
                          )}
                        </div>
                      )}
                      {tab === 'specs' && (
                        product.specs.length ? (
                          <dl className="divide-y divide-edge">
                            {product.specs.map((s) => (
                              <div key={s.label} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4 py-3 text-sm">
                                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">{s.label}</dt>
                                <dd className="text-ivory">{s.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="text-sm text-muted">Specifications will be published with the series documentation.</p>
                        )
                      )}
                      {tab === 'features' && (
                        product.features.length ? (
                          <ul className="space-y-3">
                            {product.features.map((f) => (
                              <li key={f} className="flex items-start gap-3 text-sm text-muted">
                                <span className="mt-2 h-px w-4 shrink-0 bg-gold" aria-hidden="true" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted">Feature notes are being finalised for this object.</p>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REVIEWS */}
      {product && (
        <section className="wrap py-24">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow mb-4">Collector notes</p>
              <h2 className="font-display text-4xl font-light md:text-5xl">Reviews</h2>
              <div className="mt-6 flex items-end gap-4">
                <span className="font-display text-7xl leading-none text-gold">{product.rating > 0 ? product.rating.toFixed(1) : '—'}</span>
                <div className="pb-2">
                  <Rating value={product.rating} size={16} />
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">
                    {product.review_count} verified review{product.review_count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="mt-10">
                <ReviewForm productId={product.id} signedIn={Boolean(user)} onSubmitted={() => toast.success('Thank you', 'Your review has been submitted for moderation.')} />
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {reviewsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="glass rounded-sm p-10 text-center">
                  <p className="font-display text-2xl">No notes yet</p>
                  <p className="mt-2 text-sm text-muted">Be the first collector to share your experience with this object.</p>
                </div>
              ) : (
                <ul className="divide-y divide-edge">
                  {reviews.map((r) => (
                    <li key={r.id} className="py-8 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Rating value={r.rating} />
                          <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">{formatDate(r.created_at)}</span>
                        </div>
                        <Badge tone="success">Verified</Badge>
                      </div>
                      <h3 className="mt-4 font-display text-2xl">{r.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{r.body}</p>
                      <p className="mt-4 text-xs text-ivory">— {r.author_name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* RELATED */}
      {product && related.length > 0 && (
        <section className="wrap pb-24">
          <SectionHeading eyebrow="Complete the study" title="Related objects" action={<Link to={product.collection ? `/collections/${product.collection.slug}` : '/shop'} className="link-underline font-mono text-[0.65rem] uppercase tracking-[0.28em] text-gold">View collection</Link>} />
          <div className="mt-12">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  );
}

function ReviewForm({ productId, signedIn, onSubmitted }: { productId: number; signedIn: boolean; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!signedIn) {
    return (
      <div className="glass rounded-sm p-6">
        <p className="text-sm text-muted">Sign in to leave a collector note on this object.</p>
        <Button to="/login" variant="outline" size="sm" className="mt-4">
          Sign in
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="glass rounded-sm border-success/30 p-6" role="status">
        <p className="flex items-center gap-2 text-sm text-success">
          <Check size={16} /> Review submitted. It will appear once approved by the atelier.
        </p>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (title.trim().length < 3) next.title = 'Give your note a title (3+ characters).';
    if (body.trim().length < 10) next.body = 'Share a little more (10+ characters).';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await api('/api/reviews', { method: 'POST', body: { product_id: productId, rating, title: title.trim(), body: body.trim() } });
      setDone(true);
      onSubmitted();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass space-y-5 rounded-sm p-6" noValidate>
      <p className="font-display text-xl">Leave a note</p>
      <div>
        <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted">Your rating</p>
        <Rating value={rating} interactive onChange={setRating} size={20} />
      </div>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} placeholder="A quiet masterpiece" maxLength={80} />
      <Textarea label="Your note" value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} placeholder="How does it live with you?" maxLength={1500} />
      {serverError && (
        <p className="text-xs text-danger" role="alert">
          {serverError}
        </p>
      )}
      <Button type="submit" loading={submitting} full>
        Submit review
      </Button>
    </form>
  );
}
