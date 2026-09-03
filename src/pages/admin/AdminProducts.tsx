import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Product } from '../../lib/types';
import { usePrice } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard, Table } from '../../components/admin/AdminPage';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ProductImage from '../../components/ui/ProductImage';
import { Select } from '../../components/ui/Field';

export default function AdminProducts() {
  useSEO('Products — Admin');
  const fmt = usePrice();
  const toast = useToast();
  const { data, loading, error, refetch: load, setData } = useQuery(() => api<Product[]>('/api/products?all=1&sort=newest'), []);
  const products = useMemo(() => data ?? [], [data]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return products.filter((p) => (!status || p.status === status) && (!s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.collection?.name.toLowerCase().includes(s)));
  }, [products, search, status]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api('/api/products', { method: 'DELETE', body: { id: deleting.id } });
      toast.success('Product deleted', deleting.name);
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Could not delete', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      await api('/api/products', { method: 'PUT', body: { id: p.id, featured: !p.featured } });
      setData((prev) => (prev ?? []).map((x) => (x.id === p.id ? { ...x, featured: !p.featured } : x)));
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    }
  };

  return (
    <AdminPage title="Products" description={`${products.length} objects in the catalogue`} actions={<Button to="/admin/products/new" icon={<Plus size={14} />}>New product</Button>}>
      <AdminCard>
        <div className="flex flex-col gap-3 border-b border-edge p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU or collection" aria-label="Search products" className="h-11 w-full rounded-sm border border-edge bg-white/[0.03] pl-9 pr-3 text-sm text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none" />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={[{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }]} className="h-11 sm:w-44" />
        </div>
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-4"><EmptyState title="No products match" description="Try a different search or create a new product." /></div>
        ) : (
          <Table head={<><th>Product</th><th>Collection</th><th>Price</th><th>Stock</th><th>Status</th><th>Featured</th><th className="text-right">Actions</th></>} minWidth={860}>
            {filtered.map((p) => (
              <tr key={p.id} className="transition hover:bg-white/[0.02]">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-10 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface">
                      <ProductImage src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <Link to={`/admin/products/${p.id}`} className="block truncate font-display text-base hover:text-gold">{p.name}</Link>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.15em] text-dim">{p.sku || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted">{p.collection?.name ?? '—'}</td>
                <td className="font-mono">{fmt(p.price)}</td>
                <td>
                  <span className={`font-mono ${p.stock === 0 ? 'text-danger' : p.stock <= 5 ? 'text-warning' : 'text-ivory'}`}>{p.stock}</span>
                </td>
                <td><StatusBadge status={p.status} /></td>
                <td>
                  <button type="button" onClick={() => toggleFeatured(p)} className={`rounded p-1.5 transition ${p.featured ? 'text-gold' : 'text-dim hover:text-ivory'}`} aria-label={p.featured ? 'Unfeature' : 'Feature'} aria-pressed={p.featured}>
                    <Star size={15} className={p.featured ? 'fill-gold' : ''} />
                  </button>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link to={`/admin/products/${p.id}`} className="rounded p-2 text-muted transition hover:bg-white/5 hover:text-ivory" aria-label={`Edit ${p.name}`}><Pencil size={14} /></Link>
                    <button type="button" onClick={() => setDeleting(p)} className="rounded p-2 text-muted transition hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </AdminCard>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete product?" size="sm" description={deleting?.name}>
        <p className="text-sm text-muted">This permanently removes the product and its reviews. Existing orders keep their line items.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}
