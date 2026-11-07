"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cartApi } from "@/lib/api/cart";
import { errorMessage } from "@/lib/errors";

interface Props {
  applied: string | null;
  subtotal: number;
  note?: string | null;
  onApply: (code: string | null) => void;
}

// কুপন কোড: POST /coupons/validate দিয়ে যাচাই (ভুল হলে error দেখায়)
export function CouponBox({ applied, subtotal, note, onApply }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    const c = code.trim();
    if (!c) return;
    setBusy(true); setError("");
    try {
      const r = await cartApi.validateCoupon(c, subtotal); // POST /coupons/validate
      onApply(r.code); setCode("");
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Icon name="tag" className="h-5 w-5 text-brand-600" /> কুপন কোড</h2>
      {applied ? (
        <>
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3.5 py-2.5 text-emerald-700">
          <span className="font-semibold">{applied} প্রয়োগ হয়েছে</span>
          <button onClick={() => onApply(null)} className="text-sm underline">সরান</button>
        </div>
        {note && <p className="mt-2 text-xs text-muted">{note}</p>}
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="কুপন কোড লিখুন" aria-label="কুপন কোড"
              className="h-11 min-w-0 flex-1 rounded-lg border border-line px-3.5 uppercase focus:border-brand-400 focus:outline-none" />
            <Button variant="outline" loading={busy} onClick={apply}>প্রয়োগ</Button>
          </div>
          {error && <p className="mt-1.5 text-sm text-brand-600">{error}</p>}
        </>
      )}
    </section>
  );
}
