import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, X, Trash2, Star } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Review, ReviewStatus } from '../../lib/types';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, cn } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard } from '../../components/admin/AdminPage';
import { StatusBadge } from '../../components/ui/Badge';
import Rating from '../../components/ui/Rating';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import ProductImage from '../../components/ui/ProductImage';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

export default function AdminReviews() {
  useSEO('Reviews — Admin');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const { data, loading, error, refetch: load, setData } = useQuery(() => api<Review[]>('/api/reviews?all=1'), []);
  const reviews = useMemo(() => data ?? [], [data]);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const counts = useMemo(() => reviews.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {}), [reviews]);
  const filtered = useMemo(() => reviews.filter((r) => !status || r.status === status), [reviews, status]);

  const setStatus = async (r: Review, next: ReviewStatus) => {
    setBusy(r.id);
    try {
      const updated = await api<Review>('/api/reviews', { method: 'PUT', body: { id: r.id, status: next } });
      setData((prev) => (prev ?? []).map((x) => (x.id === r.id ? { ...x, status: updated.status } : x)));
      toast.success(`Review ${next}`);
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api('/api/reviews', { method: 'DELETE', body: { id: deleting.id } });
      toast.success('Review deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Could not delete', errorMessage(err));
    }
  };

  return (
    <AdminPage title="Reviews" description="Moderate collector notes before they appear on product pages.">
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={!status} onClick={() => setParams({})} label="All" count={reviews.length} />
        {STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setParams({ status: s })} label={s} count={counts[s] || 0} />
        ))}
      </div>
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Star size={22} />} title="No reviews here" description="Reviews submitted by customers will appear for moderation." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((r) => (
            <AdminCard key={r.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface">
                      <ProductImage src={r.product?.image} alt={r.product?.name ?? ''} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      {r.product ? <Link to={`/products/${r.product.slug}`} className="block truncate text-sm text-ivory hover:text-gold">{r.product.name}</Link> : <p className="text-sm text-muted">Deleted product</p>}
                      <p className="text-xs text-muted">{r.author_name} · {formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-4"><Rating value={r.rating} /></div>
                <h3 className="mt-2 font-display text-xl">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-edge pt-4">
                  {r.status !== 'approved' && <Button size="sm" variant="outline" icon={<Check size={13} />} loading={busy === r.id} onClick={() => setStatus(r, 'approved')}>Approve</Button>}
                  {r.status !== 'rejected' && <Button size="sm" variant="ghost" icon={<X size={13} />} loading={busy === r.id} onClick={() => setStatus(r, 'rejected')}>Reject</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto hover:text-danger" icon={<Trash2 size={13} />} onClick={() => setDeleting(r)}>Delete</Button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete review?" size="sm">
        <p className="text-sm text-muted">The product rating will be recalculated.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn('flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] transition', active ? 'border-gold bg-gold/10 text-gold' : 'border-edge text-muted hover:border-edge-strong hover:text-ivory')}>
      {label} <span className="text-dim">{count}</span>
    </button>
  );
}
