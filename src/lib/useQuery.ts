import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from './api';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
}

/**
 * Minimal data-fetching hook. Re-runs when `deps` change or `refetch()` is called.
 * All state updates happen asynchronously (after the fetch resolves), so it plays
 * nicely with React's rendering model and the react-hooks lint rules.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[], enabled = true) {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null, status: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setState((s) => (s.loading ? s : { ...s, loading: true, error: null, status: null }));
        return fetcherRef.current();
      })
      .then((data) => {
        if (!cancelled && data !== undefined) setState({ data: data as T, loading: false, error: null, status: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((s) => ({ data: s.data, loading: false, error: errorMessage(err), status: err instanceof ApiError ? err.status : null }));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const setData = useCallback((updater: T | null | ((prev: T | null) => T | null)) => {
    setState((s) => ({
      ...s,
      data: typeof updater === 'function' ? (updater as (prev: T | null) => T | null)(s.data) : updater,
    }));
  }, []);

  return { data: state.data, loading: state.loading, error: state.error, status: state.status, refetch, setData };
}
