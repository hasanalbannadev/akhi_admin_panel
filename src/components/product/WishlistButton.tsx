"use client";
import { Icon } from "@/components/ui/Icon";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/format";

// হার্ট বাটন (কার্ডে ও পণ্যের পেজে)
export function WishlistButton({ productId, className = "" }: { productId: number; className?: string }) {
  const { has, toggle } = useWishlist();
  const on = has(productId);
  return (
    <button
      type="button"
      aria-label={on ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় যোগ করুন"}
      aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      className={cn("grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm hover:bg-brand-50", className)}
    >
      <Icon name="heart" filled={on} className={cn("h-[18px] w-[18px]", on ? "text-brand-600" : "text-ink/70")} />
    </button>
  );
}
