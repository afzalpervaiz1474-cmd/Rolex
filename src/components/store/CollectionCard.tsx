import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Collection } from '../../lib/types';
import ProductImage from '../ui/ProductImage';
import { cn } from '../../lib/utils';

interface Props {
  collection: Collection;
  className?: string;
  large?: boolean;
}

export default function CollectionCard({ collection, className, large }: Props) {
  return (
    <Link
      to={`/collections/${collection.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-sm border border-edge bg-surface transition-colors duration-500 hover:border-gold/40',
        className
      )}
    >
      <ProductImage
        src={collection.image_url}
        alt={collection.name}
        className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
        <p className="eyebrow mb-3">{collection.tagline}</p>
        <div className="flex items-end justify-between gap-4">
          <h3 className={cn('font-display font-light leading-none', large ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl')}>{collection.name}</h3>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold transition-all duration-500 group-hover:bg-gold group-hover:text-void">
            <ArrowUpRight size={18} />
          </span>
        </div>
        {typeof collection.product_count === 'number' && (
          <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted">
            {collection.product_count} object{collection.product_count === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </Link>
  );
}
