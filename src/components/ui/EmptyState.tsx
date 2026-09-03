import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('glass flex flex-col items-center justify-center rounded-md px-6 py-16 text-center', className)}>
      {icon && <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 text-gold">{icon}</div>}
      <h3 className="font-display text-2xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-md border-danger/30 px-6 py-14 text-center" role="alert">
      <p className="eyebrow text-danger">Something went wrong</p>
      <p className="mt-3 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-sm border border-edge-strong px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ivory transition hover:border-gold/60 hover:text-gold"
        >
          Try again
        </button>
      )}
    </div>
  );
}
