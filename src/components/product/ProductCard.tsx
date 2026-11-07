"use client";
import Link from "next/link";
import { useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "./PriceTag";
import { WishlistButton } from "./WishlistButton";
import { AddToCartButton } from "./AddToCartButton";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { discountPercent } from "@/lib/format";
import type { Product } from "@/types";

// পণ্যের কার্ড (হোম, ক্যাটাগরি, রিলেটেড সব জায়গায় একই)।
// রং থাকলে: রং বাটন (radio) চাপলে সেই রং বাছাই হয় ও কার্ডের ছবি সেই রঙের ছবি হয়ে যায়।
/** হালকা রঙের উপর কালো টিক, গাঢ় রঙের উপর সাদা টিক */
function isLight(hex?: string | null): boolean {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return true;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6;
}

export function ProductCard({ p, priority = false, best = false }: { p: Product; priority?: boolean; best?: boolean }) {
  const off = discountPercent(p.price, p.compare_at_price);
  const colors = p.colors ?? [];
  const [colorId, setColorId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { add } = useCart();
  const toast = useToast();
  const color = colors.find((c) => c.id === colorId) ?? null;
  const img = color?.images?.[0] ?? p.images[0]?.url;
  const soldOut = color ? color.stock < 1 : p.stock < 1;

  async function addWithColor() {
    if (!color) { toast("আগে একটা রং বাছুন", "error"); return; }
    setBusy(true);
    await add(p.id, 1, color.id);
    setBusy(false);
  }

  return (
    <article className="group flex flex-col rounded-xl border border-brand-100/70 bg-white p-2 shadow-[0_1px_3px_rgba(219,20,80,.06)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_8px_22px_rgba(219,20,80,.14)]">
      <div className="relative overflow-hidden rounded-lg bg-linear-to-br from-brand-50 to-white">
        <Link href={`/product/${p.slug}`} aria-label={p.name}>
          {/* key: রং বদলালে ছবি নতুন করে লোড হয় (আগের ছবি ফেল করলেও আটকে থাকে না) */}
          <SmartImage key={img} src={img} alt={p.name} priority={priority}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </Link>
        <WishlistButton productId={p.id} className="absolute right-1.5 top-1.5" />
        {off > 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-linear-to-r from-brand-500 to-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">{off}%</span>}
        {best && <span className={`absolute left-1.5 rounded-full bg-linear-to-r from-amber-500 to-red-600 px-2 py-0.5 text-[10px] font-bold leading-tight text-white shadow-sm ${p.stock < 1 ? "bottom-6" : "bottom-1.5"}`}>Best Seller</span>}
        {p.stock < 1 && <span className="absolute inset-x-0 bottom-0 bg-navy/70 py-0.5 text-center text-[11px] text-white">স্টক শেষ</span>}
      </div>
      <Link href={`/product/${p.slug}`} className="mt-1.5 min-h-9 break-words text-[13px] font-semibold leading-[18px] text-navy transition-colors hover:text-brand-600">
        {p.name}
      </Link>
      <div className="mt-0.5"><PriceTag price={p.price} compare={p.compare_at_price} /></div>
      {colors.length > 0 && (
        <div role="radiogroup" aria-label="রং" className="mt-1 flex flex-wrap items-center gap-1.5">
          {colors.slice(0, 6).map((c) => {
            const on = c.id === colorId;
            return (
              <button key={c.id} type="button" role="radio" aria-checked={on} aria-label={c.name} title={c.name}
                disabled={c.stock < 1}
                onClick={() => setColorId(on ? null : c.id)}
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border border-black/15 transition disabled:cursor-not-allowed disabled:opacity-30 ${
                  on ? "ring-1 ring-black/70 ring-offset-2" : "hover:ring-1 hover:ring-black/30 hover:ring-offset-2"}`}
                style={{ background: c.hex || "#ddd" }}>
                {on && (
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke={isLight(c.hex) ? "#111" : "#fff"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                )}
              </button>
            );
          })}
          {colors.length > 6 && <span className="text-[11px] text-muted">+{colors.length - 6}</span>}
          {color && <span className="text-[13px] font-semibold text-black">{color.name}</span>}
        </div>
      )}
      <div className="mt-auto pt-2">
        {colors.length > 0 ? (
          soldOut && p.stock < 1
            ? <Button disabled variant="soft" size="sm" className="min-h-8 h-auto! w-full px-2 py-1 text-[13px] leading-tight">স্টক শেষ</Button>
            : <Button size="sm" loading={busy} disabled={soldOut} onClick={addWithColor} className="min-h-8 h-auto! w-full px-2 py-1 text-[13px] leading-tight rounded-lg bg-linear-to-r from-brand-500 to-brand-600 font-semibold shadow-sm shadow-brand-600/30 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-md active:scale-[.98]">
                {!busy && <Icon name="bag" className="h-4 w-4 shrink-0" />} কার্টে যোগ করুন
              </Button>
        ) : (
          <AddToCartButton productId={p.id} stock={p.stock} className="min-h-8 h-auto! px-2 py-1 text-[13px] leading-tight rounded-lg bg-linear-to-r from-brand-500 to-brand-600 font-semibold shadow-sm shadow-brand-600/30 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-md active:scale-[.98]" />
        )}
      </div>
    </article>
  );
}
