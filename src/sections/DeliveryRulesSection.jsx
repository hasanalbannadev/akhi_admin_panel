'use client';
/**
 * DELIVERY RULES — free / extra delivery per product, per payment method, and free-delivery coupons.
 * The normal zone fees (Delivery Zones page) are NOT changed; these rules only adjust them.
 * APIs: GET/PUT /admin/delivery-rules
 */
import { useEffect, useState } from 'react';
import { Badge, Empty, ErrorBox, Loading, Pager, SearchBox } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';

const PER = 20;
const LABEL = { cod: 'Cash on delivery', sslcommerz: 'Card / online (SSLCommerz)', manual_bkash: 'bKash (manual)', manual_nagad: 'Nagad (manual)' };

export default function DeliveryRulesSection() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api('/admin/delivery-rules'), []);
  const [r, setR] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (data) { setR(JSON.parse(JSON.stringify(data.rules))); setDirty(false); } }, [data]);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data || !r) return <Loading />;

  const upd = (fn) => { const n = JSON.parse(JSON.stringify(r)); fn(n); setR(n); setDirty(true); };
  const method = (m) => r.methods[m] || { mode: 'normal', amount: 0 };
  const setMethod = (m, patch) => upd((n) => { n.methods[m] = { ...method(m), ...patch }; });
  const toggleFree = (id) => upd((n) => { n.free_products = n.free_products.includes(id) ? n.free_products.filter((x) => x !== id) : [...n.free_products, id]; });
  const setExtra = (id, v) => upd((n) => { const a = parseFloat(v); if (a > 0) n.extra_products[id] = a; else delete n.extra_products[id]; });
  const toggleCoupon = (c) => upd((n) => { n.free_coupons = n.free_coupons.includes(c) ? n.free_coupons.filter((x) => x !== c) : [...n.free_coupons, c]; });

  const list = data.products.filter((p) => (p.name + ' ' + p.id).toLowerCase().includes(q.toLowerCase()));
  const view = list.slice((page - 1) * PER, page * PER);
  const nFree = r.free_products.length, nExtra = Object.keys(r.extra_products).length;

  async function save() {
    setBusy(true);
    try { await api('/admin/delivery-rules', { method: 'PUT', body: r }); toast.ok('Saved — checkout uses it now'); setDirty(false); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <div className="flex sp center gap wrap">
          <div>
            <b>Delivery rules</b> {dirty && <Badge tone="amber">Unsaved</Badge>}
            <div className="muted sm">Your zone fees stay as they are. Rules below only make delivery free or add a charge. Nothing set = nothing changes.</div>
            <div className="muted sm">Order of checking: free coupon → free delivery → extra charges added.</div>
          </div>
          <button className="btn pri" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save rules'}</button>
        </div>
      </div></div>

      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <b>1. Payment method</b>
        <div className="muted sm" style={{ marginBottom: 8 }}>e.g. bKash / card = free delivery, Cash on delivery = +20 Tk.</div>
        {data.payment_methods.map((m) => (
          <div key={m} className="flex gap center wrap" style={{ marginBottom: 8 }}>
            <span style={{ minWidth: 190 }}>{LABEL[m] || m}</span>
            <select className="input" style={{ maxWidth: 220 }} value={method(m).mode} onChange={(e) => setMethod(m, { mode: e.target.value })}>
              <option value="normal">Normal zone fee</option>
              <option value="free">Free delivery</option>
              <option value="extra">Extra charge</option>
            </select>
            {method(m).mode === 'extra' && <><input className="input" type="number" min="0" style={{ maxWidth: 110 }} value={method(m).amount} onChange={(e) => setMethod(m, { amount: parseFloat(e.target.value) || 0 })} /> <span className="muted sm">Tk added</span></>}
          </div>
        ))}
      </div></div>

      <div className="card" style={{ marginBottom: 14 }}><div className="bd">
        <b>2. Free-delivery coupons</b>
        <div className="muted sm" style={{ marginBottom: 8 }}>A valid coupon ticked here makes the whole delivery free. Create coupons on the Coupons page.</div>
        {data.coupons.length === 0 ? <span className="muted sm">No coupons yet.</span> : (
          <div className="flex gap wrap">{data.coupons.map((c) => (
            <label key={c} className="flex gap center sm" style={{ border: '1px solid #ddd', borderRadius: 8, padding: '4px 10px' }}>
              <input type="checkbox" checked={r.free_coupons.includes(c)} onChange={() => toggleCoupon(c)} /> {c}
            </label>))}
          </div>
        )}
      </div></div>

      <div className="card"><div className="bd">
        <div className="flex sp center gap wrap">
          <div>
            <b>3. Products</b> <Badge tone="green">{nFree} free</Badge> <Badge>{nExtra} extra</Badge>
            <div className="muted sm">Free: the cart gets free delivery only when every item in it is free. Extra: added once per product in the cart.</div>
          </div>
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search product…" />
        </div>
        {list.length === 0 ? <Empty icon="search" text="No product" /> : (
          <div style={{ marginTop: 10 }}>
            {view.map((p) => (
              <div key={p.id} className="flex gap center wrap" style={{ padding: '8px 0', borderTop: '1px solid #eee' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}><b>{p.name}</b><div className="muted sm">{p.price} Tk</div></div>
                <label className="flex gap center sm"><input type="checkbox" checked={r.free_products.includes(p.id)} onChange={() => toggleFree(p.id)} /> Free delivery</label>
                <label className="flex gap center sm">Extra Tk <input className="input" type="number" min="0" style={{ width: 90 }} value={r.extra_products[p.id] || ''} placeholder="0" onChange={(e) => setExtra(p.id, e.target.value)} /></label>
              </div>
            ))}
            <Pager page={page} pageSize={PER} total={list.length} count={view.length} onPage={setPage} />
          </div>
        )}
      </div></div>
    </div>
  );
}
