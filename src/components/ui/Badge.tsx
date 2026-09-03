import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Tone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'plasma';

const tones: Record<Tone, string> = {
  neutral: 'border-edge-strong text-muted bg-white/[0.03]',
  gold: 'border-gold/40 text-gold bg-gold/10',
  success: 'border-success/30 text-success bg-success/10',
  warning: 'border-warning/30 text-warning bg-warning/10',
  danger: 'border-danger/30 text-danger bg-danger/10',
  plasma: 'border-plasma/30 text-plasma bg-plasma/10',
};

export const statusTone: Record<string, Tone> = {
  pending: 'warning',
  processing: 'plasma',
  shipped: 'gold',
  delivered: 'success',
  cancelled: 'danger',
  active: 'success',
  draft: 'neutral',
  archived: 'danger',
  approved: 'success',
  rejected: 'danger',
  new: 'gold',
  read: 'neutral',
  admin: 'gold',
  customer: 'neutral',
};

export default function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone[status] ?? 'neutral'} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </Badge>
  );
}
