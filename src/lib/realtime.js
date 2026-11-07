// WebSocket push: server pushes -> "rt-push" window event -> chat boxes refresh instantly (0 s).
// If WebSocket is blocked the existing 1 s polling keeps working.
import { getToken } from './api';
import { bump } from './store';

export function startRealtime() {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return () => {};
  let ws = null; let stop = false; let retry = 1000; let ping; let timer; let dt;
  const url = (t) => {
    // admin.example.com -> api.example.com (Next.js rewrites cannot carry WebSockets); NEXT_PUBLIC_WS_URL overrides
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const base = process.env.NEXT_PUBLIC_WS_URL
      || (/^admin\./.test(host) ? `${proto}://${host.replace(/^admin\./, 'api.')}/api/v1` : `${proto}://${host}/api/v1`);
    return `${base.replace(/\/$/, '')}/ws?token=${encodeURIComponent(t)}`;
  };
  const schedule = () => { retry = Math.min(retry * 2, 30000); timer = setTimeout(open, retry); };
  function open() {
    const t = getToken();
    if (stop || !t) { if (!stop) schedule(); return; }
    try { ws = new WebSocket(url(t)); } catch { schedule(); return; }
    ws.onopen = () => { retry = 1000; ping = setInterval(() => { try { ws.send('ping'); } catch { /* ignore */ } }, 25000); };
    ws.onmessage = (e) => { try { const d = JSON.parse(String(e.data)); if (d.t === 'data') { clearTimeout(dt); dt = setTimeout(bump, 400); } window.dispatchEvent(new CustomEvent('rt-push', { detail: d })); } catch { /* ignore */ } };
    ws.onclose = () => { clearInterval(ping); if (!stop) schedule(); };
    ws.onerror = () => { try { ws.close(); } catch { /* ignore */ } };
  }
  open();
  return () => { stop = true; clearInterval(ping); clearTimeout(timer); try { ws && ws.close(); } catch { /* ignore */ } };
}
