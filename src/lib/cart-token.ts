// Guest cart এর জন্য browser এ একটা UUID রাখা হয়, যেটা X-Cart-Token header এ যায়।
import { safeStorage } from "@/lib/safe-storage";
const KEY = "akhi_cart_token";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "t" + Math.random().toString(36).slice(2) + Date.now().toString(36) + "xxxxxxxx";
}

export function getCartToken(): string {
  if (typeof window === "undefined") return "";
  let t = safeStorage.get(KEY);
  if (!t || t.length < 16) {
    t = makeId();
    safeStorage.set(KEY, t);
  }
  return t;
}
