"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressPicker } from "@/components/checkout/AddressPicker";
import { CouponBox } from "@/components/checkout/CouponBox";
import { PaymentMethodPicker, enabledMethods, type PayInput } from "@/components/checkout/PaymentMethodPicker";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { LoginForm } from "@/components/account/LoginForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/lib/api/auth";
import { cartApi } from "@/lib/api/cart";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import { errorMessage } from "@/lib/errors";
import type { Address, CartSummary, PayMethod, PaymentOptions } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, ready } = useAuth();
  const { cart, loading, refresh } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [pay, setPay] = useState<PayInput>({ sender: "", trx: "" });
  const [coupon, setCoupon] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [placing, setPlacing] = useState(false);

  const selected = useMemo(() => addresses.find((a) => a.id === addressId) ?? null, [addresses, addressId]);

  // লগইন হলে ঠিকানা আনি, ডিফল্ট ঠিকানা আগে থেকে বাছাই
  useEffect(() => {
    if (!user) return;
    authApi.addresses().then((list) => {
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setAddressId(def.id);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    paymentsApi.options().then((o) => {
      setOptions(o);
      setMethod((m) => m ?? enabledMethods(o)[0] ?? null);
    }).catch(() => {});
  }, []);

  // জেলা / কুপন / কার্ট বদলালে দাম আবার হিসাব (Backend থেকে)
  useEffect(() => {
    if (!cart.items.length) return;
    let alive = true;
    cartApi.summary(selected?.district, coupon ?? undefined, method ?? "cod")
      .then((s) => {
        if (!alive) return;
        setSummary(s);
        if (s.coupon_error) { toast(s.coupon_error, "error"); setCoupon(null); }
      }).catch(() => {});
    return () => { alive = false; };
  }, [selected?.district, coupon, method, cart.subtotal, cart.items.length, toast]);

  const placeOrder = async () => {
    if (!selected) { toast("ডেলিভারি ঠিকানা বাছাই করুন", "error"); return; }
    if (!method) { toast("পেমেন্ট মেথড বাছাই করুন", "error"); return; }
    const isAcct = method.startsWith("pm_");
    if (isAcct && (pay.sender.trim().length < 3 || pay.trx.trim().length < 4)) {
      toast("যে নম্বর থেকে পাঠিয়েছেন আর TrxID দিন", "error"); return;
    }
    setPlacing(true);
    try {
      const order = await ordersApi.create({
        ship: { name: selected.recipient_name, district: selected.district, area: selected.area, address: selected.address_line },
        payment_method: method,
        payment: isAcct ? { sender_number: pay.sender.trim(), trx_id: pay.trx.trim() } : null,
        note: note.trim() || null,
        coupon_code: coupon,
      });
      await refresh(); // অর্ডার হলে Backend কার্ট খালি করে দেয়

      if (method === "sslcommerz") {
        try {
          const { gateway_url } = await paymentsApi.sslcommerzInit(order.order_no);
          window.location.assign(gateway_url);
          return;
        } catch (e) {
          toast(errorMessage(e), "error");
        }
      }
      router.push(`/order/${order.order_no}?placed=1`);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setPlacing(false);
    }
  };

  if (loading || !ready) return <PageLoader />;

  if (cart.items.length === 0 && !placing) {
    return <EmptyState icon="bag" title="কার্ট খালি" text="চেকআউট করতে আগে পণ্য যোগ করুন।" action={<LinkButton href="/shop">কেনাকাটা করুন</LinkButton>} />;
  }

  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "কার্ট", href: "/cart" }, { label: "চেকআউট" }]} />
      <h1 className="mb-5 text-2xl font-bold">চেকআউট</h1>

      {!user ? (
        <div className="space-y-4">
          <p className="text-center text-muted">অর্ডার করতে আপনার মোবাইল নম্বর ভেরিফাই করুন।</p>
          <Suspense fallback={null}><LoginForm redirect={false} title="মোবাইল নম্বর ভেরিফাই" /></Suspense>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <AddressPicker addresses={addresses} selectedId={addressId} userPhone={user.phone}
              onSelect={setAddressId} onAdded={(a) => { setAddresses((l) => [...l, a]); setAddressId(a.id); }} />
            <PaymentMethodPicker options={options} value={method} onChange={setMethod} pay={pay} onPay={setPay} free={summary?.free_by_method} />
            <CouponBox applied={coupon} subtotal={cart.subtotal} note={summary?.coupon_note} onApply={setCoupon} />
            <section className="rounded-2xl border border-line bg-white p-5">
              <Textarea label="অর্ডার নোট (ঐচ্ছিক)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ডেলিভারি নিয়ে কিছু বলার থাকলে লিখুন" maxLength={300} />
            </section>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <OrderSummary subtotal={summary?.subtotal ?? cart.subtotal} discount={summary?.discount}
              shipping={summary?.shipping_fee} total={summary?.total ?? cart.subtotal} count={cart.count}>
              <Button size="lg" className="w-full" loading={placing} onClick={placeOrder}
                disabled={!selected || !method || cart.items.some((i) => !i.in_stock)}>
                অর্ডার কনফার্ম করুন
              </Button>
              {!selected && <p className="mt-2 text-center text-xs text-muted">ঠিকানা বাছাই করলে ডেলিভারি চার্জ হিসাব হবে</p>}
            </OrderSummary>
          </div>
        </div>
      )}
    </>
  );
}
