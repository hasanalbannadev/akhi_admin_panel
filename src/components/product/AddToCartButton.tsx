"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/context/CartContext";

// কার্ডে "Add to Cart" বাটন
export function AddToCartButton({ productId, stock, className = "" }: { productId: number; stock: number; className?: string }) {
  const { add } = useCart();
  const [busy, setBusy] = useState(false);
  if (stock < 1) {
    return <Button disabled variant="soft" size="sm" className={`w-full ${className}`}>স্টক শেষ</Button>;
  }
  return (
    <Button size="sm" loading={busy} className={`w-full ${className}`}
      onClick={async () => { setBusy(true); await add(productId, 1); setBusy(false); }}>
      {!busy && <Icon name="bag" className="h-4 w-4 shrink-0" />} কার্টে যোগ করুন
    </Button>
  );
}
