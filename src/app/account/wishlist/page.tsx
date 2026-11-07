"use client";
import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/account/PageTitle";
import { PriceTag } from "@/components/product/PriceTag";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { SmartImage } from "@/components/ui/SmartImage";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAsync } from "@/hooks/useAsync";
import { wishlistApi } from "@/lib/api/wishlist";
import { errorMessage } from "@/lib/errors";

// পছন্দের তালিকা: কার্টে নিন / সরান
export default function WishlistPage() {
  const toast = useToast();
  const { refresh } = useCart();
  const { reload: reloadIds } = useWishlist();
  const { data, loading, reload } = useAsync(() => wishlistApi.list());
  const [busy, setBusy] = useState<number | null>(null);

  const act = async (id: number, fn: () => Promise<unknown>, msg: string) => {
    setBusy(id);
    try { await fn(); toast(msg); await Promise.all([reload(), reloadIds(), refresh()]); }
    catch (e) { toast(errorMessage(e), "error"); }
    finally { setBusy(null); }
  };

  return (
    <>
      <PageTitle title={`পছন্দের তালিকা (${data?.length ?? 0} পণ্য)`} />
      {loading ? <PageLoader /> : !data?.length ? (
        <EmptyState icon="heart" title="তালিকা খালি" text="পছন্দের পণ্যে হার্ট চাপুন।" action={<LinkButton href="/shop">পণ্য দেখুন</LinkButton>} />
      ) : (
        <ul className="grid gap-3">
          {data.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-xl border border-line bg-white p-3">
              <Link href={`/product/${p.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                <SmartImage src={p.images[0]?.url} alt={p.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link href={`/product/${p.slug}`} className="break-words font-medium hover:text-brand-600">{p.name}</Link>
                  <PriceTag price={p.price} compare={p.compare_at_price} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={p.stock < 1} loading={busy === p.id} onClick={() => act(p.id, () => wishlistApi.moveToCart(p.id), "কার্টে নেওয়া হয়েছে")}>
                    {p.stock < 1 ? "স্টক শেষ" : "কার্টে নিন"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => act(p.id, () => wishlistApi.remove(p.id), "সরানো হয়েছে")}>সরান</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
