import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminPage({ eyebrow = 'Admin', title, description, actions, children }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

export function AdminCard({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <div className={`glass rounded-md ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-edge px-5 py-4">
          {title && <h2 className="font-display text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Table({ head, children, minWidth = 720 }: { head: ReactNode; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-edge font-mono text-[0.58rem] uppercase tracking-[0.22em] text-dim [&>th]:px-5 [&>th]:py-3 [&>th]:font-medium">{head}</tr>
        </thead>
        <tbody className="divide-y divide-edge [&>tr>td]:px-5 [&>tr>td]:py-3.5">{children}</tbody>
      </table>
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'ivory' }: { label: string; value: string; sub?: ReactNode; tone?: 'ivory' | 'gold' }) {
  return (
    <div className="glass rounded-md p-5">
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-dim">{label}</p>
      <p className={`mt-3 font-display text-4xl ${tone === 'gold' ? 'text-gold' : ''}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
