import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { cn, initials } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';

const nav = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package, end: false },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin, end: false },
];

export default function AccountLayout() {
  useSEO('My account', 'Manage your AETHER profile, orders and addresses.');
  const { user, profile, isAdmin, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out', 'Until next time.');
    navigate('/');
  };

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="wrap pb-24 pt-36 md:pt-44">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-2xl text-gold">
            {initials(profile?.full_name || '', user?.email)}
          </div>
          <div>
            <p className="eyebrow">Member since {profile ? new Date(profile.created_at).getFullYear() : '—'}</p>
            <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">{name}</h1>
          </div>
        </div>
        {isAdmin && (
          <NavLink to="/admin" className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-gold">
            <ShieldCheck size={14} /> Open admin dashboard
          </NavLink>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside>
          <nav aria-label="Account" className="glass rounded-md p-2">
            <ul className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {nav.map((n) => (
                <li key={n.to} className="shrink-0 lg:shrink">
                  <NavLink
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-sm px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] transition',
                        isActive ? 'bg-gold/10 text-gold' : 'text-muted hover:bg-white/[0.04] hover:text-ivory'
                      )
                    }
                  >
                    <n.icon size={15} /> {n.label}
                  </NavLink>
                </li>
              ))}
              <li className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-sm px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted transition hover:bg-white/[0.04] hover:text-danger"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
