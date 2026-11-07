import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "লগইন", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className="py-6 md:py-12">
      <Suspense fallback={null}><LoginForm /></Suspense>
    </div>
  );
}
