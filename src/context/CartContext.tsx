"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cartApi } from "@/lib/api/cart";
import { errorMessage } from "@/lib/errors";
import { useToast } from "./ToastContext";
import type { CartView } from "@/types";

const EMPTY: CartView = { items: [], subtotal: 0, count: 0 };

interface CartCtx {
  cart: CartView;
  loading: boolean;
  busyId: string | null;                      // কোন সারিতে কাজ চলছে ("পণ্য:রং")
  add: (productId: number, qty?: number, colorId?: number | null) => Promise<boolean>;
  setQty: (productId: number, qty: number, colorId?: number) => Promise<void>;
  remove: (productId: number, colorId?: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [cart, setCart] = useState<CartView>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try { setCart(await cartApi.get()); } catch { /* backend বন্ধ থাকলে খালি কার্ট */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // অন্য ট্যাবে কার্ট বদলালে, এই ট্যাবে ফিরলে হালকা GET /cart/count দিয়ে মিলিয়ে নিই
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const { count } = await cartApi.count();
        if (count !== cart.count) await refresh();
      } catch { /* ignore */ }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [cart.count, refresh]);

  // সব কার্ট অ্যাকশন একই নিয়মে: loading দেখাও -> API call -> state বসাও -> error হলে toast
  const run = useCallback(async (id: string | null, fn: () => Promise<CartView>, okMsg?: string) => {
    setBusyId(id);
    try {
      setCart(await fn());
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) {
      toast(errorMessage(e), "error");
      return false;
    } finally {
      setBusyId(null);
    }
  }, [toast]);

  const add = (id: number, qty = 1, colorId?: number | null) =>
    run(`${id}:${colorId ?? 0}`, () => cartApi.add(id, qty, colorId), "কার্টে যোগ হয়েছে");
  const setQty = async (id: number, qty: number, colorId = 0) => { await run(`${id}:${colorId}`, () => cartApi.setQty(id, qty, colorId)); };
  const remove = async (id: number, colorId = 0) => { await run(`${id}:${colorId}`, () => cartApi.remove(id, colorId), "কার্ট থেকে সরানো হয়েছে"); };
  const clear = async () => { await run(null, () => cartApi.clear()); };

  return <Ctx.Provider value={{ cart, loading, busyId, add, setQty, remove, clear, refresh }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
