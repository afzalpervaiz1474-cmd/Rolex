import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../../lib/types';
import { useCart } from '../../contexts/CartContext';
import { usePrice } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import ProductImage from '../ui/ProductImage';
import Badge from '../ui/Badge';

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addItem, openCart } = useCart();
  const fmt = usePrice();
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const quickAdd = () => {
    const res = addItem(product, 1);
    if (!res.ok) {
      toast.error('Unable to add', res.reason);
      return;
    }
    setAdded(true);
    toast.success('Added to cart', product.name);
    window.setTimeout(() => setAdded(false), 1600);
    openCart();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: Math.min(index, 7) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col"
    >
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-sm border border-edge bg-surface transition-colors duration-500 group-hover:border-gold/40"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {soldOut && <Badge tone="danger">Sold out</Badge>}
          {!soldOut && lowStock && <Badge tone="warning">Only {product.stock} left</Badge>}
          {product.compare_at_price && product.compare_at_price > product.price && <Badge tone="gold">Private offer</Badge>}
        </div>
      </Link>

      {!soldOut && (
        <button
          type="button"
          onClick={quickAdd}
          aria-label={`Add ${product.name} to cart`}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-void/70 text-gold opacity-100 backdrop-blur transition-all duration-300 hover:bg-gold hover:text-void md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
        </button>
      )}

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-[0.58rem]">{product.collection?.name ?? 'Object'}</p>
          <h3 className="mt-1.5 font-display text-xl leading-tight text-ivory transition-colors group-hover:text-gold-bright">
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted">{product.short_description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm text-gold">{fmt(product.price)}</p>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <p className="font-mono text-[0.65rem] text-dim line-through">{fmt(product.compare_at_price)}</p>
          )}
        </div>
      </div>
    </motion.article>
  );
}
