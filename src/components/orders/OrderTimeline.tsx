import { Icon } from "@/components/ui/Icon";
import { COURIER_STATUS_LABEL, ORDER_STATUS_LABEL, ORDER_STEPS, ORDER_STEP_DESC, RETURN_STEPS } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { Order } from "@/types";

type TimelineOrder = Pick<Order, "status" | "courier" | "tracking_code"> & { courier_status?: string | null; return_info?: Order["return_info"] };

// অর্ডার ট্র্যাকিং টাইমলাইন (স্ক্রিন 6 ও 14)। Backend এ প্রতি ধাপের সময় নেই, তাই শুধু অবস্থা দেখানো হয়।
type Step = { key: string; label: string; desc: string; done: boolean; note?: string };

function buildSteps(order: TimelineOrder): Step[] {
  const reached = ORDER_STEPS.indexOf(order.status);
  const ri = order.return_info;
  const forward = (upto: number): Step[] => ORDER_STEPS.map((s, i) => ({
    key: s, label: ORDER_STATUS_LABEL[s], desc: ORDER_STEP_DESC[s], done: i <= upto,
  }));
  if (ri) {
    // ডেলিভারির পর কাস্টমার রিটার্ন করেছে: পুরো যাত্রা এক লাইনে
    const idx = RETURN_STEPS.findIndex((x) => x.key === ri.status);
    const steps = forward(ORDER_STEPS.length - 1);
    RETURN_STEPS.forEach((rs, i) => {
      const step: Step = { key: "r_" + rs.key, label: rs.label, desc: rs.desc, done: i <= idx };
      if (rs.key === "pickup" && ri.courier_status_bn) step.note = ri.courier_status_bn;
      if (rs.key === "refunded" && ri.refund_trx) step.note = `TrxID: ${ri.refund_trx}`;
      steps.push(step);
    });
    return steps;
  }
  if (order.status === "returned") {
    // ডেলিভারি হয়নি, কুরিয়ার পণ্য ফেরত এনেছে
    const steps = forward(ORDER_STEPS.indexOf("shipped")).slice(0, 4);
    steps.push({ key: "failed", label: "ডেলিভারি হয়নি", desc: "কুরিয়ার ডেলিভারি দিতে পারেনি", done: true });
    steps.push({ key: "back", label: "পণ্য ফেরত এসেছে", desc: ORDER_STEP_DESC.returned, done: true });
    return steps;
  }
  return forward(reached);
}

export function OrderTimeline({ order }: { order: TimelineOrder }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700">
        <Icon name="info" className="h-6 w-6" /> <span className="font-semibold">{ORDER_STEP_DESC.cancelled}</span>
      </div>
    );
  }
  const steps = buildSteps(order);
  const lastDone = steps.reduce((a, s, i) => (s.done ? i : a), -1);
  return (
    <div>
      <ol className="space-y-0">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
              {!last && <span className={cn("absolute left-[11px] top-6 h-full w-0.5", i < lastDone ? "bg-emerald-500" : "bg-line")} />}
              <span className={cn("z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line bg-white")}>
                {s.done && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <div>
                <p className={cn("text-[15px] font-semibold leading-6", !s.done && "text-muted")}>{s.label}</p>
                <p className="text-xs text-muted">{s.desc}</p>
                {s.note && s.done && <p className="mt-0.5 text-xs font-semibold text-emerald-700">{s.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {(order.courier || order.tracking_code) && (
        <div className="mt-4 rounded-xl bg-brand-50/60 p-3.5 text-sm">
          <p><span className="text-muted">কুরিয়ার:</span> <b className="capitalize">{order.courier || "Steadfast"}</b></p>
          {order.courier_status && (
            <p className="mt-0.5"><span className="text-muted">পার্সেলের অবস্থা:</span> <b>{COURIER_STATUS_LABEL[order.courier_status] ?? "আপডেট হচ্ছে"}</b></p>
          )}
          {order.tracking_code && (
            <p className="mt-0.5">
              <span className="text-muted">ট্র্যাকিং কোড:</span> <b>{order.tracking_code}</b>
              {(order.courier || "").toLowerCase().includes("steadfast") || !order.courier ? (
                <> · <a className="font-semibold text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer"
                  href={`https://steadfast.com.bd/t/${order.tracking_code}`}>কুরিয়ারে ট্র্যাক করুন</a></>
              ) : null}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
