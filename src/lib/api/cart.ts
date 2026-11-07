// কার্ট (guest ও চলবে, X-Cart-Token দিয়ে) + কুপন
import { api } from "./client";
import type { CartSummary, CartView, CouponPopup } from "@/types";

export const cartApi = {
  get: () => api<CartView>("/cart", { cart: true }),
  count: () => api<{ count: number }>("/cart/count", { cart: true }),
  add: (product_id: number, quantity = 1, color_id?: number | null) =>
    api<CartView>("/cart/items", { method: "POST", body: { product_id, quantity, color_id: color_id ?? null }, cart: true }),
  setQty: (product_id: number, quantity: number, color_id = 0) =>
    api<CartView>(`/cart/items/${product_id}`, { method: "PUT", body: { quantity }, query: { color_id }, cart: true }),
  remove: (product_id: number, color_id = 0) =>
    api<CartView>(`/cart/items/${product_id}`, { method: "DELETE", query: { color_id }, cart: true }),
  clear: () => api<CartView>("/cart", { method: "DELETE", cart: true }),
  summary: (district?: string, coupon_code?: string, payment_method?: string) =>
    api<CartSummary>("/cart/summary", { cart: true, query: { district, coupon_code, payment_method } }),
  couponPopup: () => api<CouponPopup | null>("/coupons/popup"),
  validateCoupon: (code: string, subtotal: number) =>
    api<{ code: string; discount: number }>("/coupons/validate", { method: "POST", body: { code, subtotal } }),
};
