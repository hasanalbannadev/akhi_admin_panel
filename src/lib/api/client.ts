// সব API call এই একটা ফাইল দিয়ে যায়।
// - Authorization header (লগইন থাকলে)
// - X-Cart-Token header (cart এর জন্য)
// - error handling
import { tokenStore } from "@/lib/auth-storage";
import { bump, busy } from "@/lib/store";
import { getCartToken } from "@/lib/cart-token";
import { shrinkForm } from "@/lib/compress";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
// ছবির জন্য: API_URL থেকে /api/v1 বাদ দিলে server এর মূল ঠিকানা (যেখানে /uploads আছে)
export const API_ORIGIN = API_URL.replace(/\/api\/v1$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  auth?: boolean;        // true হলে Bearer token যাবে
  cart?: boolean;        // true হলে X-Cart-Token যাবে
  revalidate?: number;   // server এ cache এর সময় (সেকেন্ড)। না দিলে cache হবে না।
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function readDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d.length) {
      const first = d[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
  }
  return fallback;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth, cart, revalidate, signal } = opts;
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const sendBody = isForm ? await shrinkForm(body as FormData) : body;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  if (cart) headers["X-Cart-Token"] = getCartToken();

  const init: RequestInit & { next?: { revalidate: number } } = {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : isForm ? (sendBody as FormData) : JSON.stringify(body),
  };
  if (typeof window === "undefined" && method === "GET" && revalidate) init.next = { revalidate };
  else init.cache = "no-store";

  let res: Response;
  const track = method !== "GET" && typeof window !== "undefined";
  if (track) busy(1);
  try {
    res = await fetch(buildUrl(path, query), init);
    if (track) setTimeout(() => busy(-1), 700);
  } catch {
    if (track) busy(-1);
    throw new ApiError("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট চেক করে আবার চেষ্টা করুন।", 0);
  }

  if (res.ok && method !== "GET" && typeof window !== "undefined") setTimeout(bump, 150);   // কিছু বদলেছে: খোলা সব স্ক্রিন নিজে আপডেট হবে
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try { data = await res.json(); } catch { /* body নেই */ }

  if (!res.ok) {
    if (res.status === 401 && auth && typeof window !== "undefined") {
      tokenStore.clear();
      window.dispatchEvent(new Event("akhi:unauthorized"));
    }
    throw new ApiError(readDetail(data, `Error ${res.status}`), res.status);
  }
  return data as T;
}
