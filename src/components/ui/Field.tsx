import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

const base =
  "w-full rounded-lg border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/60 " +
  "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Wrap({ label, error, hint, children }: { label?: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-brand-600">{error}</span>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string }
export function Input({ label, error, hint, className, ...rest }: InputProps) {
  return (
    <Wrap label={label} error={error} hint={hint}>
      <input className={cn(base, "h-11", error && "border-brand-400", className)} {...rest} />
    </Wrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string }
export function Select({ label, error, className, children, ...rest }: SelectProps) {
  return (
    <Wrap label={label} error={error}>
      <select className={cn(base, "h-11", className)} {...rest}>{children}</select>
    </Wrap>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }
export function Textarea({ label, error, className, ...rest }: TextareaProps) {
  return (
    <Wrap label={label} error={error}>
      <textarea className={cn(base, "min-h-24 py-2.5", className)} {...rest} />
    </Wrap>
  );
}
