"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { wishlistApi } from "@/lib/api/wishlist";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface WishCtx {
  ids: Set<number>;
  has: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
  reload: () => Promise<void>;
}
const Ctx = createContext<WishCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<Set<number>>(new Set());

  const reload = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    try {
      const list = await wishlistApi.list();
      setIds(new Set(list.map((p) => p.id)));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = useCallback(async (id: number) => {
    if (!user) {
      toast("পছন্দের তালিকায় রাখতে আগে লগইন করুন", "info");
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    const had = ids.has(id);
    // আগে UI বদলাই (দ্রুত লাগে), error হলে ফিরিয়ে আনি
    setIds((s) => { const n = new Set(s); if (had) n.delete(id); else n.add(id); return n; });
    try {
      if (had) await wishlistApi.remove(id); else await wishlistApi.add(id);
      toast(had ? "পছন্দের তালিকা থেকে সরানো হয়েছে" : "পছন্দের তালিকায় যোগ হয়েছে");
    } catch (e) {
      setIds((s) => { const n = new Set(s); if (had) n.add(id); else n.delete(id); return n; });
      toast(errorMessage(e), "error");
    }
  }, [user, ids, toast, router, pathname]);

  return <Ctx.Provider value={{ ids, has: (id) => ids.has(id), toggle, reload }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be inside WishlistProvider");
  return c;
}
