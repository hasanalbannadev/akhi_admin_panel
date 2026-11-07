"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// প্রাইভেট পেজে ব্যবহার করুন: লগইন না থাকলে /login এ পাঠায়
export function useRequireAuth() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
  }, [ready, user, router, pathname]);
  return { user, ready: ready && !!user };
}
