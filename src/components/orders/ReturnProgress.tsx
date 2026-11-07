import { Icon } from "@/components/ui/Icon";
import { RETURN_STEPS } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { ReturnRequest } from "@/types";

// রিটার্নের ধাপ: আবেদন -> অনুমোদন -> কুরিয়ার পিকআপ -> রিটার্ন সফল -> রিফান্ড (ভরা সার্কেল = শেষ হয়েছে)
export function ReturnProgress({ r }: { r: ReturnRequest }) {
  if (r.status === "rejected") {
    return <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm font-semibold text-red-700">আপনার রিটার্নের আবেদন গ্রহণ করা হয়নি।</p>;
  }
  const at = RETURN_STEPS.findIndex((s) => s.key === r.status);
  return (
    <ol className="mt-3">
      {RETURN_STEPS.map((s, i) => {
        const done = i <= at;
        const note = s.key === "pickup" && r.courier_status_bn ? r.courier_status_bn : s.key === "refunded" && r.refund_trx ? `TrxID: ${r.refund_trx}` : "";
        return (
          <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
            {i < RETURN_STEPS.length - 1 && <span className={cn("absolute left-[9px] top-5 h-full w-0.5", i < at ? "bg-emerald-500" : "bg-line")} />}
            <span className={cn("z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line bg-white")}>
              {done && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
            </span>
            <div>
              <p className={cn("text-sm font-semibold leading-5", !done && "text-muted")}>{s.label}</p>
              <p className="text-xs text-muted">{s.desc}</p>
              {note && done && <p className="text-xs font-semibold text-emerald-700">{note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
