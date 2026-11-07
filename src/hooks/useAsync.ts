"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/errors";
import { useRevision } from "@/lib/store";

// API থেকে ডাটা এনে loading/error/data দেয়। reload() দিয়ে আবার আনা যায়।
export function useAsync<T>(fn: () => Promise<T>, enabled = true, every = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const last = useRef("");
  const hasData = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    // ডাটা আগে থেকেই থাকলে স্পিনার দেখাই না; শুধু বদলানো অংশ আপডেট হয়
    if (!hasData.current) setLoading(true);
    setError(null);
    try { const d = await fn(); hasData.current = true; const j = JSON.stringify(d); if (j !== last.current) { last.current = j; setData(d); } }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  // কোনো পরিবর্তন সফল হলে (স্টোরের revision বাড়লে) সঙ্গে সঙ্গে নীরবে নতুন তথ্য আনি
  const rev = useRevision();
  const seen = useRef(rev);
  useEffect(() => {
    if (rev === seen.current) return;
    seen.current = rev;
    if (!enabled) return;
    (async () => {
      try { const d = await fn(); const j = JSON.stringify(d); if (j !== last.current) { last.current = j; setData(d); } }
      catch { /* থাকুক যা আছে */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev]);

  // নীরব অটো-রিফ্রেশ: ট্যাব খোলা থাকলে প্রতি `every` ms-এ চুপচাপ নতুন তথ্য আনে (স্পিনার নেই, বদলালে তবেই আপডেট)
  useEffect(() => {
    if (!enabled || !every) return;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const d = await fn(); const j = JSON.stringify(d);
        if (j !== last.current) { last.current = j; setData(d); }
      } catch { /* পরের বারে */ }
    };
    const t = setInterval(tick, every);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", tick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, every]);

  return { data, setData, loading, error, reload: load };
}
