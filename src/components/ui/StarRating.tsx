"use client";
import { Icon } from "./Icon";

// দেখানোর জন্য (readonly) অথবা ক্লিক করে রেটিং দেওয়ার জন্য (onChange দিলে)
export function StarRating({
  value, onChange, size = "h-4 w-4",
}: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value);
        const star = <Icon name="star" className={`${size} ${on ? "text-amber-400" : "text-gray-300"}`} filled={on} strokeWidth={1.4} />;
        return onChange ? (
          <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} স্টার`}>{star}</button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </span>
  );
}
