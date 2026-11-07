"use client";
import { useRef, useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { AccountMenu } from "@/components/account/AccountMenu";
import { PageTitle } from "@/components/account/PageTitle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/errors";

// প্রোফাইল: নাম ও ইমেইল এডিট (PATCH /me)
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [picBusy, setPicBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // প্রোফাইল ছবি আপলোড / বদলানো / মুছে ফেলা
  const setPic = async (url: string | null) => {
    setPicBusy(true);
    try { setUser(await authApi.updateMe({ avatar_url: url ?? "" })); toast(url ? "প্রোফাইল ছবি আপডেট হয়েছে" : "প্রোফাইল ছবি মুছে ফেলা হয়েছে"); }
    catch (err) { toast(errorMessage(err), "error"); }
    finally { setPicBusy(false); }
  };
  const pickPic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast("শুধু JPG, PNG বা WEBP ছবি দিন", "error"); return; }
    setPicBusy(true);
    try { const { url } = await authApi.uploadAvatar(f); await setPic(url); }
    catch (err) { toast(errorMessage(err), "error"); setPicBusy(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(await authApi.updateMe({ name: name.trim() || null, email: email.trim() || null }));
      toast("প্রোফাইল আপডেট হয়েছে");
    } catch (err) { toast(errorMessage(err), "error"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={picBusy} aria-label="প্রোফাইল ছবি বদলান"
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-600 disabled:opacity-60">
          {user?.avatar_url ? <SmartImage key={user.avatar_url} src={user.avatar_url} alt="প্রোফাইল ছবি" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center">{(user?.name || "A").charAt(0).toUpperCase()}</span>}
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-medium text-white">{picBusy ? "…" : "বদলান"}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPic} />
        <div className="min-w-0">
          <p className="break-words text-lg font-bold">{user?.name || "আপনার নাম যোগ করুন"}</p>
          <p className="text-sm text-muted">{user?.phone}</p>
          <div className="mt-1 flex gap-3 text-xs">
            <button type="button" className="font-semibold text-brand-600" onClick={() => fileRef.current?.click()} disabled={picBusy}>{user?.avatar_url ? "ছবি বদলান" : "ছবি যোগ করুন"}</button>
            {user?.avatar_url && <button type="button" className="text-muted underline" onClick={() => setPic(null)} disabled={picBusy}>মুছুন</button>}
          </div>
        </div>
      </div>

      <AccountMenu className="mb-5 md:hidden" />

      <PageTitle title="আমার প্রোফাইল" />
      <form onSubmit={save} className="max-w-lg space-y-4 rounded-2xl border border-line bg-white p-5">
        <Input label="মোবাইল নম্বর" value={user?.phone ?? ""} disabled readOnly hint="নম্বর বদলানো যায় না" />
        <Input label="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="ইমেইল (ঐচ্ছিক)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" loading={busy}>সংরক্ষণ করুন</Button>
      </form>
    </>
  );
}
