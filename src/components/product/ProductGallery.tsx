"use client";
import { useEffect, useMemo, useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { WishlistButton } from "./WishlistButton";
import { useColor } from "./ColorContext";
import { cn } from "@/lib/format";
import type { ProductImage } from "@/types";

// বড় ছবি ডানে, বামে ছোট থাম্বনেইল (মোবাইলেও পাশে)।
// কোনো রং বাছলে সেই রঙের ছবি আগে আসে, আর প্রথমটা বড় ছবির জায়গায় বসে।
export function ProductGallery({ images, name, productId }: { images: ProductImage[]; name: string; productId: number }) {
  const { color } = useColor();
  const list = useMemo(() => {
    const own = (color?.images ?? []).map((url, i) => ({ id: -(i + 1), url, sort_order: i }));
    const seen = new Set(own.map((i) => i.url));
    const rest = images.filter((im) => !seen.has(im.url));
    const all: ProductImage[] = [...own, ...rest];
    return all.length ? all : [{ id: 0, url: "", sort_order: 0 }];
  }, [images, color]);
  const [active, setActive] = useState(0);
  useEffect(() => { setActive(0); }, [color?.id]); // রং বদলালে ওই রঙের প্রথম ছবি বড় ছবি হবে
  const cur = list[Math.min(active, list.length - 1)];

  return (
    <div className="flex flex-row-reverse gap-2.5 sm:gap-3">
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-brand-50/50">
        <SmartImage key={cur?.url} src={cur?.url} alt={name} priority className="aspect-square w-full object-cover" />
        <WishlistButton productId={productId} className="absolute right-3 top-3 h-10 w-10" />
      </div>
      {list.length > 1 && (
        <div className="no-scrollbar flex max-h-[26rem] w-14 shrink-0 flex-col gap-2 overflow-y-auto sm:w-20">
          {list.map((im, i) => (
            <button key={`${im.id}-${im.url}`} onClick={() => setActive(i)} aria-label={`ছবি ${i + 1}`}
              className={cn("aspect-square w-full shrink-0 overflow-hidden rounded-lg border-2", i === active ? "border-brand-600" : "border-line")}>
              <SmartImage src={im.url} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
