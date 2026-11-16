'use client';
/**
 * SEO & SITEMAP — title / description / keywords per page, category and product. Nothing to code.
 * APIs: GET /admin/seo/items · PUT /admin/seo · DELETE /admin/seo?kind=&key=
 * The sitemap (sitemap.xml) is built by the website itself and follows products / categories automatically.
 */
import { useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, DataTable, Empty, ErrorBox, Field, Loading, Modal, Pager, SearchBox } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';

const SITE = 'https://akhilifestyle.com';
const TABS = [{ k: 'products', l: 'Products' }, { k: 'categories', l: 'Categories' }, { k: 'pages', l: 'Pages' }];
const PER = 25;

export default function SeoSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => api('/admin/seo/items'), []);
  const [tab, setTab] = useState('products');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [only, setOnly] = useState(false);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [pinging, setPinging] = useState(false);

  const all = (data && data[tab]) || [];
  const rows = all.filter((r) => (!only || r.seo) && (r.name + ' ' + r.key).toLowerCase().includes(q.toLowerCase()));
  const view = rows.slice((page - 1) * PER, page * PER);
  const set = (k) => (e) => setEdit((s) => ({ ...s, [k]: e.target.value }));

  const open = (r) => setEdit({ kind: tab, key: r.key, name: r.name, url: r.url, title: r.seo?.title || '', description: r.seo?.description || '', keywords: r.seo?.keywords || '', noindex: !!r.seo?.noindex });
  async function save() {
    setBusy(true);
    try {
      await api('/admin/seo', { method: 'PUT', body: { kind: edit.kind, key: edit.key, title: edit.title, description: edit.description, keywords: edit.keywords, noindex: edit.noindex } });
      toast.ok('Saved — Google sees it after the next crawl'); setEdit(null); reload();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function remove(r) {
    if (!(await confirm({ title: 'Remove this SEO?', text: `${r.name} goes back to the automatic title and description.`, confirmText: 'Remove', danger: true }))) return;
    try { await api(`/admin/seo?kind=${tab}&key=${encodeURIComponent(r.key)}`, { method: 'DELETE' }); toast.ok('Removed'); reload(); } catch (e) { toast.error(e.message); }
  }
  async function notify() {
    setPinging(true);
    try { const r = await api('/admin/seo/notify', { method: 'POST' }); toast.ok(`Sent ${r.sent} links to Bing / Yandex and others`); }
    catch (e) { toast.error(e.message); } finally { setPinging(false); }
  }
  const copy = (t) => { try { navigator.clipboard.writeText(t); toast.ok('Copied'); } catch { toast.error('Copy failed'); } };

  const status = (r) => (r.seo ? <div className="flex gap wrap">{r.seo.noindex ? <Badge tone="red">Hidden from Google</Badge> : <Badge tone="green">Custom SEO</Badge>}{r.active === false && <Badge>Inactive</Badge>}</div> : <span className="muted">Automatic</span>);
  const columns = [
    { h: tab === 'products' ? 'Product' : tab === 'categories' ? 'Category' : 'Page', cell: (r) => <div><b>{r.name}</b><div className="muted sm">{r.url}</div></div> },
    { h: 'SEO title', cell: (r) => (r.seo?.title ? <span>{r.seo.title}</span> : <span className="muted">—</span>) },
    { h: 'Keywords', cell: (r) => (r.seo?.keywords ? <span className="sm">{r.seo.keywords}</span> : <span className="muted">—</span>) },
    { h: 'Status', cell: status },
    { h: '', cls: 'r', cell: (r) => <div className="acts"><button className="btn sm" onClick={() => open(r)}><Icon name="edit" size={14} /> Edit</button>{r.seo && <button className="btn sm danger" onClick={() => remove(r)} aria-label="Remove SEO"><Icon name="trash" size={14} /></button>}</div> },
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="bd">
          <div className="flex sp center gap wrap">
            <div>
              <b>Sitemap</b> <Badge tone="green">Automatic</Badge>
              <div className="muted sm">Every active product, category and page is listed by itself. Add or delete a product and the sitemap updates within an hour. Nothing to upload.</div>
              <div className="sm" style={{ marginTop: 4 }}><a href={`${SITE}/sitemap.xml`} target="_blank" rel="noreferrer">{SITE}/sitemap.xml ↗</a></div>
            </div>
            <div className="flex gap wrap" style={{ maxWidth: '100%' }}>
              <button className="btn" onClick={() => copy(`${SITE}/sitemap.xml`)}>Copy link</button>
              <button className="btn pri" disabled={pinging} onClick={notify} title="Sends every link to Bing, Yandex and other IndexNow search engines">{pinging ? 'Sending…' : 'Tell search engines now'}</button>
              <a className="btn" href="https://search.google.com/search-console/sitemaps" target="_blank" rel="noreferrer">Open Google Search Console ↗</a>
              <button className="btn" onClick={() => setHelp(!help)}>Google Search Console</button>
            </div>
          </div>
          {help && (
            <ol className="sm" style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Open <b>search.google.com/search-console</b> and add your site (Domain or URL prefix) and verify it.</li>
              <li>Left menu → <b>Sitemaps</b> → type <code>sitemap.xml</code> → <b>Submit</b>. Do this once only.</li>
              <li>After that Google re-reads the sitemap by itself; new products are found automatically. You never submit it again.</li>
              <li>Google does not accept instant pings from websites (no button can force it). It reads the sitemap on its own. "Tell search engines now" reaches Bing, Yandex, Naver and others only.</li>
              <li>To get one page indexed sooner: Search Console → <b>URL inspection</b> → paste the page link → <b>Request indexing</b>.</li>
            </ol>
          )}
        </div>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        <div className="flex gap">{TABS.map((t) => <button key={t.k} className={`tab ${tab === t.k ? 'on' : ''}`} onClick={() => { setTab(t.k); setPage(1); setQ(''); }}>{t.l}{data ? ` (${(data[t.k] || []).length})` : ''}</button>)}</div>
        <div className="grow" />
        <label className="flex gap center sm"><input type="checkbox" checked={only} onChange={(e) => { setOnly(e.target.checked); setPage(1); }} /> Only with custom SEO</label>
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search…" />
      </div>
      <ErrorBox error={error} onRetry={reload} />
      <div className="card flush"><div className="bd">
        {loading && !data ? <Loading /> : rows.length === 0 ? <Empty icon="search" text="Nothing found" /> : (
          <>
            <DataTable columns={columns} rows={view} rowKey="key" mobile={(r) => (
              <div>
                <div className="flex sp center"><b>{r.name}</b>{status(r)}</div>
                <div className="muted sm">{r.url}</div>
                {r.seo?.title && <div className="sm">{r.seo.title}</div>}
                <div className="acts" style={{ marginTop: 8 }}><button className="btn sm" onClick={() => open(r)}>Edit</button>{r.seo && <button className="btn sm danger" onClick={() => remove(r)}>Remove</button>}</div>
              </div>
            )} />
            <Pager page={page} pageSize={PER} total={rows.length} count={view.length} onPage={setPage} />
          </>
        )}
      </div></div>

      {edit && (
        <Modal title={`SEO — ${edit.name}`} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn pri" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
          <Field label={`SEO title (${edit.title.length}/60)`} hint="Shown as the blue link on Google. Keep it under 60 letters. Empty = automatic.">
            <input className="input" value={edit.title} onChange={set('title')} maxLength={120} />
          </Field>
          <Field label={`Description (${edit.description.length}/160)`} hint="The grey text under the link. About 120–160 letters. Empty = automatic.">
            <textarea className="input" rows={3} value={edit.description} onChange={set('description')} maxLength={320} />
          </Field>
          <Field label="Keywords" hint="Separate with commas. Google ignores this tag for ranking; it is stored for Bing/others and your own records. The title and description matter most.">
            <textarea className="input" rows={2} value={edit.keywords} onChange={set('keywords')} maxLength={400} />
          </Field>
          <label className="flex gap center sm" style={{ marginBottom: 10 }}><input type="checkbox" checked={edit.noindex} onChange={(e) => setEdit({ ...edit, noindex: e.target.checked })} /> Hide this page from Google (also removed from the sitemap)</label>
          <div className="card" style={{ background: '#fff' }}><div className="bd">
            <div className="muted sm">Google preview</div>
            <div style={{ color: '#1a0dab', fontSize: 18 }}>{edit.title || edit.name}</div>
            <div style={{ color: '#006621', fontSize: 13 }}>{SITE}{edit.url}</div>
            <div style={{ color: '#545454', fontSize: 13 }}>{edit.description || 'Automatic description from the product text.'}</div>
          </div></div>
        </Modal>
      )}
    </div>
  );
}
