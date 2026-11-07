import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, RETURN_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus, PaymentStatus, ReturnStatus } from "@/types";

const TONE = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-sky-50 text-sky-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-600",
};

const pill = (tone: keyof typeof TONE, text: string) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>{text}</span>
);

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "delivered" ? "green" : status === "cancelled" ? "red" : status === "shipped" ? "blue" : status === "returned" ? "gray" : "amber";
  return pill(tone, ORDER_STATUS_LABEL[status] ?? status);
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === "paid" ? "green" : status === "failed" ? "red" : status === "refunded" ? "gray" : "amber";
  return pill(tone, PAYMENT_STATUS_LABEL[status] ?? status);
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const tone = status === "approved" || status === "refunded" || status === "received" ? "green" : status === "rejected" ? "red" : "amber";
  return pill(tone, RETURN_STATUS_LABEL[status] ?? status);
}
