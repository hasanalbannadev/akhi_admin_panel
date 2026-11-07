import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import { LinkButton } from "@/components/ui/Button";
import type { Banner } from "@/types";

// admin panel এর "Promo" ব্যানার (পণ্যের সারির মাঝখানে)। ছবি দিলে পুরো ব্যানার, ছবি না দিলে লেখা + অফারের দাম + বোতাম।
export function PromoBanners({ banners }: { banners: Banner[] }) {
  return (
    <div className="space-y-2.5">
      {banners.map((b) => {
        const link = b.link_url || "/shop";
        if (b.image_url) {
          const img = <SmartImage src={b.image_url} alt={b.title || "অফার"} className="h-full w-full object-cover" />;
          return (
            <section key={b.id} className="overflow-hidden rounded-xl bg-brand-50">
              <div className="aspect-[16/6] sm:aspect-[21/5]">
                {link.startsWith("http") ? <a href={link} className="block h-full">{img}</a> : <Link href={link} className="block h-full">{img}</Link>}
              </div>
            </section>
          );
        }
        return (
          <section key={b.id} className="flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-brand-100 via-brand-50 to-white px-5 py-3 md:px-10">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-extrabold md:text-xl">{b.title}</h2>
              {b.subtitle && <p className="break-words text-sm font-bold text-brand-600 md:text-base">{b.subtitle}</p>}
            </div>
            <LinkButton href={link} size="sm" className="shrink-0">{b.button_text || "এখনই কিনুন"}</LinkButton>
          </section>
        );
      })}
    </div>
  );
}
