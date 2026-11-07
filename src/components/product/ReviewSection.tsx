"use client";
import Link from "next/link";
import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { ReviewGallery, ReviewPhotos } from "@/components/product/ReviewPhotos";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { catalogApi } from "@/lib/api/catalog";
import { reviewsApi } from "@/lib/api/reviews";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { ReviewsOut } from "@/types";

export function ReviewSection({ slug, initial }: { slug: string; initial: ReviewsOut }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<ReviewsOut>(initial);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const reloadFirst = async () => { setData(await catalogApi.reviews(slug, 1)); setPage(1); };

  const loadMore = async () => {
    const next = await catalogApi.reviews(slug, page + 1);
    setData((d) => ({ ...next, items: [...d.items, ...next.items] }));
    setPage(page + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await reviewsApi.add(slug, rating, comment.trim(), photos);
      toast("আপনার রিভিউ জমা হয়েছে, ধন্যবাদ!");
      setComment("");
      setPhotos([]);
      await reloadFirst();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr]">
      <div className="rounded-xl bg-brand-50/60 p-5 text-center">
        <div className="text-4xl font-bold text-brand-600">{data.average ? data.average.toFixed(1) : "—"}</div>
        <div className="mt-1 flex justify-center"><StarRating value={data.average ?? 0} size="h-5 w-5" /></div>
        <p className="mt-1 text-sm text-muted">{data.count}টি রিভিউ</p>
      </div>

      <div>
        {data.items.length === 0 ? (
          <p className="text-muted">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ আপনিই দিন!</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((r, i) => (
              <li key={i} className="py-4 first:pt-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">{r.name.charAt(0).toUpperCase()}</span>
                  <span className="font-medium">{r.name}</span>
                  <StarRating value={r.rating} />
                  <span className="ml-auto text-xs text-muted">{formatDate(r.created_at, false)}</span>
                </div>
                {r.comment && <p className="mt-2 break-words text-[15px] leading-relaxed">{r.comment}</p>}
                <ReviewGallery images={r.images} />
                {r.reply && (
                  <div className="mt-2 rounded-lg bg-brand-50 p-3 text-sm">
                    <p className="mb-0.5 text-xs font-bold text-brand-600">Akhi Lifestyle এর উত্তর</p>
                    <p className="break-words">{r.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {data.items.length < data.count && (
          <Button variant="outline" size="sm" className="mt-3" onClick={loadMore}>আরও রিভিউ দেখুন</Button>
        )}

        <div className="mt-8 rounded-xl border border-line p-4">
          <h3 className="mb-1 font-bold">আপনার রিভিউ লিখুন</h3>
          <p className="mb-3 text-sm text-muted">যারা পণ্যটি ডেলিভারি পেয়েছেন, শুধু তারাই রিভিউ দিতে পারবেন।</p>
          {!user ? (
            <Link href={`/login?next=/product/${slug}`} className="font-semibold text-brand-600 hover:underline">রিভিউ দিতে লগইন করুন</Link>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <StarRating value={rating} onChange={setRating} size="h-7 w-7" />
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="পণ্যটি কেমন লেগেছে?" />
              <ReviewPhotos value={photos} onChange={setPhotos} />
              <Button type="submit" loading={busy}>রিভিউ জমা দিন</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
