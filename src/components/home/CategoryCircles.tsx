import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Category } from "@/types";

// গোল ক্যাটাগরি আইকন সারি (ছবি Admin থেকে আসে)
export function CategoryCircles({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section aria-label="ক্যাটাগরি">
      <ul className="no-scrollbar flex gap-4 overflow-x-auto md:justify-center md:gap-6">
        {categories.slice(0, 10).map((c) => (
          <li key={c.id} className="shrink-0">
            <Link href={`/category/${c.slug}`} className="flex w-16 flex-col items-center gap-1 text-center md:w-20">
              <span className="h-9 w-9 overflow-hidden rounded-full border-2 border-brand-100 bg-brand-50 md:h-10 md:w-10">
                <SmartImage src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
              </span>
              <span className="text-xs font-medium leading-tight">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
