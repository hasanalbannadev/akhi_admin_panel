'use client';
/**
 * SOCIAL POSTS — post a product to your Facebook Page and Instagram with one click (never automatic).
 * APIs: GET /admin/social/status · /products · /caption · /history · GET/PUT /settings · POST /post
 */
import { useEffect, useState } from 'react';
import { Badge, Empty, ErrorBox, Loading, SearchBox } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';

const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

function PostModal({ product, status, onClose, onDone }) {
  const toast = useToast();
  const [sel, setSel] = useState(product.images.slice(0, 1));
  const [targets, setTargets] = useState({ facebook: status.facebook.ok, instagram: status.instagram.ok });
  const [caps, setCaps] = useState(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  useEffect(() => { api(`/admin/social/caption?product_id=${product.id}`).then(setCaps).catch((e) => toast.error(e.message)); }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleImg = (u) => setSel((s) => (s.includes(u) ? s.filter((x) => x !== u) : s.length < 10 ? [...s, u] : s));
  const picked = Object.keys(targets).filter((t) => targets[t]);

  async function go(force) {
    setBusy(true);
    try {
      const r = await api('/admin/social/post', { method: 'POST', body: { product_id: product.id, targets: picked, images: sel, captions: caps || {}, force: !!force } });
      setRes(r.results); onDone();
    } catch (e) {
      if (/Post again\?/.test(e.message) && window.confirm(e.message)) { await go(true); return; }
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,18,40,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="flex center sp" style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
          <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Post: {product.name}</b>
          <button type="button" className="btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 14 }}>
          {res ? (
            <div>
              {Object.entries(res).map(([t, r]) => (
                <div key={t} style={{ padding: '8px 0' }}>
                  <b style={{ textTransform: 'capitalize' }}>{t}</b> {r.ok ? <Badge tone="green">Posted</Badge> : <Badge tone="red">Failed</Badge>}
                  <div className="sm" style={{ wordBreak: 'break-word' }}>{r.ok ? <a href={r.url} target="_blank" rel="noreferrer">Open the post ↗</a> : r.error}</div>
                </div>))}
              <button className="btn pri" onClick={onClose}>Done</button>
            </div>
          ) : (
            <>
              <b className="sm">1. Pictures ({sel.length} chosen, first one is the cover; 2+ = gallery / carousel, max 10)</b>
              <div className="flex gap wrap" style={{ margin: '6px 0 12px' }}>
                {product.images.map((u) => (
                  <button key={u} type="button" onClick={() => toggleImg(u)} aria-pressed={sel.includes(u)}
                    style={{ position: 'relative', padding: 0, border: sel.includes(u) ? '3px solid var(--brand, #e91e8c)' : '3px solid transparent', borderRadius: 10, background: 'none', cursor: 'pointer' }}>
                    <img src={u} alt="" width={68} height={68} style={{ objectFit: 'cover', borderRadius: 7, display: 'block' }} />
                    {sel.includes(u) && <span style={{ position: 'absolute', top: 2, right: 2, background: '#e91e8c', color: '#fff', borderRadius: 10, fontSize: 11, padding: '0 6px' }}>{sel.indexOf(u) + 1}</span>}
                  </button>))}
              </div>
              <b className="sm">2. Where to post</b>
              <div className="flex gap wrap" style={{ margin: '6px 0 12px' }}>
                {[['facebook', 'Facebook Page'], ['instagram', 'Instagram']].map(([k, label]) => (
                  <label key={k} className="flex gap center sm" style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', opacity: status[k].ok ? 1 : .5 }}>
                    <input type="checkbox" disabled={!status[k].ok} checked={!!targets[k]} onChange={(e) => setTargets({ ...targets, [k]: e.target.checked })} /> {label}
                    {!status[k].ok && <span className="muted">(not connected)</span>}
                  </label>))}
              </div>
              <b className="sm">3. Text (you can edit)</b>
              {!caps ? <div className="muted sm" style={{ padding: 8 }}>Loading…</div> : picked.map((t) => (
                <div key={t} style={{ margin: '6px 0 10px' }}>
                  <div className="muted sm" style={{ textTransform: 'capitalize' }}>{t}{t === 'instagram' ? ' — links are not clickable on Instagram' : ''}</div>
                  <textarea className="input" rows={7} style={{ width: '100%' }} value={caps[t] || ''} onChange={(e) => setCaps({ ...caps, [t]: e.target.value })} />
                </div>))}
              <button className="btn pri" disabled={busy || !picked.length || !sel.length || !caps} onClick={() => go(false)}>{busy ? 'Posting… (can take up to a minute)' : `Post now to ${picked.length || 'none'} place${picked.length === 1 ? '' : 's'}`}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialSection() {
  const toast = useToast();
  const st = useAsync(() => api('/admin/social/status'), []);
  const hist = useAsync(() => api('/admin/social/history'), []);
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [pick, setPick] = useState(null);
  const [footer, setFooter] = useState(null);

  const load = () => { api(`/admin/social/products?q=${encodeURIComponent(q)}`).then((r) => setList(r.items)).catch((e) => { toast.error(e.message); setList([]); }); };
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (st.data && footer === null) setFooter(st.data.footer || ''); }, [st.data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (st.error) return <ErrorBox error={st.error} onRetry={st.reload} />;
  if (!st.data || footer === null) return <Loading />;
  const s = st.data;

  async function saveFooter() {
    try { await api('/admin/social/settings', { method: 'PUT', body: { footer } }); toast.ok('Saved'); st.reload(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <div className="flex sp center gap wrap"><b>Connection</b><button className="btn" onClick={() => { st.reload(); hist.reload(); }}>Check again</button></div>
        {[['facebook', 'Facebook Page'], ['instagram', 'Instagram']].map(([k, label]) => (
          <div key={k} className="flex gap center" style={{ padding: '6px 0' }}>
            <span>{s[k].ok ? '✅' : '❌'}</span><b style={{ minWidth: 110 }}>{label}</b><span className="muted sm" style={{ wordBreak: 'break-word' }}>{s[k].detail}</span>
          </div>))}
        <div style={{ marginTop: 8 }}>
          <div className="muted sm">Added at the end of every post (hashtags, phone number, "Cash on delivery"…)</div>
          <div className="flex gap wrap" style={{ marginTop: 4 }}>
            <input className="input" style={{ flex: '1 1 260px' }} value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="#AkhiLifestyle  📞 01XXXXXXXXX" />
            <button className="btn" onClick={saveFooter} disabled={footer === (s.footer || '')}>Save</button>
          </div>
        </div>
      </div></div>

      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <div className="flex sp center gap wrap"><b>Pick a product to post</b><SearchBox value={q} onChange={setQ} placeholder="Search product…" /></div>
        {list === null ? <div className="muted sm" style={{ padding: 10 }}>Loading…</div> : list.length === 0 ? <Empty icon="search" text="No product" /> : (
          <div style={{ marginTop: 8 }}>
            {list.map((p) => (
              <div key={p.id} className="flex gap center wrap" style={{ padding: '8px 0', borderTop: '1px solid var(--line, #eee)' }}>
                {p.images[0] ? <img src={p.images[0]} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8 }} /> : <span style={{ width: 48, height: 48, borderRadius: 8, background: '#eee' }} />}
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <b>{p.name}</b>
                  <div className="muted sm">{p.price} Tk · {p.images.length} picture{p.images.length === 1 ? '' : 's'}{p.stock <= 0 ? ' · out of stock' : ''}</div>
                  <div className="flex gap wrap">{Object.entries(p.posted || {}).map(([t, ts]) => <Badge key={t} tone="green">{t} · {ago(ts)}</Badge>)}</div>
                </div>
                <button className="btn pri" disabled={!p.images.length} onClick={() => setPick(p)}>Post</button>
              </div>))}
          </div>)}
      </div></div>

      <div className="card"><div className="bd">
        <b>Recent posts</b>
        {!hist.data || hist.data.items.length === 0 ? <div className="muted sm" style={{ padding: 8 }}>Nothing posted yet.</div> : hist.data.items.map((h, i) => (
          <div key={i} className="flex gap center wrap" style={{ padding: '8px 0', borderTop: '1px solid var(--line, #eee)' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}><b>{h.name}</b><div className="muted sm">{ago(h.ts)}</div></div>
            {Object.entries(h.results).map(([t, r]) => r.ok
              ? <a key={t} className="btn sm" href={r.url} target="_blank" rel="noreferrer">{t} ↗</a>
              : <span key={t} title={r.error}><Badge tone="red">{t} failed</Badge></span>)}
          </div>))}
      </div></div>

      {pick && <PostModal product={pick} status={s} onClose={() => setPick(null)} onDone={() => { hist.reload(); load(); }} />}
    </div>
  );
}
