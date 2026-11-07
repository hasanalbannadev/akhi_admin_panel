import { ProductGrid } from "./ProductGrid";
import { ListingFilters, SortSelect, type Current } from "./ListingFilters";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { catalogApi } from "@/lib/api/catalog";
import { safe } from "@/lib/api/safe";

const PAGE_SIZE = 20;

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// /shop আর /category/[slug] দুই জায়গায় এই একই লিস্টিং ব্যবহার হয়
export async function ProductListing({ basePath, categorySlug, sp }: { basePath: string; categorySlug?: string; sp: SP }) {
  const cur: Current = { q: one(sp.q), category: categorySlug, min: one(sp.min), max: one(sp.max), sort: one(sp.sort) };
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const sort = (["new", "price_asc", "price_desc"].includes(cur.sort || "") ? cur.sort : "new") as "new" | "price_asc" | "price_desc";

  const [categories, res] = await Promise.all([
    safe(catalogApi.categories(), []),
    safe(catalogApi.products({
      q: cur.q, category: categorySlug,
      min_price: cur.min ? Number(cur.min) : undefined,
      max_price: cur.max ? Number(cur.max) : undefined,
      sort, page, page_size: PAGE_SIZE,
    }), { items: [], total: 0, page, page_size: PAGE_SIZE }),
  ]);

  const totalPages = Math.ceil(res.total / PAGE_SIZE);
  const makeHref = (p: number) => {
    const q = new URLSearchParams();
    if (cur.q) q.set("q", cur.q);
    if (cur.min) q.set("min", cur.min);
    if (cur.max) q.set("max", cur.max);
    if (sort !== "new") q.set("sort", sort);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-8">
      <ListingFilters categories={categories} cur={cur} />
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">মোট {res.total}টি পণ্য</p>
          <div className="flex items-center gap-2"><SortSelect cur={cur} /></div>
        </div>
        {res.items.length === 0 ? (
          <EmptyState icon="search" title="কোনো পণ্য পাওয়া যায়নি"
            text="ফিল্টার বা সার্চ বদলে আবার চেষ্টা করুন।" action={<LinkButton href="/shop">সব পণ্য দেখুন</LinkButton>} />
        ) : (
          <ProductGrid products={res.items} cols="lg:grid-cols-3 xl:grid-cols-4" />
        )}
        <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
      </div>
    </div>
  );
}
