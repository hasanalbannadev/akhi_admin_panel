import Link from "next/link";
import { cn } from "@/lib/format";

// Server-friendly pagination: প্রতিটা পেজ আলাদা লিংক (SEO ভালো)
export function Pagination({
  page, totalPages, makeHref,
}: { page: number; totalPages: number; makeHref: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let p = start; p <= Math.min(totalPages, start + 4); p++) pages.push(p);
  const item = "grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-medium";
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="pagination">
      {page > 1 && <Link href={makeHref(page - 1)} className={cn(item, "border-line hover:bg-brand-50")}>আগের</Link>}
      {pages.map((p) => (
        <Link key={p} href={makeHref(p)} aria-current={p === page ? "page" : undefined}
          className={cn(item, p === page ? "border-brand-600 bg-brand-600 text-white" : "border-line hover:bg-brand-50")}>
          {p}
        </Link>
      ))}
      {page < totalPages && <Link href={makeHref(page + 1)} className={cn(item, "border-line hover:bg-brand-50")}>পরের</Link>}
    </nav>
  );
}
