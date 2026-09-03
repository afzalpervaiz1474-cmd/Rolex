import { useSEO } from '../lib/useSEO';
import { useSettings, usePrice } from '../contexts/SettingsContext';
import PageHeader from '../components/ui/PageHeader';
import Reveal from '../components/ui/Reveal';

export default function ShippingReturns() {
  useSEO('Shipping & returns', 'AETHER delivery, returns and lifetime servicing policy.');
  const { settings } = useSettings();
  const fmt = usePrice();
  const threshold = Number(settings.free_shipping_threshold) || 0;
  const flat = Number(settings.shipping_flat) || 0;

  return (
    <>
      <PageHeader eyebrow="Policies" title={<>Shipping <span className="italic text-muted">& returns</span></>} description="Every object travels insured, tracked and carbon-offset. Every purchase is protected by a 30-day return window and a lifetime guarantee." crumbs={[{ label: 'Shipping & returns' }]} />
      <section className="wrap grid gap-14 pb-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <div className="glass sticky top-36 rounded-sm p-8">
            <p className="eyebrow">At a glance</p>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Standard delivery</dt>
                <dd className="mt-1 font-display text-2xl">{flat === 0 ? 'Complimentary' : fmt(flat)}</dd>
              </div>
              {threshold > 0 && (
                <div>
                  <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Complimentary over</dt>
                  <dd className="mt-1 font-display text-2xl">{fmt(threshold)}</dd>
                </div>
              )}
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Dispatch</dt>
                <dd className="mt-1 font-display text-2xl">Within 48 hours</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Returns</dt>
                <dd className="mt-1 font-display text-2xl">30 days</dd>
              </div>
            </dl>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="prose-luxe lg:col-span-7 lg:col-start-6">
          <h2>Delivery</h2>
          <p>
            Orders are prepared by the atelier and dispatched within 48 hours of confirmation. Each shipment is fully insured, tracked door-to-door and offset through verified carbon-removal projects. Standard delivery is {flat === 0 ? 'complimentary' : fmt(flat)}{threshold > 0 ? ` and complimentary on orders over ${fmt(threshold)}` : ''}.
          </p>
          <ul>
            <li><strong>North America:</strong> 2–4 business days</li>
            <li><strong>Europe & United Kingdom:</strong> 3–5 business days</li>
            <li><strong>Asia-Pacific:</strong> 4–7 business days</li>
            <li><strong>Rest of world:</strong> 5–10 business days</li>
          </ul>
          <p>Duties and import taxes for international deliveries are calculated at checkout where possible; where they are not, they are the responsibility of the recipient.</p>

          <h2>Returns & exchanges</h2>
          <p>
            Should an object not live as you imagined, you may return it within 30 days of delivery in its original, unworn condition with all documentation. Contact the concierge to receive a prepaid, insured return label. Refunds are issued to the original payment method within 5 business days of inspection.
          </p>
          <p>Personalised or engraved objects and private commissions are final sale.</p>

          <h2>Lifetime guarantee & servicing</h2>
          <p>
            Every AETHER object is serialised and guaranteed for the lifetime of its original owner against defects in materials and workmanship. Servicing — including movement regulation, re-finishing and battery or driver replacement — is complimentary. Shipping to and from the atelier for servicing is covered by AETHER.
          </p>

          <h2>Order changes & cancellations</h2>
          <p>Orders may be cancelled from your account while their status is pending. Once an order is processing, please contact the concierge and we will do our utmost to accommodate changes before dispatch.</p>
        </Reveal>
      </section>
    </>
  );
}
