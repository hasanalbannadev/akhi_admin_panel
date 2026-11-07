"use client";
import { useEffect, useState } from "react";

// WhatsApp/Facebook/Instagram/Messenger এর ইন-অ্যাপ ব্রাউজারে খুললে ছোট একটা পরামর্শ দেখায়।
// সাইট ওখানেও চলে; এটা শুধু আরও ভালো অভিজ্ঞতার জন্য (Chrome এ খুলুন)।
export function InAppBanner() {
  const [kind, setKind] = useState<"" | "android" | "ios">("");
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const inApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|WhatsApp|Line\//i.test(ua);
    if (!inApp) return;
    try { if (sessionStorage.getItem("akhi_inapp_hide")) return; } catch { /* ignore */ }
    setKind(/Android/i.test(ua) ? "android" : "ios");
  }, []);
  if (!kind || hide) return null;
  const openChrome = () => {
    const u = new URL(window.location.href);
    window.location.href = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
  };
  const close = () => { setHide(true); try { sessionStorage.setItem("akhi_inapp_hide", "1"); } catch { /* ignore */ } };
  return (
    <div className="flex items-center justify-between gap-2 bg-brand-50 px-3 py-1.5 text-[12px] text-ink">
      <span>{kind === "android" ? "ভালো অভিজ্ঞতার জন্য Chrome এ খুলুন" : "ওপরের ⋯ চেপে “Safari তে খুলুন” দিন"}</span>
      <span className="flex items-center gap-2">
        {kind === "android" && <button onClick={openChrome} className="rounded-full bg-brand-600 px-3 py-1 font-semibold text-white">Chrome এ খুলুন</button>}
        <button onClick={close} aria-label="বন্ধ করুন" className="px-1 text-base leading-none">×</button>
      </span>
    </div>
  );
}
