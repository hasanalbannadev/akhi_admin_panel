"use client";
import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import type { Address, AddressIn } from "@/types";

interface Props {
  addresses: Address[];
  selectedId: number | null;
  userPhone: string;
  onSelect: (id: number) => void;
  onAdded: (a: Address) => void;
}

// চেকআউটে সেভ করা ঠিকানা বাছাই বা নতুন ঠিকানা যোগ
export function AddressPicker({ addresses, selectedId, userPhone, onSelect, onAdded }: Props) {
  const toast = useToast();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [busy, setBusy] = useState(false);

  const save = async (a: AddressIn) => {
    setBusy(true);
    try {
      const created = await authApi.addAddress(a);
      onAdded(created);
      setAdding(false);
    } catch (e) { toast(errorMessage(e), "error"); }
    finally { setBusy(false); }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 text-lg font-bold">ডেলিভারি ঠিকানা</h2>
      {addresses.length > 0 && (
        <ul className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="min-w-0">
              <button type="button" onClick={() => onSelect(a.id)} aria-pressed={selectedId === a.id}
                className={cn("w-full rounded-xl border-2 p-3.5 text-left text-sm transition-colors",
                  selectedId === a.id ? "border-brand-600 bg-brand-50/60" : "border-line hover:border-brand-200")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{a.recipient_name}{a.label ? ` · ${a.label}` : ""}</span>
                  {selectedId === a.id && <Icon name="check-circle" className="h-5 w-5 text-brand-600" />}
                </div>
                <p className="text-muted">{a.phone}</p>
                <p className="mt-1 break-words">{a.address_line}{a.area ? `, ${a.area}` : ""}, {a.district}</p>
                {a.is_default && <span className="mt-1.5 inline-block rounded bg-brand-100 px-1.5 text-xs font-semibold text-brand-700">ডিফল্ট</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="rounded-xl bg-brand-50/40 p-4">
          <AddressForm defaultPhone={userPhone} submitLabel="ঠিকানা সংরক্ষণ করুন" loading={busy} onSubmit={save}
            onCancel={addresses.length ? () => setAdding(false) : undefined} />
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Icon name="plus" className="h-4 w-4" /> নতুন ঠিকানা</Button>
      )}
    </section>
  );
}
