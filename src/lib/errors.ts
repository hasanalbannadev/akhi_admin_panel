// Backend এর ইংরেজি error message কে বাংলায় দেখানোর ছোট ম্যাপ। না মিললে মূল message ই দেখাবে।
const MAP: Array<[RegExp, string]> = [
  [/Wrong code/i, "ভুল কোড দিয়েছেন"],
  [/Code expired or not requested/i, "কোডের মেয়াদ শেষ, নতুন কোড নিন"],
  [/Too many wrong attempts/i, "অনেকবার ভুল হয়েছে, নতুন কোড নিন"],
  [/Wait \d+s/i, "একটু অপেক্ষা করে আবার চেষ্টা করুন"],
  [/Too many codes/i, "আজকের জন্য কোডের সীমা শেষ"],
  [/Invalid Bangladeshi mobile number/i, "সঠিক বাংলাদেশি মোবাইল নম্বর দিন"],
  [/Account blocked|Account unavailable/i, "আপনার অ্যাকাউন্ট বর্তমানে বন্ধ আছে"],
  [/Only (\d+) in stock/i, "স্টকে এত পরিমাণ নেই"],
  [/Not enough stock/i, "স্টকে পর্যাপ্ত পণ্য নেই"],
  [/Cart is empty/i, "কার্ট খালি"],
  [/Minimum order is/i, "সর্বনিম্ন অর্ডারের পরিমাণ পূরণ হয়নি"],
  [/Invalid coupon/i, "কুপন কোডটি সঠিক নয়"],
  [/Coupon has expired/i, "কুপনের মেয়াদ শেষ"],
  [/Coupon is not active yet/i, "কুপনটি এখনো চালু হয়নি"],
  [/Coupon usage limit reached/i, "কুপনের ব্যবহার সীমা শেষ"],
  [/Minimum order .* for this coupon/i, "এই কুপনের জন্য আরও কেনাকাটা করতে হবে"],
  [/already used this coupon/i, "আপনি এই কুপন আগেই ব্যবহার করেছেন"],
  [/payment method is not available/i, "এই পেমেন্ট মেথড এখন চালু নেই"],
  [/Only customers who received/i, "পণ্যটি ডেলিভারি পাওয়ার পরেই রিভিউ দিতে পারবেন"],
  [/already reviewed/i, "আপনি এই পণ্যের রিভিউ আগেই দিয়েছেন"],
  [/Only delivered orders can be returned/i, "শুধু ডেলিভারি হওয়া অর্ডার রিটার্ন করা যায়"],
  [/return request already exists/i, "এই অর্ডারে ইতিমধ্যে রিটার্নের আবেদন আছে, নতুন আবেদন করা যাবে না"],
  [/return request is already open/i, "এই অর্ডারে একটি রিটার্ন অনুরোধ আগেই চলমান"],
  [/can no longer be cancelled/i, "এই অর্ডার আর বাতিল করা যাবে না"],
  [/Paid orders must be cancelled/i, "পেইড অর্ডার বাতিল করতে সাপোর্টে যোগাযোগ করুন"],
  [/transaction ID was already used/i, "এই ট্রানজেকশন আইডি আগেই ব্যবহার হয়েছে"],
  [/Payment already submitted/i, "পেমেন্ট তথ্য আগেই জমা দেওয়া হয়েছে"],
  [/Online payment is not configured/i, "অনলাইন পেমেন্ট এখনো চালু হয়নি"],
  [/Missing token|Invalid or expired token|Customer token required/i, "আবার লগইন করুন"],
  [/Out of stock/i, "স্টক শেষ"],
  [/Order not found/i, "অর্ডার খুঁজে পাওয়া যায়নি"],
];

export function bnError(message: string): string {
  for (const [re, bn] of MAP) if (re.test(message)) return bn;
  return message;
}

export function errorMessage(e: unknown, fallback = "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন"): string {
  if (e instanceof Error && e.message) return bnError(e.message);
  return fallback;
}
