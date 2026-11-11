'use client';
/**
 * ORDERS — list, filter, bulk status, detail, status/courier update, invoice print, Steadfast, CSV export.
 * APIs:
 *   GET   /admin/orders?status=&payment_status=&page=&page_size=
 *   GET   /admin/orders/{no}                      detail
 *   PATCH /admin/orders/{no}/status               {status, courier, tracking_code}
 *   POST  /admin/orders                           manual order {phone, name, district, address, items, payment}
 *   POST  /admin/orders/bulk-status               {order_nos, status}
 *   GET   /admin/orders/{no}/invoice              printable invoice
 *   POST  /admin/orders/{no}/courier/send         {courier: steadfast|pathao, city_id?, zone_id?, area_id?}
 *   GET   /admin/courier/pathao/cities | cities/{id}/zones | zones/{id}/areas
 *   GET   /admin/orders/{no}/courier/status       Steadfast delivery status (also saved on the order)
 *   GET   /admin/orders/{no}/courier/tracking     every step the parcel went through
 *   POST  /admin/courier/sync                     refresh all shipped parcels
 *   GET   /admin/courier/balance                  what Steadfast owes you
 *   GET   /admin/courier/fraud/{phone}            customer's delivery record
 *   GET   /admin/export/orders.csv?days=&status=  CSV download
 */
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import FlowTracker from '@/components/FlowTracker';
import InvoiceModal from '@/components/InvoiceModal';
import ManualOrderModal from '@/components/ManualOrderModal';
import { Badge, DataTable, Empty, ErrorBox, Field, Loading, Modal, Pager, SearchBox } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api, download } from '@/lib/api';
import { useAsync, useDebounce } from '@/lib/hooks';
import { courierTone, FILTER_STATUSES, methodName, ORDER_STATUSES, ORDER_TONE, PAYMENT_STATUSES, PAYMENT_TONE, dt, getParam, label, money } from '@/lib/format';

const PAGE = 20;
// every status Steadfast can report
export const COURIER_STATUSES = ['pending', 'in_review', 'hold', 'delivered', 'partial_delivered', 'cancelled', 'unknown',
  'delivered_approval_pending', 'partial_delivered_approval_pending', 'cancelled_approval_pending', 'unknown_approval_pending'];
// Pathao statuses
export const PATHAO_STATUSES = ['order_created', 'pickup_requested', 'assigned_for_pickup', 'picked', 'pickup_failed', 'pickup_cancelled',
  'at_the_sorting_hub', 'in_transit', 'received_at_last_mile_hub', 'assigned_for_delivery', 'partial_delivery', 'return', 'delivery_failed', 'on_hold'];

export default function OrdersSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState('');
  const [pay, setPay] = useState('');
  const [cs, setCs] = useState('');          // courier status filter
  const [cr, setCr] = useState(false);       // only orders where the customer asked to cancel
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState([]);
  const [open, setOpen] = useState(null);      // order_no
  const [bulk, setBulk] = useState('');
  const [exp, setExp] = useState(false);
  const [newOrder, setNewOrder] = useState(false);
  const [days, setDays] = useState(30);
  const [cBusy, setCBusy] = useState(false);
  const [bal, setBal] = useState(null);

  useEffect(() => { const o = getParam('open'); if (o) setOpen(o); }, []);

  const dq = useDebounce(q, 350);
  const list = useAsync(() => api('/admin/orders', { query: { status, payment_status: pay, courier_status: cs, cancel_requested: cr ? true : undefined, q: dq.trim() || undefined, page, page_size: PAGE } }), [status, pay, cs, cr, dq, page]);
  const rows = list.data?.items || [];

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
  async function deleteBulk() {
    if (!sel.length) return;
    if (!(await confirm({ title: 'Delete orders for good?', text: `${sel.length} order(s) will be removed from the database. This cannot be undone.`, confirmText: 'Delete', danger: true }))) return;
    try {
      const r = await api('/admin/orders/bulk-delete', { method: 'POST', body: { order_nos: sel } });
      toast.ok(`${r.deleted.length} deleted`);
      setSel([]); setBulk(''); list.reload();
    } catch (e) { toast.error(e.message); }
  }
  async function exportCsv() {
    try { await download('/admin/export/orders.csv', 'orders.csv', { days, status }); toast.ok('CSV downloaded'); setExp(false); }
    catch (e) { toast.error(e.message); }
  }

  async function syncCourier(which = 'all') {
    setSyncMenu(false);
    setCBusy(true);
    try {
      const r = await api('/admin/courier/sync', { method: 'POST', query: { courier: which } });
      if (r.error) toast.error(`Stopped: ${r.error}`);
      toast.ok(`Checked ${r.checked} parcel(s), ${r.updated} updated`); list.reload();
    } catch (e) { toast.error(e.message); } finally { setCBusy(false); }
  }
  const [syncMenu, setSyncMenu] = useState(false);
  const [inv, setInv] = useState(null);
  async function showBalance() {
    setCBusy(true);
    try { setBal(await api('/admin/courier/balance')); } catch (e) { toast.error(e.message); } finally { setCBusy(false); }
  }

  const Pill = ({ o }) => <Badge tone={ORDER_TONE[o.status]}>{label(o.status)}</Badge>;
  const Pay = ({ o }) => <Badge tone={PAYMENT_TONE[o.payment_status]}>{label(o.payment_status)}</Badge>;

  const columns = [
    { h: <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : rows.map((o) => o.order_no))} aria-label="Select all" />, noClick: true, cell: (o) => <input type="checkbox" checked={sel.includes(o.order_no)} onChange={() => toggle(o.order_no)} /> },
    { h: 'Order', cell: (o) => <div><b>{o.order_no}</b>{o.invoice_no && <div className="muted sm">Invoice {o.invoice_no}</div>}<div className="muted sm">{dt(o.created_at)}</div>{o.cancel_requested && o.status !== 'cancelled' && <Badge tone="red">Cancel requested</Badge>}</div> },
    { h: 'Customer', cell: (o) => <div><b>{o.ship_name}</b><div className="muted sm">{o.ship_phone} · {o.ship_district}</div></div> },
    { h: 'Items', cell: (o) => o.items.reduce((a, i) => a + i.quantity, 0) },
    { h: 'Total', cell: (o) => <b>{money(o.total)}</b> },
    { h: 'Payment', cell: (o) => <div><div className="sm">{methodName(o.payment_method, o.payment_label)}</div><Pay o={o} /></div> },
    { h: 'Courier', cell: (o) => o.courier_status ? <Badge tone={courierTone(o.courier_status)}>{label(o.courier_status)}</Badge> : <span className="muted sm">—</span> },
    { h: 'Status', cell: (o) => <Pill o={o} /> },
    { h: '', cls: 'r', cell: (o) => <div className="acts"><button className="btn sm" onClick={() => setOpen(o.order_no)}><Icon name="eye" size={14} /> View</button><button className="btn sm" title="Invoice" onClick={() => setInv(o.order_no)}><Icon name="print" size={14} /></button></div> },
  ];

  return (
    <div>
      <div className="toolbar">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search order ID, name, phone or tracking…" />
        <select className="input" style={{ width: 160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setSel([]); }}>
          <option value="">All statuses</option>{FILTER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select className="input" style={{ width: 190 }} value={pay} onChange={(e) => { setPay(e.target.value); setPage(1); setSel([]); }}>
          <option value="">All payments</option>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select className="input" style={{ width: 190 }} value={cs} onChange={(e) => { setCs(e.target.value); setPage(1); setSel([]); }}>
          <option value="">All courier statuses</option><optgroup label="Steadfast">{COURIER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</optgroup><optgroup label="Pathao">{PATHAO_STATUSES.map((s) => <option key={'p' + s} value={s}>{label(s)}</option>)}</optgroup>
        </select>
        <label className="check"><input type="checkbox" checked={cr} onChange={(e) => { setCr(e.target.checked); setPage(1); setSel([]); }} /> Cancel requests</label>
        <div className="grow" />
        <div style={{ position: 'relative' }}>
          <button className="btn" disabled={cBusy} onClick={() => setSyncMenu((v) => !v)}><Icon name="refresh" size={15} /> Sync courier ▾</button>
          {syncMenu && (
            <>
              <div onClick={() => setSyncMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div className="card" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 41, minWidth: 190, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>
                {[['all', 'All couriers'], ['steadfast', 'Steadfast only'], ['pathao', 'Pathao only']].map(([k, v]) => (
                  <button key={k} className="btn" style={{ width: '100%', justifyContent: 'flex-start', border: 0 }} onClick={() => syncCourier(k)}>{v}</button>
                ))}
              </div>
            </>
          )}
        </div>
        <button className="btn" disabled={cBusy} onClick={showBalance}><Icon name="truck" size={15} /> Courier balance</button>
        <button className="btn" onClick={() => setExp(true)}><Icon name="download" size={15} /> Export CSV</button>
        <button className="btn pri" onClick={() => setNewOrder(true)}><Icon name="plus" size={15} /> New order</button>
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
            <button className="btn sm danger" onClick={deleteBulk}><Icon name="trash" size={14} /> Delete</button>
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
                <div className="flex sp center"><b>{o.order_no}{o.invoice_no ? ` · ${o.invoice_no}` : ''}</b><b>{money(o.total)}</b></div>
                <div className="muted sm">{o.ship_name} · {o.ship_phone}</div>
                <div className="flex gap wrap" style={{ marginTop: 8 }}><Pill o={o} /><Pay o={o} /><span className="muted sm">{dt(o.created_at)}</span><button className="btn sm" onClick={(e) => { e.stopPropagation(); setInv(o.order_no); }}>Invoice</button></div>
              </div>
            )} />
            <Pager page={page} pageSize={PAGE} total={list.data?.total} count={(list.data?.items || []).length} onPage={(p) => { setPage(p); setSel([]); }} />
          </>
        )}
      </div></div>

      {inv && <InvoiceModal orderNo={inv} onClose={() => setInv(null)} />}

      {bal && (
        <Modal title="Courier balance" onClose={() => setBal(null)} footer={<button className="btn" onClick={() => setBal(null)}>Close</button>}>
          {bal.current_balance !== undefined
            ? <div><div className="muted sm">Steadfast currently owes you</div><b style={{ fontSize: 24 }}>{money(bal.current_balance)}</b></div>
            : <pre style={{ background: 'var(--gray-l)', padding: 12, borderRadius: 10, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(bal, null, 2)}</pre>}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line, #e5e7eb)' }}>
            <div className="muted sm">Pathao</div>
            <div className="sm">Pathao does not give the balance through its API. See it in the Pathao merchant panel.</div>
            <a className="btn sm" style={{ marginTop: 8, display: 'inline-flex' }} href="https://merchant.pathao.com" target="_blank" rel="noreferrer">Open Pathao panel</a>
          </div>
        </Modal>
      )}

      {newOrder && <ManualOrderModal onClose={() => setNewOrder(false)} onCreated={(o) => { setNewOrder(false); list.reload(); setOpen(o.order_no); }} />}
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
  const [inv, setInv] = useState('');
  const [track, setTrack] = useState('');
  const [busy, setBusy] = useState(false);
  const [sf, setSf] = useState(null);
  const [extra, setExtra] = useState(null);   // {title, data} for tracking history / customer check
  const [invoice, setInvoice] = useState(false);

  useEffect(() => { if (o) { setStatus(o.status); setCourier(o.courier || ''); setTrack(o.tracking_code || ''); setInv(o.invoice_no || ''); } }, [o]);

  async function save() {
    if (status === 'cancelled' && o.status !== 'cancelled' && !(await confirm({ title: 'Cancel this order?', text: 'Stock will be returned to inventory.', confirmText: 'Cancel order', danger: true }))) return;
    setBusy(true);
    try {
      await api(`/admin/orders/${orderNo}/status`, { method: 'PATCH', body: { status, courier: courier.trim() || null, tracking_code: track.trim() || null, invoice_no: inv.trim() } });
      toast.ok('Order updated'); reload(); onChanged();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function cancelNow() {
    if (!(await confirm({ title: 'Cancel this order?', text: 'The customer asked for it. Stock goes back to inventory.', confirmText: 'Cancel order', danger: true }))) return;
    setBusy(true);
    try { await api(`/admin/orders/${orderNo}/status`, { method: 'PATCH', body: { status: 'cancelled' } }); toast.ok('Order cancelled'); reload(); onChanged(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function deleteOrder() {
    if (!(await confirm({ title: 'Delete this order for good?', text: `${orderNo} will be removed from the database with its items, payments and return request. This cannot be undone.`, confirmText: 'Delete', danger: true }))) return;
    setBusy(true);
    try { await api(`/admin/orders/${orderNo}`, { method: 'DELETE' }); toast.ok('Order deleted'); onChanged(); onClose(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function keepOrder() {
    setBusy(true);
    try { await api(`/admin/orders/${orderNo}/cancel-request/dismiss`, { method: 'POST' }); toast.ok('Cancel request dismissed'); reload(); onChanged(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  const [sendDlg, setSendDlg] = useState(false);
  async function steadfastStatus() {
    try { setSf(await api(`/admin/orders/${orderNo}/courier/status`)); reload(); onChanged(); } catch (e) { toast.error(e.message); }
  }
  async function trackingHistory() {
    try { setExtra({ title: 'Tracking history', data: await api(`/admin/orders/${orderNo}/courier/tracking`) }); } catch (e) { toast.error(e.message); }
  }
  async function customerCheck() {
    try { setExtra({ title: `Customer record (${o.ship_phone})`, data: await api(`/admin/courier/fraud/${o.ship_phone}`) }); } catch (e) { toast.error(e.message); }
  }
  const showInvoice = () => setInvoice(true);

  return (
    <Modal title={`Order ${orderNo}${o && o.invoice_no ? ` · Invoice ${o.invoice_no}` : ''}`} size="wide" onClose={onClose}>
      {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : o && (<>
        {o.cancel_requested && o.status !== 'cancelled' && (
          <div className="infobox" style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ flex: 1, minWidth: 200 }}>The customer asked to cancel this order.</b>
            <button className="btn danger sm" disabled={busy} onClick={cancelNow}>Cancel order</button>
            <button className="btn sm" disabled={busy} onClick={keepOrder}>Keep order</button>
          </div>
        )}
        <Tracker o={o} />
        <div className="grid g2 stack" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
          <div>
            <h4 style={{ marginBottom: 8 }}>Items</h4>
            {o.items.map((i, k) => (
              <div className="list-item" key={k}><div className="grow"><b>{i.name}</b>{i.product_code && <span className="muted sm">Code {i.product_code}</span>}<span className="muted sm">{money(i.unit_price)} × {i.quantity}</span></div><b>{money(i.unit_price * i.quantity)}</b></div>
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
              <span>{methodName(o.payment_method, o.payment_label)}</span>
              <Badge tone={PAYMENT_TONE[o.payment_status]}>{label(o.payment_status)}</Badge>
            </div>
            <h4 style={{ marginBottom: 8 }}>Update order</h4>
            <Field label="Status"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
            <Field label="Invoice no. (optional)" hint="Shown to the customer on the invoice, SMS and order page. Empty = the website's own number."><input className="input" maxLength={40} value={inv} onChange={(e) => setInv(e.target.value)} placeholder={o.order_no} /></Field>
            <div className="row2">
              <Field label="Courier"><input className="input" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Pathao" /></Field>
              <Field label="Tracking code"><input className="input" value={track} onChange={(e) => setTrack(e.target.value)} /></Field>
            </div>
            <div className="flex gap wrap">
              <button className="btn pri" disabled={busy} onClick={save}>Save</button>
              <button className="btn" onClick={showInvoice}><Icon name="print" size={15} /> Invoice</button>
              {!o.tracking_code && !['cancelled', 'delivered'].includes(o.status) && <button className="btn dark" disabled={busy} onClick={() => setSendDlg(true)}><Icon name="truck" size={15} /> Send to courier</button>}
              {['steadfast', 'pathao'].includes(o.courier) && o.tracking_code && <button className="btn" onClick={steadfastStatus}><Icon name="refresh" size={15} /> Courier status</button>}
              {['steadfast', 'pathao'].includes(o.courier) && o.tracking_code && <button className="btn" onClick={trackingHistory}><Icon name="truck" size={15} /> Tracking history</button>}
              <button className="btn" onClick={customerCheck}><Icon name="eye" size={15} /> Check customer</button>
              <button className="btn danger" disabled={busy} onClick={deleteOrder}><Icon name="trash" size={15} /> Delete</button>
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
      </>)}
      {sendDlg && <SendCourier orderNo={orderNo} onClose={() => setSendDlg(false)} onDone={() => { setSendDlg(false); reload(); onChanged(); }} />}
      {invoice && <InvoiceModal orderNo={orderNo} onClose={() => setInvoice(false)} />}
    </Modal>
  );
}

/* ----------------------------- order progress (filled circle = reached) ----------------------------- */
const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const Tracker = FlowTracker;

/* ----------------------------- choose a courier for this order ----------------------------- */
function SendCourier({ orderNo, onClose, onDone }) {
  const toast = useToast();
  const [courier, setCourier] = useState('steadfast');
  const [cities, setCities] = useState(null);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sel, setSel] = useState({ city: '', zone: '', area: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (courier !== 'pathao' || cities) return;
    api('/admin/courier/pathao/cities').then((r) => setCities(Array.isArray(r) ? r : [])).catch((e) => { setCities([]); toast.error(e.message); });
  }, [courier]); // eslint-disable-line react-hooks/exhaustive-deps
  async function pickCity(v) {
    setSel({ city: v, zone: '', area: '' }); setZones([]); setAreas([]);
    if (v) { try { setZones(await api(`/admin/courier/pathao/cities/${v}/zones`)); } catch (e) { toast.error(e.message); } }
  }
  async function pickZone(v) {
    setSel((s) => ({ ...s, zone: v, area: '' })); setAreas([]);
    if (v) { try { setAreas(await api(`/admin/courier/pathao/zones/${v}/areas`)); } catch (e) { toast.error(e.message); } }
  }
  async function send() {
    setBusy(true);
    try {
      const body = { courier };
      if (courier === 'pathao') { if (sel.city) body.city_id = Number(sel.city); if (sel.zone) body.zone_id = Number(sel.zone); if (sel.area) body.area_id = Number(sel.area); }
      const r = await api(`/admin/orders/${orderNo}/courier/send`, { method: 'POST', body });
      toast.ok(`Sent via ${label(r.courier)}. Tracking ${r.tracking_code}`); onDone();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  return (
    <Modal title="Send to courier" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send parcel'}</button></>}>
      <Field label="Courier for this order">
        <div className="flex gap">
          {[['steadfast', 'Steadfast'], ['pathao', 'Pathao']].map(([k, v]) => (
            <label key={k} className="check" style={{ border: `2px solid ${courier === k ? 'var(--pink)' : 'var(--line)'}`, borderRadius: 10, padding: '10px 16px', flex: 1 }}>
              <input type="radio" name="courier" checked={courier === k} onChange={() => setCourier(k)} /> <b>{v}</b>
            </label>
          ))}
        </div>
      </Field>
      {courier === 'pathao' && (
        <>
          <div className="muted sm" style={{ marginBottom: 8 }}>City / zone / area are optional: leave them empty and Pathao reads the address. Pick them if Pathao says it cannot find the area.</div>
          {!cities ? <Loading /> : (
            <div className="row2">
              <Field label="City"><select className="input" value={sel.city} onChange={(e) => pickCity(e.target.value)}><option value="">Auto</option>{cities.map((c) => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}</select></Field>
              <Field label="Zone"><select className="input" value={sel.zone} disabled={!zones.length} onChange={(e) => pickZone(e.target.value)}><option value="">Auto</option>{zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}</select></Field>
            </div>
          )}
          {areas.length > 0 && <Field label="Area"><select className="input" value={sel.area} onChange={(e) => setSel((s) => ({ ...s, area: e.target.value }))}><option value="">Auto</option>{areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}</select></Field>}
        </>
      )}
      <div className="muted sm">Cash to collect is the order total for unpaid (COD) orders and 0 for paid ones. The order becomes “Shipped”.</div>
    </Modal>
  );
}
