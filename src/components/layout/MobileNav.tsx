"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/format";

// মোবাইলের নিচের ট্যাব বার (স্ক্রিন 13 এর মতো)
export function MobileNav() {
  const path = usePathname();
  const { cart } = useCart();
  const tabs = [
    { href: "/", label: "হোম", icon: "home" },
    { href: "/categories", label: "ক্যাটাগরি", icon: "grid" },
    { href: "/cart", label: "কার্ট", icon: "bag", badge: cart.count },
    { href: "/account", label: "অ্যাকাউন্ট", icon: "user" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="মোবাইল নেভিগেশন">
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} className={cn("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-brand-600" : "text-muted")}>
                <span className="relative">
                  <Icon name={t.icon} className="h-6 w-6" />
                  {!!t.badge && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">{t.badge}</span>
                  )}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
