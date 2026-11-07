import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductListing, type SP } from "@/components/product/ProductListing";

type Props = { searchParams: Promise<SP> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return withOg({
    title: q ? `"${q}" এর সার্চ রেজাল্ট` : "সব পণ্য",
    description: "Akhi Lifestyle এর সব পণ্য - ব্যাগ, জুয়েলারি, বিউটি ও আরও অনেক কিছু।",
    alternates: { canonical: "/shop" },
    // সার্চ/ফিল্টার করা পেজ index হবে না (duplicate এড়াতে)
    robots: q || sp.min || sp.max || sp.sort ? { index: false, follow: true } : undefined,
  });
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: q ? `সার্চ: ${q}` : "সব পণ্য" }]} />
      <h1 className="mb-5 text-2xl font-bold">{q ? `"${q}" এর রেজাল্ট` : "সব পণ্য"}</h1>
      <ProductListing basePath="/shop" sp={sp} />
    </>
  );
}
