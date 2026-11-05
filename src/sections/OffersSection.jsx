'use client';
/**
 * OFFERS — banner + percent discount applied to one or many products.
 * APIs: GET/POST /admin/offers · PUT/DELETE /admin/offers/{id} · PATCH /admin/offers/{id}/active?active=
 *       GET /admin/products (picker)
 * The percent is taken off the product's COMPARE price (default) or its selling price.
 */
import { useState } from 'react';
import Icon from '@/components/Icon';
import ScopePicker from '@/components/ScopePicker';
import { Badge, Empty, ErrorBox, Field, ImageUploader, Loading, Modal, Switch } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api, assetUrl } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt, money, toLocalInput } from '@/lib/format';

const BLANK = { title: '', banner: [], percent: 10, apply_on: 'compare', starts_at: '', ends_at: '', is_active: true, sort_order: 0, product_ids: [], category_ids: [], scope: 'products', subtitle: '', button_text: '', link_url: '' };
const TONE = { live: 'green', scheduled: 'amber', expired: 'red', off: 'gray' };
const LABEL = { live: 'Live', scheduled: 'Scheduled', expired: 'Expired', off: 'Off' };

export default function OffersSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => api('/admin/offers'), []);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data || [];


  function open(o) {
    if (!o) return setEdit({ ...BLANK });
    setEdit({ ...BLANK, ...o, banner: o.banner_url ? [o.banner_url] : [], starts_at: toLocalInput(o.starts_at), ends_at: toLocalInput(o.ends_at), product_ids: o.product_ids || [], category_ids: o.category_ids || [], scope: o.scope || 'products', subtitle: o.subtitle || '', button_text: o.button_text || '', link_url: o.link_url || '' });
  }
  const set = (k) => (e) => setEdit((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    const percent = parseInt(edit.percent, 10);
    if (!edit.title.trim()) return toast.error('Give the offer a title');
    if (!(percent >= 1 && percent <= 90)) return toast.error('Percent must be between 1 and 90');
    if (edit.starts_at && edit.ends_at && new Date(edit.ends_at) <= new Date(edit.starts_at)) return toast.error('End must be after start');
    const body = {
      title: edit.title.trim(), banner_url: edit.banner[0] || null, percent, apply_on: edit.apply_on,
      starts_at: edit.starts_at ? new Date(edit.starts_at).toISOString() : null,
      ends_at: edit.ends_at ? new Date(edit.ends_at).toISOString() : null,
      is_active: !!edit.is_active, sort_order: parseInt(edit.sort_order, 10) || 0,
      scope: edit.scope, product_ids: edit.scope === 'products' ? edit.product_ids : [], category_ids: edit.scope === 'categories' ? edit.category_ids : [],
      subtitle: edit.subtitle.trim() || null, button_text: edit.button_text.trim() || null, link_url: edit.link_url.trim() || null,
    };
    if (edit.scope === 'products' && !body.product_ids.length) return toast.error('Select at least one product');
    if (edit.scope === 'categories' && !body.category_ids.length) return toast.error('Select at least one category');
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
                  {o.percent}% off {o.apply_on === 'compare' ? 'compare price' : 'selling price'} · {o.scope === 'all' ? 'all products' : o.scope === 'categories' ? `${(o.category_ids || []).length} categories · ${o.product_count} products` : `${o.product_count} products`}
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
          <Field label="Banner sub-text (optional)"><input className="input" value={edit.subtitle} onChange={set('subtitle')} maxLength={200} placeholder="Up to 50% off this week" /></Field>
          <div className="row2">
            <Field label="Button text (optional)"><input className="input" value={edit.button_text} onChange={set('button_text')} maxLength={40} placeholder="Shop now" /></Field>
            <Field label="Button link (optional)" hint="Empty = opens this offer's products."><input className="input" value={edit.link_url} onChange={set('link_url')} maxLength={300} placeholder="/products" /></Field>
          </div>
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

          <ScopePicker value={edit} onChange={(v) => setEdit((s) => ({ ...s, ...v }))} />
        </Modal>
      )}
    </div>
  );
}
