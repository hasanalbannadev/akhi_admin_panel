"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStore } from "@/lib/auth-storage";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null;
  ready: boolean;                       // শুরুতে টোকেন চেক শেষ হয়েছে কিনা
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // পেজ খুললে টোকেন থাকলে প্রোফাইল আনি
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!tokenStore.get()) { setReady(true); return; }
      try {
        const me = await authApi.me();
        if (alive) setUser(me);
      } catch { /* 401 হলে client নিজেই টোকেন মুছে দেয় */ }
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  // কোনো API 401 দিলে আমরা logged out করে দিই
  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener("akhi:unauthorized", h);
    return () => window.removeEventListener("akhi:unauthorized", h);
  }, []);

  const login = useCallback(async (phone: string, code: string) => {
    const t = await authApi.verifyOtp(phone, code);
    tokenStore.set(t.access_token);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, logout, setUser }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
