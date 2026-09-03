import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import NewsletterForm from '../store/NewsletterForm';

const shop = [
  { to: '/shop', label: 'All objects' },
  { to: '/collections/timepieces', label: 'Timepieces' },
  { to: '/collections/audio', label: 'Audio' },
  { to: '/collections/eyewear', label: 'Eyewear' },
  { to: '/collections/wearables', label: 'Wearables' },
  { to: '/collections/home', label: 'Home' },
];

const maison = [
  { to: '/about', label: 'Our philosophy' },
  { to: '/contact', label: 'Concierge' },
  { to: '/shipping-returns', label: 'Shipping & returns' },
  { to: '/account', label: 'My account' },
];

const legal = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
];

export default function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-edge bg-void/60">
      <div className="hairline absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="wrap grid gap-14 py-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link to="/" className="font-display text-4xl font-light tracking-[0.42em]">
            AETHER
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            {settings.tagline || 'Objects for the next century.'} Each piece is engineered in limited series, finished by hand and
            guaranteed for life.
          </p>
          <div className="mt-10">
            <p className="eyebrow mb-4">The dispatch</p>
            <NewsletterForm source="footer" compact />
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
          <FooterColumn title="Shop" links={shop} />
          <FooterColumn title="Maison" links={maison} />
          <div>
            <FooterColumn title="Legal" links={legal} />
            <p className="eyebrow mb-4 mt-10">Atelier</p>
            <address className="space-y-1.5 text-sm not-italic leading-relaxed text-muted">
              {settings.address && <p>{settings.address}</p>}
              {settings.hours && <p>{settings.hours}</p>}
              {settings.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="block transition hover:text-gold">
                  {settings.contact_email}
                </a>
              )}
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, '')}`} className="block transition hover:text-gold">
                  {settings.contact_phone}
                </a>
              )}
            </address>
          </div>
        </div>
      </div>

      <div className="border-t border-edge">
        <div className="wrap flex flex-col gap-4 py-6 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} AETHER. Crafted for the future.</p>
          <div className="flex items-center gap-6">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 transition hover:text-gold">
                Instagram <ArrowUpRight size={11} />
              </a>
            )}
            {settings.twitter && (
              <a href={settings.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1 transition hover:text-gold">
                X <ArrowUpRight size={11} />
              </a>
            )}
            <span className="hidden sm:inline">Secure checkout · Global delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="eyebrow mb-5">{title}</p>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-muted transition hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
