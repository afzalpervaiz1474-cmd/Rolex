import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  to?: string;
  href?: string;
  full?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const base =
  'relative inline-flex items-center justify-center gap-2.5 rounded-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian disabled:cursor-not-allowed disabled:opacity-40 select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-gold text-void hover:bg-gold-bright hover:shadow-glow active:scale-[0.98]',
  secondary: 'glass text-ivory hover:border-gold/50 hover:bg-white/[0.07] active:scale-[0.98]',
  outline: 'border border-gold/50 text-gold hover:bg-gold hover:text-void active:scale-[0.98]',
  ghost: 'text-muted hover:text-ivory hover:bg-white/[0.05]',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-7',
  lg: 'h-14 px-10 text-xs',
  icon: 'h-10 w-10 p-0',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  to,
  href,
  full,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], full && 'w-full', className);
  const content = (
    <>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled || loading}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {content}
    </button>
  );
}
