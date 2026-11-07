import { LinkButton } from "@/components/ui/Button";

// "Exclusive Deals" প্রোমো ব্যানার। লেখা বদলাতে চাইলে এই ফাইলে বদলান।
export function PromoBanner() {
  return (
    <section className="flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-brand-100 via-brand-50 to-white px-5 py-3 md:px-10">
      <div>
        <h2 className="text-lg font-extrabold md:text-xl">এক্সক্লুসিভ ডিল</h2>
        <p className="text-sm font-bold text-brand-600 md:text-base">৫০% পর্যন্ত ছাড়!</p>
        <p className="mt-0.5 hidden max-w-md text-xs text-muted md:block">প্রিয় পণ্যগুলো এখন আরও কম দামে। সীমিত সময়ের অফার।</p>
      </div>
      <LinkButton href="/shop?sort=price_asc" size="sm" className="shrink-0">এখনই কিনুন</LinkButton>
    </section>
  );
}
