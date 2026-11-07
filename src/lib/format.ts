// দাম, তারিখ ইত্যাদি সাজানোর ছোট ফাংশন

export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export const taka = (n: number | null | undefined) =>
  "৳" + Math.round(Number(n || 0)).toLocaleString("en-US");

export function discountPercent(price: number, compare: number | null): number {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

// ফোন নম্বর ঠিক আছে কিনা (01XXXXXXXXX / +8801XXXXXXXXX)
export function isValidBdPhone(raw: string): boolean {
  const p = raw.replace(/[\s-]/g, "").replace(/^\+88/, "").replace(/^88(?=01)/, "");
  return /^01[3-9]\d{8}$/.test(p);
}

export const stripHtml = (s: string | null | undefined, max = 160) =>
  (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
