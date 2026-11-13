'use client';
/**
 * PRODUCT ORDERS — which product was ordered how many times, split by order status.
 * Read-only report. API: GET /admin/reports/product-orders?date_from=&date_to=&status=&q=&all_time=
 * Dates are Bangladesh time; the default is today.
 */
import { useEffect, useState } from 'react';
import { Badge, DataTable, Empty, ErrorBox, Loading, SearchBox, Thumb } from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { money } from '@/lib/format';

const TONE = { pending: 'amber', confirmed: 'blue', processing: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red', returned: 'gray' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const bdDay = (plus = 0) => new Date(Date.now() + 6 * 3600e3 + plus * 86400e3).toISOString().slice(0, 10);

export default function ProductOrdersSection() {
  const [from, setFrom] = useState(bdDay());
  const [to, setTo] = useState(bdDay());
  const [all, setAll] = useState(false);
  const [status, setStatus] = useState('');
  const [qIn, setQIn] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(qIn.trim()), 350); return () => clearTimeout(t); }, [qIn]);

  const { data, loading, error, reload } = useAsync(
    () => api('/admin/reports/product-orders', { query: { date_from: from, date_to: to, status, q, all_time: all } }),
    [from, to, status, q, all], { every: 15000 });

  const range = (a, b) => { setAll(false); setFrom(bdDay(a)); setTo(bdDay(b)); };
  const label = all ? 'All time' : from === to ? (from === bdDay() ? 'Today' : from === bdDay(-1) ? 'Yesterday' : from) : `${from} to ${to}`;
  const sts = data?.statuses || [];
  const rows = data?.products || [];
  const tot = data?.totals;

  const columns = [
    { h: 'Product', cell: (p) => (
      <div className="flex gap center"><Thumb src={p.image} /><div><b>{p.name}</b>{p.sku ? <div className="muted sm">Product code {p.sku}</div> : null}</div></div>) },
    { h: 'Orders', cell: (p) => <b>{p.orders}</b> },
    { h: 'Pieces', cell: (p) => <b>{p.qty}</b> },
    ...sts.map((s) => ({ h: cap(s), cell: (p) => (p.by_status[s] ? <div>{p.by_status[s].qty}<div className="muted sm">{p.by_status[s].orders} order{p.by_status[s].orders > 1 ? 's' : ''}</div></div> : <span className="muted">—</span>) })),
    { h: 'Sales', cell: (p) => money(p.revenue) },
  ];

  return (
    <div>
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button className={`btn sm ${!all && from === bdDay() && to === bdDay() ? 'pri' : ''}`} onClick={() => range(0, 0)}>Today</button>
        <button className={`btn sm ${!all && from === bdDay(-1) && to === bdDay(-1) ? 'pri' : ''}`} onClick={() => range(-1, -1)}>Yesterday</button>
        <button className={`btn sm ${!all && from === bdDay(-6) && to === bdDay() ? 'pri' : ''}`} onClick={() => range(-6, 0)}>Last 7 days</button>
        <button className={`btn sm ${!all && from === bdDay(-29) && to === bdDay() ? 'pri' : ''}`} onClick={() => range(-29, 0)}>Last 30 days</button>
        <button className={`btn sm ${!all && from === bdDay(-89) && to === bdDay() ? 'pri' : ''}`} onClick={() => range(-89, 0)}>Last 90 days</button>
        <button className={`btn sm ${!all && from === bdDay(-364) && to === bdDay() ? 'pri' : ''}`} onClick={() => range(-364, 0)}>Last 365 days</button>
        <button className={`btn sm ${all ? 'pri' : ''}`} onClick={() => setAll(true)}>All time</button>
        <div className="grow" />
        <span className="muted sm">Custom:</span>
        <input className="input" type="date" value={from} onChange={(e) => { setAll(false); setFrom(e.target.value || bdDay()); }} style={{ width: 150 }} aria-label="From" />
        <input className="input" type="date" value={to} onChange={(e) => { setAll(false); setTo(e.target.value || bdDay()); }} style={{ width: 150 }} aria-label="To" />
      </div>
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 170 }} aria-label="Status">
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select>
        <div style={{ flex: 1, minWidth: 200 }}><SearchBox value={qIn} onChange={setQIn} placeholder="Search product name or code…" /></div>
      </div>
      <ErrorBox error={error} onRetry={reload} />

      {tot && (
        <div className="card" style={{ marginBottom: 12 }}><div className="bd">
          <div className="muted sm" style={{ marginBottom: 8 }}>{label} · {data.product_count} product{data.product_count === 1 ? '' : 's'}</div>
          <div className="flex gap" style={{ flexWrap: 'wrap' }}>
            <Badge tone="pink">{tot.orders} orders</Badge>
            <Badge tone="gray">{tot.qty} pieces</Badge>
            {sts.map((s) => <Badge key={s} tone={TONE[s] || 'gray'}>{cap(s)}: {tot.by_status[s].orders} orders · {tot.by_status[s].qty} pcs</Badge>)}
          </div>
        </div></div>
      )}

      <div className="card flush"><div className="bd">
        {loading && !data ? <Loading /> : rows.length === 0 ? <Empty icon="box" text="No orders for this period" /> : (
          <DataTable columns={columns} rows={rows} rowKey="product_id" mobile={(p) => (
            <div>
              <div className="flex gap center"><Thumb src={p.image} /><div><b>{p.name}</b>{p.sku ? <div className="muted sm">Product code {p.sku}</div> : null}</div></div>
              <div className="flex gap" style={{ flexWrap: 'wrap', margin: '8px 0 0' }}>
                <Badge tone="pink">{p.orders} orders</Badge><Badge tone="gray">{p.qty} pcs</Badge>
                {sts.filter((s) => p.by_status[s]).map((s) => <Badge key={s} tone={TONE[s] || 'gray'}>{cap(s)}: {p.by_status[s].qty}</Badge>)}
              </div>
            </div>
          )} />
        )}
      </div></div>
    </div>
  );
}
