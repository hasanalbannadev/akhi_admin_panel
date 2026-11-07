"use client";
import { useState } from "react";
import { payLabel } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { PayAccount, PayMethod, PaymentOptions } from "@/types";

export interface PayInput { sender: string; trx: string }

// চেকআউটে দেখানোর মেথড তালিকা: COD, অনলাইন (SSLCommerz) আর admin এর যোগ করা অ্যাকাউন্ট (bKash/Nagad/ব্যাংক)
export function enabledMethods(o: PaymentOptions | null): PayMethod[] {
  if (!o) return [];
  const list: PayMethod[] = [];
  if (o.cod.enabled) list.push("cod");
  if (o.sslcommerz.enabled) list.push("sslcommerz");
  return [...list, ...(o.methods ?? []).map((m) => m.key)];
}

export function AccountInfo({ m }: { m: PayAccount }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!m.account_number) return;
    navigator.clipboard?.writeText(m.account_number).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  const row = "flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1";
  return (
    <div className="mt-2 rounded-xl bg-white p-3 text-sm">
      {m.bank_name && <p className={row}><span className="text-muted">ব্যাংক</span><b className="break-words">{m.bank_name}{m.branch ? `, ${m.branch}` : ""}</b></p>}
      {m.account_name && <p className={row}><span className="text-muted">অ্যাকাউন্টের নাম</span><b className="break-words">{m.account_name}</b></p>}
      {m.account_number && (
        <p className={row}>
          <span className="text-muted">{m.kind === "bank" ? "অ্যাকাউন্ট নম্বর" : "নম্বর"}</span>
          <span className="flex items-center gap-2"><b className="break-all text-base">{m.account_number}</b>
            <button type="button" onClick={copy} className="rounded-md border border-line px-2 py-0.5 text-xs text-brand-600 hover:bg-brand-50">{copied ? "কপি হয়েছে" : "কপি"}</button></span>
        </p>
      )}
      {m.instructions && <p className="mt-1 whitespace-pre-wrap break-words text-muted">{m.instructions}</p>}
    </div>
  );
}

export function PaymentMethodPicker({
  options, value, onChange, pay, onPay, free,
}: {
  options: PaymentOptions | null; value: PayMethod | null; onChange: (m: PayMethod) => void;
  pay: PayInput; onPay: (p: PayInput) => void;
  free?: Record<string, boolean>;   // পেমেন্ট মেথড অনুযায়ী ডেলিভারি ফ্রি কিনা
}) {
  const methods = enabledMethods(options);
  const acct = (key: string) => options?.methods.find((m) => m.key === key);
  const inp = "h-11 w-full rounded-lg border border-line bg-white px-3 text-[15px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 text-lg font-bold">পেমেন্ট মেথড</h2>
      {!options && <p className="text-sm text-muted">লোড হচ্ছে...</p>}
      {options && methods.length === 0 && <p className="text-sm text-red-600">এখন কোনো পেমেন্ট মেথড চালু নেই। পরে চেষ্টা করুন।</p>}
      <ul className="space-y-2.5">
        {methods.map((m) => {
          const a = acct(m);
          const on = value === m;
          return (
            <li key={m}>
              <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5", on ? "border-brand-600 bg-brand-50/60" : "border-line hover:border-brand-200")}>
                <input type="radio" name="pay" className="mt-1 accent-brand-600" checked={on} onChange={() => onChange(m)} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">{a ? a.title : payLabel(m)}
                    {free && m in free && (free[m]
                      ? <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold leading-tight text-white">ফ্রি ডেলিভারি</span>
                      : <span className="rounded border border-line px-1.5 py-0.5 text-[11px] font-medium leading-tight text-muted">ডেলিভারি চার্জ লাগবে</span>)}
                  </span>
                  {m === "cod" && <span className="text-sm text-muted">পণ্য হাতে পেয়ে টাকা দিন</span>}
                  {m === "sslcommerz" && <span className="text-sm text-muted">কার্ড, bKash, Nagad, Rocket সহ অনলাইনে পেমেন্ট</span>}
                  {a && !on && <span className="text-sm text-muted">টাকা পাঠিয়ে TrxID দিন</span>}
                </span>
              </label>
              {a && on && (
                <div className="mx-1 mt-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
                  <p className="text-sm">নিচের {a.kind === "bank" ? "অ্যাকাউন্টে" : "নম্বরে"} মোট টাকা পাঠান, তারপর আপনার তথ্য লিখুন:</p>
                  <AccountInfo m={a} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium">{a.kind === "bank" ? "যে অ্যাকাউন্ট/নম্বর থেকে পাঠিয়েছেন" : "যে নম্বর থেকে পাঠিয়েছেন"}
                      <input className={`${inp} mt-1`} inputMode="tel" value={pay.sender} onChange={(e) => onPay({ ...pay, sender: e.target.value })} maxLength={40} /></label>
                    <label className="block text-sm font-medium">ট্রানজেকশন আইডি (TrxID)
                      <input className={`${inp} mt-1 uppercase`} value={pay.trx} onChange={(e) => onPay({ ...pay, trx: e.target.value })} maxLength={40} /></label>
                  </div>
                  <p className="mt-2 text-xs text-muted">আমরা পেমেন্ট যাচাই করে অর্ডার কনফার্ম করব এবং SMS পাঠাব।</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
