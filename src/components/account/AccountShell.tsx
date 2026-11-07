"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { Icon } from "@/components/ui/Icon";
import { PageLoader } from "@/components/ui/Spinner";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth();
  const path = usePathname();
  if (!ready) return <PageLoader />;
  const root = path === "/account";
  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <AccountMenu className="hidden self-start md:block" />
      <div className="min-w-0">
        {!root && (
          <Link href="/account" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted md:hidden">
            <Icon name="chevron-left" className="h-4 w-4" /> অ্যাকাউন্ট
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
