"use client";
import { useRef, useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { reviewsApi } from "@/lib/api/reviews";
import { imageUrl } from "@/lib/image";
import { errorMessage } from "@/lib/errors";


// রিভিউয়ের ছবি আপলোড (সর্বোচ্চ ৪টা)। ছবি বাদ দিলে সার্ভার থেকেও মুছে যায় (সেভ না করা হলে)।
type Up = (f: File) => Promise<{ url: string }>;
export function ReviewPhotos({ value, saved = [], onChange, max = 4, upload = reviewsApi.upload, discard = reviewsApi.discard }: {
  value: string[]; saved?: string[]; onChange: (v: string[]) => void; max?: number; upload?: Up; discard?: (u: string) => Promise<unknown>;
}) {
  const MAX = max;
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX - value.length);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const next = [...value];
    for (const f of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast("শুধু JPG, PNG বা WEBP ছবি দিন", "error"); continue; }
      try { next.push((await upload(f)).url); }
      catch (err) { toast(errorMessage(err), "error"); }
    }
    onChange(next);
    setBusy(false);
  };

  const remove = (u: string) => {
    onChange(value.filter((x) => x !== u));
    if (!saved.includes(u)) discard(u).catch(() => {});   // সেভ হয়নি এমন ছবি সার্ভার থেকে মুছে ফেলা
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((u) => (
          <div key={u} className="relative h-16 w-16 overflow-hidden rounded-lg border border-line">
            <SmartImage src={u} alt="রিভিউয়ের ছবি" className="h-full w-full object-cover" />
            <button type="button" aria-label="ছবি মুছুন" onClick={() => remove(u)}
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white">
              <Icon name="x" className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < MAX && (
          <button type="button" onClick={() => ref.current?.click()} disabled={busy}
            className="grid h-16 w-16 place-items-center rounded-lg border-2 border-dashed border-line text-center text-[11px] leading-tight text-muted hover:border-brand-300 disabled:opacity-50">
            {busy ? "আপলোড…" : <span>+ ছবি<br />যোগ করুন</span>}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pick} />
      <p className="mt-1 text-xs text-muted">সর্বোচ্চ {MAX}টি ছবি (JPG, PNG বা WEBP)।</p>
    </div>
  );
}

// রিভিউয়ের ছবির ছোট গ্যালারি (ক্লিক করলে বড় ছবি নতুন ট্যাবে)
export function ReviewGallery({ images }: { images?: string[] }) {
  if (!images?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((u) => (
        <a key={u} href={imageUrl(u)} target="_blank" rel="noopener noreferrer" className="h-16 w-16 overflow-hidden rounded-lg border border-line">
          <SmartImage src={u} alt="রিভিউয়ের ছবি" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}
