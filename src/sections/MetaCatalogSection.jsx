'use client';
/**
 * META CATALOG — one feed for Facebook / Instagram / WhatsApp / Messenger shops + live health check with fix buttons.
 * APIs: GET /admin/meta-catalog/status · POST /admin/meta-catalog/fix {action} · GET /admin/meta-feed/info
 */
import { useEffect, useState } from 'react';
import { Badge, ErrorBox, Loading } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';

const FIX_LABEL = { create_catalog: 'Create catalog', create_feed: 'Link my website feed', connect_waba: 'Connect to WhatsApp', show_catalog: 'Turn ON catalog icon & cart', upload_now: 'Fetch now', sync_sets: 'Create collections' };

export default function MetaCatalogSection() {
  const toast = useToast();
  const st = useAsync(() => api('/admin/meta-catalog/status'), []);
  const info = useAsync(() => api('/admin/meta-feed/info'), []);
  const [busy, setBusy] = useState('');
  const [wl, setWl] = useState(null);                       // Auto catalog (welcome) settings
  const [wlErr, setWlErr] = useState('');
  const [wlog, setWlog] = useState([]);
  const loadLog = () => api('/admin/meta-catalog/welcome-log').then((r) => setWlog(r.items || [])).catch(() => {});
  useEffect(() => { loadLog(); }, []);
  useEffect(() => { api('/admin/meta-catalog/welcome').then(setWl).catch((e) => setWlErr(e.message || 'error')); }, []);
  async function saveWl() {
    try { const r = await api('/admin/meta-catalog/welcome', { method: 'PUT', body: wl }); setWl(r); toast.ok('Saved'); } catch (e) { toast.error(e.message); }
  }
  const copy = (t) => { try { navigator.clipboard.writeText(t); toast.ok('Copied'); } catch { toast.error('Copy failed'); } };
  if (st.error) return <ErrorBox error={st.error} onRetry={st.reload} />;
  if (info.error) return <ErrorBox error={info.error} onRetry={info.reload} />;
  if (!st.data || !info.data) return <Loading />;
  const d = info.data, checks = st.data.checks || [];
  const issues = d.skipped_no_image.length + d.no_description.length;
  const bad = checks.filter((c) => !c.ok).length;

  async function run(action) {
    setBusy(action);
    try { const r = await api('/admin/meta-catalog/fix', { method: 'POST', body: { action } }); toast.ok(r.message || 'Done'); st.reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(''); }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <div className="flex sp center gap wrap">
          <div><b>Health check</b> <Badge tone={bad ? 'red' : 'green'}>{bad ? `${bad} to fix` : 'All good'}</Badge>
            <div className="muted sm">Checks Meta live. Buttons below fix what is missing using your server's Meta token.</div></div>
          <button className="btn" onClick={() => { st.reload(); info.reload(); }}>Check again</button>
        </div>
        <div style={{ marginTop: 10 }}>
          {checks.map((c) => (
            <div key={c.key} className="flex gap center wrap" style={{ padding: '8px 0', borderTop: '1px solid var(--line, #eee)' }}>
              <span style={{ width: 22 }}>{c.ok ? '✅' : c.manual ? 'ℹ️' : '❌'}</span>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}><b>{c.label}</b><div className="muted sm" style={{ wordBreak: 'break-word' }}>{c.detail}</div></div>
              {c.action && <button className={`btn ${c.ok ? '' : 'pri'}`} disabled={!!busy} onClick={() => run(c.action)}>{busy === c.action ? 'Working…' : FIX_LABEL[c.action]}</button>}
            </div>
          ))}
        </div>
      </div></div>

      {!wl && wlErr && <div className="card" style={{ marginBottom: 14 }}><div className="bd"><b>Auto catalog for new chats</b> <Badge tone="red">backend not updated</Badge><div className="muted sm">The server still runs an old meta_catalog.py ("{wlErr}"). Put the new meta_catalog.py on the server and restart akhi_backend; this box then shows the ON/OFF switch and the delay.</div></div></div>}
      {wl && <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <div className="flex sp center gap wrap">
          <div><b>Auto catalog for new chats</b> <Badge tone={wl.on ? 'green' : 'gray'}>{wl.on ? 'ON' : 'OFF'}</Badge>
            <div className="muted sm">When a customer writes for the first time, or again after being silent for the hours set below (Messenger / Instagram / WhatsApp), your greeting and then the category cards are sent automatically. Each card opens the website; with a shop link below it also gets a "🛍 Shop" button.</div></div>
          <label className="flex gap center"><input type="checkbox" checked={wl.on} onChange={(e) => setWl({ ...wl, on: e.target.checked })} /> Turn on</label>
        </div>
        <div className="flex gap wrap" style={{ marginTop: 10 }}>
          <label className="sm" style={{ flex: '1 1 160px' }}>Show<br />
            <select className="input" style={{ width: '100%' }} value={wl.mode} onChange={(e) => setWl({ ...wl, mode: e.target.value })}>
              <option value="categories">Categories</option><option value="products">Latest products</option></select></label>
          <label className="sm" style={{ flex: '1 1 100px' }}>Wait (seconds)<br />
            <input className="input" type="number" min={0} max={30} style={{ width: '100%' }} value={wl.delay} onChange={(e) => setWl({ ...wl, delay: Number(e.target.value) || 0 })} /></label>
          <label className="sm" style={{ flex: '1 1 140px' }}>Again after silence (hours)<br />
            <input className="input" type="number" min={1} max={72} style={{ width: '100%' }} value={wl.gap_hours ?? 6} onChange={(e) => setWl({ ...wl, gap_hours: Math.max(1, Number(e.target.value) || 6) })} /></label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label className="sm">Greeting sent first by this server (optional)<br />
            <textarea className="input" rows={3} style={{ width: '100%' }} maxLength={1000} placeholder="আসসালামু আলাইকুম! Akhi Lifestyle-এ স্বাগতম 😊 নিচে আমাদের কালেকশন দেখুন।" value={wl.greeting || ''} onChange={(e) => setWl({ ...wl, greeting: e.target.value })} /></label>
          <div className="flex gap wrap sm" style={{ marginTop: 4 }}>
            {[['greet_wa', 'WhatsApp'], ['greet_fb', 'Messenger'], ['greet_ig', 'Instagram']].map(([k, l]) => (
              <label key={k} className="flex gap center"><input type="checkbox" checked={!!wl[k]} onChange={(e) => setWl({ ...wl, [k]: e.target.checked })} /> {l}</label>))}
            <span className="muted">(Messenger/Instagram-এ Meta-র নিজের গ্রিটিং থাকলে টিক দেবেন না)</span>
          </div>
        </div>
        <div className="flex gap wrap" style={{ marginTop: 8 }}>
          <label className="sm" style={{ flex: '1 1 260px' }}>Facebook Shop link (optional)<br />
            <input className="input" style={{ width: '100%' }} placeholder="https://www.facebook.com/yourpage/shop" value={wl.shop_fb} onChange={(e) => setWl({ ...wl, shop_fb: e.target.value })} /></label>
          <label className="sm" style={{ flex: '1 1 260px' }}>Instagram Shop link (optional)<br />
            <input className="input" style={{ width: '100%' }} placeholder="https://www.instagram.com/yourname/" value={wl.shop_ig} onChange={(e) => setWl({ ...wl, shop_ig: e.target.value })} /></label>
        </div>
        <div style={{ marginTop: 10 }}><button className="btn pri" onClick={saveWl}>Save</button></div>
        <div style={{ marginTop: 14 }}>
          <div className="flex gap center"><b className="sm">Last auto-catalog attempts</b><button className="btn sm" onClick={loadLog}>Refresh</button></div>
          {wlog.length === 0 ? <div className="muted sm">Nothing yet. After a customer writes, the result (sent / why not) shows here.</div> : wlog.map((l, i) => (
            <div key={i} className="sm" style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
              <Badge tone={l.status === 'ok' ? 'green' : l.status === 'fail' ? 'red' : 'gray'}>{l.status}</Badge> <b>{l.ch}</b> · <span className="muted">{new Date(l.t).toLocaleString()}</span><br />{l.msg}
            </div>))}
        </div>
        <div className="muted sm" style={{ marginTop: 6 }}>The same "🛍 Shop" button is also added to every product / category card you send by hand from a chat. If Meta's own automatic greeting is on, keep it: ours only adds the cards after it.</div>
      </div></div>}

      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <b>Catalog feed link</b> <Badge tone="green">Automatic</Badge>
        <div className="muted sm" style={{ margin: '4px 0 8px' }}>Meta re-reads this link by itself, so new products, prices and stock follow. Every product opens its page on {d.site}.</div>
        <div className="flex gap wrap center">
          <code style={{ wordBreak: 'break-all' }}>{d.feed_url}</code>
          <button className="btn" onClick={() => copy(d.feed_url)}>Copy link</button>
          <a className="btn" href={d.feed_url} target="_blank" rel="noreferrer">Open ↗</a>
        </div>
        <div className="flex gap wrap" style={{ marginTop: 10 }}>
          <Badge tone="green">{d.in_feed} products in feed</Badge>
          <Badge>{d.out_of_stock} out of stock</Badge>
          <Badge tone={d.skipped_no_image.length ? 'red' : 'green'}>{d.skipped_no_image.length} skipped (no image)</Badge>
          <Badge tone={d.no_description.length ? 'amber' : 'green'}>{d.no_description.length} without description</Badge>
        </div>
        {issues > 0 && (
          <div className="sm" style={{ marginTop: 8 }}>
            {d.skipped_no_image.length > 0 && <div><b>Add a picture to:</b> {d.skipped_no_image.join(', ')}</div>}
            {d.no_description.length > 0 && <div className="muted"><b>Name is used as description for:</b> {d.no_description.join(', ')}</div>}
          </div>
        )}
      </div></div>

      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <b>Where customers see it</b>
        <ul className="sm" style={{ paddingLeft: 18, lineHeight: 1.7, marginTop: 6 }}>
          <li><b>WhatsApp:</b> catalog (bag) icon on your business profile and chat. A customer's cart arrives in <b>Chat → WhatsApp</b> as an order with product names.</li>
          <li><b>Messenger / Instagram / WhatsApp chats:</b> press 🛍 in the chat box to send a product card (picture, price, "View &amp; order" → your website).</li>
          <li><b>Facebook Page &amp; Instagram shop:</b> connect once in Commerce Manager → your catalog → Settings (Meta does not allow this through the API). Categories: Catalog → Sets → filter <i>Product type contains</i> the category name.</li>
        </ul>
        <div className="muted sm">Categories: {d.categories.join(', ') || '—'}</div>
        <div className="muted sm" style={{ marginTop: 6 }}>Meta's own checkout is not available in every country. Tapping a product opens your website to order.</div>
      </div></div>
    </div>
  );
}
