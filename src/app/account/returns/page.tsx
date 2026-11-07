"use client";
import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/account/PageTitle";
import { ReturnStatusBadge } from "@/components/orders/StatusBadge";
import { ReturnProgress } from "@/components/orders/ReturnProgress";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/context/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { ordersApi } from "@/lib/api/orders";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";

export default function ReturnsPage() {
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => ordersApi.returns(), true, 3000);
  const [open, setOpen] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<number, string>>({});

  // GET /returns/{id} থেকে সর্বশেষ অবস্থা আনি
  const toggle = async (id: number) => {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    try {
      const d = await ordersApi.returnDetail(id);
      setDetail((m) => ({ ...m, [id]: d.admin_note || "এখনো আমাদের কোনো নোট নেই। অনুরোধ যাচাই করা হচ্ছে।" }));
    } catch (e) { setDetail((m) => ({ ...m, [id]: errorMessage(e) })); }
  };

  const cancel = async (id: number) => {
    if (!confirm("রিটার্ন অনুরোধ বাতিল করবেন?")) return;
    try { await ordersApi.cancelReturn(id); toast("অনুরোধ বাতিল হয়েছে"); reload(); }
    catch (e) { toast(errorMessage(e), "error"); }
  };

  return (
    <>
      <PageTitle title="রিটার্ন অনুরোধ" sub="ডেলিভারি হওয়া অর্ডারের পেজ থেকে রিটার্ন অনুরোধ করুন।" />
      {loading ? <PageLoader /> : !data?.length ? (
        <EmptyState icon="return" title="কোনো রিটার্ন অনুরোধ নেই" />
      ) : (
        <ul className="grid gap-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <Link href={`/order/${r.order_no}`} className="font-bold hover:text-brand-600">#{r.order_no}</Link>
                <ReturnStatusBadge status={r.status} />
              </div>
              <p className="mt-2 break-words">{r.reason}</p>
              <ReturnProgress r={r} />
              {r.status === "refunded" && <p className="mt-2 rounded-lg bg-emerald-50 p-2.5 text-emerald-800"><b>Refund Completed</b> · ৳{Math.round(r.refund_amount ?? r.total ?? 0)} · TrxID {r.refund_trx}</p>}
              {r.refund_bkash && <p className="mt-2 text-xs text-muted">রিফান্ডের বিকাশ নম্বর: <b className="text-ink">{r.refund_bkash}</b></p>}
              {open === r.id && <p className="mt-2 rounded-lg bg-brand-50/60 p-2.5 text-sm">{detail[r.id] ?? "লোড হচ্ছে..."}</p>}
              {r.admin_note && open !== r.id && <p className="mt-2 rounded-lg bg-brand-50/60 p-2.5"><b>আমাদের নোট:</b> {r.admin_note}</p>}
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{formatDate(r.created_at)}</span>
                <button onClick={() => toggle(r.id)} className="text-sm font-semibold text-brand-600">{open === r.id ? "বন্ধ করুন" : "বিস্তারিত"}</button>
                {r.status === "requested" && <button onClick={() => cancel(r.id)} className="text-sm font-semibold text-brand-600">অনুরোধ বাতিল</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
