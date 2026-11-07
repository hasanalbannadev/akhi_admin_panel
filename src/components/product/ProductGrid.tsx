import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";

// কার্ডের প্রস্থ নির্দিষ্ট (সর্বোচ্চ ~১৩ rem), তাই সব জায়গায় একই মাপ। `cols` আগের কলের সাথে মিল রাখতে আছে।
export function ProductGrid({ products, bestIds }: { products: Product[]; cols?: string; bestIds?: Set<number> }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-[repeat(auto-fill,minmax(10rem,13rem))]">
      {products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} best={bestIds?.has(p.id)} />)}
    </div>
  );
}
