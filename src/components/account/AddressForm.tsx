"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { DISTRICTS } from "@/lib/districts";
import { isValidBdPhone } from "@/lib/format";
import type { AddressIn } from "@/types";

interface Props {
  initial?: Partial<AddressIn>;
  defaultPhone?: string;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (a: AddressIn) => void | Promise<void>;
  onCancel?: () => void;
}

// ঠিকানা যোগ/এডিট ফর্ম (চেকআউট ও অ্যাকাউন্ট দুই জায়গায় ব্যবহার হয়)
export function AddressForm({ initial, defaultPhone = "", submitLabel = "সংরক্ষণ করুন", loading, onSubmit, onCancel }: Props) {
  const [f, setF] = useState<AddressIn>({
    label: initial?.label ?? "",
    recipient_name: initial?.recipient_name ?? "",
    phone: initial?.phone ?? defaultPhone,
    district: initial?.district ?? "Dhaka",
    area: initial?.area ?? "",
    address_line: initial?.address_line ?? "",
    is_default: initial?.is_default ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof AddressIn>(k: K, v: AddressIn[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.recipient_name.trim()) er.recipient_name = "নাম দিন";
    if (!isValidBdPhone(f.phone)) er.phone = "সঠিক মোবাইল নম্বর দিন";
    if (!f.address_line.trim()) er.address_line = "ঠিকানা লিখুন";
    setErrors(er);
    if (Object.keys(er).length) return;
    onSubmit({ ...f, label: f.label?.trim() || null, area: f.area?.trim() || null });
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input label="প্রাপকের নাম" value={f.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} error={errors.recipient_name} />
        <Input label="মোবাইল নম্বর" type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        <Select label="জেলা" value={f.district} onChange={(e) => set("district", e.target.value)}>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Input label="এলাকা / থানা" value={f.area ?? ""} onChange={(e) => set("area", e.target.value)} placeholder="যেমন: মিরপুর" />
      </div>
      <Textarea label="পূর্ণ ঠিকানা" value={f.address_line} onChange={(e) => set("address_line", e.target.value)} error={errors.address_line} placeholder="বাড়ি, রোড, ফ্ল্যাট নম্বর..." />
      <Input label="ঠিকানার নাম (ঐচ্ছিক)" value={f.label ?? ""} onChange={(e) => set("label", e.target.value)} placeholder="বাসা / অফিস" maxLength={40} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.is_default} onChange={(e) => set("is_default", e.target.checked)} />
        ডিফল্ট ঠিকানা হিসেবে রাখুন
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>বাতিল</Button>}
      </div>
    </form>
  );
}
