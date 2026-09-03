import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Collection, Product, Spec, ProductStatus } from '../../lib/types';
import { slugify } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard } from '../../components/admin/AdminPage';
import ImageUploader from '../../components/admin/ImageUploader';
import { Input, Textarea, Select, Checkbox } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';

interface Draft {
  name: string;
  slug: string;
  collection_id: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  sku: string;
  stock: string;
  status: ProductStatus;
  featured: boolean;
  materials: string;
  images: string[];
  specs: Spec[];
  features: string[];
}

const empty: Draft = { name: '', slug: '', collection_id: '', short_description: '', description: '', price: '', compare_at_price: '', sku: '', stock: '0', status: 'active', featured: false, materials: '', images: [], specs: [], features: [] };

type Errors = Partial<Record<keyof Draft, string>>;

export default function AdminProductForm() {
  const { id } = useParams();
  const isNew = !id;
  useSEO(isNew ? 'New product — Admin' : 'Edit product — Admin');
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(empty);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  useEffect(() => {
    api<Collection[]>('/api/collections').then(setCollections).catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    api<Product>(`/api/products?id=${id}&all=1`)
      .then((p) => {
        if (cancelled) return;
        setDraft({
          name: p.name,
          slug: p.slug,
          collection_id: p.collection_id ? String(p.collection_id) : '',
          short_description: p.short_description,
          description: p.description,
          price: String(p.price),
          compare_at_price: p.compare_at_price != null ? String(p.compare_at_price) : '',
          sku: p.sku,
          stock: String(p.stock),
          status: p.status,
          featured: p.featured,
          materials: p.materials,
          images: p.images,
          specs: p.specs,
          features: p.features,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (draft.name.trim().length < 2) e.name = 'Name is required.';
    if (!slugify(draft.slug || draft.name)) e.slug = 'Slug is required.';
    const price = Number(draft.price);
    if (draft.price === '' || Number.isNaN(price) || price < 0) e.price = 'Enter a valid price.';
    if (draft.compare_at_price !== '') {
      const cmp = Number(draft.compare_at_price);
      if (Number.isNaN(cmp) || cmp <= price) e.compare_at_price = 'Must be greater than the price.';
    }
    const stock = Number(draft.stock);
    if (draft.stock === '' || !Number.isInteger(stock) || stock < 0) e.stock = 'Enter a whole number.';
    if (draft.short_description.trim().length < 10) e.short_description = 'Add a short description (10+ characters).';
    return e;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please correct the highlighted fields');
      return;
    }
    setSaving(true);
    const body = {
      ...(isNew ? {} : { id: Number(id) }),
      name: draft.name.trim(),
      slug: slugify(draft.slug || draft.name),
      collection_id: draft.collection_id ? Number(draft.collection_id) : null,
      short_description: draft.short_description.trim(),
      description: draft.description.trim(),
      price: Number(draft.price),
      compare_at_price: draft.compare_at_price === '' ? null : Number(draft.compare_at_price),
      sku: draft.sku.trim(),
      stock: Number(draft.stock),
      status: draft.status,
      featured: draft.featured,
      materials: draft.materials.trim(),
      images: draft.images,
      specs: draft.specs.filter((s) => s.label.trim() && s.value.trim()),
      features: draft.features.map((f) => f.trim()).filter(Boolean),
    };
    try {
      const saved = await api<Product>('/api/products', { method: isNew ? 'POST' : 'PUT', body });
      toast.success(isNew ? 'Product created' : 'Product saved', saved.name);
      navigate('/admin/products');
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={() => navigate(0)} />;

  return (
    <AdminPage
      eyebrow="Catalogue"
      title={isNew ? 'New product' : draft.name || 'Edit product'}
      actions={
        <>
          <Button variant="ghost" to="/admin/products" icon={<ChevronLeft size={14} />}>Back</Button>
          <Button onClick={submit} loading={saving}>{isNew ? 'Create product' : 'Save changes'}</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title="Details">
            <div className="space-y-5 p-5">
              <Input label="Name" value={draft.name} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} error={errors.name} required />
              <Input label="Slug" value={draft.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} onBlur={() => set('slug', slugify(draft.slug))} error={errors.slug} hint={`/products/${slugify(draft.slug || draft.name) || '…'}`} className="font-mono" required />
              <Textarea label="Short description" value={draft.short_description} onChange={(e) => set('short_description', e.target.value)} error={errors.short_description} className="min-h-[80px]" required hint="Shown on cards and at the top of the product page." />
              <Textarea label="Full description" value={draft.description} onChange={(e) => set('description', e.target.value)} className="min-h-[180px]" hint="Separate paragraphs with a blank line." />
              <Input label="Materials" value={draft.materials} onChange={(e) => set('materials', e.target.value)} placeholder="Grade-5 titanium, sapphire" />
            </div>
          </AdminCard>

          <AdminCard title="Images">
            <div className="p-5">
              <ImageUploader images={draft.images} onChange={(imgs) => set('images', imgs)} />
            </div>
          </AdminCard>

          <AdminCard title="Specifications" action={<button type="button" onClick={() => set('specs', [...draft.specs, { label: '', value: '' }])} className="flex items-center gap-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-gold"><Plus size={12} /> Add row</button>}>
            <div className="space-y-3 p-5">
              {draft.specs.length === 0 && <p className="text-sm text-muted">No specifications yet.</p>}
              {draft.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label="Spec label" placeholder="Label" value={s.label} onChange={(e) => set('specs', draft.specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} wrapperClassName="flex-1" />
                  <Input aria-label="Spec value" placeholder="Value" value={s.value} onChange={(e) => set('specs', draft.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} wrapperClassName="flex-[2]" />
                  <button type="button" onClick={() => set('specs', draft.specs.filter((_, k) => k !== i))} className="h-12 rounded-sm border border-edge px-3 text-muted transition hover:border-danger/50 hover:text-danger" aria-label="Remove row"><X size={14} /></button>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Features" action={<button type="button" onClick={() => set('features', [...draft.features, ''])} className="flex items-center gap-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-gold"><Plus size={12} /> Add feature</button>}>
            <div className="space-y-3 p-5">
              {draft.features.length === 0 && <p className="text-sm text-muted">No features yet.</p>}
              {draft.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label="Feature" placeholder="Feature" value={f} onChange={(e) => set('features', draft.features.map((x, k) => (k === i ? e.target.value : x)))} wrapperClassName="flex-1" />
                  <button type="button" onClick={() => set('features', draft.features.filter((_, k) => k !== i))} className="h-12 rounded-sm border border-edge px-3 text-muted transition hover:border-danger/50 hover:text-danger" aria-label="Remove feature"><X size={14} /></button>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Pricing & inventory">
            <div className="space-y-5 p-5">
              <Input label="Price" type="number" step="0.01" min={0} value={draft.price} onChange={(e) => set('price', e.target.value)} error={errors.price} className="font-mono" required />
              <Input label="Compare-at price" type="number" step="0.01" min={0} value={draft.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} error={errors.compare_at_price} className="font-mono" hint="Optional. Shows a private offer badge." />
              <Input label="SKU" value={draft.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} className="font-mono" placeholder="AE-XX-000" />
              <Input label="Stock" type="number" min={0} step={1} value={draft.stock} onChange={(e) => set('stock', e.target.value)} error={errors.stock} className="font-mono" required />
            </div>
          </AdminCard>
          <AdminCard title="Organisation">
            <div className="space-y-5 p-5">
              <Select label="Collection" value={draft.collection_id} onChange={(e) => set('collection_id', e.target.value)} placeholder="No collection" options={collections.map((c) => ({ value: String(c.id), label: c.name }))} />
              <Select label="Status" value={draft.status} onChange={(e) => set('status', e.target.value as ProductStatus)} options={[{ value: 'active', label: 'Active — visible in store' }, { value: 'draft', label: 'Draft — hidden' }, { value: 'archived', label: 'Archived — hidden' }]} />
              <Checkbox label="Featured on the home page" checked={draft.featured} onChange={(e) => set('featured', e.target.checked)} />
            </div>
          </AdminCard>
          {!isNew && (
            <Link to={`/products/${draft.slug}`} target="_blank" rel="noreferrer" className="block text-center font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted hover:text-gold">
              View in storefront ↗
            </Link>
          )}
        </div>
      </form>
    </AdminPage>
  );
}
