import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { catalogApi } from "@/lib/api/catalog";
import { safe } from "@/lib/api/safe";

export const metadata: Metadata = withOg({
  title: "সব ক্যাটাগরি",
  description: "Akhi Lifestyle এর সব পণ্য ক্যাটাগরি অনুযায়ী দেখুন।",
  alternates: { canonical: "/categories" },
});

export default async function CategoriesPage() {
  const cats = (await safe(catalogApi.categories(), [])).filter((c) => !c.parent_id);
  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "ক্যাটাগরি" }]} />
      <h1 className="mb-5 text-2xl font-bold">সব ক্যাটাগরি</h1>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cats.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.slug}`} className="block overflow-hidden rounded-xl border border-line bg-white text-center transition-shadow hover:shadow-md">
              <SmartImage src={c.image_url} alt={c.name} className="aspect-square w-full object-cover" />
              <span className="block p-3 font-semibold">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
