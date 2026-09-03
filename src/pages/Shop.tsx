import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useQuery } from '../lib/useQuery';
import type { Collection, Product } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import { cn } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import ProductGrid from '../components/store/ProductGrid';
import { ErrorState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Field';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Alphabetical' },
];

const PRICE_PRESETS = [
  { label: 'Under $500', min: '', max: '500' },
  { label: '$500 – $1,000', min: '500', max: '1000' },
  { label: '$1,000 – $5,000', min: '1000', max: '5000' },
  { label: '$5,000+', min: '5000', max: '' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const collection = params.get('collection') ?? '';
  const sort = params.get('sort') ?? 'featured';
  const min = params.get('min') ?? '';
  const max = params.get('max') ?? '';

  useSEO(q ? `Search “${q}”` : 'Shop all objects', 'Browse the complete AETHER catalogue of luxury objects.');

  const [filtersOpen, setFiltersOpen] = useState(false);
  // The draft remembers which URL query it was typed against; if the URL query
  // changes externally (e.g. navbar search), the input follows the URL.
  const [draft, setDraft] = useState({ value: q, base: q });
  const searchDraft = draft.base === q ? draft.value : q;

  const collectionsQuery = useQuery(() => api<Collection[]>('/api/collections'), []);
  const collections = useMemo(() => collectionsQuery.data ?? [], [collectionsQuery.data]);

  const productsQuery = useQuery(
    () => api<Product[]>(`/api/products${qs({ search: q, collection, sort, min_price: min, max_price: max })}`),
    [q, collection, sort, min, max]
  );
  const products = productsQuery.data ?? [];
  const loading = productsQuery.loading;
  const error = productsQuery.error;

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchDraft.trim() !== q) update({ q: searchDraft.trim() });
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const activeCount = [q, collection, min, max].filter(Boolean).length;
  const activeCollection = useMemo(() => collections.find((c) => c.slug === collection), [collections, collection]);

  const filters = (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-4">Collection</p>
        <ul className="space-y-1">
          <li>
            <FilterButton active={!collection} onClick={() => update({ collection: '' })}>
              All objects
            </FilterButton>
          </li>
          {collections.map((c) => (
            <li key={c.id}>
              <FilterButton active={collection === c.slug} onClick={() => update({ collection: c.slug })} count={c.product_count}>
                {c.name}
              </FilterButton>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-4">Price</p>
        <ul className="space-y-1">
          <li>
            <FilterButton active={!min && !max} onClick={() => update({ min: '', max: '' })}>
              Any price
            </FilterButton>
          </li>
          {PRICE_PRESETS.map((p) => (
            <li key={p.label}>
              <FilterButton active={min === p.min && max === p.max} onClick={() => update({ min: p.min, max: p.max })}>
                {p.label}
              </FilterButton>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => update({ min: e.target.value })}
            placeholder="Min"
            aria-label="Minimum price"
            className="h-10 w-full rounded-sm border border-edge bg-white/[0.03] px-3 font-mono text-xs text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none"
          />
          <span className="text-dim">–</span>
          <input
            type="number"
            min={0}
            value={max}
            onChange={(e) => update({ max: e.target.value })}
            placeholder="Max"
            aria-label="Maximum price"
            className="h-10 w-full rounded-sm border border-edge bg-white/[0.03] px-3 font-mono text-xs text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none"
          />
        </div>
      </div>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => setParams(new URLSearchParams(), { replace: true })}
          className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-danger"
        >
          <X size={12} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow={activeCollection ? activeCollection.tagline : 'The catalogue'}
        title={activeCollection ? activeCollection.name : q ? <>Results for <span className="italic text-muted">“{q}”</span></> : <>All <span className="italic text-muted">objects</span></>}
        description={activeCollection?.description ?? 'Every object in the AETHER catalogue, engineered in limited series and guaranteed for life.'}
        crumbs={[{ label: 'Shop' }]}
      />

      <div className="wrap pb-24">
        <div className="mb-10 flex flex-col gap-4 border-y border-edge py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-sm border border-edge px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-ivory transition hover:border-gold/50 lg:hidden"
            >
              <SlidersHorizontal size={14} /> Filters {activeCount > 0 && <span className="text-gold">({activeCount})</span>}
            </button>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted" aria-live="polite">
              {loading ? 'Loading…' : `${products.length} object${products.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={searchDraft}
                onChange={(e) => setDraft({ value: e.target.value, base: q })}
                placeholder="Search the catalogue"
                aria-label="Search products"
                className="h-11 w-full rounded-sm border border-edge bg-white/[0.03] pl-9 pr-4 text-sm text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none sm:w-64"
              />
            </div>
            <Select aria-label="Sort products" value={sort} onChange={(e) => update({ sort: e.target.value })} options={SORTS} className="h-11 sm:w-52" />
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-36">{filters}</div>
          </aside>
          <div>{error ? <ErrorState message={error} onRetry={productsQuery.refetch} /> : <ProductGrid products={products} loading={loading} />}</div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-void/70 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="glass-strong absolute inset-y-0 left-0 w-full max-w-xs overflow-y-auto p-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-2xl">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="p-2 text-muted hover:text-ivory" aria-label="Close filters">
                <X size={18} />
              </button>
            </div>
            {filters}
          </div>
        </div>
      )}
    </>
  );
}

function FilterButton({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition',
        active ? 'bg-gold/10 text-gold' : 'text-muted hover:bg-white/[0.04] hover:text-ivory'
      )}
    >
      <span>{children}</span>
      {typeof count === 'number' && <span className="font-mono text-[0.6rem] text-dim">{count}</span>}
    </button>
  );
}
