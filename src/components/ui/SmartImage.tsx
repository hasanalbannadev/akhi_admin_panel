"use client";
import { useEffect, useState } from "react";
import { imageUrl, PLACEHOLDER } from "@/lib/image";

// ছবি লোড না হলে প্লেসহোল্ডার দেখায়। Backend এর /uploads/.. relative url ও ঠিক করে।
export function SmartImage({
  src, alt, className, priority = false,
}: { src?: string | null; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);   // নতুন ছবি দিলে আগের ব্যর্থতা মনে রাখি না
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? PLACEHOLDER : imageUrl(src)}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
