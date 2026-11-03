'use client';
/**
 * RETURNS & REFUNDS — approve a return, send it to the courier, mark "Return Successful", then refund by bKash.
 * APIs: GET /admin/returns?status=&q= · PATCH /admin/returns/{id}  body {status, note, courier_status, refund_trx, refund_sender, refund_amount}
 *       POST /admin/returns/{id}/courier {courier}
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, ErrorBox, Field, Loading, Modal, SearchBox } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync, useDebounce } from '@/lib/hooks';
import { RETURN_TONE, dt, label, money } from '@/lib/format';

const STEPS = [['requested', 'Requested'], ['approved', 'Approved'], ['pickup', 'Courier pickup'], ['received', 'Return successful'], ['refunded', 'Refund completed']];
const PICKUP = [['pickup_pending', 'Pickup pending'], ['picked_up', 'Picked up'], ['on_the_way', 'On the way'], ['at_hub', 'At hub']];

function Steps({ status }) {
  const at = STEPS.findIndex(([k]) => k === status);
  return (
    <div className="tracker" style={{ margin: '10px 0' }}>
      {STEPS.map(([k, t], i) => (
        <div key={k} className={`st ${i <= at ? 'done' : ''} ${i === at ? 'cur' : ''}`}><span className="dotc">{i <= at ? <Icon name="check" size={12} /> : null}</span><small>{t}</small></div>
      ))}
    </div>
  );
}

export default function ReturnsSection() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 350);
  const [dlg, setDlg] = useState(null);          // { r, action }
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  const [geo, setGeo] = useState({ cities: null, zones: [], areas: [], city: '', zone: '', area: '' });   // Pathao pickup address
  const list = useAsync(() => api('/admin/returns', { query: { status, q: dq || undefined } }), [status, dq]);
  const rows = list.data || [];

  function ask(r, action) {
    setDlg({ r, action });
    setF({ note: r.admin_note || '', restock: true, courier: r.courier || 'steadfast', trx: '', sender: '', amount: r.total || '' });
  }
  useEffect(() => {
    if (dlg?.action !== 'courier' || f.courier !== 'pathao' || geo.cities) return;
    api('/admin/courier/pathao/cities').then((r) => setGeo((g) => ({ ...g, cities: Array.isArray(r) ? r : [] }))).catch((e) => { setGeo((g) => ({ ...g, cities: [] })); toast.error(e.message); });
  }, [dlg, f.courier]); // eslint-disable-line react-hooks/exhaustive-deps
  async function pickCity(v) {
    setGeo((g) => ({ ...g, city: v, zone: '', area: '', zones: [], areas: [] }));
    if (v) { try { const z = await api(`/admin/courier/pathao/cities/${v}/zones`); setGeo((g) => ({ ...g, zones: z })); } catch (e) { toast.error(e.message); } }
  }
  async function pickZone(v) {
    setGeo((g) => ({ ...g, zone: v, area: '', areas: [] }));
    if (v) { try { const a = await api(`/admin/courier/pathao/zones/${v}/areas`); setGeo((g) => ({ ...g, areas: a })); } catch (e) { toast.error(e.message); } }
  }
  async function patch(r, body, ok) {
    setBusy(true);
    try { await api(`/admin/returns/${r.id}`, { method: 'PATCH', body }); toast.ok(ok); setDlg(null); list.reload(); window.dispatchEvent(new CustomEvent('badges-refresh')); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function submit() {
    const { r, action } = dlg;
    if (action === 'courier') {
      if (f.courier === 'pathao' && !(geo.city && geo.zone && geo.area)) return toast.error("Choose the customer's city, zone and area");
      setBusy(true);
      try {
        const res = await api(`/admin/returns/${r.id}/courier`, { method: 'POST', body: { courier: f.courier, ...(f.courier === 'pathao' ? { city_id: Number(geo.city), zone_id: Number(geo.zone), area_id: Number(geo.area) } : {}) } });
        toast.ok('Return pickup booked with the courier');
        setDlg(null); list.reload();
      } catch (e) { toast.error(e.message); } finally { setBusy(false); }
      return;
    }
    if (action === 'refunded') {
      if ((f.trx || '').trim().length < 6) return toast.error('Enter the bKash TrxID');
      if (!/^01[3-9]\d{8}$/.test(f.sender || '')) return toast.error('Enter the shop bKash number you sent from (11 digits)');
      return patch(r, { status: 'refunded', note: f.note.trim() || null, refund_trx: f.trx.trim(), refund_sender: f.sender, refund_amount: Number(f.amount) || undefined }, 'Refund completed, customer notified by SMS');
    }
    return patch(r, { status: action, note: f.note.trim() || null }, action === 'received' ? 'Return successful, customer notified by SMS' : `Return ${action}`);
  }

  const title = { approved: 'Approve return', rejected: 'Reject return', received: 'Return successful', refunded: 'Refund completed', courier: 'Send return to courier' };

  return (
    <div>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Order no or phone" />
        <div className="tabs">
          {[['', 'All'], ['requested', 'Requested'], ['approved', 'Approved'], ['pickup', 'Pickup'], ['received', 'To refund'], ['refunded', 'Refunded'], ['rejected', 'Rejected']].map(([k, t]) => (
            <button key={t} className={`tab ${status === k ? 'on' : ''}`} onClick={() => setStatus(k)}>{t}</button>))}
        </div>
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      <div className="grid">
        {list.loading && !list.data ? <Loading /> : rows.length === 0 ? <div className="card"><Empty icon="undo" text="No return requests" /></div> : rows.map((r) => (
          <div className="card" key={r.id}><div className="bd">
            <div className="flex sp center wrap gap">
              <div><Link href={`/orders?open=${r.order_no}`} className="bold">{r.order_no}</Link> <span className="muted sm">· {r.customer} · {r.phone} · {money(r.total)} · {dt(r.created_at)}</span></div>
              <Badge tone={RETURN_TONE[r.status]}>{r.status === 'received' ? 'Return successful' : r.status === 'refunded' ? 'Refund completed' : label(r.status)}</Badge>
            </div>
            {r.status !== 'rejected' && <Steps status={r.status} />}
            <div style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}><span className="muted">Reason: </span>{r.reason}</div>
            <div className="flex gap wrap sm" style={{ margin: '6px 0' }}>
              <span><span className="muted">Refund to bKash: </span><b>{r.refund_bkash || '—'}</b></span>
              {r.courier && <span><span className="muted">Courier: </span><b>{label(r.courier)}</b>{r.courier_status && <> · {label(r.courier_status)}</>}</span>}
            </div>
            {r.status === 'refunded' && <div className="infobox">Refunded {money(r.refund_amount)} · TrxID <b>{r.refund_trx}</b> · from {r.refund_sender} · {dt(r.refunded_at)}</div>}
            {r.admin_note && <div className="muted sm">Your note: {r.admin_note}</div>}
            <div className="flex gap wrap" style={{ marginTop: 10 }}>
              {r.status === 'requested' && <>
                <button className="btn sm ok" onClick={() => ask(r, 'approved')}><Icon name="check" size={14} /> Approve</button>
                <button className="btn sm danger" onClick={() => ask(r, 'rejected')}><Icon name="x" size={14} /> Reject</button>
              </>}
              {r.status === 'approved' && <>
                <button className="btn sm dark" onClick={() => ask(r, 'courier')}><Icon name="truck" size={14} /> Send to courier (pickup)</button>
                <button className="btn sm ok" onClick={() => ask(r, 'received')}><Icon name="check" size={14} /> Return successful</button>
                <button className="btn sm danger" onClick={() => ask(r, 'rejected')}><Icon name="x" size={14} /> Reject</button>
              </>}
              {r.status === 'pickup' && <>
                <select className="input sm" style={{ width: 'auto' }} value={r.courier_status || 'pickup_pending'} onChange={(e) => patch(r, { courier_status: e.target.value }, 'Pickup status updated')}>
                  {PICKUP.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                </select>
                <button className="btn sm ok" onClick={() => ask(r, 'received')}><Icon name="check" size={14} /> Return successful</button>
              </>}
              {r.status === 'received' && <button className="btn sm pri" onClick={() => ask(r, 'refunded')}><Icon name="wallet" size={14} /> Refund (bKash)</button>}
            </div>
          </div></div>
        ))}
      </div>

      {dlg && (
        <Modal title={`${title[dlg.action]} — ${dlg.r.order_no}`} onClose={() => setDlg(null)}
          footer={<><button className="btn" onClick={() => setDlg(null)}>Cancel</button>
            <button className={`btn ${dlg.action === 'rejected' ? 'danger' : 'pri'}`} disabled={busy} onClick={submit}>{busy ? 'Saving…' : dlg.action === 'refunded' ? 'Completed Refunded' : 'Confirm'}</button></>}>
          {dlg.action === 'courier' && <>
            <Field label="Courier"><select className="input" value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value })}><option value="steadfast">Steadfast</option><option value="pathao">Pathao</option></select></Field>
            {f.courier === 'pathao' && (
              <>
                <div className="muted sm" style={{ marginBottom: 8 }}>Pick the <b>customer's</b> address area. The rider collects the parcel there and brings it to your shop (set SHOP_PHONE / SHOP_ADDRESS in .env). Status then updates by itself.</div>
                {!geo.cities ? <Loading /> : (
                  <div className="row2">
                    <Field label="City"><select className="input" value={geo.city} onChange={(e) => pickCity(e.target.value)}><option value="">Select</option>{geo.cities.map((c) => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}</select></Field>
                    <Field label="Zone"><select className="input" value={geo.zone} disabled={!geo.zones.length} onChange={(e) => pickZone(e.target.value)}><option value="">Select</option>{geo.zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}</select></Field>
                  </div>
                )}
                {geo.areas.length > 0 && <Field label="Area"><select className="input" value={geo.area} onChange={(e) => setGeo((g) => ({ ...g, area: e.target.value }))}><option value="">Select</option>{geo.areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}</select></Field>}
              </>
            )}
            {f.courier === 'steadfast' && <div className="infobox">A return request is created through the Steadfast API for the original parcel.</div>}
          </>}
          {dlg.action === 'received' && <div className="infobox">The customer gets the "Return successful" SMS, the order becomes Returned and the items go back to stock.</div>}
          {dlg.action === 'refunded' && <>
            <div className="infobox">Send <b>{money(f.amount)}</b> to the customer's bKash number <b style={{ fontSize: 16 }}>{dlg.r.refund_bkash || '—'}</b>, then fill in the proof below. The amount is deducted from revenue.</div>
            <Field label="Refund amount (৳)"><input className="input" type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="bKash TrxID *"><input className="input" value={f.trx} onChange={(e) => setF({ ...f, trx: e.target.value.toUpperCase() })} placeholder="e.g. BK12AB34CD" /></Field>
            <Field label="Your bKash number you sent from *"><input className="input" inputMode="numeric" maxLength={11} value={f.sender} onChange={(e) => setF({ ...f, sender: e.target.value.replace(/\D/g, '') })} placeholder="01XXXXXXXXX" /></Field>
          </>}
          <Field label="Note (optional, customer can see it)"><textarea className="input" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
