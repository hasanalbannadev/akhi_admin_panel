import { discountPercent, taka } from "@/lib/format";

export function PriceTag({ price, compare, large = false }: { price: number; compare: number | null; large?: boolean }) {
  const off = discountPercent(price, compare);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-bold text-brand-600 ${large ? "text-3xl" : "text-[17px]"}`}>{taka(price)}</span>
      {off > 0 && compare && (
        <>
          <span className={`text-muted line-through ${large ? "text-lg" : "text-sm"}`}>{taka(compare)}</span>
          {large && <span className="rounded-md bg-brand-600 px-2 py-0.5 text-sm font-semibold text-white">{off}% ছাড়</span>}
        </>
      )}
    </div>
  );
}
