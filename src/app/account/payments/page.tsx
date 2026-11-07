"use client";
import Link from "next/link";
import { PageTitle } from "@/components/account/PageTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { paymentsApi } from "@/lib/api/payments";
import { payLabel } from "@/lib/constants";
import { formatDate, taka } from "@/lib/format";

const STATUS: Record<string, string> = { pending: "যাচাই চলছে", approved: "গৃহীত", success: "সফল", rejected: "বাতিল", failed: "ব্যর্থ" };

export default function PaymentHistoryPage() {
  const { data, loading } = useAsync(() => paymentsApi.history(), true, 15000);
  return (
    <>
      <PageTitle title="পেমেন্ট হিস্টরি" />
      {loading ? <PageLoader /> : !data?.length ? <EmptyState icon="card" title="কোনো অনলাইন পেমেন্ট নেই" /> : (
        <ul className="grid gap-3">
          {data.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 text-sm">
              <div>
                <Link href={`/order/${p.order_no}`} className="font-bold hover:text-brand-600">#{p.order_no}</Link>
                <p className="text-muted">{payLabel(p.method, p.label)}{p.trx_id ? ` · ${p.trx_id}` : ""}</p>
                <p className="text-xs text-muted">{formatDate(p.created_at)}</p>
              </div>
              <div className="text-right"><b className="text-base">{taka(p.amount)}</b><p className="text-xs">{STATUS[p.status] ?? p.status}</p></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
