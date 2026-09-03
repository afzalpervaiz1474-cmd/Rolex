import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Collection } from '../../lib/types';
import { slugify } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard, Table } from '../../components/admin/AdminPage';
import ImageUploader from '../../components/admin/ImageUploader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Checkbox } from '../../components/ui/Field';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import ProductImage from '../../components/ui/ProductImage';

interface Draft { name: string; slug: string; tagline: string; description: string; image_url: string; featured: boolean; sort_order: string }
const empty: Draft = { name: '', slug: '', tagline: '', description: '', image_url: '', featured: false, sort_order: '0' };

export default function AdminCollections() {
  useSEO('Collections — Admin');
  const toast = useToast();
  const { data, loading, error, refetch: load } = useQuery(() => api<Collection[]>('/api/collections'), []);
  const collections = data ?? [];
  const [editing, setEditing] = useState<Collection | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const open = (c: Collection | 'new') => {
    setEditing(c);
    setErrors({});
    setSlugTouched(c !== 'new');
    setDraft(c === 'new' ? { ...empty, sort_order: String(collections.length + 1) } : { name: c.name, slug: c.slug, tagline: c.tagline, description: c.description, image_url: c.image_url, featured: c.featured, sort_order: String(c.sort_order) });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (draft.name.trim().length < 2) next.name = 'Name is required.';
    if (!slugify(draft.slug || draft.name)) next.slug = 'Slug is required.';
    if (draft.sort_order !== '' && Number.isNaN(Number(draft.sort_order))) next.sort_order = 'Must be a number.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const body = { ...draft, slug: slugify(draft.slug || draft.name), sort_order: Number(draft.sort_order) || 0 };
    try {
      if (editing === 'new') await api('/api/collections', { method: 'POST', body });
      else if (editing) await api('/api/collections', { method: 'PUT', body: { id: editing.id, ...body } });
      toast.success(editing === 'new' ? 'Collection created' : 'Collection saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api('/api/collections', { method: 'DELETE', body: { id: deleting.id } });
      toast.success('Collection deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Could not delete', errorMessage(err));
    }
  };

  return (
    <AdminPage title="Collections" description="Group objects into disciplines shown across the storefront." actions={<Button icon={<Plus size={14} />} onClick={() => open('new')}>New collection</Button>}>
      <AdminCard>
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : collections.length === 0 ? (
          <div className="p-4"><EmptyState title="No collections yet" action={<Button onClick={() => open('new')}>Create the first collection</Button>} /></div>
        ) : (
          <Table head={<><th>Collection</th><th>Tagline</th><th>Objects</th><th>Order</th><th>Featured</th><th className="text-right">Actions</th></>}>
            {collections.map((c) => (
              <tr key={c.id} className="transition hover:bg-white/[0.02]">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-sm border border-edge bg-surface">
                      <ProductImage src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-display text-base">{c.name}</p>
                      <p className="font-mono text-[0.58rem] text-dim">/collections/{c.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted">{c.tagline || '—'}</td>
                <td className="font-mono">{c.product_count ?? 0}</td>
                <td className="font-mono text-muted">{c.sort_order}</td>
                <td>{c.featured ? <Badge tone="gold">Featured</Badge> : <Badge>—</Badge>}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => open(c)} className="rounded p-2 text-muted transition hover:bg-white/5 hover:text-ivory" aria-label={`Edit ${c.name}`}><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeleting(c)} className="rounded p-2 text-muted transition hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </AdminCard>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New collection' : 'Edit collection'} size="lg">
        <form onSubmit={save} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Name" value={draft.name} onChange={(e) => { setDraft((d) => ({ ...d, name: e.target.value, slug: slugTouched ? d.slug : slugify(e.target.value) })); }} error={errors.name} required />
            <Input label="Slug" value={draft.slug} onChange={(e) => { setSlugTouched(true); setDraft({ ...draft, slug: e.target.value }); }} error={errors.slug} className="font-mono" required />
          </div>
          <Input label="Tagline" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} placeholder="Chronos — instruments of time" />
          <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div>
            <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted">Cover image</p>
            <ImageUploader single images={draft.image_url ? [draft.image_url] : []} onChange={(imgs) => setDraft({ ...draft, image_url: imgs[0] ?? '' })} />
          </div>
          <div className="grid items-end gap-5 sm:grid-cols-2">
            <Input label="Sort order" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} error={errors.sort_order} className="font-mono" />
            <Checkbox label="Featured on the home page" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} className="pb-3" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing === 'new' ? 'Create' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete collection?" size="sm" description={deleting?.name}>
        <p className="text-sm text-muted">Products in this collection will remain in the catalogue but become unassigned.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}
