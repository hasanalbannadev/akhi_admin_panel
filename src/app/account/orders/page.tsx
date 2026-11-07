"use client";
import { useState } from "react";
import { PageTitle } from "@/components/account/PageTitle";
import { OrderCard } from "@/components/orders/OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { ordersApi } from "@/lib/api/orders";
import { cn } from "@/lib/format";

const TABS = [
  { id: "all", label: "সব অর্ডার", test: () => true },
  { id: "active", label: "চলমান", test: (s: string) => ["pending", "confirmed", "processing", "shipped"].includes(s) },
  { id: "delivered", label: "ডেলিভারি সম্পন্ন", test: (s: string) => s === "delivered" },
  { id: "cancelled", label: "বাতিল", test: (s: string) => s === "cancelled" },
];

export default function OrdersPage() {
  const { data, loading, error } = useAsync(() => ordersApi.list(), true, 3000);
  const [tab, setTab] = useState("all");
  const t = TABS.find((x) => x.id === tab)!;
  const list = (data ?? []).filter((o) => t.test(o.status));

  return (
    <>
      <PageTitle title="আমার অর্ডার" />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium", tab === x.id ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white hover:bg-brand-50")}>
            {x.label}
          </button>
        ))}
      </div>
      {loading ? <PageLoader /> : error ? <p className="text-brand-600">{error}</p> : list.length === 0 ? (
        <EmptyState icon="box" title="কোনো অর্ডার নেই" text="আপনার অর্ডার এখানে দেখা যাবে।" action={<LinkButton href="/shop">কেনাকাটা করুন</LinkButton>} />
      ) : (
        <div className="grid gap-3">{list.map((o) => <OrderCard key={o.order_no} o={o} />)}</div>
      )}
    </>
  );
}
