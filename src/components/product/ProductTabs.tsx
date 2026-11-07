"use client";
import { useState } from "react";
import { ReviewSection } from "./ReviewSection";
import { DeliveryChecker } from "./DeliveryChecker";
import { taka, cn } from "@/lib/format";
import type { DeliveryZone, ReviewsOut } from "@/types";

// বিবরণ | রিভিউ | ডেলিভারি | রিটার্ন নীতি
export function ProductTabs({
  slug, description, reviews, zones, price,
}: { slug: string; price: number; description: string | null; reviews: ReviewsOut; zones: DeliveryZone[] }) {
  const [tab, setTab] = useState<"desc" | "reviews" | "delivery" | "return">("desc");
  const tabs = [
    { id: "desc", label: "বিবরণ" },
    { id: "reviews", label: `রিভিউ (${reviews.count})` },
    { id: "delivery", label: "ডেলিভারি" },
    { id: "return", label: "রিটার্ন নীতি" },
  ] as const;

  return (
    <section className="mt-10 rounded-2xl border border-line bg-white">
      <div role="tablist" className="no-scrollbar flex overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn("whitespace-nowrap border-b-2 px-5 py-3.5 text-[15px] font-semibold",
              tab === t.id ? "border-brand-600 text-brand-600" : "border-transparent text-muted hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5 md:p-6" role="tabpanel">
        {tab === "desc" && (
          description
            ? <div className="max-w-3xl whitespace-pre-line leading-7">{description}</div>
            : <p className="text-muted">এই পণ্যের বিস্তারিত বিবরণ শীঘ্রই যোগ করা হবে।</p>
        )}
        {tab === "reviews" && <ReviewSection slug={slug} initial={reviews} />}
        {tab === "delivery" && (
          <div className="max-w-xl space-y-3">
            <DeliveryChecker price={price} />
            {zones.length === 0 && <p className="text-muted">সারা বাংলাদেশে ডেলিভারি দেওয়া হয়।</p>}
            {zones.map((z) => (
              <div key={z.name} className="rounded-lg bg-brand-50/60 p-4">
                <div className="font-semibold">{z.name}</div>
                <div className="text-sm">ডেলিভারি চার্জ: <b>{taka(z.fee)}</b>
                  {z.free_over != null && <> · {taka(z.free_over)} এর বেশি কিনলে <b className="text-emerald-600">ফ্রি</b></>}
                </div>
              </div>
            ))}
            <p className="text-sm text-muted">ডেলিভারি সময়: সাধারণত ২-৫ কর্মদিবস।</p>
          </div>
        )}
        {tab === "return" && (
          <ul className="max-w-2xl list-disc space-y-2 pl-5 leading-7">
            <li>ডেলিভারি পাওয়ার পর পণ্যে সমস্যা থাকলে আপনি অ্যাকাউন্ট থেকে রিটার্ন অনুরোধ করতে পারবেন।</li>
            <li>পণ্য অব্যবহৃত ও আসল প্যাকেজিং সহ থাকতে হবে।</li>
            <li>রিটার্ন অনুমোদিত হলে রিফান্ড প্রক্রিয়া শুরু হবে।</li>
          </ul>
        )}
      </div>
    </section>
  );
}
