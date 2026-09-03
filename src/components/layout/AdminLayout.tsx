import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  Mail,
  Settings,
  Store,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn, initials } from '../../lib/utils';

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/collections', label: 'Collections', icon: Layers },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-7">
        <Link to="/admin" onClick={close} className="font-display text-2xl font-light tracking-[0.4em]">
          AETHER
        </Link>
        <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-gold">Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={close}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-sm px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] transition',
                isActive ? 'bg-gold/10 text-gold' : 'text-muted hover:bg-white/[0.04] hover:text-ivory'
              )
            }
          >
            <n.icon size={15} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-edge p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-display text-sm text-gold">
            {initials(profile?.full_name || '', user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ivory">{profile?.full_name || 'Administrator'}</p>
            <p className="truncate text-xs text-dim">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-edge py-2.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted transition hover:border-gold/50 hover:text-gold"
          >
            <Store size={13} /> Storefront
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center justify-center rounded-sm border border-edge px-3 py-2.5 text-muted transition hover:border-danger/50 hover:text-danger"
            aria-label="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid-bg min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-edge bg-void/80 backdrop-blur-xl lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-edge bg-void/80 px-5 py-4 backdrop-blur-xl lg:hidden">
        <Link to="/admin" className="font-display text-xl tracking-[0.4em]">
          AETHER
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} className="p-2 text-ivory" aria-label="Toggle admin menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-void/70" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-edge bg-void pt-14">{sidebar}</div>
        </div>
      )}

      <main className="min-h-screen px-5 py-8 md:px-10 md:py-12 lg:pl-[calc(16rem+2.5rem)]">
        <Outlet />
      </main>
    </div>
  );
}
