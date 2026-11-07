// WebSocket push: server বার্তা পাঠালেই "rt-push" event আসে → chat সাথে সাথে আপডেট (0 সেকেন্ড)।
// WebSocket না চললে আগের মতো ১ সেকেন্ডের polling চলতে থাকে (কিছু ভাঙে না)।
import { API_URL } from "@/lib/api/client";
import { bump } from "@/lib/store";

export function startRealtime(getToken: () => string | null): () => void {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") return () => {};
  let ws: WebSocket | null = null;
  let stop = false;
  let retry = 1000;
  let ping: ReturnType<typeof setInterval> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dt: ReturnType<typeof setTimeout> | undefined;

  const url = (t: string) => {
    const base = (process.env.NEXT_PUBLIC_WS_URL || API_URL).replace(/^http/, "ws").replace(/\/$/, "");
    return `${base}/ws?token=${encodeURIComponent(t)}`;
  };
  const open = () => {
    const t = getToken();
    if (stop || !t) return;
    try { ws = new WebSocket(url(t)); } catch { schedule(); return; }
    ws.onopen = () => { retry = 1000; ping = setInterval(() => { try { ws?.send("ping"); } catch { /* ignore */ } }, 25000); };
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(String(e.data));
        if (d.t === "data") { clearTimeout(dt); dt = setTimeout(bump, 400); }
        window.dispatchEvent(new CustomEvent("rt-push", { detail: d }));
      } catch { /* ignore */ }
    };
    ws.onclose = () => { clearInterval(ping); if (!stop) schedule(); };
    ws.onerror = () => { try { ws?.close(); } catch { /* ignore */ } };
  };
  const schedule = () => { retry = Math.min(retry * 2, 30000); timer = setTimeout(open, retry); };
  open();
  return () => { stop = true; clearInterval(ping); clearTimeout(timer); try { ws?.close(); } catch { /* ignore */ } };
}
