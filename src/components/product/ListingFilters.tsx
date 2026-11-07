"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PRICE_RANGES, SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { Category } from "@/types";

export interface Current { q?: string; category?: string; min?: string; max?: string; sort?: string }

// URL এর query তৈরি। undefined/ফাঁকা হলে বাদ যায়, আর page সবসময় রিসেট হয়।
function qs(cur: Current, change: Partial<Current>) {
  const merged = { ...cur, ...change };
  const p = new URLSearchParams();
  if (merged.q) p.set("q", merged.q);
  if (merged.min) p.set("min", merged.min);
  if (merged.max) p.set("max", merged.max);
  if (merged.sort && merged.sort !== "new") p.set("sort", merged.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function Panel({ categories, cur, onNavigate }: { categories: Category[]; cur: Current; onNavigate?: () => void }) {
  const router = useRouter();
  const [min, setMin] = useState(cur.min || "");
  const [max, setMax] = useState(cur.max || "");
  const pathname = usePathname();
  const top = categories.filter((c) => !c.parent_id);

  const go = (change: Partial<Current>) => { router.push(pathname + qs(cur, change)); onNavigate?.(); };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-bold">ক্যাটাগরি</h3>
        <ul className="space-y-1 text-[15px]">
          <li><Link onClick={onNavigate} href={`/shop${qs(cur, {})}`} className={cn("block rounded-md px-2 py-1.5 hover:bg-brand-50", !cur.category && "font-semibold text-brand-600")}>সব পণ্য</Link></li>
          {top.map((c) => {
            const kids = categories.filter((k) => k.parent_id === c.id);
            const open = cur.category === c.slug || kids.some((k) => k.slug === cur.category);
            return (
              <li key={c.id}>
                <Link onClick={onNavigate} href={`/category/${c.slug}${qs(cur, {})}`} className={cn("block rounded-md px-2 py-1.5 hover:bg-brand-50", cur.category === c.slug && "font-semibold text-brand-600")}>{c.name}</Link>
                {open && kids.length > 0 && (
                  <ul className="ml-3 border-l border-line pl-2">
                    {kids.map((k) => (
                      <li key={k.id}><Link onClick={onNavigate} href={`/category/${k.slug}${qs(cur, {})}`} className={cn("block rounded-md px-2 py-1 text-sm hover:bg-brand-50", cur.category === k.slug && "font-semibold text-brand-600")}>{k.name}</Link></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-bold">দাম</h3>
        <ul className="space-y-1.5 text-[15px]">
          {PRICE_RANGES.map((r) => {
            const active = cur.min === String(r.min) && (r.max ? cur.max === String(r.max) : !cur.max);
            return (
              <li key={r.label}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="price" checked={active} className="accent-brand-600"
                    onChange={() => go({ min: String(r.min), max: r.max ? String(r.max) : "" })} />
                  {r.label}
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="সর্বনিম্ন" aria-label="সর্বনিম্ন দাম" className="h-10 w-full rounded-lg border border-line px-2 text-sm" />
          <span>-</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="সর্বোচ্চ" aria-label="সর্বোচ্চ দাম" className="h-10 w-full rounded-lg border border-line px-2 text-sm" />
        </div>
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => go({ min, max })}>প্রয়োগ করুন</Button>
      </div>

      {(cur.min || cur.max || cur.q) && (
        <Button variant="primary" className="w-full" onClick={() => { router.push(pathname); onNavigate?.(); }}>ফিল্টার মুছুন</Button>
      )}
    </div>
  );
}

// ডেস্কটপে সাইডবার, মোবাইলে "ফিল্টার" বাটন -> পপআপ
export function ListingFilters({ categories, cur }: { categories: Category[]; cur: Current }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block"><Panel categories={categories} cur={cur} /></aside>
      <Button variant="outline" size="sm" className="self-start lg:hidden" onClick={() => setOpen(true)}>
        <Icon name="filter" className="h-4 w-4" /> ফিল্টার
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="ফিল্টার">
        <Panel categories={categories} cur={cur} onNavigate={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function SortSelect({ cur }: { cur: Current }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <select aria-label="সাজান" value={cur.sort || "new"} onChange={(e) => router.push(pathname + qs(cur, { sort: e.target.value }))}
      className="h-9 rounded-lg border border-line bg-white px-2 text-sm">
      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
