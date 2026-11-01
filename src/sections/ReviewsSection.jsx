'use client';
/**
 * REVIEWS — moderate customer reviews.
 * APIs: GET /admin/reviews?visible=&page= (30/page) · PATCH /admin/reviews/{id}?visible= · DELETE /admin/reviews/{id}
 *       GET /admin/products (only to show product names)
 */
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, ErrorBox, Loading, Pager, Stars } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api, assetUrl } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt } from '@/lib/format';

export default function ReviewsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [vis, setVis] = useState('');
  const [page, setPage] = useState(1);
  const list = useAsync(() => api('/admin/reviews', { query: { visible: vis, page } }), [vis, page]);
  const prods = useAsync(() => api('/admin/products', { query: { page_size: 100 } }).catch(() => ({ items: [] })), []);
  const names = useMemo(() => Object.fromEntries((prods.data?.items || []).map((p) => [p.id, p.name])), [prods.data]);
  const rows = list.data || [];

  async function setVisible(r, v) {
    try { await api(`/admin/reviews/${r.id}`, { method: 'PATCH', query: { visible: v } }); toast.ok(v ? 'Review is now visible' : 'Review hidden'); list.reload(); }
    catch (e) { toast.error(e.message); }
  }
  const [reply, setReply] = useState(null); // { id, text }
  async function saveReply() {
    try { await api(`/admin/reviews/${reply.id}/reply`, { method: 'PUT', body: { text: reply.text } }); toast.ok(reply.text.trim() ? 'Reply saved' : 'Reply removed'); setReply(null); list.reload(); }
    catch (e) { toast.error(e.message); }
  }
  async function remove(r) {
    if (!(await confirm({ title: 'Delete review?', text: 'This cannot be undone. Its photos are deleted from the server too.', confirmText: 'Delete', danger: true }))) return;
    try { await api(`/admin/reviews/${r.id}`, { method: 'DELETE' }); toast.ok('Review deleted'); list.reload(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="tabs">
          {[['', 'All'], ['true', 'Visible'], ['false', 'Hidden']].map(([k, t]) => (
            <button key={t} className={`tab ${vis === k ? 'on' : ''}`} onClick={() => { setVis(k); setPage(1); }}>{t}</button>
          ))}
        </div>
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      <div className="card flush"><div className="bd" style={{ padding: '0 18px' }}>
        {list.loading && !list.data ? <Loading /> : rows.length === 0 ? <Empty icon="star" text="No reviews" /> : rows.map((r) => (
          <div className="list-item" key={r.id} style={{ alignItems: 'flex-start' }}>
            <div className="grow" style={{ whiteSpace: 'normal' }}>
              <div className="flex gap center wrap"><Stars n={r.rating} /><b style={{ display: 'inline' }}>{names[r.product_id] || `Product #${r.product_id}`}</b><Badge tone={r.is_visible ? 'green' : 'gray'}>{r.is_visible ? 'Visible' : 'Hidden'}</Badge></div>
              <div style={{ margin: '5px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.comment || <span className="muted">No comment</span>}</div>
              {r.images?.length > 0 && <div className="flex gap" style={{ flexWrap: 'wrap', margin: '6px 0' }}>{r.images.map((u) => <a key={u} href={assetUrl(u)} target="_blank" rel="noopener noreferrer"><img src={assetUrl(u)} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} /></a>)}</div>}
              {r.reply && <div style={{ margin: '6px 0', padding: '8px 10px', borderRadius: 10, background: '#fdf2f8', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><b>Shop reply:</b> {r.reply}</div>}
              {reply?.id === r.id && (
                <div style={{ margin: '8px 0' }}>
                  <textarea className="input" maxLength={1000} value={reply.text} onChange={(e) => setReply({ id: r.id, text: e.target.value })} placeholder="Write the shop's public reply (empty = remove)" />
                  <div className="flex gap" style={{ marginTop: 6 }}><button className="btn sm pri" onClick={saveReply}>Save reply</button><button className="btn sm" onClick={() => setReply(null)}>Cancel</button></div>
                </div>
              )}
              <span className="muted sm">{dt(r.created_at)}</span>
            </div>
            <div className="flex gap" style={{ flexWrap: 'wrap' }}>
              <button className="btn sm" onClick={() => setReply({ id: r.id, text: r.reply || '' })}><Icon name="chat" size={14} /> {r.reply ? 'Edit reply' : 'Reply'}</button>
              <button className="btn sm" onClick={() => setVisible(r, !r.is_visible)}><Icon name="eye" size={14} /> {r.is_visible ? 'Hide' : 'Show'}</button>
              <button className="btn sm danger" onClick={() => remove(r)} aria-label="Delete"><Icon name="trash" size={14} /></button>
            </div>
          </div>
        ))}
      </div>
        {rows.length > 0 || page > 1 ? <Pager page={page} pageSize={30} count={rows.length} onPage={setPage} /> : null}
      </div>
    </div>
  );
}
