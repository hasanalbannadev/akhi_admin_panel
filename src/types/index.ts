// Backend (FastAPI) এর response এর TypeScript টাইপ। schemas.py এর সাথে মিলিয়ে লেখা।

export interface ProductImage { id: number; url: string; sort_order: number }
export interface ProductColor { id: number; name: string; hex: string | null; stock: number; images: string[] }

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: ProductImage[];
  colors?: ProductColor[];
  free_delivery_methods?: string[];   // এই পেমেন্টে ডেলিভারি চার্জ ফ্রি (cod | sslcommerz | pm_<id>)
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  image_url: string | null;
  sort_order: number;
  nav_order?: number;
  is_active: boolean;
}

export interface CategoryDetail { category: Category; children: Category[]; parent: Category | null }

export interface Paged<T> { items: T[]; total: number; page: number; page_size: number }

export interface Offer {
  id: number; title: string; slug: string; banner_url: string | null; percent: number; ends_at: string | null; product_count: number;
  subtitle?: string | null; button_text?: string | null; link_url?: string | null;
}
export interface CouponPopup {
  id: number; code: string; label: string; title: string | null; text: string | null; image: string | null;
  button_text: string | null; link: string | null; seconds: number; min_subtotal: number;
}
export interface Banner {
  id: number; title: string | null; image_url: string | null; link_url: string | null;
  subtitle?: string | null; button_text?: string | null; placement?: "hero" | "promo";
}

export interface CartLine {
  product_id: number;
  color_id?: number;
  color_name?: string | null;
  color_hex?: string | null;
  name: string;
  slug: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  in_stock: boolean;
}
export interface CartView { items: CartLine[]; subtotal: number; count: number }

export interface CartSummary {
  subtotal: number;
  discount: number;
  coupon_error: string | null;
  coupon_note?: string | null;
  free_by_method?: Record<string, boolean>;   // কোন পেমেন্টে এই কার্টের ডেলিভারি ফ্রি
  shipping_fee: number | null;
  total: number;
  count: number;
}

export interface User { id: number; phone: string; name: string | null; email: string | null; avatar_url?: string | null }
export interface TokenOut { access_token: string; token_type: string; phone: string }
export interface OtpSent { sent: boolean; expires_in: number; debug_code?: string }

export interface AddressIn {
  label?: string | null;
  recipient_name: string;
  phone: string;
  district: string;
  area?: string | null;
  address_line: string;
  is_default: boolean;
}
export interface Address extends AddressIn { id: number }

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "failed" | "refunded";
// "cod" | "sslcommerz" | "pm_<id>" (admin এর যোগ করা bKash/Nagad/ব্যাংক) | পুরোনো "manual_bkash" / "manual_nagad"
export type PayMethod = string;

export interface OrderItem { name: string; unit_price: number; quantity: number }
export interface Order {
  order_no: string;
  status: OrderStatus;
  payment_method: PayMethod;
  payment_label?: string | null;
  cancel_requested?: boolean;
  return_info?: ReturnRequest | null;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  ship_name: string;
  ship_phone: string;
  ship_district: string;
  ship_area: string | null;
  ship_address: string;
  courier: string | null;
  tracking_code: string | null;
  courier_status?: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface OrderCreateBody {
  ship: { name: string; district: string; area?: string | null; address: string };
  payment_method: PayMethod;
  payment?: { sender_number: string; trx_id: string } | null;
  note?: string | null;
  coupon_code?: string | null;
}

export interface Invoice {
  invoice_no: string;
  date: string;
  status: string;
  customer: { name: string; phone: string };
  ship_to: { district: string; area: string | null; address: string };
  items: { name: string; quantity: number; unit_price: number; line_total: number }[];
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  shipping_fee: number;
  total: number;
  payment_method: string;
  payment_label?: string | null;
  payment_status: string;
  courier: string | null;
  tracking_code: string | null;
  consignment_id?: string | null;
}

export interface PayAccount {
  key: string; id: number; kind: "bkash" | "nagad" | "rocket" | "upay" | "bank" | "other"; title: string;
  account_number: string | null; account_name: string | null; bank_name: string | null; branch: string | null;
  instructions: string | null; delivery_free?: boolean;
}
export interface PaymentOptions {
  cod: { enabled: boolean };
  sslcommerz: { enabled: boolean };
  methods: PayAccount[];   // admin এর যোগ করা অ্যাকাউন্ট (bKash, Nagad, ব্যাংক...)
}

export interface PaymentHistoryRow {
  order_no: string;
  label?: string | null;
  method: string;
  amount: number;
  status: string;
  trx_id: string | null;
  created_at: string;
}

export interface ShopInfo { currency: string; min_order_amount: number; payment_methods: Record<string, boolean>; social?: Record<string, string> }
export interface DeliveryZone { name: string; districts: string[]; fee: number; free_over: number | null }

export interface ReviewsOut {
  average: number | null;
  count: number;
  items: { rating: number; comment: string | null; images?: string[]; reply?: string | null; created_at: string; name: string }[];
}
export interface MyReview {
  id: number;
  product: string;
  slug: string;
  rating: number;
  comment: string | null;
  images?: string[];
  reply?: string | null;
  is_visible: boolean;
  created_at: string;
}

// requested -> approved -> pickup (কুরিয়ার) -> received (রিটার্ন সফল) -> refunded
export type ReturnStatus = "requested" | "approved" | "pickup" | "received" | "refunded" | "rejected";
export interface ReturnRequest {
  id: number;
  order_no: string;
  reason: string;
  status: ReturnStatus;
  status_bn?: string;
  admin_note: string | null;
  created_at: string;
  refund_bkash?: string | null;
  courier?: string | null;
  courier_status?: string | null;
  courier_status_bn?: string | null;
  received_at?: string | null;
  refund_amount?: number | null;
  refund_trx?: string | null;
  refund_sender?: string | null;
  refunded_at?: string | null;
  total?: number;
}

export interface Suggestion { name: string; slug: string }

export interface SupportMsg { id: number; sender: "customer" | "admin"; text: string | null; images: string[]; edited: boolean; created_at: string }
