import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { Settings } from '../../lib/types';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { isEmail } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard } from '../../components/admin/AdminPage';
import { Input, Textarea } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function AdminSettings() {
  useSEO('Settings — Admin');
  const { settings, loading } = useSettings();
  if (loading) return <TableSkeleton rows={6} />;
  return <SettingsForm initial={settings} />;
}

function SettingsForm({ initial }: { initial: Settings }) {
  const { setSettings } = useSettings();
  const toast = useToast();
  const [draft, setDraft] = useState<Settings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!draft.store_name?.trim()) next.store_name = 'Store name is required.';
    const tax = Number(draft.tax_rate);
    if (draft.tax_rate === '' || Number.isNaN(tax) || tax < 0 || tax > 1) next.tax_rate = 'Enter a decimal between 0 and 1 (e.g. 0.08).';
    if (Number.isNaN(Number(draft.shipping_flat)) || Number(draft.shipping_flat) < 0) next.shipping_flat = 'Must be zero or more.';
    if (Number.isNaN(Number(draft.free_shipping_threshold)) || Number(draft.free_shipping_threshold) < 0) next.free_shipping_threshold = 'Must be zero or more.';
    if (!/^[A-Z]{3}$/.test(draft.currency || '')) next.currency = 'Use a 3-letter ISO code (USD, EUR, GBP).';
    if (draft.contact_email && !isEmail(draft.contact_email)) next.contact_email = 'Enter a valid email.';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      const updated = await api<Settings>('/api/settings', { method: 'PUT', body: draft });
      setSettings(updated);
      setDraft(updated);
      toast.success('Settings saved', 'Changes are live across the storefront.');
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage title="Settings" description="Storefront identity, commerce rules and concierge details." actions={<Button onClick={save} loading={saving}>Save settings</Button>}>
      <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Identity">
          <div className="space-y-5 p-5">
            <Input label="Store name" value={draft.store_name ?? ''} onChange={set('store_name')} error={errors.store_name} required />
            <Input label="Tagline" value={draft.tagline ?? ''} onChange={set('tagline')} hint="Shown in the hero and footer." />
            <Textarea label="Announcement bar" value={draft.announcement ?? ''} onChange={set('announcement')} className="min-h-[72px]" hint="Leave blank to hide the bar above the navigation." />
          </div>
        </AdminCard>
        <AdminCard title="Commerce">
          <div className="space-y-5 p-5">
            <Input label="Currency (ISO)" value={draft.currency ?? ''} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value.toUpperCase() }))} error={errors.currency} className="font-mono uppercase" maxLength={3} />
            <Input label="Tax rate (decimal)" type="number" step="0.001" min={0} max={1} value={draft.tax_rate ?? ''} onChange={set('tax_rate')} error={errors.tax_rate} className="font-mono" hint={`Currently ${Math.round((Number(draft.tax_rate) || 0) * 1000) / 10}%`} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Flat shipping" type="number" step="0.01" min={0} value={draft.shipping_flat ?? ''} onChange={set('shipping_flat')} error={errors.shipping_flat} className="font-mono" />
              <Input label="Free shipping over" type="number" step="0.01" min={0} value={draft.free_shipping_threshold ?? ''} onChange={set('free_shipping_threshold')} error={errors.free_shipping_threshold} className="font-mono" hint="0 disables free shipping" />
            </div>
          </div>
        </AdminCard>
        <AdminCard title="Concierge">
          <div className="space-y-5 p-5">
            <Input label="Contact email" type="email" value={draft.contact_email ?? ''} onChange={set('contact_email')} error={errors.contact_email} />
            <Input label="Telephone" value={draft.contact_phone ?? ''} onChange={set('contact_phone')} />
            <Input label="Atelier address" value={draft.address ?? ''} onChange={set('address')} />
            <Input label="Hours" value={draft.hours ?? ''} onChange={set('hours')} />
          </div>
        </AdminCard>
        <AdminCard title="Social">
          <div className="space-y-5 p-5">
            <Input label="Instagram URL" value={draft.instagram ?? ''} onChange={set('instagram')} placeholder="https://instagram.com/aether" />
            <Input label="X URL" value={draft.twitter ?? ''} onChange={set('twitter')} placeholder="https://x.com/aether" />
          </div>
        </AdminCard>
      </form>
    </AdminPage>
  );
}
