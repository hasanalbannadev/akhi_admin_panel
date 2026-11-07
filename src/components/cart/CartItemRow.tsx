"use client";
import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useCart } from "@/context/CartContext";
import { taka } from "@/lib/format";
import type { CartLine } from "@/types";

// কার্ট পেজের একটা সারি: ছবি, নাম, দাম, পরিমাণ +/-, মুছুন
export function CartItemRow({ line }: { line: CartLine }) {
  const { setQty, remove, busyId } = useCart();
  const cid = line.color_id ?? 0;
  const busy = busyId === `${line.product_id}:${cid}`;
  return (
    <li className="flex gap-3 py-4 sm:gap-4">
      <Link href={`/product/${line.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-50 sm:h-24 sm:w-24">
        <SmartImage src={line.image} alt={line.name} className="h-full w-full object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${line.slug}`} className="break-words font-medium hover:text-brand-600">{line.name}</Link>
        {line.color_name && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            {line.color_hex && <i className="inline-block h-3 w-3 rounded-full border border-line" style={{ background: line.color_hex }} />}
            রং: {line.color_name}
          </p>
        )}
        <p className="mt-0.5 text-sm font-semibold text-brand-600">{taka(line.unit_price)}</p>
        {!line.in_stock && <p className="mt-0.5 text-xs font-medium text-red-600">এই পরিমাণ এখন স্টকে নেই</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="inline-flex items-center rounded-lg border border-line">
            <button aria-label="কমান" disabled={busy} onClick={() => setQty(line.product_id, line.quantity - 1, cid)} className="grid h-9 w-9 place-items-center disabled:opacity-40"><Icon name="minus" className="h-4 w-4" /></button>
            <span className="w-8 text-center text-sm font-semibold">{busy ? <Spinner className="mx-auto h-4 w-4" /> : line.quantity}</span>
            <button aria-label="বাড়ান" disabled={busy} onClick={() => setQty(line.product_id, line.quantity + 1, cid)} className="grid h-9 w-9 place-items-center disabled:opacity-40"><Icon name="plus" className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span className="font-bold">{taka(line.line_total)}</span>
            <button aria-label="মুছুন" disabled={busy} onClick={() => remove(line.product_id, cid)} className="grid h-9 w-9 place-items-center rounded-full text-brand-600 hover:bg-brand-50"><Icon name="trash" className="h-[18px] w-[18px]" /></button>
          </div>
        </div>
      </div>
    </li>
  );
}
