import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-lg font-bold md:text-xl">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-sm font-semibold text-brand-600 hover:underline">
          সব দেখুন <Icon name="chevron-right" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
