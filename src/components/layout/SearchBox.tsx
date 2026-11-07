"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { catalogApi } from "@/lib/api/catalog";
import { Icon } from "@/components/ui/Icon";
import type { Suggestion } from "@/types";

// সার্চ বক্স: টাইপ করলে /search/suggest থেকে সাজেশন, Enter দিলে /shop?q=
export function SearchBox({ className = "", big = false }: { className?: string; big?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [list, setList] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setList([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try { setList(await catalogApi.suggest(q.trim(), ctrl.signal)); setOpen(true); } catch { /* ignore */ }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => list.length && setOpen(true)}
          placeholder="কী খুঁজছেন?"
          aria-label="পণ্য খুঁজুন"
          className={`w-full rounded-full border border-line bg-white pl-5 text-[15px] shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 ${big ? "h-12 pr-28" : "h-11 pr-12"}`}
        />
        {big ? (
          <button type="submit" aria-label="সার্চ" className="absolute right-1.5 top-1.5 flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
            <Icon name="search" className="h-4 w-4" />সার্চ
          </button>
        ) : (
          <button type="submit" aria-label="সার্চ" className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white">
            <Icon name="search" className="h-4 w-4" />
          </button>
        )}
      </form>
      {open && list.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {list.map((s) => (
            <li key={s.slug}>
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                onClick={() => { setOpen(false); setQ(""); router.push(`/product/${s.slug}`); }}
              >
                <Icon name="search" className="h-4 w-4 text-muted" /> {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
