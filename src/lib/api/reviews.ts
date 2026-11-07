// রিভিউ (লেখা/এডিট লগইন লাগে; মুছতে পারে শুধু অ্যাডমিন; শুধু ডেলিভারি পাওয়া পণ্যে)। ছবি সর্বোচ্চ ৪টা।
import { api } from "./client";
import type { MyReview } from "@/types";

export const reviewsApi = {
  mine: () => api<MyReview[]>("/me/reviews", { auth: true }),
  add: (slug: string, rating: number, comment: string, images: string[] = []) =>
    api<{ ok: boolean }>(`/products/${slug}/reviews`, { method: "POST", body: { rating, comment, images }, auth: true }),
  edit: (slug: string, rating: number, comment: string, images: string[] = []) =>
    api<{ ok: boolean }>(`/products/${slug}/reviews`, { method: "PUT", body: { rating, comment, images }, auth: true }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ url: string }>("/me/review-photo", { method: "POST", body: fd, auth: true });
  },
  discard: (url: string) => api<void>("/me/review-photo", { method: "DELETE", query: { url }, auth: true }),
};
