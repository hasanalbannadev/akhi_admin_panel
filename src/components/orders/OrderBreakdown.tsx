import { payLabel } from "@/lib/constants";
import { formatDate, taka } from "@/lib/format";
import { PaymentStatusBadge } from "./StatusBadge";
import type { Order } from "@/types";

// অর্ডারের পণ্য, দাম, ঠিকানা, পেমেন্ট - track পেজ ও order পেজ দুই জায়গায় ব্যবহার হয়
export function OrderBreakdown({ order }: { order: Order }) {
  const row = "flex justify-between py-1 text-[15px]";
  return (
    <div className="space-y-5">
      <ul className="divide-y divide-line rounded-xl border border-line">
        {order.items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="break-words font-medium">{it.name}</p>
              <p className="text-sm text-muted">{taka(it.unit_price)} × {it.quantity}</p>
            </div>
            <b>{taka(it.unit_price * it.quantity)}</b>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-brand-50/50 p-4">
        <div className={row}><span className="text-muted">সাবটোটাল</span><span>{taka(order.subtotal)}</span></div>
        {order.discount > 0 && <div className={row}><span className="text-muted">ডিসকাউন্ট{order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span className="text-emerald-600">- {taka(order.discount)}</span></div>}
        <div className={row}><span className="text-muted">ডেলিভারি চার্জ</span><span>{order.shipping_fee ? taka(order.shipping_fee) : "ফ্রি"}</span></div>
        <div className="mt-1 flex justify-between border-t border-dashed border-line pt-2 text-lg font-bold"><span>মোট</span><span className="text-brand-600">{taka(order.total)}</span></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-4 text-sm">
          <h3 className="mb-1.5 font-bold">ডেলিভারি ঠিকানা</h3>
          <p className="font-medium">{order.ship_name}</p>
          <p className="text-muted">{order.ship_phone}</p>
          <p className="mt-1">{order.ship_address}{order.ship_area ? `, ${order.ship_area}` : ""}, {order.ship_district}</p>
        </div>
        <div className="rounded-xl border border-line p-4 text-sm">
          <h3 className="mb-1.5 font-bold">পেমেন্ট</h3>
          <p>{payLabel(order.payment_method, order.payment_label)}</p>
          <div className="mt-1.5"><PaymentStatusBadge status={order.payment_status} /></div>
          <p className="mt-2 text-xs text-muted">অর্ডারের সময়: {formatDate(order.created_at)}</p>
        </div>
      </div>
    </div>
  );
}
