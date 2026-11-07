// পেমেন্ট: COD / bKash / Nagad (manual) / SSLCommerz
import { api } from "./client";
import type { PaymentHistoryRow, PaymentOptions } from "@/types";

export const paymentsApi = {
  options: () => api<PaymentOptions>("/payment/options"),
  submitManual: (order_no: string, sender_number: string, trx_id: string) =>
    api<{ order_no: string; payment_status: string; message: string }>("/payment/manual", {
      method: "POST", body: { order_no, sender_number, trx_id }, auth: true,
    }),
  sslcommerzInit: (order_no: string) =>
    api<{ gateway_url: string; tran_id: string }>("/payment/sslcommerz/init", {
      method: "POST", query: { order_no }, auth: true,
    }),
  history: () => api<PaymentHistoryRow[]>("/payment/history", { auth: true }),
};
