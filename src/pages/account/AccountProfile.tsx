import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api, errorMessage } from '../../lib/api';
import type { Profile } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import supabase from '../../lib/supabase';
import { Input } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function AccountProfile() {
  const { user, profile, profileLoading } = useAuth();
  if (!profile) {
    if (profileLoading) return <TableSkeleton rows={4} />;
    return (
      <div className="glass rounded-md p-8 text-sm text-muted">
        We could not load your profile. Please refresh the page or sign in again.
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <ProfileForm key={profile.id} profile={profile} email={user?.email ?? ''} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const { refreshProfile } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (phone && !/^[+\d\s()-]{6,24}$/.test(phone)) next.phone = 'Phone number looks invalid.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await api<Profile>('/api/profile', { method: 'PUT', body: { full_name: fullName.trim(), phone: phone.trim() } });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass rounded-md p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Profile</p>
          <h2 className="mt-2 font-display text-3xl">Personal details</h2>
        </div>
        <Badge tone={profile.role === 'admin' ? 'gold' : 'neutral'}>{profile.role}</Badge>
      </div>
      <form onSubmit={save} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} autoComplete="name" />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" />
        </div>
        <Input label="Email" value={email} disabled hint="Email is managed through your sign-in provider." />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Member since {formatDate(profile.created_at)}</p>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pw.next.length < 8) return setPwError('Use at least 8 characters.');
    if (pw.next !== pw.confirm) return setPwError('Passwords do not match.');
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwSaving(false);
    if (error) return setPwError(error.message);
    setPw({ next: '', confirm: '' });
    toast.success('Password updated');
  };

  return (
    <section className="glass rounded-md p-6 md:p-8">
      <p className="eyebrow">Security</p>
      <h2 className="mt-2 font-display text-3xl">Change password</h2>
      <form onSubmit={changePassword} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="New password" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} hint="Minimum 8 characters" />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        </div>
        {pwError && (
          <p className="text-xs text-danger" role="alert">
            {pwError}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" loading={pwSaving}>
            Update password
          </Button>
        </div>
      </form>
    </section>
  );
}
