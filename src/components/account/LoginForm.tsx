"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/errors";
import { isValidBdPhone } from "@/lib/format";

// শুধু নিজের সাইটের পাথে redirect করা যাবে (নিরাপত্তার জন্য)
export const safeNext = (n: string | null | undefined, fallback = "/account") =>
  n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;

interface Props {
  redirect?: boolean;                 // true হলে লগইনের পর ?next= এ যাবে
  onSuccess?: () => void;
  title?: string;
}

// ফোন নম্বর -> OTP কোড -> লগইন (পাসওয়ার্ড লাগে না, নতুন হলে অ্যাকাউন্ট নিজে তৈরি হয়)
export function LoginForm({ redirect = true, onSuccess, title = "লগইন / সাইন আপ" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [debug, setDebug] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!isValidBdPhone(phone)) { setError("সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)"); return; }
    setBusy(true);
    try {
      const r = await authApi.sendOtp(phone);
      setDebug(r.debug_code || "");
      setStep("code");
      setWait(60);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) { setError("৬ ডিজিটের কোড দিন"); return; }
    setBusy(true);
    try {
      await login(phone, code);
      onSuccess?.();
      if (redirect) router.replace(safeNext(params.get("next")));
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h1 className="text-center text-2xl font-bold">{title}</h1>
      <p className="mb-5 mt-1 text-center text-sm text-muted">মোবাইল নম্বরে আসা কোড দিয়ে ঢুকুন, পাসওয়ার্ড লাগবে না।</p>

      {step === "phone" ? (
        <form onSubmit={send} className="space-y-4">
          <Input label="মোবাইল নম্বর" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX"
            value={phone} onChange={(e) => setPhone(e.target.value)} error={error} autoFocus />
          <Button type="submit" size="lg" className="w-full" loading={busy}>কোড পাঠান</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-center text-sm">কোড পাঠানো হয়েছে <b>{phone}</b> নম্বরে</p>
          <Input label="৬ ডিজিটের কোড" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} error={error} autoFocus
            className="text-center text-xl tracking-[0.5em]" />
          {debug && <p className="rounded-md bg-amber-50 p-2 text-center text-xs text-amber-800">ডেভেলপমেন্ট কোড: {debug}</p>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>লগইন করুন</Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="text-muted hover:text-ink" onClick={() => { setStep("phone"); setCode(""); setError(""); }}>নম্বর বদলান</button>
            <button type="button" disabled={wait > 0 || busy} onClick={() => send()} className="font-semibold text-brand-600 disabled:text-muted">
              {wait > 0 ? `আবার পাঠান (${wait}s)` : "আবার কোড পাঠান"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
