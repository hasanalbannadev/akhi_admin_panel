import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductListing, type SP } from "@/components/product/ProductListing";
import { catalogApi } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

async function getCategory(slug: string) {
  try { return await catalogApi.categoryDetail(slug); }
  catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { category } = await catalogApi.categoryDetail(slug);
    return withOg({
      title: category.name,
      description: `${SITE.name} এর ${category.name} কালেকশন দেখুন। সেরা দামে, সারা বাংলাদেশে ডেলিভারি।`,
      alternates: { canonical: `/category/${slug}` },
    });
  } catch {
    return withOg({ title: "ক্যাটাগরি", alternates: { canonical: `/category/${slug}` } });
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { category, children, parent } = await getCategory(slug);

  return (
    <>
      <Breadcrumb items={[
        { label: "হোম", href: "/" },
        ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
        { label: category.name },
      ]} />
      <h1 className="mb-3 text-2xl font-bold">{category.name}</h1>
      {children.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-brand-300 hover:bg-brand-50">{c.name}</Link>
          ))}
        </div>
      )}
      <ProductListing basePath={`/category/${slug}`} categorySlug={slug} sp={sp} />
    </>
  );
}
