'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks { data, loading, error }.
 * Re-runs when `deps` change. Call reload() after a change to refresh.
 *   const { data, loading, error, reload } = useAsync(() => api('/admin/coupons'), []);
 *
 * LIVE: while the tab is visible the loader re-runs quietly every `every` ms (default 3 s) — no spinner, no flicker,
 * and the state is only replaced when the data really changed, so lists update by themselves without a browser reload.
 * Pass { every: 0 } to switch it off (forms that copy the data into their own state).
 */
export function useAsync(fn, deps = [], opts = {}) {
  const every = opts.every === undefined ? 3000 : opts.every;
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const seq = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const lastRef = useRef('');

  const run = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fnRef.current();
      if (id === seq.current) { lastRef.current = safeJson(data); setState({ data, loading: false, error: '' }); }
    } catch (e) {
      if (id === seq.current) setState({ data: null, loading: false, error: e.message || String(e) });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  /** quiet refresh: never shows a spinner, ignores errors, skips identical data */
  const quiet = useCallback(async () => {
    const id = seq.current;
    try {
      const data = await fnRef.current();
      if (id !== seq.current) return;
      const j = safeJson(data);
      if (j === lastRef.current) return;
      lastRef.current = j;
      setState((s) => ({ data, loading: false, error: s.error && !s.data ? '' : '' }));
    } catch { /* keep what is on screen */ }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run(); }, [run]);
  useEffect(() => {
    if (!every) return undefined;
    const tick = () => { if (!document.hidden) quiet(); };
    const t = setInterval(tick, every);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [quiet, every]);
  return { ...state, reload: run };
}

function safeJson(v) { try { return JSON.stringify(v); } catch { return String(Math.random()); } }

export function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Keeps a "busy" flag around an async action. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn) => {
    setBusy(true);
    try { return await fn(); } finally { setBusy(false); }
  }, []);
  return [busy, run];
}
