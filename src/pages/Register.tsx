import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { isEmail } from '../lib/utils';
import { useSEO } from '../lib/useSEO';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input, Checkbox } from '../components/ui/Field';
import Button from '../components/ui/Button';
import GoogleButton from '../components/GoogleButton';
import { AuthShell, Divider } from './Login';

export default function Register() {
  useSEO('Create account', 'Join the AETHER inner circle.');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string; agree?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    else if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) next.password = 'Include at least one letter and one number.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    if (!agree) next.agree = 'Please accept the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) {
      setErrors({ form: error.message });
      return;
    }
    if (data.session) {
      toast.success('Welcome to AETHER', 'Your account is ready.');
    } else {
      setNeedsConfirm(true);
    }
  };

  if (needsConfirm) {
    return (
      <AuthShell title={<>Check your <span className="italic text-muted">inbox.</span></>} subtitle={`We sent a confirmation link to ${email}. Follow it to activate your account.`}>
        <Button to="/login" variant="secondary" full>
          Return to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        <>
          Join the <span className="italic text-muted">circle.</span>
        </>
      }
      subtitle="Create an account for order tracking, saved addresses and early access to new series."
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="8+ characters, letters and numbers" required />
          <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} required />
        </div>
        <div>
          <Checkbox
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            label={
              <>
                I agree to the{' '}
                <Link to="/terms" className="text-gold hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-gold hover:underline">
                  Privacy Policy
                </Link>
              </>
            }
          />
          {errors.agree && (
            <p className="mt-2 text-xs text-danger" role="alert">
              {errors.agree}
            </p>
          )}
        </div>
        {errors.form && (
          <p className="rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger" role="alert">
            {errors.form}
          </p>
        )}
        <Button type="submit" full size="lg" loading={loading}>
          Create account
        </Button>
      </form>
      <Divider />
      <GoogleButton label="Sign up with Google" onClick={() => { if (!signInWithGoogle('AETHER')) toast.error('Google sign-in unavailable'); }} />
      <p className="mt-8 text-center text-sm text-muted">
        Already a member?{' '}
        <Link to="/login" state={{ from }} className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
