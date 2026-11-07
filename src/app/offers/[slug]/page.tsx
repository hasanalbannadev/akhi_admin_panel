import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SmartImage } from "@/components/ui/SmartImage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { catalogApi } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try { return await catalogApi.offer(slug); }
  catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { offer } = await catalogApi.offer(slug);
    return withOg({ title: `${offer.title} - ${offer.percent}% ছাড়`, description: `${SITE.name} এর ${offer.title} অফার। ${offer.percent}% পর্যন্ত ছাড়।`, alternates: { canonical: `/offers/${slug}` } });
  } catch { return withOg({ title: "অফার", alternates: { canonical: `/offers/${slug}` } }); }
}

export default async function OfferPage({ params }: Props) {
  const { slug } = await params;
  const { offer, products } = await load(slug);
  const end = offer.ends_at ? new Date(offer.ends_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }) : null;
  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: offer.title }]} />
      {offer.banner_url && (
        <div className="mb-3 aspect-[16/6] overflow-hidden rounded-xl bg-brand-50 sm:aspect-[21/5]">
          <SmartImage src={offer.banner_url} alt={offer.title} className="h-full w-full object-cover" priority />
        </div>
      )}
      <h1 className="text-xl font-bold md:text-2xl">{offer.title}</h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        <span className="font-bold text-brand-600">{offer.percent}% ছাড়</span>{end ? ` · ${end} পর্যন্ত` : ""}
      </p>
      {products.length === 0
        ? <EmptyState icon="search" title="এই অফারে এখন কোনো পণ্য নেই" text="অন্য পণ্য দেখুন।" />
        : <ProductGrid products={products} />}
    </>
  );
}
