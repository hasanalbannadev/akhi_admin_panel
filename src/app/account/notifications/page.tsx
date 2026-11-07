"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/account/PageTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageLoader } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { ordersApi } from "@/lib/api/orders";
import { ORDER_STATUS_LABEL, RETURN_STATUS_LABEL } from "@/lib/constants";
import { cn, formatDate } from "@/lib/format";

// Backend এ আলাদা নোটিফিকেশন API নেই, তাই অর্ডার ও রিটার্নের বর্তমান অবস্থা থেকেই নোটিফিকেশন বানানো হয়।
// "পড়া হয়েছে" চিহ্ন browser এ (localStorage) থাকে।
const KEY = "akhi_notif_read";

interface Item { id: string; text: string; href: string; date: string; icon: string }

export default function NotificationsPage() {
  const orders = useAsync(() => ordersApi.list(), true, 3000);
  const returns = useAsync(() => ordersApi.returns(), true, 3000);
  const [read, setRead] = useState<string[]>([]);

  useEffect(() => { try { setRead(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ } }, []);

  const items = useMemo<Item[]>(() => {
    const a: Item[] = (orders.data ?? []).map((o) => ({
      id: `o-${o.order_no}-${o.status}-${o.payment_status}`,
      text: `অর্ডার #${o.order_no}: ${ORDER_STATUS_LABEL[o.status]}`,
      href: `/order/${o.order_no}`, date: o.created_at, icon: "box",
    }));
    const b: Item[] = (returns.data ?? []).map((r) => ({
      id: `r-${r.id}-${r.status}`,
      text: `রিটার্ন #${r.order_no}: ${RETURN_STATUS_LABEL[r.status]}`,
      href: "/account/returns", date: r.created_at, icon: "return",
    }));
    return [...a, ...b].sort((x, y) => +new Date(y.date) - +new Date(x.date));
  }, [orders.data, returns.data]);

  const markAll = () => {
    const ids = items.map((i) => i.id);
    setRead(ids);
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  };

  if (orders.loading || returns.loading) return <PageLoader />;
  return (
    <>
      <div className="flex items-start justify-between">
        <PageTitle title="নোটিফিকেশন" />
        {items.length > 0 && <button onClick={markAll} className="text-sm font-semibold text-brand-600">সব পড়া হয়েছে</button>}
      </div>
      {items.length === 0 ? <EmptyState icon="bell" title="কোনো নোটিফিকেশন নেই" /> : (
        <ul className="grid gap-2.5">
          {items.map((n) => (
            <li key={n.id}>
              <Link href={n.href} className={cn("flex items-center gap-3 rounded-xl border p-3.5", read.includes(n.id) ? "border-line bg-white" : "border-brand-200 bg-brand-50/60")}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-600"><Icon name={n.icon} /></span>
                <span className="min-w-0 flex-1"><span className="block font-medium">{n.text}</span><span className="text-xs text-muted">{formatDate(n.date)}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
