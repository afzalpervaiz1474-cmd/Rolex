import { useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { isEmail, cn } from '../../lib/utils';

interface Props {
  source?: string;
  compact?: boolean;
  className?: string;
}

export default function NewsletterForm({ source = 'footer', compact, className }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setState('loading');
    try {
      await api('/api/subscribe', { method: 'POST', body: { email: email.trim(), source } });
      setState('done');
      setEmail('');
    } catch (err) {
      setError(errorMessage(err));
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <p className={cn('flex items-center gap-2 text-sm text-success', className)} role="status">
        <Check size={16} /> You are on the list. Welcome to the inner circle.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className={cn('flex items-center border-b border-edge-strong transition focus-within:border-gold', compact ? 'max-w-sm' : 'max-w-lg')}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          aria-invalid={Boolean(error)}
          className={cn('flex-1 bg-transparent py-3 text-ivory placeholder:text-dim focus:outline-none', compact ? 'text-sm' : 'font-display text-xl')}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="flex items-center gap-2 py-3 pl-4 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-gold transition hover:text-gold-bright disabled:opacity-50"
        >
          {state === 'loading' ? 'Joining…' : 'Join'} <ArrowRight size={14} />
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
