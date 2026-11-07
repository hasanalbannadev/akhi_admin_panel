"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderBreakdown } from "./OrderBreakdown";
import { OrderTimeline } from "./OrderTimeline";
import { OrderStatusBadge, ReturnStatusBadge } from "./StatusBadge";
import { ManualPayForm } from "./ManualPayForm";
import { InvoiceModal } from "./InvoiceModal";
import { ReturnModal } from "./ReturnModal";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import { errorMessage } from "@/lib/errors";
import type { Order, PaymentOptions } from "@/types";

// একটা অর্ডারের পুরো পেজ: স্ট্যাটাস, পেমেন্ট, ট্র্যাকিং, ইনভয়েস, ক্যান্সেল, রিটার্ন, রি-অর্ডার
export function OrderDetailView({ orderNo, placed, paid }: { orderNo: string; placed: boolean; paid: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const { refresh: refreshCart } = useCart();
  const { ready } = useRequireAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [invoice, setInvoice] = useState(false);
  const [ret, setRet] = useState(false);

  const load = async () => {
    try { setOrder(await ordersApi.detail(orderNo)); }
    catch (e) { setError(errorMessage(e)); }
  };

  useEffect(() => { if (ready) { load(); paymentsApi.options().then(setOptions).catch(() => {}); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready, orderNo]);

  // শিপ হওয়ার পর বা রিটার্ন চলাকালে কুরিয়ারের অবস্থা লাইভ আপডেট (২০ সেকেন্ডে একবার, ট্যাব খোলা থাকলে)
  const live = !!order && (order.status === "shipped" || (!!order.return_info && order.return_info.status !== "refunded" && order.return_info.status !== "rejected"));
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") ordersApi.detail(orderNo).then(setOrder).catch(() => {}); }, 3000);
    return () => clearInterval(t);
  }, [live, orderNo]);

  const act = async (name: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(name);
    try { await fn(); toast(okMsg); await load(); }
    catch (e) { toast(errorMessage(e), "error"); }
    finally { setBusy(null); }
  };

  const payNow = async () => {
    setBusy("pay");
    try {
      const { gateway_url } = await paymentsApi.sslcommerzInit(orderNo);
      window.location.assign(gateway_url);
    } catch (e) { toast(errorMessage(e), "error"); setBusy(null); }
  };

  const reorder = async () => {
    setBusy("reorder");
    try {
      const r = await ordersApi.reorder(orderNo);
      await refreshCart();
      toast(r.skipped.length ? `${r.added.length}টি যোগ হয়েছে, ${r.skipped.length}টি স্টকে নেই` : "পণ্যগুলো কার্টে যোগ হয়েছে");
      router.push("/cart");
    } catch (e) { toast(errorMessage(e), "error"); setBusy(null); }
  };

  if (!ready || (!order && !error)) return <PageLoader />;
  if (error || !order) return <EmptyState icon="info" title="অর্ডার পাওয়া যায়নি" text={error} action={<Link href="/account/orders" className="font-semibold text-brand-600">আমার অর্ডারে যান</Link>} />;

  const unpaid = order.payment_status === "unpaid" || order.payment_status === "failed";
  const canCancel = (order.status === "pending" || order.status === "confirmed" || order.status === "processing") && !order.cancel_requested;
  const isManual = order.payment_method.startsWith("pm_") || order.payment_method === "manual_bkash" || order.payment_method === "manual_nagad";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* স্ট্যাটাস ব্যানার */}
      {paid === "1" && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-700"><Icon name="check-circle" /> পেমেন্ট সফল হয়েছে, ধন্যবাদ!</div>}
      {paid === "0" && <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 font-semibold text-red-700"><Icon name="info" /> পেমেন্ট সম্পন্ন হয়নি। নিচ থেকে আবার চেষ্টা করুন।</div>}
      {placed && paid === null && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-white p-6 text-center">
          <Icon name="check-circle" className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-2 text-2xl font-bold">অর্ডার সম্পন্ন হয়েছে!</h1>
          <p className="text-muted">আপনার অর্ডার নম্বর <b className="text-ink">#{order.order_no}</b>। আমরা অর্ডার কনফার্ম করলে SMS পাবেন।</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">অর্ডার #{order.order_no}</h2>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* পেমেন্ট বাকি থাকলে */}
      {order.cancel_requested && order.status !== "cancelled" && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">আপনার বাতিলের অনুরোধ পাঠানো হয়েছে। আমরা কনফার্ম করলে অর্ডার বাতিল হবে এবং আপনাকে জানানো হবে।</div>
      )}
      {unpaid && order.payment_method === "sslcommerz" && order.status !== "cancelled" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5">
          <p className="font-semibold">অনলাইন পেমেন্ট এখনো বাকি আছে</p>
          <Button loading={busy === "pay"} onClick={payNow}>এখন পেমেন্ট করুন</Button>
        </div>
      )}
      {unpaid && isManual && order.status !== "cancelled" && <ManualPayForm order={order} options={options} onDone={load} />}
      {order.payment_status === "pending_verification" && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">আপনার পেমেন্ট তথ্য যাচাই করা হচ্ছে। কনফার্ম হলে অর্ডার প্রক্রিয়া শুরু হবে।</div>
      )}

      {order.return_info && (
        <div className="rounded-2xl border border-line bg-white p-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">রিটার্ন ও রিফান্ড</h3>
            <ReturnStatusBadge status={order.return_info.status} />
          </div>
          <p className="mt-2 text-muted">{order.return_info.reason}</p>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {order.return_info.refund_bkash && <p><span className="text-muted">রিফান্ডের বিকাশ নম্বর:</span> <b>{order.return_info.refund_bkash}</b></p>}
            {order.return_info.courier && <p><span className="text-muted">পিকআপ কুরিয়ার:</span> <b className="capitalize">{order.return_info.courier}</b></p>}
            {order.return_info.courier_status_bn && order.return_info.status === "pickup" && <p className="sm:col-span-2"><span className="text-muted">পিকআপের অবস্থা:</span> <b>{order.return_info.courier_status_bn}</b></p>}
            {order.return_info.status === "refunded" && (
              <>
                <p><span className="text-muted">রিফান্ড:</span> <b>৳{Math.round(order.return_info.refund_amount ?? order.total).toLocaleString("en-US")}</b></p>
                <p><span className="text-muted">TrxID:</span> <b>{order.return_info.refund_trx}</b></p>
                {order.return_info.refund_sender && <p><span className="text-muted">যে নম্বর থেকে পাঠানো:</span> <b>{order.return_info.refund_sender}</b></p>}
              </>
            )}
          </div>
          {order.return_info.admin_note && <p className="mt-2 rounded-lg bg-brand-50/60 p-2.5"><b>আমাদের নোট:</b> {order.return_info.admin_note}</p>}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5 md:self-start">
          <h3 className="mb-4 font-bold">অর্ডার ট্র্যাকিং</h3>
          <OrderTimeline order={order} />
        </div>
        <OrderBreakdown order={order} />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={() => setInvoice(true)}><Icon name="download" className="h-4 w-4" /> ইনভয়েস</Button>
        <Button variant="outline" loading={busy === "reorder"} onClick={reorder}><Icon name="refresh" className="h-4 w-4" /> আবার অর্ডার করুন</Button>
        {canCancel && (
          <Button variant="soft" loading={busy === "cancel"}
            onClick={() => { if (confirm("অর্ডার বাতিলের অনুরোধ পাঠাতে চান? আমরা কনফার্ম করলে অর্ডার বাতিল হবে।")) act("cancel", () => ordersApi.cancel(order.order_no), "বাতিলের অনুরোধ পাঠানো হয়েছে"); }}>
            বাতিলের অনুরোধ করুন
          </Button>
        )}
        {order.cancel_requested && order.status !== "cancelled" && (
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-50 px-3 text-sm font-semibold text-amber-800">
            <Icon name="info" className="h-4 w-4" /> বাতিলের আবেদন করা হয়েছে
          </span>
        )}
        {order.status === "delivered" && !order.return_info && <Button variant="soft" onClick={() => setRet(true)}><Icon name="return" className="h-4 w-4" /> রিটার্ন করুন</Button>}
      </div>

      <InvoiceModal orderNo={order.order_no} open={invoice} onClose={() => setInvoice(false)} />
      <ReturnModal orderNo={order.order_no} open={ret} onClose={() => setRet(false)} onDone={() => router.push("/account/returns")} />
    </div>
  );
}
