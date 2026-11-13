'use client';
/**
 * COUPONS — list, create, edit, disable. A coupon can also be a BANNER-ONLY campaign (no code, no discount: just the pop-up).
 * A coupon can be limited to some payment methods (empty = works with all).
 * APIs: GET/POST /admin/coupons · GET/PUT/DELETE /admin/coupons/{id}   (DELETE = disable) · GET /admin/payment-methods
 */
import { useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, DataTable, Empty, ErrorBox, Field, ImageUploader, Loading, Modal, Switch } from '@/components/ui';
import ScopePicker from '@/components/ScopePicker';
import { useConfirm, useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt, money, toLocalInput } from '@/lib/format';

const BLANK = { code: '', kind: 'percent', value: '', min_subtotal: 0, max_discount: '', usage_limit: '', per_user_limit: 1, starts_at: '', expires_at: '', is_active: true,
  scope: 'all', product_ids: [], category_ids: [], popup_enabled: false, popup_title: '', popup_text: '', popup_image: [], popup_button_text: '', popup_link: '', popup_seconds: 2, popup_only: false, pay_methods: [] };

// the server may send the payment methods as a list or as comma text; always work with a list
const asList = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);

export default function CouponsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => api('/admin/coupons'), []);
  const pm = useAsync(() => api('/admin/payment-methods'), []);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = Array.isArray(data) ? data : [];
  // the payment methods a coupon can be limited to (same keys the checkout uses)
  const payOptions = [{ key: 'cod', label: 'Cash on delivery' }, { key: 'sslcommerz', label: 'Online payment (SSLCommerz)' },
    ...((Array.isArray(pm.data) ? pm.data : []).filter((m) => m.is_active).map((m) => ({ key: `pm_${m.id}`, label: m.title })))];
  const togglePay = (k) => setEdit((s) => ({ ...s, pay_methods: asList(s.pay_methods).includes(k) ? asList(s.pay_methods).filter((x) => x !== k) : [...asList(s.pay_methods), k] }));

  async function open(c) {
    if (!c) return setEdit({ ...BLANK });
    try { // GET /admin/coupons/{id} so the form always has the freshest values
      const f = await api(`/admin/coupons/${c.id}`);
      setEdit({ ...BLANK, ...f, max_discount: f.max_discount ?? '', usage_limit: f.usage_limit ?? '', starts_at: toLocalInput(f.starts_at), expires_at: toLocalInput(f.expires_at),
        popup_title: f.popup_title || '', popup_text: f.popup_text || '', popup_button_text: f.popup_button_text || '', popup_link: f.popup_link || '',
        popup_image: f.popup_image ? [f.popup_image] : [], product_ids: f.product_ids || [], category_ids: f.category_ids || [],
        popup_only: !!f.popup_only, pay_methods: asList(f.pay_methods) });
    } catch (e) { toast.error(e.message); }
  }
  const set = (k) => (e) => setEdit((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save() {
    const only = !!edit.popup_only;
    const v = Number(edit.value);
    if (!only) {
      if (edit.code.trim().length < 3) return toast.error('Code must be at least 3 characters');
      if (!(v > 0)) return toast.error('Value must be greater than 0');
      if (edit.kind === 'percent' && v > 100) return toast.error('Percent cannot exceed 100');
    } else if (!edit.popup_image[0] && !edit.popup_title.trim()) return toast.error('Add a banner image (or at least a title) for the pop-up');
    const body = {
      popup_only: only, pay_methods: only ? [] : asList(edit.pay_methods),
      code: edit.code.trim().toUpperCase(), kind: only ? 'percent' : edit.kind, value: only ? 0 : v, min_subtotal: Number(edit.min_subtotal) || 0,
      max_discount: edit.max_discount === '' ? null : Number(edit.max_discount),
      usage_limit: edit.usage_limit === '' ? null : parseInt(edit.usage_limit, 10),
      per_user_limit: parseInt(edit.per_user_limit, 10) || 1,
      starts_at: edit.starts_at ? new Date(edit.starts_at).toISOString() : null,
      expires_at: edit.expires_at ? new Date(edit.expires_at).toISOString() : null,
      is_active: !!edit.is_active,
      scope: edit.scope, product_ids: edit.scope === 'products' ? edit.product_ids : [], category_ids: edit.scope === 'categories' ? edit.category_ids : [],
      popup_enabled: only ? true : !!edit.popup_enabled, popup_title: edit.popup_title.trim() || null, popup_text: edit.popup_text.trim() || null,
      popup_image: edit.popup_image[0] || null, popup_button_text: edit.popup_button_text.trim() || null, popup_link: edit.popup_link.trim() || null,
      popup_seconds: Math.min(30, Math.max(1, parseInt(edit.popup_seconds, 10) || 2)),
    };
    if (!only && edit.scope === 'products' && !body.product_ids.length) return toast.error('Select at least one product');
    if (!only && edit.scope === 'categories' && !body.category_ids.length) return toast.error('Select at least one category');
    setBusy(true);
    try {
      if (edit.id) await api(`/admin/coupons/${edit.id}`, { method: 'PUT', body });
      else await api('/admin/coupons', { method: 'POST', body });
      toast.ok('Coupon saved'); setEdit(null); reload();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function disable(c) {
    if (!(await confirm({ title: 'Disable coupon?', text: `${c.code} will stop working. You can re-enable it by editing.`, confirmText: 'Disable', danger: true }))) return;
    try { await api(`/admin/coupons/${c.id}`, { method: 'DELETE' }); toast.ok('Coupon disabled'); reload(); } catch (e) { toast.error(e.message); }
  }

  const state = (c) => {
    if (!c.is_active) return <Badge tone="gray">Disabled</Badge>;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return <Badge tone="red">Expired</Badge>;
    if (c.usage_limit && c.used_count >= c.usage_limit) return <Badge tone="amber">Used up</Badge>;
    return <Badge tone="green">Active</Badge>;
  };
  const val = (c) => (c.kind === 'percent' ? `${c.value}%` : money(c.value));

  const columns = [
    { h: 'Code', cell: (c) => (c.popup_only ? <Badge tone="blue">Banner only</Badge> : <b style={{ letterSpacing: '.04em' }}>{c.code}</b>) },
    { h: 'Discount', cell: (c) => c.popup_only ? <span className="muted">—</span> : <div>{val(c)}{c.max_discount ? <div className="muted sm">max {money(c.max_discount)}</div> : null}</div> },
    { h: 'Applies to', cell: (c) => (c.popup_only ? <span className="muted sm">Pop-up only</span> : (
      <span className="muted sm">{c.scope === 'products' ? `${(c.product_ids || []).length} products` : c.scope === 'categories' ? `${(c.category_ids || []).length} categories` : 'All products'}
        {asList(c.pay_methods).length > 0 && <div>{asList(c.pay_methods).length} payment method{asList(c.pay_methods).length > 1 ? 's' : ''} only</div>}</span>)) },
    { h: 'Min order', cell: (c) => (c.min_subtotal ? money(c.min_subtotal) : '—') },
    { h: 'Used', cell: (c) => `${c.used_count}${c.usage_limit ? ` / ${c.usage_limit}` : ''}` },
    { h: 'Valid until', cell: (c) => <span className="muted">{c.expires_at ? dt(c.expires_at, false) : 'No expiry'}</span> },
    { h: 'Status', cell: state },
    {
      h: '', cls: 'r', cell: (c) => (
        <div className="acts">
          <button className="btn sm" onClick={() => open(c)}><Icon name="edit" size={14} /> Edit</button>
          {c.is_active && <button className="btn sm danger" onClick={() => disable(c)}>Disable</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="toolbar"><div className="muted">{rows.length} coupons</div><div className="grow" />
        <button className="btn pri" onClick={() => open(null)}><Icon name="plus" size={16} /> Add Coupon</button></div>
      <ErrorBox error={error} onRetry={reload} />
      <div className="card flush"><div className="bd">
        {loading && !data ? <Loading /> : rows.length === 0 ? <Empty icon="ticket" text="No coupons yet" /> : (
          <DataTable columns={columns} rows={rows} mobile={(c) => (
            <div>
              <div className="flex sp center"><b>{c.popup_only ? 'Banner only' : c.code}</b>{state(c)}</div>
              <div className="muted sm" style={{ margin: '5px 0 9px' }}>{c.popup_only ? 'Pop-up banner, no discount' : `${val(c)} off · used ${c.used_count}${c.usage_limit ? `/${c.usage_limit}` : ''}`}</div>
              <div className="flex gap"><button className="btn sm" onClick={() => open(c)}>Edit</button>{c.is_active && <button className="btn sm danger" onClick={() => disable(c)}>Disable</button>}</div>
            </div>
          )} />
        )}
      </div></div>

      {edit && (
        <Modal title={edit.id ? (edit.popup_only ? 'Edit banner campaign' : `Edit ${edit.code}`) : 'New coupon'} onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn pri" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="flex sp center"><b>Banner only (no coupon code, no discount)</b>
              <Switch checked={!!edit.popup_only} onChange={(v) => setEdit((s) => ({ ...s, popup_only: v, popup_enabled: v ? true : s.popup_enabled }))} /></div>
            <div className="muted sm" style={{ marginTop: 4 }}>Turn this on to run a campaign with just a pop-up banner: add an image, and optionally a button or link.</div>
          </div>
          {!edit.popup_only && <>
          <Field label="Code *"><input className="input" value={edit.code} onChange={set('code')} placeholder="WELCOME10" autoFocus style={{ textTransform: 'uppercase' }} /></Field>
          <div className="row2">
            <Field label="Type"><select className="input" value={edit.kind} onChange={set('kind')}><option value="percent">Percent (%)</option><option value="fixed">Fixed amount (৳)</option></select></Field>
            <Field label="Value *"><input className="input" type="number" min="0" step="0.01" value={edit.value} onChange={set('value')} /></Field>
          </div>
          <div className="row2">
            <Field label="Minimum order (৳)"><input className="input" type="number" min="0" value={edit.min_subtotal} onChange={set('min_subtotal')} /></Field>
            <Field label="Max discount (৳)" hint="Cap for percent coupons"><input className="input" type="number" min="0" value={edit.max_discount} onChange={set('max_discount')} /></Field>
          </div>
          <div className="row2">
            <Field label="Total usage limit" hint="Empty = unlimited"><input className="input" type="number" min="1" value={edit.usage_limit} onChange={set('usage_limit')} /></Field>
            <Field label="Per customer limit"><input className="input" type="number" min="1" value={edit.per_user_limit} onChange={set('per_user_limit')} /></Field>
          </div>
          </>}
          <div className="row2">
            <Field label="Starts"><input className="input" type="datetime-local" value={edit.starts_at} onChange={set('starts_at')} /></Field>
            <Field label="Expires"><input className="input" type="datetime-local" value={edit.expires_at} onChange={set('expires_at')} /></Field>
          </div>
          {!edit.popup_only && <>
          <ScopePicker value={edit} onChange={(v) => setEdit((s) => ({ ...s, ...v }))} />
          <div className="hint muted sm" style={{ margin: '-4px 0 10px' }}>While this coupon is active and valid, products it covers do not get their offer price at checkout; offers return when the coupon ends.</div>
          <div style={{ marginBottom: 12 }}>
            <b>Works with these payment methods</b>
            <div className="muted sm" style={{ margin: '2px 0 6px' }}>{asList(edit.pay_methods).length ? 'Only the ticked methods accept this coupon. With any other method the customer sees “this coupon does not work with this payment method”.' : 'Nothing ticked = the coupon works with every payment method.'}</div>
            <div className="flex gap" style={{ flexWrap: 'wrap' }}>
              {payOptions.map((o) => (
                <label className="check" key={o.key}><input type="checkbox" checked={asList(edit.pay_methods).includes(o.key)} onChange={() => togglePay(o.key)} /> {o.label}</label>
              ))}
            </div>
          </div>
          </>}
          <label className="check"><input type="checkbox" checked={edit.is_active} onChange={set('is_active')} /> Active</label>

          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />
          <div className="flex sp center"><b>Pop-up banner on the website</b>{edit.popup_only ? <Badge tone="green">On</Badge> : <Switch checked={!!edit.popup_enabled} onChange={(v) => setEdit((s) => ({ ...s, popup_enabled: v }))} />}</div>
          <div className="muted sm" style={{ margin: '4px 0 10px' }}>A pop-up in the middle of the website, shown once per visit while this is active. Customers can close it early. {edit.popup_only ? '' : 'If a coupon code is set, they can tap the code to copy it.'}</div>
          {(edit.popup_enabled || edit.popup_only) && (
            <>
              <Field label="Title"><input className="input" value={edit.popup_title} onChange={set('popup_title')} maxLength={120} placeholder="Special coupon for you!" /></Field>
              <Field label="Text"><input className="input" value={edit.popup_text} onChange={set('popup_text')} maxLength={200} placeholder="Use this code at checkout" /></Field>
              <Field label="Banner image" hint="Shown in full, nothing is cut. When an image is set, the Title and Text above are not shown (put them in the image)."><ImageUploader single value={edit.popup_image} onChange={(v) => setEdit((s) => ({ ...s, popup_image: v }))} /></Field>
              <div className="row2">
                <Field label="Button text" hint="Empty = no button"><input className="input" value={edit.popup_button_text} onChange={set('popup_button_text')} maxLength={40} placeholder="Shop now" /></Field>
                <Field label="Link" hint="With a link, tapping the banner opens it, with or without a button"><input className="input" value={edit.popup_link} onChange={set('popup_link')} maxLength={300} placeholder="/shop" /></Field>
              </div>
              <Field label="Show for (seconds)" hint="Then it closes by itself. 1–30."><input className="input" type="number" min="1" max="30" value={edit.popup_seconds} onChange={set('popup_seconds')} /></Field>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
