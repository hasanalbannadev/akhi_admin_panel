"use client";
import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/account/PageTitle";
import { ReviewGallery } from "@/components/product/ReviewPhotos";
import { ReviewEditModal } from "@/components/account/ReviewEditModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { StarRating } from "@/components/ui/StarRating";
import { useAsync } from "@/hooks/useAsync";
import { reviewsApi } from "@/lib/api/reviews";
import { formatDate } from "@/lib/format";
import type { MyReview } from "@/types";

export default function MyReviewsPage() {
  const { data, loading, reload } = useAsync(() => reviewsApi.mine());
  const [edit, setEdit] = useState<MyReview | null>(null);

  return (
    <>
      <PageTitle title="আমার রিভিউ" sub="ডেলিভারি পাওয়া পণ্যের পেজ থেকে নতুন রিভিউ দিতে পারবেন।" />
      {loading ? <PageLoader /> : !data?.length ? (
        <EmptyState icon="star" title="কোনো রিভিউ নেই" text="পণ্য হাতে পেলে রিভিউ দিন।" />
      ) : (
        <ul className="grid gap-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/product/${r.slug}`} className="font-semibold hover:text-brand-600">{r.product}</Link>
                <span className="text-xs text-muted">{formatDate(r.created_at, false)}</span>
              </div>
              <div className="mt-1"><StarRating value={r.rating} /></div>
              {r.comment && <p className="mt-2 break-words text-[15px]">{r.comment}</p>}
              <ReviewGallery images={r.images} />
              {r.reply && <div className="mt-2 rounded-lg bg-brand-50 p-3 text-sm"><p className="mb-0.5 text-xs font-bold text-brand-600">Akhi Lifestyle এর উত্তর</p><p className="break-words">{r.reply}</p></div>}
              {!r.is_visible && <p className="mt-2 text-xs text-amber-700">এই রিভিউ বর্তমানে লুকানো আছে</p>}
              <div className="mt-3 flex gap-4 text-sm font-semibold">
                <button className="text-brand-600" onClick={() => setEdit(r)}>এডিট</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ReviewEditModal key={edit?.id ?? 0} review={edit} onClose={() => setEdit(null)} onDone={reload} />
    </>
  );
}
