import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";

// অ্যাকাউন্টের সব পেজ noindex (Google এ আসবে না)
export const metadata: Metadata = { title: "আমার অ্যাকাউন্ট", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
