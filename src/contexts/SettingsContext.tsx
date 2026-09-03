import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { formatPrice } from '../lib/utils';
import type { Settings } from '../lib/types';

export const FALLBACK_SETTINGS: Settings = {
  store_name: 'AETHER',
  tagline: 'Objects for the next century',
  announcement: '',
  currency: 'USD',
  tax_rate: '0.08',
  shipping_flat: '25',
  free_shipping_threshold: '500',
  contact_email: 'concierge@aether.store',
  contact_phone: '',
  address: '',
  hours: '',
  instagram: '',
  twitter: '',
};

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  refresh: () => Promise<void>;
  setSettings: (s: Settings) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: FALLBACK_SETTINGS,
  loading: true,
  refresh: async () => undefined,
  setSettings: () => undefined,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return api<Settings>('/api/settings')
      .then((data) => setSettings({ ...FALLBACK_SETTINGS, ...data }))
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<Settings>('/api/settings')
      .then((data) => {
        if (!cancelled) setSettings({ ...FALLBACK_SETTINGS, ...data });
      })
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ settings, loading, refresh, setSettings }), [settings, loading, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

export function usePrice() {
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  return useCallback((amount: number) => formatPrice(amount, currency), [currency]);
}
