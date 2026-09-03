import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, Infinity as InfinityIcon, Leaf, Headset } from 'lucide-react';
import { api } from '../lib/api';
import { useQuery } from '../lib/useQuery';
import type { Collection, Product } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import { useSettings } from '../contexts/SettingsContext';
import Button from '../components/ui/Button';
import SectionHeading from '../components/ui/SectionHeading';
import Reveal from '../components/ui/Reveal';
import ProductGrid from '../components/store/ProductGrid';
import CollectionCard from '../components/store/CollectionCard';
import NewsletterForm from '../components/store/NewsletterForm';
import Skeleton from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  useSEO(undefined, 'AETHER — luxury objects engineered for the next century. Timepieces, audio, eyewear, wearables and home.');
  const { settings } = useSettings();
  const { data, loading, error, refetch: load } = useQuery(async () => {
    const [collections, products] = await Promise.all([
      api<Collection[]>('/api/collections'),
      api<Product[]>('/api/products?featured=1&limit=8'),
    ]);
    return { collections, products };
  }, []);
  const collections = data?.collections ?? [];
  const products = data?.products ?? [];

  const featuredCollections = collections.filter((c) => c.featured);
  const [lead, ...rest] = featuredCollections.length ? featuredCollections : collections;

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <motion.img
          src="/images/hero.jpg"
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/30" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(212,180,131,0.16),transparent_55%)]" aria-hidden="true" />
        <div className="wrap relative w-full pb-20 pt-48 md:pb-28">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease }} className="eyebrow mb-6">
            {settings.tagline || 'Objects for the next century'}
          </motion.p>
          <h1 className="font-display text-[clamp(3.2rem,9.5vw,9rem)] font-light leading-[0.9] tracking-[-0.02em]">
            <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.45, ease }}>
              Precision,
            </motion.span>
            <motion.span
              className="text-gradient-gold block italic"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.6, ease }}
            >
              rendered in obsidian.
            </motion.span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85, ease }}
            className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
          >
            <p className="max-w-md text-base leading-relaxed text-muted md:text-lg">
              Five collections of instruments for living — machined from titanium, sapphire and silence. Made in limited
              series, finished by hand, guaranteed for life.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button to="/shop" size="lg" iconRight={<ArrowRight size={14} />}>
                Explore the catalogue
              </Button>
              <Button to="/about" size="lg" variant="secondary">
                Our philosophy
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mt-16 flex items-center gap-8 border-t border-edge pt-6 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-dim"
          >
            <span className="flex items-center gap-2">
              <ArrowDown size={12} className="animate-bounce text-gold" /> Scroll
            </span>
            <span className="hidden sm:inline">Est. 2025 · New York · Geneva · Tokyo</span>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative overflow-hidden border-y border-edge bg-void/50 py-4" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-16 whitespace-nowrap font-display text-2xl font-light tracking-[0.3em] text-muted/70">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex gap-16">
              {(collections.length ? collections : [{ name: 'Timepieces' }, { name: 'Audio' }, { name: 'Eyewear' }, { name: 'Wearables' }, { name: 'Home' }]).map((c, j) => (
                <span key={`${i}-${j}`} className="flex items-center gap-16">
                  {c.name}
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* COLLECTIONS */}
      <section className="wrap py-24 md:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="The collections"
            title={
              <>
                Five disciplines.
                <br />
                <span className="italic text-muted">One standard.</span>
              </>
            }
            description="Each collection is a study in a single material truth — from the vacuum-sealed calibres of Chronos to the ceramic acoustics of Resonance."
            action={
              <Link to="/collections" className="link-underline font-mono text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                View all collections
              </Link>
            }
          />
        </Reveal>
        <div className="mt-14">
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="aspect-[4/5] md:col-span-2 md:row-span-2 md:aspect-auto" />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3]" />
              ))}
            </div>
          ) : lead ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Reveal className="md:col-span-2 md:row-span-2">
                <CollectionCard collection={lead} large className="aspect-[4/5] h-full min-h-[420px] md:aspect-auto" />
              </Reveal>
              {rest.slice(0, 4).map((c, i) => (
                <Reveal key={c.id} delay={0.08 * (i + 1)}>
                  <CollectionCard collection={c} className="aspect-[4/3] min-h-[240px]" />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="relative py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,180,131,0.07),transparent_60%)]" aria-hidden="true" />
        <div className="wrap relative">
          <Reveal>
            <SectionHeading
              eyebrow="The curated edit"
              title="Objects of the season"
              description="A selection from the atelier — pieces our engineers and collectors return to most often."
              action={
                <Button to="/shop" variant="outline" iconRight={<ArrowRight size={14} />}>
                  Shop all
                </Button>
              }
            />
          </Reveal>
          <div className="mt-14">
            {error ? null : <ProductGrid products={products} loading={loading} />}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="wrap py-24 md:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-sm border border-edge">
              <img src="/images/atelier.jpg" alt="Inside the AETHER atelier" loading="lazy" className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 to-transparent" aria-hidden="true" />
              <div className="glass absolute bottom-6 left-6 right-6 rounded-sm p-5">
                <p className="eyebrow">Atelier note</p>
                <p className="mt-2 font-display text-xl italic leading-snug">“We do not decorate. We remove everything that is not essential, then polish what remains.”</p>
              </div>
            </div>
          </Reveal>
          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.1}>
              <p className="eyebrow mb-5">The maison</p>
              <h2 className="font-display text-4xl font-light leading-[1.05] sm:text-5xl md:text-6xl">
                Engineered like instruments. <span className="italic text-muted">Worn like heirlooms.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted">
                AETHER was founded on a single conviction: the objects we live with should be as considered as the
                architecture we live in. Our engineers and artisans work side by side in a single atelier, where a
                titanium watch case and a ceramic speaker enclosure are held to the same tolerance.
              </p>
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-edge pt-8">
                {[
                  ['0.01', 'mm tolerance'],
                  ['500', 'pieces per series'],
                  ['∞', 'year guarantee'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="font-display text-4xl text-gold">{v}</dt>
                    <dd className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-dim">{l}</dd>
                  </div>
                ))}
              </dl>
              <Button to="/about" variant="ghost" className="mt-8 -ml-4" iconRight={<ArrowRight size={14} />}>
                Read the manifesto
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="wrap py-16 md:py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: InfinityIcon, title: 'Lifetime guarantee', body: 'Every object is serialised and guaranteed for the lifetime of its owner. Servicing is complimentary, forever.' },
            { icon: Leaf, title: 'Carbon-neutral delivery', body: 'Insured, tracked and offset. Complimentary on orders over the threshold, worldwide.' },
            { icon: Headset, title: 'Private concierge', body: 'A dedicated advisor for commissions, sizing and aftercare — by message, call or in the atelier.' },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="glass card-hover h-full rounded-sm p-8 hover:-translate-y-1 hover:border-gold/40 hover:shadow-glow">
                <s.icon size={22} className="text-gold" aria-hidden="true" />
                <h3 className="mt-6 font-display text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="wrap pb-8 pt-16 md:pt-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-sm border border-edge bg-surface px-6 py-16 text-center md:px-16 md:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(212,180,131,0.18),transparent_60%)]" aria-hidden="true" />
            <div className="relative mx-auto max-w-2xl">
              <p className="eyebrow mb-5">The dispatch</p>
              <h2 className="font-display text-4xl font-light leading-tight sm:text-5xl md:text-6xl">
                First access to new series, <span className="italic text-muted">before they are announced.</span>
              </h2>
              <p className="mt-5 text-sm text-muted">One letter a month. No noise.</p>
              <div className="mx-auto mt-10 flex justify-center">
                <NewsletterForm source="home" className="w-full max-w-lg text-left" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
