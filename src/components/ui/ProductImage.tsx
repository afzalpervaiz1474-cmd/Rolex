import { useState } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

export default function ProductImage({ src, alt, className, loading = 'lazy' }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(212,180,131,0.14),transparent_55%),linear-gradient(160deg,#14141e,#0a0a0f)]',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <span className="font-display text-4xl tracking-[0.4em] text-gold/40">AE</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      className={cn('transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', className)}
    />
  );
}
