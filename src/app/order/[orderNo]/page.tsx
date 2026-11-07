import { OrderDetailView } from "@/components/orders/OrderDetailView";

type Props = {
  params: Promise<{ orderNo: string }>;
  searchParams: Promise<{ placed?: string; paid?: string }>;
};

// SSLCommerz পেমেন্টের পর Backend এখানে redirect করে: /order/{no}?paid=1 বা ?paid=0
export default async function OrderPage({ params, searchParams }: Props) {
  const { orderNo } = await params;
  const sp = await searchParams;
  return <OrderDetailView orderNo={orderNo} placed={sp.placed === "1"} paid={sp.paid ?? null} />;
}
