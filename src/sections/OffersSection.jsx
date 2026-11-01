'use client';
/**
 * OFFERS — banner + percent discount applied to one or many products.
 * APIs: GET/POST /admin/offers · PUT/DELETE /admin/offers/{id} · PATCH /admin/offers/{id}/active?active=
 *       GET /admin/products (picker)
 * The percent is taken off the product's COMPARE price (default) or its selling price.
 */
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, ErrorBox, Field, ImageUploader, Loading, Modal, Switch } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api, assetUrl } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt, money, toLocalInput } from '@/lib/format';

const BLANK = { title: '', banner: [], percent: 10, apply_on: 'compare', starts_at: '', ends_at: '', is_active: true, sort_order: 0, product_ids: [] };
const TONE = { live: 'green', scheduled: 'amber', expired: 'red', off: 'gray' };
const LABEL = { live: 'Live', scheduled: 'Scheduled', expired: 'Expired', off: 'Off' };

/** same rule as the backend: new price must be lower than the selling price */
function offerPrice(p, percent, applyOn) {
  const price = Number(p.price || 0);
  const cmp = Number(p.compare_at_price || 0);
  const base = applyOn === 'compare' && cmp > 0 ? cmp : price;
  const now = Math.round(base * (1 - percent / 100) * 100) / 100;
  return now > 0 && now < price ? now : null;
}

export default function OffersSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => api('/admin/offers'), []);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const rows = data || [];

  const prods = useAsync(() => (edit ? api('/admin/products', { query: { page_size: 100 } }).catch(() => ({ items: [] })) : Promise.resolve(null)), [!!edit]);
  const all = prods.data?.items || [];
  const shown = useMemo(() => all.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())), [all, q]);
  const byId = useMemo(() => Object.fromEntries(all.map((p) => [p.id, p])), [all]);

  function open(o) {
    setQ('');
    if (!o) return setEdit({ ...BLANK });
    setEdit({ ...BLANK, ...o, banner: o.banner_url ? [o.banner_url] : [], starts_at: toLocalInput(o.starts_at), ends_at: toLocalInput(o.ends_at), product_ids: o.product_ids || [] });
  }
  const set = (k) => (e) => setEdit((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (id) => setEdit((s) => ({ ...s, product_ids: s.product_ids.includes(id) ? s.product_ids.filter((x) => x !== id) : [...s.product_ids, id] }));

  async function save() {
    const percent = parseInt(edit.percent, 10);
    if (!edit.title.trim()) return toast.error('Give the offer a title');
    if (!(percent >= 1 && percent <= 90)) return toast.error('Percent must be between 1 and 90');
    if (edit.starts_at && edit.ends_at && new Date(edit.ends_at) <= new Date(edit.starts_at)) return toast.error('End must be after start');
    const body = {
      title: edit.title.trim(), banner_url: edit.banner[0] || null, percent, apply_on: edit.apply_on,
      starts_at: edit.starts_at ? new Date(edit.starts_at).toISOString() : null,
      ends_at: edit.ends_at ? new Date(edit.ends_at).toISOString() : null,
      is_active: !!edit.is_active, sort_order: parseInt(edit.sort_order, 10) || 0, product_ids: edit.product_ids,
    };
    setBusy(true);
    try {
      if (edit.id) await api(`/admin/offers/${edit.id}`, { method: 'PUT', body });
      else await api('/admin/offers', { method: 'POST', body });
      toast.ok('Offer saved'); setEdit(null); reload();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function flip(o) {
    try { await api(`/admin/offers/${o.id}/active`, { method: 'PATCH', query: { active: !o.is_active } }); reload(); } catch (e) { toast.error(e.message); }
  }
  async function remove(o) {
    if (!(await confirm({ title: 'Delete offer?', text: `"${o.title}" will be removed and its banner file deleted. Product prices go back to normal.`, confirmText: 'Delete', danger: true }))) return;
    try { await api(`/admin/offers/${o.id}`, { method: 'DELETE' }); toast.ok('Offer deleted'); reload(); } catch (e) { toast.error(e.message); }
  }

  const noDiscount = edit ? edit.product_ids.filter((id) => byId[id] && offerPrice(byId[id], Number(edit.percent) || 0, edit.apply_on) === null).length : 0;

  return (
    <div>
      <div className="toolbar"><div className="muted">{rows.length} offers</div><div className="grow" />
        <button className="btn pri" onClick={() => open(null)}><Icon name="plus" size={16} /> Add Offer</button></div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : rows.length === 0 ? <div className="card"><div className="bd"><Empty icon="tag" text="No offers yet — create one with a banner and a % discount" /></div></div> : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))' }}>
          {rows.map((o) => (
            <div className="card" key={o.id} style={{ overflow: 'hidden' }}>
              <div style={{ aspectRatio: '16/6', background: 'var(--gray-l)', display: 'grid', placeItems: 'center' }}>
                {o.banner_url ? <img src={assetUrl(o.banner_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="image" size={28} />}
              </div>
              <div className="bd">
                <div className="flex sp center" style={{ gap: 8 }}>
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</b>
                  <Badge tone={TONE[o.status] || 'gray'}>{LABEL[o.status] || o.status}</Badge>
                </div>
                <div className="muted sm" style={{ margin: '6px 0 10px' }}>
                  {o.percent}% off {o.apply_on === 'compare' ? 'compare price' : 'selling price'} · {o.product_count} products
                  <br />{o.starts_at ? dt(o.starts_at) : 'Starts now'} → {o.ends_at ? dt(o.ends_at) : 'No end'}
                </div>
                <div className="flex sp center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <div className="check"><Switch checked={o.is_active} onChange={() => flip(o)} /> <span className="sm">Visible</span></div>
                  <div className="flex gap">
                    <button className="btn sm" onClick={() => open(o)}><Icon name="edit" size={14} /> Edit</button>
                    <button className="btn sm danger" onClick={() => remove(o)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <Modal title={edit.id ? 'Edit offer' : 'New offer'} size="lg" onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn pri" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save offer'}</button></>}>
          <Field label="Title *"><input className="input" value={edit.title} onChange={set('title')} placeholder="Eid Sale" autoFocus /></Field>
          <Field label="Banner image" hint="Wide image works best (about 1200×450)."><ImageUploader single value={edit.banner} onChange={(v) => setEdit((s) => ({ ...s, banner: v }))} /></Field>
          <div className="row2">
            <Field label="Discount percent *"><input className="input" type="number" min="1" max="90" value={edit.percent} onChange={set('percent')} /></Field>
            <Field label="Apply percent on" hint="Compare price = the crossed-out “old” price.">
              <select className="input" value={edit.apply_on} onChange={set('apply_on')}>
                <option value="compare">Compare price (recommended)</option>
                <option value="price">Selling price</option>
              </select>
            </Field>
          </div>
          <div className="row2">
            <Field label="Starts (optional)"><input className="input" type="datetime-local" value={edit.starts_at} onChange={set('starts_at')} /></Field>
            <Field label="Ends (optional)"><input className="input" type="datetime-local" value={edit.ends_at} onChange={set('ends_at')} /></Field>
          </div>
          <div className="row2">
            <Field label="Sort order"><input className="input" type="number" value={edit.sort_order} onChange={set('sort_order')} /></Field>
            <Field label="Visible"><div className="check"><Switch checked={!!edit.is_active} onChange={(v) => setEdit((s) => ({ ...s, is_active: v }))} /> <span>{edit.is_active ? 'On' : 'Off'}</span></div></Field>
          </div>

          <Field label={`Products (${edit.product_ids.length} selected)`}>
            <input className="input" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex gap" style={{ margin: '8px 0' }}>
              <button type="button" className="btn sm" onClick={() => setEdit((s) => ({ ...s, product_ids: [...new Set([...s.product_ids, ...shown.map((p) => p.id)])] }))}>Select shown</button>
              <button type="button" className="btn sm" onClick={() => setEdit((s) => ({ ...s, product_ids: [] }))}>Clear</button>
            </div>
            <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
              {prods.loading && !prods.data ? <Loading /> : shown.length === 0 ? <div className="muted sm" style={{ padding: 14 }}>No products found</div> : shown.map((p) => {
                const on = edit.product_ids.includes(p.id);
                const np = offerPrice(p, Number(edit.percent) || 0, edit.apply_on);
                return (
                  <label key={p.id} className="check" style={{ display: 'flex', width: '100%', padding: '8px 10px', borderBottom: '1px solid var(--line)', gap: 10 }}>
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} />
                    <span className="thumb">{p.images?.[0] ? <img src={assetUrl(p.images[0].url)} alt="" /> : null}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <span className="muted sm">{money(p.price)}{p.compare_at_price ? ` · compare ${money(p.compare_at_price)}` : ''}</span>
                    </span>
                    <span className="sm" style={{ textAlign: 'right', color: np ? 'var(--green, #16a34a)' : 'var(--muted)' }}>{np ? `→ ${money(np)}` : 'no discount'}</span>
                  </label>
                );
              })}
            </div>
            {noDiscount > 0 && <div className="hint" style={{ color: '#b45309', marginTop: 6 }}>{noDiscount} selected product(s) would get no discount (the result is not cheaper than the selling price). Add a higher compare price or switch to “Selling price”.</div>}
          </Field>
        </Modal>
      )}
    </div>
  );
}
