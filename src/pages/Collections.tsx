import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useQuery } from '../lib/useQuery';
import type { Collection } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import PageHeader from '../components/ui/PageHeader';
import Reveal from '../components/ui/Reveal';
import Skeleton from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import ProductImage from '../components/ui/ProductImage';
import { cn } from '../lib/utils';

export default function Collections() {
  useSEO('Collections', 'Explore the five AETHER collections: Chronos, Resonance, Optik, Kinetic and Habitat.');
  const { data, loading, error, refetch: load } = useQuery(() => api<Collection[]>('/api/collections'), []);
  const collections = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Five disciplines"
        title={
          <>
            The <span className="italic text-muted">collections</span>
          </>
        }
        description="Each collection is governed by a single material truth. Explore them as chapters of one continuous study in precision."
        crumbs={[{ label: 'Collections' }]}
      />
      <div className="wrap space-y-6 pb-24">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[360px] w-full" />)
        ) : (
          collections.map((c, i) => (
            <Reveal key={c.id} delay={0.05}>
              <Link
                to={`/collections/${c.slug}`}
                className={cn(
                  'group grid overflow-hidden rounded-sm border border-edge bg-surface transition-colors hover:border-gold/40 md:grid-cols-2',
                  i % 2 === 1 && 'md:[&>*:first-child]:order-2'
                )}
              >
                <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[420px]">
                  <ProductImage
                    src={c.image_url}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                  />
                </div>
                <div className="flex flex-col justify-between p-8 md:p-12">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="eyebrow">
                        {String(i + 1).padStart(2, '0')} — {c.tagline}
                      </p>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">{c.product_count} objects</span>
                    </div>
                    <h2 className="mt-6 font-display text-5xl font-light leading-none md:text-7xl">{c.name}</h2>
                    <p className="mt-6 max-w-md text-sm leading-relaxed text-muted md:text-base">{c.description}</p>
                  </div>
                  <span className="mt-10 inline-flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                    Enter the collection
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 transition-all duration-500 group-hover:bg-gold group-hover:text-void">
                      <ArrowRight size={14} />
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))
        )}
      </div>
    </>
  );
}
