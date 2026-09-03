import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { isEmail } from '../lib/utils';
import { useSEO } from '../lib/useSEO';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import GoogleButton from '../components/GoogleButton';

export default function Login() {
  useSEO('Sign in', 'Sign in to your AETHER account.');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErrors({ form: error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message });
      return;
    }
    toast.success('Welcome back');
  };

  return (
    <AuthShell
      title={
        <>
          Welcome <span className="italic text-muted">back.</span>
        </>
      }
      subtitle="Sign in to access your orders, addresses and private offers."
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required />
        {errors.form && (
          <p className="rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger" role="alert">
            {errors.form}
          </p>
        )}
        <Button type="submit" full size="lg" loading={loading}>
          Sign in
        </Button>
      </form>
      <Divider />
      <GoogleButton onClick={() => { if (!signInWithGoogle('AETHER')) toast.error('Google sign-in unavailable'); }} />
      <p className="mt-8 text-center text-sm text-muted">
        New to AETHER?{' '}
        <Link to="/register" state={{ from }} className="text-gold hover:underline">
          Create an account
        </Link>
      </p>
      <div className="glass mt-8 rounded-sm p-4 text-xs text-muted">
        <p className="eyebrow mb-2 text-[0.55rem]">Demo credentials</p>
        <p>
          Customer: <span className="font-mono text-ivory">demo@aether.store</span> / <span className="font-mono text-ivory">Demo1234!</span>
        </p>
        <p className="mt-1">
          Admin: <span className="font-mono text-ivory">admin@aether.store</span> / <span className="font-mono text-ivory">Admin1234!</span>
        </p>
      </div>
    </AuthShell>
  );
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-edge" />
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-dim">or</span>
      <span className="h-px flex-1 bg-edge" />
    </div>
  );
}

export function AuthShell({ title, subtitle, children }: { title: React.ReactNode; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/hero.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/40 via-obsidian/30 to-obsidian" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-end p-16">
          <p className="eyebrow">The inner circle</p>
          <p className="mt-4 max-w-md font-display text-4xl font-light leading-tight">“An object is finished when nothing can be removed without loss.”</p>
          <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-dim">AETHER atelier notes, vol. I</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 pb-20 pt-36 lg:pt-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md">
          <h1 className="font-display text-5xl font-light leading-none md:text-6xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-10">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
