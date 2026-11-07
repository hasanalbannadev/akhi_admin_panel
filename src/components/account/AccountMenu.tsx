"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { ACCOUNT_MENU } from "@/lib/constants";
import { cn } from "@/lib/format";

// অ্যাকাউন্ট মেনু: ডেস্কটপে বাম সাইডবার, মোবাইলে /account পেজে পুরো লিস্ট (স্ক্রিন 8)
export function AccountMenu({ className = "" }: { className?: string }) {
  const path = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  return (
    <nav className={cn("overflow-hidden rounded-2xl border border-line bg-white", className)} aria-label="অ্যাকাউন্ট মেনু">
      <ul className="divide-y divide-line">
        {ACCOUNT_MENU.map((m) => {
          const active = m.href === "/account" ? path === "/account" : path.startsWith(m.href);
          return (
            <li key={m.href}>
              <Link href={m.href} className={cn("flex items-center gap-3 px-4 py-3.5 text-[15px] hover:bg-brand-50", active && "bg-brand-50 font-semibold text-brand-600")}>
                <Icon name={m.icon} className="h-5 w-5" />
                <span className="flex-1">{m.label}</span>
                <Icon name="chevron-right" className="h-4 w-4 text-muted" />
              </Link>
            </li>
          );
        })}
        <li>
          <button onClick={() => { logout(); router.push("/"); }} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-brand-600 hover:bg-brand-50">
            <Icon name="logout" className="h-5 w-5" /> লগ আউট
          </button>
        </li>
      </ul>
    </nav>
  );
}
