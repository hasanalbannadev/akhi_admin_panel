import type { Metadata } from "next";
import { HeroSlider } from "@/components/home/HeroSlider";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { SectionHeader } from "@/components/home/SectionHeader";
import { OfferBanners } from "@/components/home/OfferBanners";
import { PromoBanners } from "@/components/home/PromoBanners";
import { ProductGrid } from "@/components/product/ProductGrid";
import { catalogApi } from "@/lib/api/catalog";
import { safe } from "@/lib/api/safe";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} - ব্যাগ, জুয়েলারি ও লাইফস্টাইল অ্যাক্সেসরিজ | ক্যাশ অন ডেলিভারি` },
  alternates: { canonical: "/" },
};

// হোম পেজ: Banner -> Feature -> Category -> পণ্য (Best Seller আগে, তারপর নতুন) -> ডিল/অফার ব্যানার
export default async function HomePage() {
  const [banners, promos, categories, best, fresh, offers] = await Promise.all([
    safe(catalogApi.banners(), []),
    safe(catalogApi.banners(120, "promo"), []),
    safe(catalogApi.categories(), []),
    safe(catalogApi.bestSellers(6), []),
    safe(catalogApi.newArrivals(16), []),
    safe(catalogApi.offers(), []),
  ]);
  const topCategories = categories.filter((c) => !c.parent_id);
  // একটাই "পণ্য" সেকশন: যেগুলো সবচেয়ে বেশি বিক্রি হয় (Best Seller) সেগুলো একদম শুরুতে, তারপর নতুন পণ্য।
  const bestIds = new Set(best.map((p) => p.id));
  const products = [...best, ...fresh.filter((p) => !bestIds.has(p.id))].slice(0, 16);

  return (
    <div className="space-y-2.5 md:space-y-3">
      <HeroSlider banners={banners} />
      <FeatureStrip />
      <CategoryCircles categories={topCategories} />

      {products.length > 0 && (
        <section>
          <SectionHeader title="আমাদের পণ্য" href="/shop" />
          <ProductGrid products={products} bestIds={bestIds} />
        </section>
      )}

      {/* ডিল / অফার ব্যানার পণ্যের কার্ডের নিচে (admin এর Banners থেকে বদলানো যায়) */}
      {promos.length > 0 && <PromoBanners banners={promos} />}
      {offers.length > 0 && <OfferBanners offers={offers} />}

      {products.length === 0 && (
        <p className="py-10 text-center text-muted">পণ্য শীঘ্রই যোগ করা হচ্ছে। একটু পরে আবার দেখুন।</p>
      )}
    </div>
  );
}
