"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { cartApi } from "@/lib/api/cart";
import type { CouponPopup as Popup } from "@/types";

// ছোট কুপন পপআপ: সাইটে ঢুকলে একবার ভেসে ওঠে (ট্যাব/ব্রাউজার বন্ধ করে আবার ঢুকলে আবার), কয়েক সেকেন্ড থাকে,
// কাস্টমার নিজেও ✕ চাপতে পারে। কুপন কোড কপি করা যায়। মাউস/আঙুল রাখলে সময় থেমে থাকে।
const KEY = "akhi_coupon_popup_seen";

export function CouponPopup() {
  const [p, setP] = useState<Popup | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => { if (timer.current) clearTimeout(timer.current); setP(null); }, []);
  const arm = useCallback((sec: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(close, sec * 1000);
  }, [close]);

  useEffect(() => {
    let seen = "";
    try { seen = sessionStorage.getItem(KEY) || ""; } catch { /* private mode: show it every page load */ }
    let alive = true;
    const t = setTimeout(() => {
      cartApi.couponPopup().then((c) => {
        if (!alive || !c || seen === String(c.id)) return;
        try { sessionStorage.setItem(KEY, String(c.id)); } catch { /* ignore */ }
        setP(c);
        arm(c.seconds || 2);
      }).catch(() => {});
    }, 800);
    return () => { alive = false; clearTimeout(t); if (timer.current) clearTimeout(timer.current); };
  }, [arm]);

  if (!p) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.code); } catch {
      const t = document.createElement("textarea"); t.value = p.code; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch { /* ignore */ } t.remove();
    }
    setCopied(true);
    arm(Math.max(p.seconds || 2, 3));       // কপি করলে একটু বেশি সময় দেখায়
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-3 md:bottom-6 md:justify-start md:px-6" role="dialog" aria-label="কুপন">
      <div className="pointer-events-auto w-full max-w-[340px] animate-[popin_.25s_ease-out] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onMouseEnter={() => timer.current && clearTimeout(timer.current)} onMouseLeave={() => arm(p.seconds || 2)}
        onTouchStart={() => timer.current && clearTimeout(timer.current)}>
        <button onClick={close} aria-label="বন্ধ করুন" className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white">
          <Icon name="x" className="h-4 w-4" />
        </button>
        {p.image && <div className="aspect-[16/7] w-full bg-brand-50"><SmartImage src={p.image} alt={p.title || "কুপন"} className="h-full w-full object-cover" /></div>}
        <div className="space-y-2 p-3.5">
          <p className="break-words text-base font-extrabold">{p.title || `${p.label} কুপন`}</p>
          {p.text && <p className="break-words text-sm text-muted">{p.text}</p>}
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand-400 bg-brand-50 px-3 py-2">
            <span className="min-w-0 flex-1 break-all text-sm font-extrabold tracking-wide text-brand-700">{p.code}</span>
            <button onClick={copy} className="shrink-0 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">{copied ? "কপি হয়েছে ✓" : "কপি"}</button>
          </div>
          {p.button_text && p.link && (
            <Link href={p.link} onClick={close} className="block rounded-lg bg-brand-600 py-2 text-center text-sm font-bold text-white">{p.button_text}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
