import { useState, type FormEvent } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Address } from '../../lib/types';
import { useToast } from '../../contexts/ToastContext';
import { Input, Checkbox } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

type Draft = Omit<Address, 'id' | 'user_id' | 'created_at'>;
const empty: Draft = { label: '', full_name: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'United States', phone: '', is_default: false };

export default function AccountAddresses() {
  const toast = useToast();
  const { data, loading, error, refetch: load } = useQuery(() => api<Address[]>('/api/addresses'), []);
  const addresses = data ?? [];
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const open = (a: Address | 'new') => {
    setEditing(a);
    setErrors({});
    setDraft(a === 'new' ? empty : { label: a.label, full_name: a.full_name, line1: a.line1, line2: a.line2, city: a.city, state: a.state, postal_code: a.postal_code, country: a.country, phone: a.phone, is_default: a.is_default });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (draft.full_name.trim().length < 2) next.full_name = 'Full name is required.';
    if (!draft.line1.trim()) next.line1 = 'Street address is required.';
    if (!draft.city.trim()) next.city = 'City is required.';
    if (!draft.state.trim()) next.state = 'State / region is required.';
    if (!draft.postal_code.trim()) next.postal_code = 'Postal code is required.';
    if (!draft.country.trim()) next.country = 'Country is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      if (editing === 'new') await api('/api/addresses', { method: 'POST', body: draft });
      else if (editing) await api('/api/addresses', { method: 'PUT', body: { id: editing.id, ...draft } });
      toast.success(editing === 'new' ? 'Address added' : 'Address updated');
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
      await api('/api/addresses', { method: 'DELETE', body: { id: deleting.id } });
      toast.success('Address removed');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Could not remove', errorMessage(err));
    }
  };

  const makeDefault = async (a: Address) => {
    try {
      await api('/api/addresses', { method: 'PUT', body: { id: a.id, is_default: true } });
      toast.success('Default address updated');
      load();
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Delivery</p>
          <h2 className="mt-2 font-display text-3xl">Saved addresses</h2>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => open('new')}>
          Add address
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : addresses.length === 0 ? (
        <EmptyState icon={<MapPin size={22} />} title="No saved addresses" description="Save an address to speed through checkout." action={<Button onClick={() => open('new')}>Add your first address</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="glass flex flex-col rounded-md p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="eyebrow text-[0.58rem]">{a.label || 'Address'}</p>
                {a.is_default && <Badge tone="gold">Default</Badge>}
              </div>
              <address className="mt-4 text-sm not-italic leading-relaxed text-muted">
                <p className="text-ivory">{a.full_name}</p>
                <p>{a.line1}</p>
                {a.line2 && <p>{a.line2}</p>}
                <p>
                  {a.city}, {a.state} {a.postal_code}
                </p>
                <p>{a.country}</p>
                {a.phone && <p className="mt-1 font-mono text-xs">{a.phone}</p>}
              </address>
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-edge pt-4">
                <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => open(a)}>
                  Edit
                </Button>
                {!a.is_default && (
                  <Button size="sm" variant="ghost" icon={<Star size={13} />} onClick={() => makeDefault(a)}>
                    Set default
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="ml-auto hover:text-danger" icon={<Trash2 size={13} />} onClick={() => setDeleting(a)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New address' : 'Edit address'}>
        <form onSubmit={save} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Label" placeholder="Home, Studio…" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <Input label="Full name" value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} error={errors.full_name} required />
          </div>
          <Input label="Street address" value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} error={errors.line1} required />
          <Input label="Apartment, suite, etc." value={draft.line2} onChange={(e) => setDraft({ ...draft, line2: e.target.value })} />
          <div className="grid gap-5 sm:grid-cols-3">
            <Input label="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} error={errors.city} required />
            <Input label="State / Region" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} error={errors.state} required />
            <Input label="Postal code" value={draft.postal_code} onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })} error={errors.postal_code} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Country" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} error={errors.country} required />
            <Input label="Phone" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </div>
          <Checkbox label="Set as default delivery address" checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save address
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Remove address?" size="sm">
        <p className="text-sm text-muted">This address will be removed from your account.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Keep
          </Button>
          <Button variant="danger" onClick={remove}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
