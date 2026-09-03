import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { Lock, Tag, X, ChevronLeft, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePrice, useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { api, errorMessage } from '../lib/api';
import { computeTotals } from '../lib/pricing';
import { isEmail, luhnValid, formatCardNumber, formatExpiry, expiryValid, cn } from '../lib/utils';
import type { Address, CouponValidation, Order, Profile } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import { Input, Checkbox, Textarea } from '../components/ui/Field';
import Button from '../components/ui/Button';
import ProductImage from '../components/ui/ProductImage';
import LoadingScreen from '../components/ui/LoadingScreen';

interface FormState {
  email: string;
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  card_name: string;
  card_number: string;
  card_expiry: string;
  card_cvc: string;
  notes: string;
  save_address: boolean;
}

const initial: FormState = {
  email: '',
  full_name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'United States',
  phone: '',
  card_name: '',
  card_number: '',
  card_expiry: '',
  card_cvc: '',
  notes: '',
  save_address: false,
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function Checkout() {
  useSEO('Checkout', 'Secure checkout.');
  const { user, profile, loading, profileLoading } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) navigate('/cart', { replace: true });
  }, [items.length, navigate]);

  if (loading || (user && profileLoading && !profile)) {
    return (
      <div className="pt-40">
        <LoadingScreen label="Preparing checkout" />
      </div>
    );
  }
  if (items.length === 0) return null;
  return <CheckoutForm key={user?.id ?? 'guest'} user={user} profile={profile} />;
}

function CheckoutForm({ user, profile }: { user: User | null; profile: Profile | null }) {
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const fmt = usePrice();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(() => ({
    ...initial,
    email: user?.email ?? '',
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | 'new'>('new');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const applyAddress = (a: Address) => {
    setSelectedAddress(a.id);
    setForm((f) => ({
      ...f,
      full_name: a.full_name,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      postal_code: a.postal_code,
      country: a.country,
      phone: a.phone || f.phone,
      save_address: false,
    }));
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<Address[]>('/api/addresses')
      .then((list) => {
        if (cancelled) return;
        setAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) {
          setSelectedAddress(def.id);
          setForm((f) => ({
            ...f,
            full_name: def.full_name,
            line1: def.line1,
            line2: def.line2,
            city: def.city,
            state: def.state,
            postal_code: def.postal_code,
            country: def.country,
            phone: def.phone || f.phone,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const discount = coupon?.discount ?? 0;
  const totals = useMemo(() => computeTotals(subtotal, discount, settings), [subtotal, discount, settings]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const value = key === 'card_number' ? formatCardNumber(raw) : key === 'card_expiry' ? formatExpiry(raw) : key === 'card_cvc' ? raw.replace(/\D/g, '').slice(0, 4) : raw;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    if (['full_name', 'line1', 'line2', 'city', 'state', 'postal_code', 'country'].includes(key)) setSelectedAddress('new');
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!isEmail(form.email)) e.email = 'Enter a valid email address.';
    if (form.full_name.trim().length < 2) e.full_name = 'Enter the recipient’s full name.';
    if (!form.line1.trim()) e.line1 = 'Street address is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.state.trim()) e.state = 'State / region is required.';
    if (!form.postal_code.trim()) e.postal_code = 'Postal code is required.';
    if (!form.country.trim()) e.country = 'Country is required.';
    if (form.phone && !/^[+\d\s()-]{6,24}$/.test(form.phone)) e.phone = 'Phone number looks invalid.';
    if (form.card_name.trim().length < 2) e.card_name = 'Name on card is required.';
    if (!luhnValid(form.card_number)) e.card_number = 'Enter a valid card number.';
    if (!expiryValid(form.card_expiry)) e.card_expiry = 'Enter a valid expiry (MM/YY).';
    if (!/^\d{3,4}$/.test(form.card_cvc)) e.card_cvc = 'Enter the 3–4 digit code.';
    return e;
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Enter a code.');
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api<CouponValidation>('/api/validate-coupon', { method: 'POST', body: { code, subtotal } });
      setCoupon(res);
      toast.success('Code applied', `${res.code} — ${fmt(res.discount)} off`);
    } catch (err) {
      setCoupon(null);
      setCouponError(errorMessage(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      window.setTimeout(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      setServerError('Please correct the highlighted fields.');
      return;
    }
    setServerError(null);
    setSubmitting(true);
    try {
      const shipping_address = {
        full_name: form.full_name.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim(),
        phone: form.phone.trim(),
      };
      const order = await api<Order>('/api/orders', {
        method: 'POST',
        body: {
          email: form.email.trim(),
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_address,
          coupon_code: coupon?.code ?? '',
          payment: { method: 'card', last4: form.card_number.replace(/\D/g, '').slice(-4), name: form.card_name.trim() },
          notes: form.notes.trim(),
        },
      });
      if (user && form.save_address && selectedAddress === 'new') {
        api('/api/addresses', { method: 'POST', body: { ...shipping_address, label: 'Checkout' } }).catch(() => undefined);
      }
      try {
        sessionStorage.setItem('aether-last-order', JSON.stringify({ number: order.order_number, email: order.email }));
      } catch {
        /* ignore */
      }
      toast.success('Order confirmed', order.order_number);
      navigate(`/order/${order.order_number}?email=${encodeURIComponent(order.email)}`, { replace: true });
      clearCart();
    } catch (err) {
      setServerError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/cart" className="mb-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted hover:text-ivory">
            <ChevronLeft size={12} /> Back to cart
          </Link>
          <h1 className="font-display text-5xl font-light md:text-6xl">Checkout</h1>
        </div>
        <p className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted">
          <Lock size={12} className="text-gold" /> 256-bit encrypted · Demo payment
        </p>
      </div>

      <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {/* CONTACT */}
          <Section step="01" title="Contact">
            <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} required placeholder="you@example.com" />
            {!user && (
              <p className="text-xs text-dim">
                Have an account?{' '}
                <Link to="/login" state={{ from: '/checkout' }} className="text-gold hover:underline">
                  Sign in
                </Link>{' '}
                for saved addresses and order history.
              </p>
            )}
          </Section>

          {/* SHIPPING */}
          <Section step="02" title="Delivery">
            {addresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyAddress(a)}
                    aria-pressed={selectedAddress === a.id}
                    className={cn(
                      'rounded-sm border p-4 text-left text-sm transition',
                      selectedAddress === a.id ? 'border-gold bg-gold/5' : 'border-edge hover:border-edge-strong'
                    )}
                  >
                    <p className="eyebrow text-[0.55rem]">{a.label || 'Saved address'}{a.is_default ? ' · Default' : ''}</p>
                    <p className="mt-2 text-ivory">{a.full_name}</p>
                    <p className="text-muted">
                      {a.line1}, {a.city} {a.postal_code}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddress('new');
                    setForm((f) => ({ ...f, full_name: profile?.full_name || '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'United States' }));
                  }}
                  aria-pressed={selectedAddress === 'new'}
                  className={cn('rounded-sm border p-4 text-left text-sm transition', selectedAddress === 'new' ? 'border-gold bg-gold/5' : 'border-edge hover:border-edge-strong')}
                >
                  <p className="eyebrow text-[0.55rem]">New address</p>
                  <p className="mt-2 text-muted">Enter a different delivery address</p>
                </button>
              </div>
            )}
            <Input label="Full name" autoComplete="name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} required />
            <Input label="Street address" autoComplete="address-line1" value={form.line1} onChange={set('line1')} error={errors.line1} required />
            <Input label="Apartment, suite, etc." autoComplete="address-line2" value={form.line2} onChange={set('line2')} />
            <div className="grid gap-5 sm:grid-cols-3">
              <Input label="City" autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} required />
              <Input label="State / Region" autoComplete="address-level1" value={form.state} onChange={set('state')} error={errors.state} required />
              <Input label="Postal code" autoComplete="postal-code" value={form.postal_code} onChange={set('postal_code')} error={errors.postal_code} required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Country" autoComplete="country-name" value={form.country} onChange={set('country')} error={errors.country} required />
              <Input label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} hint="For delivery coordination" />
            </div>
            {user && selectedAddress === 'new' && (
              <Checkbox label="Save this address to my account" checked={form.save_address} onChange={(e) => setForm((f) => ({ ...f, save_address: e.target.checked }))} />
            )}
            <Textarea label="Delivery notes" value={form.notes} onChange={set('notes')} placeholder="Concierge instructions, gift message, access codes…" className="min-h-[88px]" />
          </Section>

          {/* PAYMENT */}
          <Section step="03" title="Payment">
            <div className="glass flex items-start gap-3 rounded-sm p-4 text-xs text-muted">
              <CreditCard size={16} className="mt-0.5 shrink-0 text-gold" />
              <p>
                This is a demonstration checkout. No charge will be made. Use any Luhn-valid card such as{' '}
                <button type="button" className="font-mono text-gold hover:underline" onClick={() => setForm((f) => ({ ...f, card_number: '4242 4242 4242 4242', card_expiry: '12/29', card_cvc: '424' }))}>
                  4242 4242 4242 4242
                </button>
                .
              </p>
            </div>
            <Input label="Name on card" autoComplete="cc-name" value={form.card_name} onChange={set('card_name')} error={errors.card_name} required />
            <Input label="Card number" inputMode="numeric" autoComplete="cc-number" value={form.card_number} onChange={set('card_number')} error={errors.card_number} required placeholder="0000 0000 0000 0000" className="font-mono" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Expiry" inputMode="numeric" autoComplete="cc-exp" value={form.card_expiry} onChange={set('card_expiry')} error={errors.card_expiry} required placeholder="MM/YY" className="font-mono" />
              <Input label="Security code" inputMode="numeric" autoComplete="cc-csc" value={form.card_cvc} onChange={set('card_cvc')} error={errors.card_cvc} required placeholder="CVC" className="font-mono" />
            </div>
          </Section>
        </div>

        {/* SUMMARY */}
        <aside className="lg:col-span-5">
          <div className="glass sticky top-36 rounded-sm p-7">
            <p className="eyebrow">Order summary</p>
            <ul className="mt-6 max-h-[320px] space-y-4 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.product_id} className="flex items-center gap-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface">
                    <ProductImage src={i.image} alt={i.name} className="h-full w-full object-cover" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold font-mono text-[0.6rem] font-bold text-void">{i.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base">{i.name}</p>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-dim">{i.collection}</p>
                  </div>
                  <p className="font-mono text-sm">{fmt(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-edge pt-5">
              {coupon ? (
                <div className="flex items-center justify-between rounded-sm border border-success/30 bg-success/5 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-mono text-xs text-success">
                    <Tag size={13} /> {coupon.code}
                  </span>
                  <button type="button" onClick={() => { setCoupon(null); setCouponInput(''); }} className="text-dim hover:text-danger" aria-label="Remove code">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                      placeholder="Private code"
                      aria-label="Coupon code"
                      aria-invalid={Boolean(couponError)}
                      className={cn('h-11 flex-1 rounded-sm border bg-white/[0.03] px-4 font-mono text-xs uppercase tracking-[0.15em] text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none', couponError ? 'border-danger/60' : 'border-edge')}
                    />
                    <Button type="button" variant="secondary" size="sm" className="h-11" onClick={applyCoupon} loading={couponLoading}>
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-xs text-danger" role="alert">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <dl className="mt-6 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-mono">{fmt(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd className="font-mono">−{fmt(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-mono">{totals.shipping === 0 ? 'Complimentary' : fmt(totals.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax ({Math.round((Number(settings.tax_rate) || 0) * 1000) / 10}%)</dt>
                <dd className="font-mono">{fmt(totals.tax)}</dd>
              </div>
            </dl>
            <div className="hairline my-5" />
            <div className="flex items-end justify-between">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted">Total</span>
              <span className="font-display text-4xl">{fmt(totals.total)}</span>
            </div>
            {serverError && (
              <p className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger" role="alert">
                {serverError}
              </p>
            )}
            <Button type="submit" full size="lg" className="mt-6" loading={submitting} icon={<Lock size={14} />}>
              {submitting ? 'Placing order' : `Pay ${fmt(totals.total)}`}
            </Button>
            <p className="mt-4 text-center text-[0.65rem] leading-relaxed text-dim">
              By placing your order you agree to our{' '}
              <Link to="/terms" className="underline hover:text-ivory">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline hover:text-ivory">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${step}`}>
      <div className="mb-6 flex items-center gap-4">
        <span className="font-mono text-[0.62rem] tracking-[0.25em] text-gold">{step}</span>
        <h2 id={`step-${step}`} className="font-display text-3xl">
          {title}
        </h2>
        <span className="h-px flex-1 bg-edge" aria-hidden="true" />
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
