import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  value: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
}

export default function Rating({ value, count, size = 14, interactive = false, onChange, className }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? 'Rating' : `${value} out of 5 stars`}>
        {stars.map((s) => {
          const filled = s <= Math.round(value);
          const star = (
            <Star
              size={size}
              className={cn('transition-colors', filled ? 'fill-gold text-gold' : 'text-dim', interactive && 'hover:text-gold')}
              aria-hidden="true"
            />
          );
          if (!interactive) return <span key={s}>{star}</span>;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={s === Math.round(value)}
              aria-label={`${s} star${s > 1 ? 's' : ''}`}
              onClick={() => onChange?.(s)}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              {star}
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="font-mono text-[0.65rem] tracking-wider text-muted">
          {value > 0 ? value.toFixed(1) : '—'} ({count})
        </span>
      )}
    </div>
  );
}
