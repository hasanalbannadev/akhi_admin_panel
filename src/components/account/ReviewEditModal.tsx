"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewPhotos } from "@/components/product/ReviewPhotos";
import { useToast } from "@/context/ToastContext";
import { reviewsApi } from "@/lib/api/reviews";
import { errorMessage } from "@/lib/errors";
import type { MyReview } from "@/types";

export function ReviewEditModal({ review, onClose, onDone }: { review: MyReview | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [photos, setPhotos] = useState<string[]>(review?.images ?? []);
  const [busy, setBusy] = useState(false);
  if (!review) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await reviewsApi.edit(review.slug, rating, comment.trim(), photos); toast("রিভিউ আপডেট হয়েছে"); onDone(); onClose(); }
    catch (err) { toast(errorMessage(err), "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="রিভিউ এডিট">
      <form onSubmit={save} className="space-y-3.5">
        <p className="font-medium">{review.product}</p>
        <StarRating value={rating} onChange={setRating} size="h-7 w-7" />
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
        <ReviewPhotos value={photos} saved={review.images ?? []} onChange={setPhotos} />
        <Button type="submit" loading={busy} className="w-full">সংরক্ষণ করুন</Button>
      </form>
    </Modal>
  );
}
