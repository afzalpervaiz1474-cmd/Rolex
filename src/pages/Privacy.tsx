import { useSEO } from '../lib/useSEO';
import PageHeader from '../components/ui/PageHeader';
import Reveal from '../components/ui/Reveal';

export default function Privacy() {
  useSEO('Privacy policy', 'How AETHER collects, uses and protects your information.');
  return (
    <>
      <PageHeader eyebrow="Legal" title={<>Privacy <span className="italic text-muted">policy</span></>} description="Restraint extends to data. We collect only what is required to fulfil your order and serve you well." crumbs={[{ label: 'Privacy' }]} />
      <section className="wrap pb-24">
        <Reveal className="prose-luxe max-w-3xl">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-dim">Last updated: January 2025</p>
          <h2>1. What we collect</h2>
          <p>When you create an account, place an order or contact the concierge, we collect the information you provide: your name, email address, delivery address, telephone number and order history. Payment details are processed by our payment partner and are never stored on AETHER systems beyond the final four digits of your card.</p>
          <h2>2. How we use it</h2>
          <ul>
            <li>To fulfil, deliver and service your orders</li>
            <li>To respond to concierge enquiries and commissions</li>
            <li>To send the Dispatch newsletter, if you have subscribed</li>
            <li>To maintain the security and integrity of our platform</li>
          </ul>
          <h2>3. What we do not do</h2>
          <p>We do not sell, rent or trade your personal information. We do not use third-party advertising trackers. Analytics are aggregated and anonymised.</p>
          <h2>4. Storage & security</h2>
          <p>Your information is stored on encrypted infrastructure with strict access controls. Authentication is handled with industry-standard hashing and session management. Data is retained for as long as your account is active or as required to meet legal obligations.</p>
          <h2>5. Your rights</h2>
          <p>You may access, correct or delete your personal information at any time from your account or by contacting the concierge. You may unsubscribe from the Dispatch with one click at any time.</p>
          <h2>6. Cookies</h2>
          <p>We use strictly necessary cookies and local storage to keep you signed in and to remember your cart. No marketing cookies are set.</p>
          <h2>7. Contact</h2>
          <p>Questions regarding this policy may be directed to the concierge at any time.</p>
        </Reveal>
      </section>
    </>
  );
}
