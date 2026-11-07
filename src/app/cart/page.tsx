"use client";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton, Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useCart } from "@/context/CartContext";
import { catalogApi } from "@/lib/api/catalog";
import { taka } from "@/lib/format";

export default function CartPage() {
  const { cart, loading, clear } = useCart();
  const [minOrder, setMinOrder] = useState(0);

  // দোকানের সর্বনিম্ন অর্ডার পরিমাণ (Admin settings থেকে)
  useEffect(() => { catalogApi.shopInfo().then((i) => setMinOrder(Number(i.min_order_amount) || 0)).catch(() => {}); }, []);

  if (loading) return <PageLoader />;

  const hasOut = cart.items.some((i) => !i.in_stock);
  const belowMin = minOrder > 0 && cart.subtotal < minOrder;

  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "কার্ট" }]} />
      <h1 className="mb-5 text-2xl font-bold">কার্ট ({cart.count} পণ্য)</h1>

      {cart.items.length === 0 ? (
        <EmptyState icon="bag" title="আপনার কার্ট খালি" text="পছন্দের পণ্য কার্টে যোগ করুন।" action={<LinkButton href="/shop">কেনাকাটা শুরু করুন</LinkButton>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-2xl border border-line bg-white px-4">
            <ul className="divide-y divide-line">{cart.items.map((l) => <CartItemRow key={`${l.product_id}:${l.color_id ?? 0}`} line={l} />)}</ul>
            <div className="border-t border-line py-3 text-right">
              <button onClick={clear} className="text-sm font-medium text-brand-600 hover:underline">কার্ট খালি করুন</button>
            </div>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <OrderSummary subtotal={cart.subtotal} total={cart.subtotal} count={cart.count}>
              {belowMin && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">সর্বনিম্ন অর্ডার {taka(minOrder)}। আরও {taka(minOrder - cart.subtotal)} এর পণ্য যোগ করুন।</p>}
              {hasOut && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">কিছু পণ্যের স্টক কম। পরিমাণ কমিয়ে নিন।</p>}
              {belowMin || hasOut
                ? <Button size="lg" className="w-full" disabled>চেকআউট করুন</Button>
                : <LinkButton href="/checkout" size="lg" className="w-full">চেকআউট করুন</LinkButton>}
              <LinkButton href="/shop" variant="ghost" className="mt-2 w-full">আরও কেনাকাটা করুন</LinkButton>
            </OrderSummary>
          </div>
        </div>
      )}
    </>
  );
}
