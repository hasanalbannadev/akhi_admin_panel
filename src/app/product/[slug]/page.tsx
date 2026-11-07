import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Icon } from "@/components/ui/Icon";
import { StarRating } from "@/components/ui/StarRating";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PriceTag } from "@/components/product/PriceTag";
import { BuyBox } from "@/components/product/BuyBox";
import { ColorProvider } from "@/components/product/ColorContext";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeader } from "@/components/home/SectionHeader";
import { catalogApi } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { safe } from "@/lib/api/safe";
import { imageUrl } from "@/lib/image";
import { stripHtml } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { paymentsApi } from "@/lib/api/payments";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  try { return await catalogApi.product(slug); }
  catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

// ===== প্রতিটা পণ্যের নিজস্ব SEO title / description / Open Graph ছবি =====
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await catalogApi.product(slug);
    const desc = stripHtml(p.description, 155) || `${p.name} - ${SITE.name} থেকে কিনুন। ক্যাশ অন ডেলিভারি।`;
    const img = p.images[0] ? imageUrl(p.images[0].url) : undefined;
    return {
      title: p.name,
      description: desc,
      alternates: { canonical: `/product/${p.slug}` },
      openGraph: {
        type: "website", title: `${p.name} | ${SITE.name}`, description: desc, url: `/product/${p.slug}`,
        images: img ? [{ url: img, alt: p.name }] : undefined,
      },
      twitter: { card: "summary_large_image", title: p.name, description: desc, images: img ? [img] : undefined },
    };
  } catch {
    return withOg({ title: "পণ্য", alternates: { canonical: `/product/${slug}` } });
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);

  const [reviews, related, zones, categories, payOpts] = await Promise.all([
    safe(catalogApi.reviews(slug), { average: null, count: 0, items: [] }),
    safe(catalogApi.related(slug, 8), []),
    safe(catalogApi.zones(), []),
    safe(catalogApi.categories(), []),
    safe(paymentsApi.options(), null),
  ]);
  const cat = categories.find((c) => c.id === p.category_id);
  // প্রতিটি চালু পেমেন্ট পদ্ধতিতে এই পণ্যের ডেলিভারি চার্জ ফ্রি কিনা (অ্যাডমিনের টিক; টিক না থাকলে সাধারণ নিয়ম: ক্যাশ অন ডেলিভারিতে চার্জ, বাকিতে ফ্রি)
  const chosen = p.free_delivery_methods ?? [];
  const methodFree = (k: string) => {
    const m = payOpts?.methods.find((x) => x.key === k);
    return m ? m.delivery_free !== false : k !== "cod";   // অ্যাকাউন্টের নিজস্ব সেটিং; COD এ চার্জ, অনলাইনে ফ্রি
  };
  const isFree = (k: string) => (chosen.length ? chosen.includes(k) : methodFree(k));
  const payRows = payOpts ? [
    ...(payOpts.cod.enabled ? [{ k: "cod", name: "ক্যাশ অন ডেলিভারি" }] : []),
    ...(payOpts.sslcommerz.enabled ? [{ k: "sslcommerz", name: "অনলাইন (কার্ড/মোবাইল ব্যাংকিং)" }] : []),
    ...payOpts.methods.map((m) => ({ k: m.key, name: m.title })),
  ].map((r) => ({ ...r, free: isFree(r.k) })) : [];

  const crumbs = [
    { label: "হোম", href: "/" },
    ...(cat ? [{ label: cat.name, href: `/category/${cat.slug}` }] : [{ label: "সব পণ্য", href: "/shop" }]),
    { label: p.name },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, reviews)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
        { name: "হোম", path: "/" },
        ...(cat ? [{ name: cat.name, path: `/category/${cat.slug}` }] : []),
        { name: p.name, path: `/product/${p.slug}` },
      ])) }} />

      <Breadcrumb items={crumbs} />

      <ColorProvider colors={p.colors ?? []}>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={p.images} name={p.name} productId={p.id} />

        <div className="space-y-5">
          <h1 className="text-2xl font-bold leading-snug md:text-3xl">{p.name}</h1>
          <div className="flex items-center gap-2 text-sm">
            <StarRating value={reviews.average ?? 0} />
            <span className="font-semibold">{reviews.average ? reviews.average.toFixed(1) : "নতুন"}</span>
            <span className="text-muted">({reviews.count} রিভিউ)</span>
          </div>
          <PriceTag price={p.price} compare={p.compare_at_price} large />

          <BuyBox product={p} />

          <ul className="grid grid-cols-1 gap-2.5 rounded-xl bg-brand-50/60 p-4 text-sm sm:grid-cols-3">
            {[
              { icon: "shield", t: "১০০% অরিজিনাল" },
              { icon: "refresh", t: "সহজ রিটার্ন" },
              { icon: "truck", t: "ক্যাশ অন ডেলিভারি" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-2 font-medium"><Icon name={f.icon} className="h-5 w-5 text-brand-600" />{f.t}</li>
            ))}
          </ul>

          {chosen.length > 0 && payRows.length > 0 && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-sm">
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <Icon name="truck" className="h-5 w-5 text-brand-600" />
                <span>ডেলিভারি চার্জ</span>
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">ফ্রি ডেলিভারি অফার</span>
              </p>
              <ul className="space-y-1">
                {payRows.map((r) => (
                  <li key={r.k} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-words">{r.name}</span>
                    {r.free
                      ? <b className="shrink-0 text-emerald-700">ডেলিভারি ফ্রি</b>
                      : <span className="shrink-0 text-muted">ডেলিভারি চার্জ লাগবে</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      </ColorProvider>

      <ProductTabs slug={p.slug} price={p.price} description={p.description} reviews={reviews} zones={zones} />

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="আপনার পছন্দ হতে পারে" />
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}

      <p className="mt-10 text-center text-sm text-muted">
        সাহায্য লাগলে <Link href="/contact" className="font-semibold text-brand-600">আমাদের সাথে যোগাযোগ করুন</Link>
      </p>
    </>
  );
}
