"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { AccountInfo } from "@/components/checkout/PaymentMethodPicker";
import { useToast } from "@/context/ToastContext";
import { paymentsApi } from "@/lib/api/payments";
import { errorMessage } from "@/lib/errors";
import { payLabel } from "@/lib/constants";
import { taka } from "@/lib/format";
import type { Order, PaymentOptions } from "@/types";

// অর্ডারের পরে পেমেন্ট তথ্য জমা (আগের পেমেন্ট ভুল/বাতিল হলে আবার দেওয়ার জন্য)
export function ManualPayForm({ order, options, onDone }: { order: Order; options: PaymentOptions | null; onDone: () => void }) {
  const toast = useToast();
  const [sender, setSender] = useState("");
  const [trx, setTrx] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const acct = options?.methods.find((m) => m.key === order.payment_method);
  const name = acct?.title ?? payLabel(order.payment_method, order.payment_label);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (sender.trim().length < 3) { setError("যে নম্বর/অ্যাকাউন্ট থেকে টাকা পাঠিয়েছেন সেটি দিন"); return; }
    if (trx.trim().length < 4) { setError("সঠিক ট্রানজেকশন আইডি (TrxID) দিন"); return; }
    setBusy(true);
    try {
      await paymentsApi.submitManual(order.order_no, sender.trim(), trx.trim());
      toast("পেমেন্ট তথ্য জমা হয়েছে, আমরা যাচাই করব");
      onDone();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3.5 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5">
      <h3 className="text-lg font-bold">{name} এ পেমেন্ট করুন</h3>
      <p className="text-sm"><b>{taka(order.total)}</b> পাঠান, তারপর নিচে আপনার তথ্য জমা দিন:</p>
      {acct && <AccountInfo m={acct} />}
      <Input label="যে নম্বর/অ্যাকাউন্ট থেকে পাঠিয়েছেন" value={sender} onChange={(e) => setSender(e.target.value)} maxLength={40} />
      <Input label="ট্রানজেকশন আইডি (TrxID)" value={trx} onChange={(e) => setTrx(e.target.value)} className="uppercase" maxLength={40} />
      {error && <p className="text-sm text-brand-600">{error}</p>}
      <Button type="submit" loading={busy}>পেমেন্ট তথ্য জমা দিন</Button>
    </form>
  );
}
