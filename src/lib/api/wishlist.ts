// পছন্দের তালিকা (লগইন লাগে)
import { api } from "./client";
import type { Product } from "@/types";

export const wishlistApi = {
  list: () => api<Product[]>("/wishlist", { auth: true }),
  add: (id: number) => api<{ ok: boolean }>(`/wishlist/${id}`, { method: "POST", auth: true }),
  remove: (id: number) => api<void>(`/wishlist/${id}`, { method: "DELETE", auth: true }),
  moveToCart: (id: number) =>
    api<{ ok: boolean }>(`/wishlist/${id}/move-to-cart`, { method: "POST", auth: true, cart: true }),
};
