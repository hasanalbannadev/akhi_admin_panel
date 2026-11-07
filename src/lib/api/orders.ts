// অর্ডার, ট্র্যাকিং, ইনভয়েস, রিটার্ন
import { api } from "./client";
import type { Invoice, Order, OrderCreateBody, ReturnRequest } from "@/types";

export const ordersApi = {
  create: (body: OrderCreateBody) => api<Order>("/orders", { method: "POST", body, auth: true, cart: true }),
  list: () => api<Order[]>("/orders", { auth: true }),
  detail: (orderNo: string) => api<Order>(`/orders/${orderNo}`, { auth: true }),
  cancel: (orderNo: string) => api<Order>(`/orders/${orderNo}/cancel`, { method: "POST", auth: true }),
  invoice: (orderNo: string) => api<Invoice>(`/orders/${orderNo}/invoice`, { auth: true }),
  reorder: (orderNo: string) =>
    api<{ added: string[]; skipped: string[] }>(`/orders/${orderNo}/reorder`, { method: "POST", auth: true, cart: true }),
  track: (order_no: string, phone: string) => api<Order>("/orders/track", { query: { order_no, phone } }),

  returns: () => api<ReturnRequest[]>("/returns", { auth: true }),
  returnDetail: (id: number) => api<ReturnRequest>(`/returns/${id}`, { auth: true }),
  requestReturn: (orderNo: string, reason: string, refund_bkash: string) =>
    api<{ id: number; status: string }>(`/orders/${orderNo}/return`, { method: "POST", body: { reason, refund_bkash }, auth: true }),
  cancelReturn: (id: number) => api<{ ok: boolean }>(`/returns/${id}/cancel`, { method: "POST", auth: true }),
};
