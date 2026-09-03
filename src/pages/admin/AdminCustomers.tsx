import { useMemo, useState } from 'react';
import { Search, ShieldCheck, User } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useQuery } from '../../lib/useQuery';
import type { Customer } from '../../lib/types';
import { usePrice } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, initials } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';
import AdminPage, { AdminCard, Table, Stat } from '../../components/admin/AdminPage';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export default function AdminCustomers() {
  useSEO('Customers — Admin');
  const fmt = usePrice();
  const toast = useToast();
  const { user } = useAuth();
  const { data, loading, error, refetch: load } = useQuery(() => api<Customer[]>('/api/customers'), []);
  const customers = useMemo(() => data ?? [], [data]);
  const [search, setSearch] = useState('');
  const [roleTarget, setRoleTarget] = useState<Customer | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return customers.filter((c) => !s || c.email.toLowerCase().includes(s) || (c.full_name || '').toLowerCase().includes(s));
  }, [customers, search]);

  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0);

  const toggleRole = async () => {
    if (!roleTarget) return;
    const role = roleTarget.role === 'admin' ? 'customer' : 'admin';
    setBusy(true);
    try {
      await api('/api/customers', { method: 'PUT', body: { id: roleTarget.id, role } });
      toast.success('Role updated', `${roleTarget.email} is now ${role}`);
      setRoleTarget(null);
      load();
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPage title="Customers" description="Registered members and their purchase history.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={String(customers.length)} />
        <Stat label="Lifetime value" value={fmt(totalSpent)} tone="gold" />
        <Stat label="Administrators" value={String(customers.filter((c) => c.role === 'admin').length)} />
      </div>
      <AdminCard>
        <div className="border-b border-edge p-4">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" aria-label="Search customers" className="h-11 w-full rounded-sm border border-edge bg-white/[0.03] pl-9 pr-3 text-sm text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-4"><EmptyState icon={<User size={22} />} title="No customers found" /></div>
        ) : (
          <Table head={<><th>Customer</th><th>Role</th><th>Orders</th><th>Spent</th><th>Last order</th><th>Joined</th><th className="text-right">Actions</th></>} minWidth={860}>
            {filtered.map((c) => (
              <tr key={c.id} className="transition hover:bg-white/[0.02]">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 font-display text-sm text-gold">{initials(c.full_name, c.email)}</div>
                    <div className="min-w-0">
                      <p className="truncate text-ivory">{c.full_name || '—'}</p>
                      <p className="truncate text-xs text-muted">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td><StatusBadge status={c.role} /></td>
                <td className="font-mono">{c.order_count}</td>
                <td className="font-mono text-gold">{fmt(c.total_spent)}</td>
                <td className="text-muted">{formatDate(c.last_order_at)}</td>
                <td className="text-muted">{formatDate(c.created_at)}</td>
                <td>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setRoleTarget(c)} disabled={c.id === user?.id} className="flex items-center gap-1.5 rounded-sm border border-edge px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted transition hover:border-gold/50 hover:text-gold disabled:opacity-30">
                      <ShieldCheck size={12} /> {c.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </AdminCard>

      <Modal open={roleTarget !== null} onClose={() => setRoleTarget(null)} title={roleTarget?.role === 'admin' ? 'Revoke admin access?' : 'Grant admin access?'} size="sm" description={roleTarget?.email}>
        <p className="text-sm text-muted">{roleTarget?.role === 'admin' ? 'This member will lose access to the admin dashboard.' : 'This member will be able to manage products, orders, customers and settings.'}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRoleTarget(null)}>Cancel</Button>
          <Button loading={busy} onClick={toggleRole}>Confirm</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}
