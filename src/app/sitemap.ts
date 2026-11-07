import type { MetadataRoute } from "next";
import { catalogApi } from "@/lib/api/catalog";
import { safe } from "@/lib/api/safe";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

// sitemap.xml: সব ক্যাটাগরি ও পণ্যের লিংক নিজে নিজে তৈরি হয়
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = ["", "/shop", "/categories", "/track", "/about", "/contact", "/privacy", "/terms", "/return-policy"]
    .map((p) => ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 }));

  const categories = await safe(catalogApi.categories(3600), []);
  const catPages = categories.map((c) => ({
    url: `${SITE.url}/category/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
  }));

  // সর্বোচ্চ ৫ পেজ × ৬০ = ৩০০ পণ্য। বেশি হলে সংখ্যাটা বাড়ান।
  const products = [];
  for (let page = 1; page <= 5; page++) {
    const res = await safe(catalogApi.products({ page, page_size: 60 }, 3600), null);
    if (!res || res.items.length === 0) break;
    products.push(...res.items);
    if (products.length >= res.total) break;
  }
  const productPages = products.map((p) => ({
    url: `${SITE.url}/product/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8,
  }));

  return [...staticPages, ...catPages, ...productPages];
}
