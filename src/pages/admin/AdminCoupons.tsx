import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Coupon } from '../../lib/types';
import { usePrice } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard, Table } from '../../components/admin/AdminPage';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, Select, Checkbox } from '../../components/ui/Field';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';

interface Draft { code: string; type: 'percent' | 'fixed'; value: string; min_subtotal: string; max_uses: string; expires_at: string; active: boolean }
const empty: Draft = { code: '', type: 'percent', value: '', min_subtotal: '', max_uses: '', expires_at: '', active: true };

export default function AdminCoupons() {
  useSEO('Coupons — Admin');
  const fmt = usePrice();
  const toast = useToast();
  const { data, loading, error, refetch: load, setData } = useQuery(() => api<Coupon[]>('/api/coupons'), []);
  const coupons = data ?? [];
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const open = (c: Coupon | 'new') => {
    setEditing(c);
    setErrors({});
    setDraft(c === 'new' ? empty : { code: c.code, type: c.type, value: String(c.value), min_subtotal: c.min_subtotal ? String(c.min_subtotal) : '', max_uses: c.max_uses != null ? String(c.max_uses) : '', expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '', active: c.active });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[A-Z0-9-]{3,24}$/.test(draft.code.trim().toUpperCase())) next.code = 'Use 3–24 letters, numbers or dashes.';
    const v = Number(draft.value);
    if (draft.value === '' || Number.isNaN(v) || v <= 0) next.value = 'Enter a value greater than zero.';
    else if (draft.type === 'percent' && v > 100) next.value = 'Percent cannot exceed 100.';
    if (draft.min_subtotal !== '' && (Number.isNaN(Number(draft.min_subtotal)) || Number(draft.min_subtotal) < 0)) next.min_subtotal = 'Must be zero or more.';
    if (draft.max_uses !== '' && (!Number.isInteger(Number(draft.max_uses)) || Number(draft.max_uses) < 1)) next.max_uses = 'Must be a whole number ≥ 1.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const body = { ...draft, code: draft.code.trim().toUpperCase(), value: v, min_subtotal: draft.min_subtotal === '' ? 0 : Number(draft.min_subtotal), max_uses: draft.max_uses === '' ? null : Number(draft.max_uses), expires_at: draft.expires_at ? new Date(`${draft.expires_at}T23:59:59`).toISOString() : null };
    try {
      if (editing === 'new') await api('/api/coupons', { method: 'POST', body });
      else if (editing) await api('/api/coupons', { method: 'PUT', body: { id: editing.id, ...body } });
      toast.success(editing === 'new' ? 'Coupon created' : 'Coupon saved', body.code);
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
      await api('/api/coupons', { method: 'DELETE', body: { id: deleting.id } });
      toast.success('Coupon deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Could not delete', errorMessage(err));
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await api('/api/coupons', { method: 'PUT', body: { id: c.id, active: !c.active } });
      setData((prev) => (prev ?? []).map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    }
  };

  const state = (c: Coupon) => {
    if (!c.active) return <Badge>Inactive</Badge>;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return <Badge tone="danger">Expired</Badge>;
    if (c.max_uses != null && c.used_count >= c.max_uses) return <Badge tone="warning">Exhausted</Badge>;
    return <Badge tone="success">Live</Badge>;
  };

  return (
    <AdminPage title="Coupons" description="Private codes for collectors, launches and partners." actions={<Button icon={<Plus size={14} />} onClick={() => open('new')}>New coupon</Button>}>
      <AdminCard>
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : coupons.length === 0 ? (
          <div className="p-4"><EmptyState icon={<Ticket size={22} />} title="No coupons yet" action={<Button onClick={() => open('new')}>Create a coupon</Button>} /></div>
        ) : (
          <Table head={<><th>Code</th><th>Discount</th><th>Minimum</th><th>Usage</th><th>Expires</th><th>State</th><th className="text-right">Actions</th></>} minWidth={860}>
            {coupons.map((c) => (
              <tr key={c.id} className="transition hover:bg-white/[0.02]">
                <td className="font-mono text-gold">{c.code}</td>
                <td>{c.type === 'percent' ? `${c.value}% off` : `${fmt(c.value)} off`}</td>
                <td className="text-muted">{c.min_subtotal ? fmt(c.min_subtotal) : '—'}</td>
                <td className="font-mono text-muted">{c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ''}</td>
                <td className="text-muted">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                <td>{state(c)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => toggleActive(c)} className="rounded-sm border border-edge px-2.5 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted transition hover:border-gold/50 hover:text-gold">{c.active ? 'Disable' : 'Enable'}</button>
                    <button type="button" onClick={() => open(c)} className="rounded p-2 text-muted transition hover:bg-white/5 hover:text-ivory" aria-label={`Edit ${c.code}`}><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeleting(c)} className="rounded p-2 text-muted transition hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${c.code}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </AdminCard>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New coupon' : 'Edit coupon'}>
        <form onSubmit={save} noValidate className="space-y-5">
          <Input label="Code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} error={errors.code} className="font-mono uppercase" placeholder="WELCOME10" required />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Draft['type'] })} options={[{ value: 'percent', label: 'Percent off' }, { value: 'fixed', label: 'Fixed amount off' }]} />
            <Input label={draft.type === 'percent' ? 'Percent' : 'Amount'} type="number" min={0} step="0.01" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} error={errors.value} className="font-mono" required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Minimum subtotal" type="number" min={0} step="0.01" value={draft.min_subtotal} onChange={(e) => setDraft({ ...draft, min_subtotal: e.target.value })} error={errors.min_subtotal} className="font-mono" hint="Leave blank for none" />
            <Input label="Max uses" type="number" min={1} step={1} value={draft.max_uses} onChange={(e) => setDraft({ ...draft, max_uses: e.target.value })} error={errors.max_uses} className="font-mono" hint="Leave blank for unlimited" />
          </div>
          <div className="grid items-end gap-5 sm:grid-cols-2">
            <Input label="Expires" type="date" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} hint="Leave blank to never expire" />
            <Checkbox label="Active" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="pb-8" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing === 'new' ? 'Create' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete coupon?" size="sm" description={deleting?.code}>
        <p className="text-sm text-muted">Orders that already used this code are unaffected.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}
