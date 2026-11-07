"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { ChatComposer } from "./ChatComposer";
import { ReviewGallery, ReviewPhotos } from "@/components/product/ReviewPhotos";
import { useToast } from "@/context/ToastContext";
import { supportApi } from "@/lib/api/support";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { SupportMsg } from "@/types";

// আমাদের সাথে সরাসরি মেসেজ। ছবি দেওয়া যায় (সর্বোচ্চ ৩টা)। নিজের মেসেজ এডিট করা যায়, মোছা যায় না।
export function SupportChat() {
  const toast = useToast();
  const [msgs, setMsgs] = useState<SupportMsg[] | null>(null);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<SupportMsg | null>(null);
  const [eText, setEText] = useState("");
  const [ePhotos, setEPhotos] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  const lastId = useRef(0);
  const load = useCallback(async () => {
    try {
      const all = await supportApi.list();
      lastId.current = all.length ? all[all.length - 1].id : 0;
      setMsgs(all);
      window.dispatchEvent(new Event("support-seen"));
    } catch { setMsgs((m) => m ?? []); }
  }, []);
  // নতুন মেসেজ প্রতি ৩ সেকেন্ডে (শুধু নতুনগুলো আনে, তাই হালকা); পুরো তালিকা ২০ সেকেন্ডে একবার (মোছা/এডিট ধরতে)
  const fresh = useCallback(async () => {
    try {
      const add = await supportApi.list(lastId.current || undefined);
      if (!add.length) return;
      lastId.current = add[add.length - 1].id;
      setMsgs((m) => { const have = new Set((m ?? []).map((x) => x.id)); return [...(m ?? []), ...add.filter((x) => !have.has(x.id))]; });
      window.dispatchEvent(new Event("support-seen"));
    } catch { /* next tick */ }
  }, []);
  useEffect(() => {
    load();
    let n = 0;
    const t = setInterval(() => { if (document.hidden) return; n += 1; if (n % 20 === 0) load(); else fresh(); }, 1000);
    const vis = () => { if (!document.hidden) fresh(); };
    document.addEventListener("visibilitychange", vis);
    const rt = () => { fresh(); };
    window.addEventListener("rt-push", rt);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); window.removeEventListener("rt-push", rt); };
  }, [load, fresh]);
  useEffect(() => {
    if (msgs === null) return;
    if (first.current) { first.current = false; return; }
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msgs?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!text.trim() && !photos.length) return;
    setBusy(true);
    try { await supportApi.send(text.trim(), photos); setText(""); setPhotos([]); await load(); }
    catch (err) { toast(errorMessage(err), "error"); }
    finally { setBusy(false); }
  };
  const startEdit = (m: SupportMsg) => { setEditing(m); setEText(m.text ?? ""); setEPhotos(m.images); };
  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try { await supportApi.edit(editing.id, eText.trim(), ePhotos); setEditing(null); await load(); toast("মেসেজ আপডেট হয়েছে"); }
    catch (err) { toast(errorMessage(err), "error"); }
    finally { setBusy(false); }
  };

  return (
    <section className="mb-5 rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-bold">আমাদের মেসেজ করুন</h2>
        <p className="text-xs text-muted">আপনার প্রশ্ন বা সমস্যা লিখুন, ছবিও দিতে পারেন। আমরা এখানেই উত্তর দেব।</p>
      </div>
      <div className="max-h-[55vh] min-h-32 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {msgs === null ? <p className="text-center text-sm text-muted">লোড হচ্ছে…</p>
          : msgs.length === 0 ? <p className="text-center text-sm text-muted">এখনো কোনো মেসেজ নেই।</p>
          : msgs.map((m) => {
            const mine = m.sender === "customer";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "bg-brand-50 text-ink"}`}>
                  {!mine && <p className="mb-0.5 text-xs font-bold text-brand-600">Akhi Lifestyle</p>}
                  {editing?.id === m.id ? (
                    <div className="space-y-2 text-ink">
                      <Textarea value={eText} onChange={(e) => setEText(e.target.value)} maxLength={1500} />
                      <ReviewPhotos value={ePhotos} saved={m.images} max={3} onChange={setEPhotos} upload={supportApi.upload} discard={supportApi.discard} />
                      <div className="flex gap-2">
                        <Button size="sm" loading={busy} onClick={saveEdit}>সংরক্ষণ</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                      <ReviewGallery images={m.images} />
                      <p className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-muted"}`}>
                        {formatDate(m.created_at)}{m.edited ? " · এডিটেড" : ""}
                        {mine && <button type="button" className="ml-2 underline" onClick={() => startEdit(m)}>এডিট</button>}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        <div ref={endRef} />
      </div>
      <ChatComposer text={text} onText={setText} photos={photos} onPhotos={setPhotos} busy={busy} onSend={() => send()}
        upload={supportApi.upload} discard={supportApi.discard} />
    </section>
  );
}
