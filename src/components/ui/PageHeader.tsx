import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-dim">
        <li>
          <Link to="/" className="transition hover:text-gold">
            Home
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-2">
            <ChevronRight size={10} aria-hidden="true" />
            {c.to ? (
              <Link to={c.to} className="transition hover:text-gold">
                {c.label}
              </Link>
            ) : (
              <span className="text-muted" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function PageHeader({ eyebrow, title, description, crumbs, children }: Props) {
  return (
    <header className="relative overflow-hidden pb-14 pt-36 md:pb-20 md:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,180,131,0.1),transparent_60%)]" aria-hidden="true" />
      <div className="wrap relative">
        {crumbs && <Breadcrumbs crumbs={crumbs} />}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
          <h1 className="font-display text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">{title}</h1>
          {description && <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{description}</p>}
          {children}
        </motion.div>
      </div>
    </header>
  );
}
