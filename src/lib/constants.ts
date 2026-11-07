// সব বাংলা লেবেল ও মেনু এক জায়গায়। কিছু বদলাতে চাইলে এখানে বদলান।
import type { OrderStatus, PayMethod, PaymentStatus, ReturnStatus } from "@/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "অপেক্ষমান",
  confirmed: "নিশ্চিত হয়েছে",
  processing: "প্রস্তুত হচ্ছে",
  shipped: "শিপড হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
  returned: "Returned",
};

// ট্র্যাকিং টাইমলাইনের ধাপ
export const ORDER_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export const ORDER_STEP_DESC: Record<OrderStatus, string> = {
  pending: "আপনার অর্ডার আমরা পেয়েছি",
  confirmed: "অর্ডার নিশ্চিত করা হয়েছে",
  processing: "পণ্য প্যাকেজিং চলছে",
  shipped: "কুরিয়ারে হস্তান্তর করা হয়েছে",
  delivered: "পণ্য ডেলিভারি সম্পন্ন",
  cancelled: "অর্ডার বাতিল করা হয়েছে",
  returned: "পণ্য ফেরত এসেছে",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "অপরিশোধিত",
  pending_verification: "যাচাই চলছে",
  paid: "পরিশোধিত",
  failed: "ব্যর্থ",
  refunded: "রিফান্ড হয়েছে",
};

export const PAY_METHOD_LABEL: Record<string, string> = {
  cod: "ক্যাশ অন ডেলিভারি",
  sslcommerz: "কার্ড / মোবাইল ব্যাংকিং (SSLCommerz)",
  manual_bkash: "bKash",
  manual_nagad: "Nagad",
};

// অর্ডারে দেখানোর পেমেন্ট নাম: admin এর দেওয়া নাম (bKash Personal ...) থাকলে সেটা, না হলে ডিফল্ট
export function payLabel(method: PayMethod, label?: string | null): string {
  if (method === "cod") return PAY_METHOD_LABEL.cod;
  if (method === "sslcommerz") return PAY_METHOD_LABEL.sslcommerz;
  return label || PAY_METHOD_LABEL[method] || method;
}

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "অনুরোধ করা হয়েছে",
  approved: "অনুমোদিত",
  pickup: "পিকআপ চলছে",
  received: "রিটার্ন সফল",
  rejected: "বাতিল",
  refunded: "Refund Completed",
};

// রিটার্ন/রিফান্ডের ধাপ (ক্রমানুসারে)
export const RETURN_STEPS: { key: ReturnStatus; label: string; desc: string }[] = [
  { key: "requested", label: "রিটার্নের আবেদন", desc: "আপনার আবেদন আমরা পেয়েছি" },
  { key: "approved", label: "রিটার্ন অনুমোদিত", desc: "আবেদন গ্রহণ করা হয়েছে" },
  { key: "pickup", label: "কুরিয়ার পিকআপ", desc: "কুরিয়ার আপনার কাছ থেকে পণ্য নিয়ে আসছে" },
  { key: "received", label: "রিটার্ন সফল", desc: "পণ্য আমাদের কাছে পৌঁছেছে" },
  { key: "refunded", label: "রিফান্ড সম্পন্ন", desc: "বিকাশে টাকা পাঠানো হয়েছে" },
];

export const SORT_OPTIONS = [
  { value: "new", label: "সর্বশেষ" },
  { value: "price_asc", label: "দাম: কম থেকে বেশি" },
  { value: "price_desc", label: "দাম: বেশি থেকে কম" },
] as const;

export const PRICE_RANGES = [
  { label: "৳0 - ৳1,000", min: 0, max: 1000 },
  { label: "৳1,001 - ৳2,000", min: 1001, max: 2000 },
  { label: "৳2,001 - ৳3,000", min: 2001, max: 3000 },
  { label: "৳3,001+", min: 3001, max: undefined },
] as const;

// Footer ও অন্যান্য জায়গার লিংক
export const FOOTER_QUICK_LINKS = [
  { href: "/", label: "হোম" },
  { href: "/shop", label: "সব পণ্য" },
  { href: "/cart", label: "কার্ট" },
  { href: "/track", label: "অর্ডার ট্র্যাক" },
  { href: "/contact", label: "যোগাযোগ" },
];

export const FOOTER_SUPPORT_LINKS = [
  { href: "/about", label: "আমাদের সম্পর্কে" },
  { href: "/return-policy", label: "রিটার্ন ও রিফান্ড পলিসি" },
  { href: "/privacy", label: "প্রাইভেসি পলিসি" },
  { href: "/terms", label: "শর্তাবলি" },
];

export const ACCOUNT_MENU = [
  { href: "/account", label: "আমার প্রোফাইল", icon: "user" },
  { href: "/account/addresses", label: "ঠিকানা ব্যবস্থাপনা", icon: "pin" },
  { href: "/account/orders", label: "আমার অর্ডার", icon: "bag" },
  { href: "/account/reviews", label: "রিভিউ", icon: "star" },
  { href: "/account/returns", label: "রিটার্ন অনুরোধ", icon: "return" },
  { href: "/account/wishlist", label: "পছন্দের তালিকা", icon: "heart" },
  { href: "/account/payments", label: "পেমেন্ট হিস্টরি", icon: "card" },
  { href: "/account/notifications", label: "নোটিফিকেশন", icon: "bell" },
  { href: "/account/support", label: "সাপোর্ট / চ্যাট", icon: "chat" },
] as const;

// Steadfast কুরিয়ারের delivery_status -> বাংলা লেখা (backend এর steadfast.py র সাথে মিল রাখা)
export const COURIER_STATUS_LABEL: Record<string, string> = {
  in_review: "কুরিয়ার অনুমোদনের অপেক্ষায়",
  pending: "কুরিয়ারে বুক হয়েছে, শীঘ্রই পাঠানো হবে",
  hold: "পার্সেল হোল্ডে আছে, আমরা যোগাযোগ করব",
  delivered_approval_pending: "ডেলিভারি হয়েছে, কুরিয়ার যাচাই করছে",
  partial_delivered_approval_pending: "আংশিক ডেলিভারি, কুরিয়ার যাচাই করছে",
  cancelled_approval_pending: "ডেলিভারি হয়নি, কুরিয়ার যাচাই করছে",
  unknown_approval_pending: "কুরিয়ার যাচাই করছে",
  delivered: "ডেলিভারি সম্পন্ন",
  partial_delivered: "আংশিক ডেলিভারি সম্পন্ন",
  cancelled: "ডেলিভারি হয়নি, পণ্য ফেরত আসছে",
  exceptional: "পার্সেলে সমস্যা হয়েছে, আমরা যোগাযোগ করব",
  unknown: "কুরিয়ারের তথ্য পাওয়া যায়নি",
  // Pathao
  order_created: "কুরিয়ারে বুক হয়েছে, শীঘ্রই পিকআপ হবে",
  order_updated: "অর্ডার আপডেট হয়েছে",
  pickup_requested: "পিকআপের অনুরোধ করা হয়েছে",
  assigned_for_pickup: "রাইডার পিকআপে আসছে",
  picked: "পার্সেল পিকআপ হয়েছে",
  pickup_failed: "পিকআপ হয়নি, আবার চেষ্টা হবে",
  pickup_cancelled: "পিকআপ বাতিল হয়েছে",
  at_the_sorting_hub: "সর্টিং হাবে আছে",
  in_transit: "পার্সেল পথে আছে",
  received_at_last_mile_hub: "আপনার এলাকার হাবে পৌঁছেছে",
  assigned_for_delivery: "রাইডার ডেলিভারির জন্য বের হয়েছে",
  partial_delivery: "আংশিক ডেলিভারি সম্পন্ন",
  return: "ডেলিভারি হয়নি, পণ্য ফেরত আসছে",
  delivery_failed: "ডেলিভারি করা যায়নি, আমরা যোগাযোগ করব",
  on_hold: "পার্সেল হোল্ডে আছে, আমরা যোগাযোগ করব",
  paid_return: "পেইড রিটার্ন",
  exchange: "এক্সচেঞ্জ",
};
