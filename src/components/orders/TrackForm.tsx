"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { OrderTimeline } from "./OrderTimeline";
import { OrderBreakdown } from "./OrderBreakdown";
import { OrderStatusBadge } from "./StatusBadge";
import { ordersApi } from "@/lib/api/orders";
import { errorMessage } from "@/lib/errors";
import type { Order } from "@/types";

// লগইন ছাড়াই অর্ডার নম্বর + ফোন দিয়ে ট্র্যাকিং
export function TrackForm() {
  const [no, setNo] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setOrder(null);
    if (!no.trim() || !phone.trim()) { setError("অর্ডার নম্বর ও মোবাইল নম্বর দুটোই দিন"); return; }
    setBusy(true);
    try { setOrder(await ordersApi.track(no.trim(), phone.trim())); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-5 lg:self-start">
        <Input label="অর্ডার নম্বর" placeholder="যেমন: AC1A2B3C4D" value={no} onChange={(e) => setNo(e.target.value)} />
        <Input label="মোবাইল নম্বর" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <p className="text-sm text-brand-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>ট্র্যাক করুন</Button>
      </form>

      {order && (
        <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">অর্ডার #{order.order_no}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <OrderTimeline order={order} />
          <OrderBreakdown order={order} />
        </div>
      )}
    </div>
  );
}
