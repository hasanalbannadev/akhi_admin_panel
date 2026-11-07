import Link from "next/link";
import { Icon } from "./Icon";
import { cn } from "@/lib/format";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1 overflow-hidden text-sm text-muted md:mb-4">
      {items.map((it, i) => (
        <span key={i} className={cn("flex items-center gap-1", i === items.length - 1 ? "min-w-0" : "shrink-0")}>
          {i > 0 && <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0" />}
          {it.href ? <Link href={it.href} className="whitespace-nowrap hover:text-brand-600">{it.label}</Link> : <span className="truncate text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
