// লগইন টোকেন browser এ রাখা হয় (ইন-অ্যাপ ব্রাউজারেও চলে, safe-storage দেখুন)।
import { safeStorage } from "@/lib/safe-storage";
const KEY = "akhi_token";

export const tokenStore = {
  get(): string | null { return safeStorage.get(KEY); },
  set(token: string) { safeStorage.set(KEY, token); },
  clear() { safeStorage.remove(KEY); },
};
