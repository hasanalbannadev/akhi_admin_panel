'use client';
/**
 * MANUAL ORDER - the admin places an order by hand (customer came from Facebook / WhatsApp / phone).
 * The order is saved on the customer account with that phone number, so when the customer logs in with the same
 * number the order, its tracking and invoice show up in "My orders".
 * APIs: GET /admin/products?q= · GET /delivery/zones · POST /admin/orders
 */
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Field, Modal } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useDebounce } from '@/lib/hooks';
import { money } from '@/lib/format';

export default function ManualOrderModal({ onClose, onCreated }) {
  const toast = useToast();
  const [f, setF] = useState({ phone: '', name: '', district: '', area: '', address: '', payment: 'cod', paid_note: '',
    shipping_fee: '', discount: '', note: '', status: 'confirmed', send_sms: true, invoice_no: '' });
  const [lines, setLines] = useState([]);         // { product, color_id, quantity }
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 300);
  const [found, setFound] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    api('/delivery/zones').then((z) => setDistricts([...new Set((z || []).flatMap((x) => x.districts || []))].sort())).catch(() => {});
  }, []);
  useEffect(() => {
    if (!dq.trim()) { setFound([]); return; }
    let live = true;
    api('/admin/products', { query: { q: dq.trim(), page_size: 8 } }).then((r) => live && setFound(r.items || [])).catch(() => {});
    return () => { live = false; };
  }, [dq]);

  function add(p) {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.product.id === p.id && !(p.colors || []).length);
      if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, quantity: Math.min(50, l.quantity + 1) } : l));
      return [...ls, { product: p, color_id: (p.colors || []).length ? '' : null, quantity: 1 }];
    });
    setQ(''); setFound([]);
  }
  const upd = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const sub = lines.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0);

  async function save() {
    if (!f.phone.trim()) return toast.error('Enter the customer phone number');
    if (!f.name.trim()) return toast.error('Enter the customer name');
    if (!f.district.trim()) return toast.error('Enter the district');
    if (f.address.trim().length < 3) return toast.error('Enter the address');
    if (!lines.length) return toast.error('Add at least one product');
    if (lines.some((l) => l.color_id === '')) return toast.error('Choose a colour for every product that has colours');
    setBusy(true);
    try {
      const o = await api('/admin/orders', { method: 'POST', body: {
        phone: f.phone.trim(), name: f.name.trim(), district: f.district.trim(), area: f.area.trim() || null, address: f.address.trim(),
        items: lines.map((l) => ({ product_id: l.product.id, color_id: l.color_id || null, quantity: l.quantity })),
        payment: f.payment, paid_note: f.paid_note.trim() || null,
        shipping_fee: f.shipping_fee === '' ? null : Number(f.shipping_fee), discount: Number(f.discount) || 0,
        note: f.note.trim() || null, status: f.status, send_sms: f.send_sms, invoice_no: f.invoice_no.trim() || null } });
      toast.ok(`Order ${o.order_no} created`);
      onCreated(o);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="New manual order" size="wide" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn pri" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Create order'}</button></>}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Field label="Customer phone *" hint="The customer sees this order after logging in with this number."><input className="input" inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" /></Field>
        <Field label="Customer name *"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="District *">
          <input className="input" list="mo-districts" value={f.district} onChange={set('district')} placeholder="e.g. Dhaka" />
          <datalist id="mo-districts">{districts.map((d) => <option key={d} value={d} />)}</datalist>
        </Field>
        <Field label="Area"><input className="input" value={f.area} onChange={set('area')} /></Field>
      </div>
      <Field label="Address *"><textarea className="input" rows={2} value={f.address} onChange={set('address')} /></Field>

      <Field label="Products *">
        <div style={{ position: 'relative' }}>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a product by name to add…" />
          {found.length > 0 && (
            <div className="card" style={{ position: 'absolute', left: 0, right: 0, top: '105%', zIndex: 30, padding: 6, maxHeight: 260, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>
              {found.map((p) => (
                <button key={p.id} type="button" className="btn" style={{ width: '100%', justifyContent: 'space-between', border: 0 }} onClick={() => add(p)}>
                  <span>{p.name}</span><span className="muted sm">{money(p.price)} · stock {p.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>
      {lines.map((l, i) => (
        <div key={i} className="card" style={{ padding: 10, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', minWidth: 0 }}><b>{l.product.name}</b><div className="muted sm">{money(l.product.price)} each</div></div>
          {(l.product.colors || []).length > 0 && (
            <select className="input" style={{ width: 150 }} value={l.color_id} onChange={(e) => upd(i, { color_id: e.target.value ? Number(e.target.value) : '' })}>
              <option value="">Colour…</option>
              {l.product.colors.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.stock})</option>)}
            </select>
          )}
          <input className="input" type="number" min={1} max={50} style={{ width: 80 }} value={l.quantity}
            onChange={(e) => upd(i, { quantity: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />
          <button type="button" className="iconbtn" aria-label="Remove" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}><Icon name="x" /></button>
        </div>
      ))}
      {lines.length > 0 && <div className="muted sm" style={{ marginBottom: 12 }}>Products total (estimate): <b>{money(sub)}</b>. The server uses the live selling price (offers included).</div>}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Field label="Payment">
          <select className="input" value={f.payment} onChange={set('payment')}>
            <option value="cod">Cash on delivery (customer pays the courier)</option>
            <option value="paid">Already paid (bKash / Nagad / cash)</option>
          </select>
        </Field>
        {f.payment === 'paid' && <Field label="Paid how (shown on invoice)"><input className="input" maxLength={70} value={f.paid_note} onChange={set('paid_note')} placeholder="e.g. bKash personal" /></Field>}
        <Field label="Delivery fee (৳)" hint="Empty = the delivery zone's fee. 0 = free."><input className="input" type="number" min={0} value={f.shipping_fee} onChange={set('shipping_fee')} /></Field>
        <Field label="Discount (৳)"><input className="input" type="number" min={0} value={f.discount} onChange={set('discount')} /></Field>
        <Field label="Order status">
          <select className="input" value={f.status} onChange={set('status')}>
            <option value="confirmed">Confirmed</option><option value="pending">Pending</option>
          </select>
        </Field>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Field label="Invoice no. (optional)" hint="Shown to the customer. Empty = the website's own number."><input className="input" maxLength={40} value={f.invoice_no} onChange={set('invoice_no')} /></Field>
        <Field label="Note (optional)"><input className="input" value={f.note} onChange={set('note')} /></Field>
      </div>
      {f.status === 'confirmed' && <label className="check"><input type="checkbox" checked={f.send_sms} onChange={set('send_sms')} /> Send the “order confirmed” SMS to the customer</label>}
    </Modal>
  );
}
