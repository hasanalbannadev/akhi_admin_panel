import { redirect } from "next/navigation";

// পুরনো/সংক্ষিপ্ত লিংক -> অ্যাকাউন্টের পছন্দের তালিকা
export default function WishlistRedirect() {
  redirect("/account/wishlist");
}
