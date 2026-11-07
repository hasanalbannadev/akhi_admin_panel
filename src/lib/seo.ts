// SEO এর সাহায্যকারী: canonical url, JSON-LD
import { SITE } from "@/lib/site";
import { imageUrl } from "@/lib/image";
import { stripHtml } from "@/lib/format";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const absUrl = (path: string) => `${SITE.url}${path.startsWith("/") ? path : "/" + path}`;

export function productJsonLd(p: Product, rating?: { average: number | null; count: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: stripHtml(p.description, 300) || p.name,
    image: p.images.map((i) => imageUrl(i.url)),
    sku: String(p.id),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: absUrl(`/product/${p.slug}`),
      priceCurrency: "BDT",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(rating && rating.count > 0 && rating.average
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count } }
      : {}),
  };
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/shop?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  email: SITE.email,
  telephone: SITE.phone,
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name, item: absUrl(it.path),
    })),
  };
}

// প্রতি পেজের নিজস্ব title/description/url দিয়ে og + twitter বানায়।
// (না দিলে Next হোমপেজের og:title/og:url inherit করে → WhatsApp/Facebook এ সব লিংকে একই প্রিভিউ দেখায়)
export function withOg(m: Metadata, path?: string): Metadata {
  const t = typeof m.title === "string" ? m.title : SITE.name;
  const title = t.includes(SITE.name) ? t : `${t} | ${SITE.name}`;
  const canon = path ?? (m.alternates?.canonical as string | undefined);
  const desc = (m.description as string | undefined) ?? SITE.description;
  const og = (m.openGraph ?? {}) as Record<string, unknown>;
  return {
    ...m,
    openGraph: { type: "website", locale: "bn_BD", siteName: SITE.name, title, description: desc, ...(canon ? { url: canon } : {}), ...og },
    twitter: { card: "summary_large_image", title, description: desc, ...(m.twitter ?? {}) },
  } as Metadata;
}
