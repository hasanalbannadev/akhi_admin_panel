import { API_ORIGIN } from "@/lib/api/client";

// ছবি না থাকলে/লোড না হলে এই প্লেসহোল্ডার দেখাবে
export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='#FDEEF3'/><g fill='none' stroke='#E8A6BC' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'><path d='M140 170h120l14 120H126z'/><path d='M168 170v-14a32 32 0 0 1 64 0v14'/></g></svg>`,
  );

// Backend যদি ভুল করে localhost/127.0.0.1 দিয়ে ছবির url সেভ করে (PUBLIC_API_URL ঠিক না থাকলে),
// তাহলে আমরা সেই অংশটা আসল API server দিয়ে বদলে দিই। তাই পুরনো ছবিও দেখা যায়।
const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(?=\/)/i;

export function imageUrl(u?: string | null): string {
  if (!u) return PLACEHOLDER;
  if (u.startsWith("data:")) return u;
  // যেকোনো host দিয়ে সেভ হওয়া /uploads/... ছবি (localhost, api.example.com ইত্যাদি) আসল API server দিয়ে দেখাই
  const up = u.match(/^(?:https?:)?\/\/[^/]+(\/uploads\/.+)$/i);
  if (up) return API_ORIGIN + up[1];
  if (LOCAL_HOST.test(u)) return u.replace(LOCAL_HOST, API_ORIGIN);
  if (/^(https?:)?\/\//.test(u)) return u;
  return API_ORIGIN + (u.startsWith("/") ? u : "/" + u);
}
