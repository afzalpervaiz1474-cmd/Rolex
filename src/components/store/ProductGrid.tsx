import type { Product } from '../../lib/types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { PackageSearch } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

interface Props {
  products: Product[];
  loading?: boolean;
  columns?: 3 | 4;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function ProductGrid({ products, loading, columns = 4, emptyTitle = 'No objects found', emptyDescription }: Props) {
  const grid = cn('grid gap-x-6 gap-y-12 sm:grid-cols-2', columns === 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3');
  if (loading) {
    return (
      <div className={grid} aria-busy="true">
        {Array.from({ length: columns === 4 ? 8 : 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!products.length) {
    return (
      <EmptyState
        icon={<PackageSearch size={22} />}
        title={emptyTitle}
        description={emptyDescription ?? 'Try adjusting your filters or explore the full catalogue.'}
        action={
          <Button to="/shop" variant="secondary">
            View all objects
          </Button>
        }
      />
    );
  }
  return (
    <div className={grid}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
