'use client';
/**
 * META CATALOG — one feed for Facebook / Instagram / WhatsApp / Messenger shops + live health check with fix buttons.
 * APIs: GET /admin/meta-catalog/status · POST /admin/meta-catalog/fix {action} · GET /admin/meta-feed/info
 */
import { useState } from 'react';
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
