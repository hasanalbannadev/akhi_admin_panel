// WhatsApp/Facebook/Instagram এর ইন-অ্যাপ ব্রাউজারে localStorage ব্লক বা খালি হতে পারে।
// তাই: localStorage → sessionStorage → মেমোরি, যেটা কাজ করে সেটাতেই রাখা হয় (লগইন/কার্ট যেন না ভাঙে)।
const mem = new Map<string, string>();

function pick(): Storage | null {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      const s = window[name];
      const k = "__t";
      s.setItem(k, "1"); s.removeItem(k);
      return s;
    } catch { /* next */ }
  }
  return null;
}

export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try { const v = pick()?.getItem(key); if (v != null) return v; } catch { /* ignore */ }
    return mem.get(key) ?? null;
  },
  set(key: string, val: string) {
    mem.set(key, val);
    try { pick()?.setItem(key, val); } catch { /* ignore */ }
  },
  remove(key: string) {
    mem.delete(key);
    try { pick()?.removeItem(key); } catch { /* ignore */ }
  },
};
