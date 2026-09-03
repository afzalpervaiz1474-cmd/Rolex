import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, qs } from '../lib/api';
import { useQuery } from '../lib/useQuery';
import type { Collection, Product } from '../lib/types';
import { useSEO } from '../lib/useSEO';
import { Breadcrumbs } from '../components/ui/PageHeader';
import ProductGrid from '../components/store/ProductGrid';
import { ErrorState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Field';
import Skeleton from '../components/ui/Skeleton';
import NotFound from './NotFound';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export default function CollectionDetail() {
  const { slug = '' } = useParams();
  const [sort, setSort] = useState('featured');

  const collectionQuery = useQuery(() => api<Collection>(`/api/collections?slug=${encodeURIComponent(slug)}`), [slug]);
  const productsQuery = useQuery(() => api<Product[]>(`/api/products${qs({ collection: slug, sort })}`), [slug, sort]);

  const collection = collectionQuery.data;
  const loading = collectionQuery.loading;
  const products = productsQuery.data ?? [];
  const productsLoading = productsQuery.loading;
  const error = collectionQuery.status === 404 ? null : collectionQuery.error ?? productsQuery.error;

  useSEO(collection ? collection.name : 'Collection', collection?.description);

  if (collectionQuery.status === 404) return <NotFound />;

  return (
    <>
      <section className="relative overflow-hidden pt-32 md:pt-36">
        <div className="relative mx-auto max-w-[1600px] px-3 sm:px-5">
          <div className="relative flex min-h-[440px] items-end overflow-hidden rounded-sm border border-edge md:min-h-[520px]">
            {loading ? (
              <Skeleton className="absolute inset-0 rounded-none" />
            ) : (
              collection?.image_url && (
                <motion.img
                  src={collection.image_url}
                  alt=""
                  aria-hidden="true"
                  initial={{ scale: 1.06, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-obsidian/10" aria-hidden="true" />
            <div className="relative w-full p-6 md:p-14">
              <Breadcrumbs crumbs={[{ label: 'Collections', to: '/collections' }, { label: collection?.name ?? '…' }]} />
              {loading ? (
                <>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-20 w-2/3" />
                </>
              ) : (
                collection && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="eyebrow mb-4">{collection.tagline}</p>
                    <h1 className="font-display text-6xl font-light leading-none md:text-8xl">{collection.name}</h1>
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{collection.description}</p>
                  </motion.div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-20">
        <div className="mb-10 flex flex-col gap-4 border-b border-edge pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted" aria-live="polite">
            {productsLoading ? 'Loading…' : `${products.length} object${products.length === 1 ? '' : 's'}`}
          </p>
          <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} className="h-11 sm:w-52" />
        </div>
        {error ? (
          <ErrorState message={error} onRetry={() => { collectionQuery.refetch(); productsQuery.refetch(); }} />
        ) : (
          <ProductGrid products={products} loading={productsLoading} emptyTitle="This collection is being prepared" emptyDescription="New objects are added as each series completes. Return soon." />
        )}
      </section>
    </>
  );
}
