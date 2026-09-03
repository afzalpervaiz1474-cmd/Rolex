import { useSEO } from '../lib/useSEO';
import PageHeader from '../components/ui/PageHeader';
import Reveal from '../components/ui/Reveal';

export default function Terms() {
  useSEO('Terms of service', 'Terms governing the use of AETHER and the purchase of its objects.');
  return (
    <>
      <PageHeader eyebrow="Legal" title={<>Terms of <span className="italic text-muted">service</span></>} description="The agreement between you and AETHER when you browse, purchase or commission." crumbs={[{ label: 'Terms' }]} />
      <section className="wrap pb-24">
        <Reveal className="prose-luxe max-w-3xl">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-dim">Last updated: January 2025</p>
          <h2>1. Acceptance</h2>
          <p>By accessing AETHER or placing an order you agree to these terms. If you do not agree, please do not use the service.</p>
          <h2>2. Objects & availability</h2>
          <p>All objects are produced in limited series. Availability shown on the site is updated in real time, but in rare cases an object may become unavailable between order and dispatch. In that event we will contact you immediately with an alternative or a full refund.</p>
          <h2>3. Pricing & payment</h2>
          <p>Prices are displayed in the store currency and exclude duties unless stated. Taxes and shipping are calculated at checkout. We reserve the right to correct pricing errors; if an error affects your order we will contact you before proceeding.</p>
          <h2>4. Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify the concierge immediately of any unauthorised use.</p>
          <h2>5. Returns & guarantee</h2>
          <p>Returns are accepted within 30 days in accordance with our Shipping & Returns policy. The lifetime guarantee covers defects in materials and workmanship for the original owner and excludes damage from misuse or unauthorised modification.</p>
          <h2>6. Intellectual property</h2>
          <p>All designs, imagery, text and marks on this site are the property of AETHER and may not be reproduced without written permission.</p>
          <h2>7. Limitation of liability</h2>
          <p>To the fullest extent permitted by law, AETHER shall not be liable for indirect or consequential loss arising from the use of the site or its objects. Nothing in these terms limits your statutory rights.</p>
          <h2>8. Governing law</h2>
          <p>These terms are governed by the laws of the State of New York. Any dispute shall be subject to the exclusive jurisdiction of its courts.</p>
        </Reveal>
      </section>
    </>
  );
}
