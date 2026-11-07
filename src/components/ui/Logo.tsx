import Link from "next/link";
import { SITE } from "@/lib/site";

// লোগো (ফন্ট script)। নিজের লোগো ছবি চাইলে এখানে <img> বসিয়ে দিন।
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 flex-col whitespace-nowrap leading-none" aria-label={`${SITE.name} হোম`}>
      <span className={`font-script text-[24px] font-bold sm:text-[28px] ${light ? "text-white" : "text-brand-600"}`}>{SITE.name}</span>
      <span className={`mt-0.5 text-[10px] tracking-wide ${light ? "text-white/70" : "text-muted"}`}>{SITE.tagline}</span>
    </Link>
  );
}
