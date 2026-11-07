import { taka } from "@/lib/format";
import type { ReactNode } from "react";

interface Props {
  subtotal: number;
  discount?: number;
  shipping?: number | null;       // null হলে "চেকআউটে হিসাব হবে"
  total: number;
  count?: number;
  children?: ReactNode;           // নিচে বাটন ইত্যাদি
}

// কার্ট ও চেকআউটে একই "অর্ডার সামারি" বক্স
export function OrderSummary({ subtotal, discount = 0, shipping, total, count, children }: Props) {
  const row = "flex items-center justify-between py-1.5 text-[15px]";
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-2 text-lg font-bold">অর্ডার সামারি</h2>
      <div className={row}><span className="text-muted">সাবটোটাল{count ? ` (${count} পণ্য)` : ""}</span><span>{taka(subtotal)}</span></div>
      {discount > 0 && <div className={row}><span className="text-muted">কুপন ডিসকাউন্ট</span><span className="text-emerald-600">- {taka(discount)}</span></div>}
      <div className={row}>
        <span className="text-muted">ডেলিভারি চার্জ</span>
        <span>{shipping == null ? "চেকআউটে হিসাব হবে" : shipping === 0 ? <b className="text-emerald-600">ফ্রি</b> : taka(shipping)}</span>
      </div>
      <div className="my-2 border-t border-dashed border-line" />
      <div className="flex items-center justify-between py-1.5 text-lg font-bold"><span>মোট</span><span className="text-brand-600">{taka(total)}</span></div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
