import { useState } from 'react';
import { Mail, MailOpen, Archive, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { ContactMessage } from '../../lib/types';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, cn } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard } from '../../components/admin/AdminPage';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

export default function AdminMessages() {
  useSEO('Messages — Admin');
  const toast = useToast();
  const { data, loading, error, refetch: load, setData } = useQuery(() => api<ContactMessage[]>('/api/contact'), []);
  const messages = data ?? [];
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const setStatus = async (m: ContactMessage, status: ContactMessage['status']) => {
    try {
      const updated = await api<ContactMessage>('/api/contact', { method: 'PUT', body: { id: m.id, status } });
      setData((prev) => (prev ?? []).map((x) => (x.id === m.id ? updated : x)));
      if (selected?.id === m.id) setSelected(updated);
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    }
  };

  const open = (m: ContactMessage) => {
    setSelected(m);
    if (m.status === 'new') setStatus(m, 'read');
  };

  const remove = async (m: ContactMessage) => {
    try {
      await api('/api/contact', { method: 'DELETE', body: { id: m.id } });
      setData((prev) => (prev ?? []).filter((x) => x.id !== m.id));
      if (selected?.id === m.id) setSelected(null);
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Could not delete', errorMessage(err));
    }
  };

  return (
    <AdminPage title="Messages" description="Concierge enquiries submitted through the contact form.">
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : messages.length === 0 ? (
        <EmptyState icon={<Mail size={22} />} title="Inbox is clear" description="New concierge messages will appear here." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <AdminCard className="lg:col-span-2">
            <ul className="divide-y divide-edge">
              {messages.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => open(m)} className={cn('flex w-full flex-col gap-1 px-5 py-4 text-left transition hover:bg-white/[0.03]', selected?.id === m.id && 'bg-gold/5')} aria-current={selected?.id === m.id}>
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className={cn('truncate text-sm', m.status === 'new' ? 'font-semibold text-ivory' : 'text-muted')}>{m.name}</span>
                      <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-wider text-dim">{formatDate(m.created_at)}</span>
                    </div>
                    <span className="truncate text-xs text-muted">{m.subject}</span>
                    <StatusBadge status={m.status} className="mt-1" />
                  </button>
                </li>
              ))}
            </ul>
          </AdminCard>
          <AdminCard className="lg:col-span-3">
            {selected ? (
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-[0.58rem]">{selected.subject}</p>
                    <h2 className="mt-2 font-display text-2xl">{selected.name}</h2>
                    <a href={`mailto:${selected.email}`} className="text-sm text-muted hover:text-gold">{selected.email}</a>
                  </div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-wider text-dim">{formatDate(selected.created_at, true)}</p>
                </div>
                <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ivory">{selected.message}</p>
                <div className="mt-8 flex flex-wrap gap-2 border-t border-edge pt-5">
                  <Button size="sm" href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`} icon={<MailOpen size={13} />}>Reply by email</Button>
                  {selected.status !== 'archived' && <Button size="sm" variant="ghost" icon={<Archive size={13} />} onClick={() => setStatus(selected, 'archived')}>Archive</Button>}
                  {selected.status === 'archived' && <Button size="sm" variant="ghost" onClick={() => setStatus(selected, 'read')}>Unarchive</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto hover:text-danger" icon={<Trash2 size={13} />} onClick={() => remove(selected)}>Delete</Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center p-6 text-sm text-muted">Select a message to read it.</div>
            )}
          </AdminCard>
        </div>
      )}
    </AdminPage>
  );
}
