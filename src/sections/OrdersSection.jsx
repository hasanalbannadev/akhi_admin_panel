'use client';
/**
 * ORDERS — list, filter, bulk status, detail, status/courier update, invoice print, Steadfast, CSV export.
 * APIs:
 *   GET   /admin/orders?status=&payment_status=&page=&page_size=
 *   GET   /admin/orders/{no}                      detail
 *   PATCH /admin/orders/{no}/status               {status, courier, tracking_code}
 *   POST  /admin/orders/bulk-status               {order_nos, status}
 *   GET   /admin/orders/{no}/invoice              printable invoice
 *   POST  /admin/orders/{no}/courier/steadfast    send to Steadfast
 *   GET   /admin/orders/{no}/courier/status       Steadfast delivery status (also saved on the order)
 *   GET   /admin/orders/{no}/courier/tracking     every step the parcel went through
 *   POST  /admin/courier/sync                     refresh all shipped parcels
 *   GET   /admin/courier/balance                  what Steadfast owes you
 *   GET   /admin/courier/fraud/{phone}            customer's delivery record
 *   GET   /admin/export/orders.csv?days=&status=  CSV download
 */
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, DataTable, Empty, ErrorBox, Field, Loading, Modal, Pager, SearchBox } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api, download } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { METHOD_LABEL, ORDER_STATUSES, ORDER_TONE, PAYMENT_STATUSES, PAYMENT_TONE, dt, getParam, label, money } from '@/lib/format';

const PAGE = 20;
const COURIER_TONE = { in_review: 'amber', pending: 'amber', hold: 'red', delivered: 'green', partial_delivered: 'blue', cancelled: 'red', exceptional: 'red' };
const courierTone = (s) => COURIER_TONE[s] || (String(s).endsWith('approval_pending') ? 'blue' : 'gray');

export default function OrdersSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState('');
  const [pay, setPay] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState([]);
  const [open, setOpen] = useState(null);      // order_no
  const [bulk, setBulk] = useState('');
  const [exp, setExp] = useState(false);
  const [days, setDays] = useState(30);
  const [cBusy, setCBusy] = useState(false);
  const [bal, setBal] = useState(null);

  useEffect(() => { const o = getParam('open'); if (o) setOpen(o); }, []);

  const list = useAsync(() => api('/admin/orders', { query: { status, payment_status: pay, page, page_size: PAGE } }), [status, pay, page]);
  const rows = (list.data?.items || []).filter((o) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return o.order_no.toLowerCase().includes(s) || o.ship_name.toLowerCase().includes(s) || o.ship_phone.includes(s);
  });

  const toggle = (no) => setSel((s) => (s.includes(no) ? s.filter((x) => x !== no) : [...s, no]));
  const allOn = rows.length > 0 && rows.every((o) => sel.includes(o.order_no));

  async function applyBulk() {
    if (!bulk || !sel.length) return;
    if (!(await confirm({ title: 'Update orders?', text: `Set ${sel.length} order(s) to "${label(bulk)}".`, confirmText: 'Update', danger: bulk === 'cancelled' }))) return;
    try {
      const r = await api('/admin/orders/bulk-status', { method: 'POST', body: { order_nos: sel, status: bulk } });
      toast.ok(`${r.updated.length} updated${r.not_found.length ? `, ${r.not_found.length} not found` : ''}`);
      setSel([]); setBulk(''); list.reload();
    } catch (e) { toast.error(e.message); }
  }
  async function exportCsv() {
    try { await download('/admin/export/orders.csv', 'orders.csv', { days, status }); toast.ok('CSV downloaded'); setExp(false); }
    catch (e) { toast.error(e.message); }
  }

  async function syncCourier() {
    setCBusy(true);
    try {
      const r = await api('/admin/courier/sync', { method: 'POST' });
      if (r.error) toast.error(`Stopped: ${r.error}`);
      toast.ok(`Checked ${r.checked} parcel(s), ${r.updated} updated`); list.reload();
    } catch (e) { toast.error(e.message); } finally { setCBusy(false); }
  }
  async function showBalance() {
    setCBusy(true);
    try { setBal(await api('/admin/courier/balance')); } catch (e) { toast.error(e.message); } finally { setCBusy(false); }
  }

  const Pill = ({ o }) => <Badge tone={ORDER_TONE[o.status]}>{label(o.status)}</Badge>;
  const Pay = ({ o }) => <Badge tone={PAYMENT_TONE[o.payment_status]}>{label(o.payment_status)}</Badge>;

  const columns = [
    { h: <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : rows.map((o) => o.order_no))} aria-label="Select all" />, noClick: true, cell: (o) => <input type="checkbox" checked={sel.includes(o.order_no)} onChange={() => toggle(o.order_no)} /> },
    { h: 'Order', cell: (o) => <div><b>{o.order_no}</b><div className="muted sm">{dt(o.created_at)}</div></div> },
    { h: 'Customer', cell: (o) => <div><b>{o.ship_name}</b><div className="muted sm">{o.ship_phone} · {o.ship_district}</div></div> },
    { h: 'Items', cell: (o) => o.items.reduce((a, i) => a + i.quantity, 0) },
    { h: 'Total', cell: (o) => <b>{money(o.total)}</b> },
    { h: 'Payment', cell: (o) => <div><div className="sm">{METHOD_LABEL[o.payment_method] || o.payment_method}</div><Pay o={o} /></div> },
    { h: 'Courier', cell: (o) => o.courier_status ? <Badge tone={courierTone(o.courier_status)}>{label(o.courier_status)}</Badge> : <span className="muted sm">—</span> },
    { h: 'Status', cell: (o) => <Pill o={o} /> },
    { h: '', cls: 'r', cell: (o) => <button className="btn sm" onClick={() => setOpen(o.order_no)}><Icon name="eye" size={14} /> View</button> },
  ];

  return (
    <div>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Order no, name or phone (this page)" />
        <select className="input" style={{ width: 160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setSel([]); }}>
          <option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select className="input" style={{ width: 190 }} value={pay} onChange={(e) => { setPay(e.target.value); setPage(1); setSel([]); }}>
          <option value="">All payments</option>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <div className="grow" />
        <button className="btn" disabled={cBusy} onClick={syncCourier}><Icon name="refresh" size={15} /> Sync courier</button>
        <button className="btn" disabled={cBusy} onClick={showBalance}><Icon name="truck" size={15} /> Courier balance</button>
        <button className="btn" onClick={() => setExp(true)}><Icon name="download" size={15} /> Export CSV</button>
      </div>

      {sel.length > 0 && (
        <div className="card mb" style={{ padding: 12 }}>
          <div className="flex center gap wrap">
            <b>{sel.length} selected</b>
            <select className="input" style={{ width: 180 }} value={bulk} onChange={(e) => setBulk(e.target.value)}>
              <option value="">Change status to…</option>
              {ORDER_STATUSES.filter((s) => s !== 'pending').map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
            <button className="btn pri sm" disabled={!bulk} onClick={applyBulk}>Apply</button>
            <button className="btn sm" onClick={() => setSel([])}>Clear</button>
          </div>
        </div>
      )}

      <ErrorBox error={list.error} onRetry={list.reload} />
      <div className="card flush"><div className="bd">
        {list.loading && !list.data ? <Loading /> : rows.length === 0 ? <Empty icon="cart" text="No orders found" /> : (
          <>
            <DataTable columns={columns} rows={rows} rowKey="order_no" mobile={(o) => (
              <div onClick={() => setOpen(o.order_no)}>
                <div className="flex sp center"><b>{o.order_no}</b><b>{money(o.total)}</b></div>
                <div className="muted sm">{o.ship_name} · {o.ship_phone}</div>
                <div className="flex gap wrap" style={{ marginTop: 8 }}><Pill o={o} /><Pay o={o} /><span className="muted sm">{dt(o.created_at)}</span></div>
              </div>
            )} />
            <Pager page={page} pageSize={PAGE} total={list.data?.total} count={(list.data?.items || []).length} onPage={(p) => { setPage(p); setSel([]); }} />
          </>
        )}
      </div></div>

      {bal && (
        <Modal title="Steadfast balance" onClose={() => setBal(null)} footer={<button className="btn" onClick={() => setBal(null)}>Close</button>}>
          {bal.current_balance !== undefined
            ? <div><div className="muted sm">Courier currently owes you</div><b style={{ fontSize: 24 }}>{money(bal.current_balance)}</b></div>
            : <pre style={{ background: 'var(--gray-l)', padding: 12, borderRadius: 10, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(bal, null, 2)}</pre>}
        </Modal>
      )}

      {open && <OrderDetail orderNo={open} onClose={() => setOpen(null)} onChanged={list.reload} />}

      {exp && (
        <Modal title="Export orders to CSV" onClose={() => setExp(false)}
          footer={<><button className="btn" onClick={() => setExp(false)}>Cancel</button><button className="btn pri" onClick={exportCsv}><Icon name="download" size={15} /> Download</button></>}>
          <Field label="Orders from the last"><select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 90, 180, 366].map((d) => <option key={d} value={d}>{d} days</option>)}</select></Field>
          <div className="muted sm">Uses the status filter currently selected ({status ? label(status) : 'all statuses'}). Up to 5000 rows.</div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- order detail modal ----------------------------- */
function OrderDetail({ orderNo, onClose, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: o, loading, error, reload } = useAsync(() => api(`/admin/orders/${orderNo}`), [orderNo]);
  const [status, setStatus] = useState('');
  const [courier, setCourier] = useState('');
  const [track, setTrack] = useState('');
  const [busy, setBusy] = useState(false);
  const [sf, setSf] = useState(null);
  const [extra, setExtra] = useState(null);   // {title, data} for tracking history / customer check
  const [invoice, setInvoice] = useState(null);

  useEffect(() => { if (o) { setStatus(o.status); setCourier(o.courier || ''); setTrack(o.tracking_code || ''); } }, [o]);

  async function save() {
    if (status === 'cancelled' && o.status !== 'cancelled' && !(await confirm({ title: 'Cancel this order?', text: 'Stock will be returned to inventory.', confirmText: 'Cancel order', danger: true }))) return;
    setBusy(true);
    try {
      await api(`/admin/orders/${orderNo}/status`, { method: 'PATCH', body: { status, courier: courier.trim() || null, tracking_code: track.trim() || null } });
      toast.ok('Order updated'); reload(); onChanged();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function sendSteadfast() {
    if (!(await confirm({ title: 'Send to Steadfast?', text: 'A consignment will be created and the order marked as shipped.', confirmText: 'Send' }))) return;
    setBusy(true);
    try {
      const r = await api(`/admin/orders/${orderNo}/courier/steadfast`, { method: 'POST' });
      toast.ok(`Sent. Tracking ${r.tracking_code}`); reload(); onChanged();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function steadfastStatus() {
    try { setSf(await api(`/admin/orders/${orderNo}/courier/status`)); reload(); onChanged(); } catch (e) { toast.error(e.message); }
  }
  async function trackingHistory() {
    try { setExtra({ title: 'Tracking history', data: await api(`/admin/orders/${orderNo}/courier/tracking`) }); } catch (e) { toast.error(e.message); }
  }
  async function customerCheck() {
    try { setExtra({ title: `Customer record (${o.ship_phone})`, data: await api(`/admin/courier/fraud/${o.ship_phone}`) }); } catch (e) { toast.error(e.message); }
  }
  async function showInvoice() {
    try { setInvoice(await api(`/admin/orders/${orderNo}/invoice`)); } catch (e) { toast.error(e.message); }
  }

  return (
    <Modal title={`Order ${orderNo}`} size="wide" onClose={onClose}>
      {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : o && (
        <div className="grid g2 stack" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
          <div>
            <h4 style={{ marginBottom: 8 }}>Items</h4>
            {o.items.map((i, k) => (
              <div className="list-item" key={k}><div className="grow"><b>{i.name}</b><span className="muted sm">{money(i.unit_price)} × {i.quantity}</span></div><b>{money(i.unit_price * i.quantity)}</b></div>
            ))}
            <div style={{ marginTop: 10 }}>
              <div className="sum-row"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
              <div className="sum-row"><span>Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><span>−{money(o.discount)}</span></div>
              <div className="sum-row"><span>Shipping</span><span>{money(o.shipping_fee)}</span></div>
              <div className="sum-row tot"><span>Total</span><span>{money(o.total)}</span></div>
            </div>
            <h4 style={{ margin: '18px 0 8px' }}>Customer & delivery</h4>
            <dl className="kv">
              <dt>Name</dt><dd>{o.ship_name}</dd>
              <dt>Phone</dt><dd><a href={`tel:${o.ship_phone}`}>{o.ship_phone}</a></dd>
              <dt>Address</dt><dd>{o.ship_address}{o.ship_area ? `, ${o.ship_area}` : ''}, {o.ship_district}</dd>
              <dt>Placed</dt><dd>{dt(o.created_at)}</dd>
              {o.courier_status && <><dt>Courier</dt><dd><Badge tone={courierTone(o.courier_status)}>{label(o.courier_status)}</Badge></dd></>}
            </dl>
          </div>
          <div>
            <h4 style={{ marginBottom: 8 }}>Payment</h4>
            <div className="flex gap wrap center" style={{ marginBottom: 16 }}>
              <span>{METHOD_LABEL[o.payment_method] || o.payment_method}</span>
              <Badge tone={PAYMENT_TONE[o.payment_status]}>{label(o.payment_status)}</Badge>
            </div>
            <h4 style={{ marginBottom: 8 }}>Update order</h4>
            <Field label="Status"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
            <div className="row2">
              <Field label="Courier"><input className="input" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Pathao" /></Field>
              <Field label="Tracking code"><input className="input" value={track} onChange={(e) => setTrack(e.target.value)} /></Field>
            </div>
            <div className="flex gap wrap">
              <button className="btn pri" disabled={busy} onClick={save}>Save</button>
              <button className="btn" onClick={showInvoice}><Icon name="print" size={15} /> Invoice</button>
              {!o.tracking_code && !['cancelled', 'delivered'].includes(o.status) && <button className="btn dark" disabled={busy} onClick={sendSteadfast}><Icon name="truck" size={15} /> Send to Steadfast</button>}
              {o.courier === 'steadfast' && o.tracking_code && <button className="btn" onClick={steadfastStatus}><Icon name="refresh" size={15} /> Courier status</button>}
              {o.courier === 'steadfast' && o.tracking_code && <button className="btn" onClick={trackingHistory}><Icon name="truck" size={15} /> Tracking history</button>}
              <button className="btn" onClick={customerCheck}><Icon name="eye" size={15} /> Check customer</button>
            </div>
            {sf && (
              <div className="card" style={{ padding: 12, marginTop: 12 }}>
                <div className="muted sm">Courier says</div>
                <b>{sf.label_bn || label(sf.delivery_status)}</b> <Badge tone={courierTone(sf.delivery_status)}>{label(sf.delivery_status)}</Badge>
                <div className="muted sm" style={{ marginTop: 4 }}>Tracking {sf.tracking_code}{sf.consignment_id ? ` · Consignment ${sf.consignment_id}` : ''}</div>
              </div>
            )}
            {extra && (
              <div style={{ marginTop: 12 }}>
                <div className="flex sp center"><b>{extra.title}</b><button className="btn sm" onClick={() => setExtra(null)}>Hide</button></div>
                <pre style={{ background: 'var(--gray-l)', padding: 12, borderRadius: 10, marginTop: 6, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(extra.data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      {invoice && <Invoice inv={invoice} onClose={() => setInvoice(null)} />}
    </Modal>
  );
}

function Invoice({ inv, onClose }) {
  return (
    <Modal title={`Invoice ${inv.invoice_no}`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Close</button><button className="btn pri" onClick={() => window.print()}><Icon name="print" size={15} /> Print</button></>}>
      <div id="invoice">
        <div className="flex sp"><div><b style={{ fontSize: 18 }}>Akhi Lifestyle</b><div className="muted sm">Invoice {inv.invoice_no}</div></div><div className="muted sm">{dt(inv.date)}</div></div>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
        <div className="sm"><b>{inv.customer.name}</b> · {inv.customer.phone}<br />{inv.ship_to.address}, {inv.ship_to.area ? `${inv.ship_to.area}, ` : ''}{inv.ship_to.district}</div>
        <table className="tbl compact" style={{ margin: '14px 0', minWidth: 0 }}>
          <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Total</th></tr></thead>
          <tbody>{inv.items.map((i, k) => <tr key={k}><td>{i.name}</td><td className="r">{i.quantity}</td><td className="r">{money(i.unit_price)}</td><td className="r">{money(i.line_total)}</td></tr>)}</tbody>
        </table>
        <div className="sum-row"><span>Subtotal</span><span>{money(inv.subtotal)}</span></div>
        <div className="sum-row"><span>Discount</span><span>−{money(inv.discount)}</span></div>
        <div className="sum-row"><span>Shipping</span><span>{money(inv.shipping_fee)}</span></div>
        <div className="sum-row tot"><span>Total</span><span>{money(inv.total)}</span></div>
        <div className="muted sm" style={{ marginTop: 10 }}>{METHOD_LABEL[inv.payment_method]} · {label(inv.payment_status)}</div>
      </div>
    </Modal>
  );
}
