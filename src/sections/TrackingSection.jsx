'use client';
/**
 * ORDER TRACKING — type an order ID (or phone / tracking code) and see the whole journey as one long line of
 * circles: filled = reached, empty = still to come. Covers delivery, courier return, customer return and refund.
 * APIs: GET /admin/orders?q=&page_size=8 · GET /admin/orders/{no}/courier/status (refresh from the courier)
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import FlowTracker from '@/components/FlowTracker';
import { Badge, Empty, ErrorBox, Loading } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync, useDebounce } from '@/lib/hooks';
import { ORDER_TONE, courierTone, dt, label, methodName, money } from '@/lib/format';

export default function TrackingSection() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 300);
  const { data, loading, error, reload } = useAsync(() => api('/admin/orders', { query: { q: dq || undefined, page_size: dq ? 8 : 5 } }), [dq]);
  const [busy, setBusy] = useState('');
  const rows = data?.items || [];

  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) reload(); }, 15000);   // live
    return () => clearInterval(t);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(o) {
    setBusy(o.order_no);
    try { await api(`/admin/orders/${o.order_no}/courier/status`); reload(); toast.ok('Courier status refreshed'); }
    catch (e) { toast.error(e.message); } finally { setBusy(''); }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <div className="searchbig" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="search" size={20} />
          <input className="input" autoFocus value={q} onChange={(e) => setQ(e.target.value.trim())} placeholder="Type an Order ID, phone number or tracking code…" aria-label="Search order" style={{ flex: 1, minWidth: 0, fontSize: 16 }} />
        </div>
        <div className="muted sm" style={{ marginTop: 8 }}>{dq ? `Results for “${dq}”` : 'Latest orders (type above to search any order)'}</div>
      </div></div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : rows.length === 0 ? <div className="card"><Empty icon="search" text="No order found" /></div> : rows.map((o) => {
        const ri = o.return_info;
        return (
          <div className="card" key={o.order_no} style={{ marginBottom: 14 }}><div className="bd">
            <div className="flex sp center wrap gap">
              <div>
                <Link href={`/orders?open=${o.order_no}`} className="bold" style={{ fontSize: 17 }}>{o.order_no}</Link>
                <div className="muted sm">{o.ship_name} · {o.ship_phone} · {o.ship_district} · {dt(o.created_at)}</div>
              </div>
              <div className="flex gap center wrap">
                <Badge tone={ORDER_TONE[o.status]}>{label(o.status)}</Badge>
                {o.cancel_requested && o.status !== 'cancelled' && <Badge tone="red">Cancel requested</Badge>}
                <b>{money(o.total)}</b>
              </div>
            </div>
            <FlowTracker o={o} />
            <div className="flex gap wrap sm">
              <span><span className="muted">Payment: </span>{methodName(o.payment_method, o.payment_label)} · {label(o.payment_status)}</span>
              {o.courier && <span><span className="muted">Courier: </span><b>{label(o.courier)}</b></span>}
              {o.tracking_code && <span><span className="muted">Tracking: </span><b>{o.tracking_code}</b></span>}
              {o.courier_status && <span><span className="muted">Courier status: </span><Badge tone={courierTone(o.courier_status)}>{label(o.courier_status)}</Badge></span>}
            </div>
            {ri && (
              <div className="infobox" style={{ marginTop: 10 }}>
                <b>Return:</b> {ri.status_bn || label(ri.status)} · refund to bKash <b>{ri.refund_bkash || '—'}</b>
                {ri.courier && <> · {label(ri.courier)}{ri.courier_status ? ` (${label(ri.courier_status)})` : ''}</>}
                {ri.status === 'refunded' && <> · TrxID <b>{ri.refund_trx}</b></>}
                {' '}<Link href="/returns" style={{ textDecoration: 'underline' }}>Manage</Link>
              </div>
            )}
            <div className="flex gap wrap" style={{ marginTop: 10 }}>
              <Link className="btn sm" href={`/orders?open=${o.order_no}`}><Icon name="eye" size={14} /> Open order</Link>
              {o.courier && o.tracking_code && <button className="btn sm" disabled={busy === o.order_no} onClick={() => refresh(o)}><Icon name="refresh" size={14} /> {busy === o.order_no ? 'Checking…' : 'Refresh from courier'}</button>}
            </div>
          </div></div>
        );
      })}
    </div>
  );
}
