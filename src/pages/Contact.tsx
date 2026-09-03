import { useState, type FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, Check } from 'lucide-react';
import { useSEO } from '../lib/useSEO';
import { api, errorMessage } from '../lib/api';
import { isEmail } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import { Input, Textarea, Select } from '../components/ui/Field';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';

const subjects = [
  { value: 'Order enquiry', label: 'Order enquiry' },
  { value: 'Private commission', label: 'Private commission' },
  { value: 'Servicing & aftercare', label: 'Servicing & aftercare' },
  { value: 'Press', label: 'Press' },
  { value: 'Other', label: 'Other' },
];

export default function Contact() {
  useSEO('Concierge', 'Contact the AETHER concierge for orders, commissions and aftercare.');
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ name: profile?.full_name ?? '', email: user?.email ?? '', subject: 'Order enquiry', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = 'Please tell us your name.';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!form.subject) next.subject = 'Choose a subject.';
    if (form.message.trim().length < 10) next.message = 'Tell us a little more (10+ characters).';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setServerError(null);
    try {
      await api('/api/contact', { method: 'POST', body: form });
      setDone(true);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Concierge" title={<>We are <span className="italic text-muted">listening.</span></>} description="For orders, private commissions, servicing or simply a conversation about objects — a dedicated advisor will respond within one business day." crumbs={[{ label: 'Concierge' }]} />
      <section className="wrap grid gap-14 pb-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <ul className="space-y-8">
            {settings.contact_email && (
              <li className="flex gap-4">
                <Mail size={18} className="mt-1 shrink-0 text-gold" />
                <div>
                  <p className="eyebrow text-[0.58rem]">Email</p>
                  <a href={`mailto:${settings.contact_email}`} className="mt-1 block text-ivory hover:text-gold">{settings.contact_email}</a>
                </div>
              </li>
            )}
            {settings.contact_phone && (
              <li className="flex gap-4">
                <Phone size={18} className="mt-1 shrink-0 text-gold" />
                <div>
                  <p className="eyebrow text-[0.58rem]">Telephone</p>
                  <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, '')}`} className="mt-1 block text-ivory hover:text-gold">{settings.contact_phone}</a>
                </div>
              </li>
            )}
            {settings.address && (
              <li className="flex gap-4">
                <MapPin size={18} className="mt-1 shrink-0 text-gold" />
                <div>
                  <p className="eyebrow text-[0.58rem]">Atelier</p>
                  <p className="mt-1 text-ivory">{settings.address}</p>
                </div>
              </li>
            )}
            {settings.hours && (
              <li className="flex gap-4">
                <Clock size={18} className="mt-1 shrink-0 text-gold" />
                <div>
                  <p className="eyebrow text-[0.58rem]">Hours</p>
                  <p className="mt-1 text-ivory">{settings.hours}</p>
                </div>
              </li>
            )}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6">
          {done ? (
            <div className="glass rounded-sm p-10 text-center" role="status">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-success/40 text-success">
                <Check size={22} />
              </div>
              <h2 className="mt-6 font-display text-3xl">Message received</h2>
              <p className="mt-3 text-sm text-muted">Thank you, {form.name.split(' ')[0]}. An advisor will reply to {form.email} within one business day.</p>
              <Button variant="secondary" className="mt-8" onClick={() => { setDone(false); setForm((f) => ({ ...f, message: '' })); }}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="glass space-y-5 rounded-sm p-6 md:p-10">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required autoComplete="name" />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required autoComplete="email" />
              </div>
              <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} options={subjects} error={errors.subject} required />
              <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} required className="min-h-[160px]" placeholder="How may we help?" />
              {serverError && (
                <p className="rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger" role="alert">
                  {serverError}
                </p>
              )}
              <Button type="submit" size="lg" loading={loading}>
                Send message
              </Button>
            </form>
          )}
        </Reveal>
      </section>
    </>
  );
}
