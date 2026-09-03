import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Search, ShoppingBag, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'Maison' },
  { to: '/contact', label: 'Concierge' },
];

export default function Navbar() {
  const { count, openCart } = useCart();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    setSearchOpen(false);
    setQuery('');
  };

  const solid = scrolled || menuOpen || searchOpen || location.pathname !== '/';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {settings.announcement && (
        <div className="bg-gold px-4 py-2 text-center font-mono text-[0.6rem] font-medium uppercase tracking-[0.25em] text-void">
          {settings.announcement}
        </div>
      )}
      <nav className={cn('transition-all duration-500', solid ? 'glass-nav' : 'bg-transparent')} aria-label="Primary">
        <div className="wrap relative flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded p-2 text-ivory transition hover:text-gold lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <ul className="hidden items-center gap-9 lg:flex">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'link-underline font-mono text-[0.65rem] uppercase tracking-[0.28em] transition-colors',
                        isActive ? 'text-gold' : 'text-ivory/80 hover:text-ivory'
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/"
            onClick={closeAll}
            className="absolute left-1/2 -translate-x-1/2 font-display text-[1.65rem] font-light tracking-[0.42em] text-ivory transition hover:text-gold sm:text-3xl"
            aria-label="AETHER home"
          >
            AETHER
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-full p-2.5 text-ivory transition hover:bg-white/5 hover:text-gold"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search size={19} />
            </button>
            {isAdmin && (
              <Link to="/admin" onClick={closeAll} className="hidden rounded-full p-2.5 text-gold transition hover:bg-white/5 md:block" aria-label="Admin dashboard" title="Admin">
                <ShieldCheck size={19} />
              </Link>
            )}
            <Link
              to={user ? '/account' : '/login'}
              onClick={closeAll}
              className="hidden rounded-full p-2.5 text-ivory transition hover:bg-white/5 hover:text-gold sm:block"
              aria-label={user ? 'My account' : 'Sign in'}
            >
              <User size={19} />
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative rounded-full p-2.5 text-ivory transition hover:bg-white/5 hover:text-gold"
              aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-mono text-[0.6rem] font-bold text-void">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-edge"
            >
              <form onSubmit={submitSearch} className="wrap flex items-center gap-4 py-4" role="search">
                <Search size={18} className="text-gold" aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search objects, materials, collections…"
                  aria-label="Search products"
                  className="h-10 flex-1 bg-transparent font-display text-xl text-ivory placeholder:text-dim focus:outline-none sm:text-2xl"
                />
                <button type="submit" className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-gold">
                  Search <ArrowRight size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-nav fixed inset-x-0 bottom-0 top-[calc(5rem+2rem)] z-40 overflow-y-auto lg:hidden"
            style={{ top: settings.announcement ? 'calc(5rem + 2.05rem)' : '5rem' }}
          >
            <div className="wrap flex flex-col gap-2 py-10">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  <NavLink
                    to={l.to}
                    onClick={closeAll}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between border-b border-edge py-5 font-display text-4xl font-light',
                        isActive ? 'text-gold' : 'text-ivory'
                      )
                    }
                  >
                    {l.label}
                    <ArrowRight size={20} className="text-gold" />
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-8 flex flex-col gap-4">
                <Link to={user ? '/account' : '/login'} onClick={closeAll} className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-muted">
                  <User size={16} /> {user ? 'My account' : 'Sign in / Register'}
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={closeAll} className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-gold">
                    <ShieldCheck size={16} /> Admin dashboard
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
