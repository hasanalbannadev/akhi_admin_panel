"use client";
import { useEffect, type ReactNode } from "react";
import { startRealtime } from "@/lib/realtime";
import { tokenStore } from "@/lib/auth-storage";
import { useAuth } from "./AuthContext";
import { useBusy } from "@/lib/store";
import { InAppBanner } from "@/components/layout/InAppBanner";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";

function Realtime() {
  const { user } = useAuth();
  const id = user ? (user as { id?: number }).id ?? 1 : 0;
  useEffect(() => (id ? startRealtime(() => tokenStore.get()) : undefined), [id]);
  return null;
}

function TopBar() {
  const on = useBusy();
  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden bg-brand-100">
      <div className="h-full w-1/3 animate-[topbar_0.9s_ease-in-out_infinite] bg-brand-600" />
    </div>
  );
}

// সব context এক জায়গায় জড়ো করা (layout.tsx এ একবারই বসানো)
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider><Realtime /><TopBar /><InAppBanner />{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
