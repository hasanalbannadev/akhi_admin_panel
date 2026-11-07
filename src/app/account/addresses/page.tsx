"use client";
import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { PageTitle } from "@/components/account/PageTitle";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/errors";
import type { Address, AddressIn } from "@/types";

// ঠিকানা: যোগ / এডিট / ডিলিট / ডিফল্ট
export default function AddressesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => authApi.addresses());
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (a: AddressIn) => {
    setBusy(true);
    try {
      if (editing && editing !== "new") await authApi.updateAddress(editing.id, a);
      else await authApi.addAddress(a);
      toast("ঠিকানা সংরক্ষিত হয়েছে");
      setEditing(null);
      await reload();
    } catch (e) { toast(errorMessage(e), "error"); }
    finally { setBusy(false); }
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast(msg); await reload(); } catch (e) { toast(errorMessage(e), "error"); }
  };

  return (
    <>
      <PageTitle title="ঠিকানা ব্যবস্থাপনা" />
      {editing ? (
        <div className="max-w-xl rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 font-bold">{editing === "new" ? "নতুন ঠিকানা" : "ঠিকানা এডিট"}</h2>
          <AddressForm initial={editing === "new" ? undefined : editing} defaultPhone={user?.phone} loading={busy} onSubmit={save} onCancel={() => setEditing(null)} />
        </div>
      ) : loading ? <PageLoader /> : (
        <>
          <Button className="mb-4" onClick={() => setEditing("new")}><Icon name="plus" className="h-4 w-4" /> নতুন ঠিকানা</Button>
          {!data?.length ? <EmptyState icon="pin" title="কোনো ঠিকানা নেই" text="দ্রুত চেকআউটের জন্য ঠিকানা সংরক্ষণ করুন।" /> : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.map((a) => (
                <li key={a.id} className="rounded-xl border border-line bg-white p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <b>{a.recipient_name}{a.label ? ` · ${a.label}` : ""}</b>
                    {a.is_default && <span className="rounded bg-brand-100 px-1.5 text-xs font-semibold text-brand-700">ডিফল্ট</span>}
                  </div>
                  <p className="text-muted">{a.phone}</p>
                  <p className="mt-1">{a.address_line}{a.area ? `, ${a.area}` : ""}, {a.district}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                    <button className="text-brand-600" onClick={() => setEditing(a)}>এডিট</button>
                    {!a.is_default && <button className="text-brand-600" onClick={() => run(() => authApi.makeDefault(a.id), "ডিফল্ট ঠিকানা বদলেছে")}>ডিফল্ট করুন</button>}
                    <button className="text-muted hover:text-red-600" onClick={() => confirm("ঠিকানাটি মুছবেন?") && run(() => authApi.deleteAddress(a.id), "ঠিকানা মুছে গেছে")}>মুছুন</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
