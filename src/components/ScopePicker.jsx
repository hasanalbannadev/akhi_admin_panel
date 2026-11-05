'use client';
/**
 * ScopePicker — "applies to": all products / selected products / selected categories.
 * Shared by Coupons and Offers. value = { scope, product_ids, category_ids }.
 * APIs: GET /admin/products?q= · GET /admin/categories
 */
import { useEffect, useState } from 'react';
import { Field, Loading } from '@/components/ui';
import { api, assetUrl } from '@/lib/api';
import { money } from '@/lib/format';

export default function ScopePicker({ value, onChange, allowAll = true }) {
  const { scope, product_ids: pids, category_ids: cids } = value;
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [cats, setCats] = useState(null);
  const [names, setNames] = useState({});

  useEffect(() => {
    if (scope !== 'products') return undefined;
    let live = true;
    const t = setTimeout(() => {
      api('/admin/products', { query: { page_size: 50, ...(q.trim() ? { q: q.trim() } : {}) } })
        .then((r) => { if (!live) return; const list = r.items || []; setItems(list); setNames((n) => ({ ...n, ...Object.fromEntries(list.map((p) => [p.id, p.name])) })); })
        .catch(() => live && setItems([]));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [scope, q]);
  useEffect(() => {
    if (scope === 'categories' && !cats) api('/admin/categories').then((r) => setCats(Array.isArray(r) ? r : [])).catch(() => setCats([]));
  }, [scope, cats]);

  const put = (patch) => onChange({ scope, product_ids: pids, category_ids: cids, ...patch });
  const tog = (key, list, id) => put({ [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  const opts = [...(allowAll ? [['all', 'All products']] : []), ['products', 'Selected products'], ['categories', 'Selected categories']];

  return (
    <Field label="Applies to" hint="All = every product, including ones added later.">
      <div className="flex gap" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
        {opts.map(([k, v]) => (
          <label key={k} className="check" style={{ border: `2px solid ${scope === k ? 'var(--pink)' : 'var(--line)'}`, borderRadius: 10, padding: '8px 12px' }}>
            <input type="radio" name="scope" checked={scope === k} onChange={() => put({ scope: k })} /> <b>{v}</b>
          </label>
        ))}
      </div>

      {scope === 'products' && (
        <>
          <input className="input" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="muted sm" style={{ margin: '6px 0' }}>
            {pids.length} selected
            {pids.length > 0 && <> · <button type="button" className="btn sm" onClick={() => put({ product_ids: [] })}>Clear</button></>}
          </div>
          {pids.length > 0 && (
            <div className="flex gap" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
              {pids.map((id) => <button type="button" key={id} className="btn sm" onClick={() => tog('product_ids', pids, id)} title="Remove">{names[id] || `#${id}`} ✕</button>)}
            </div>
          )}
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            {!items ? <Loading /> : items.length === 0 ? <div className="muted sm" style={{ padding: 14 }}>No products found</div> : items.map((p) => (
              <label key={p.id} className="check" style={{ display: 'flex', width: '100%', padding: '8px 10px', borderBottom: '1px solid var(--line)', gap: 10 }}>
                <input type="checkbox" checked={pids.includes(p.id)} onChange={() => tog('product_ids', pids, p.id)} />
                <span className="thumb">{p.images?.[0] ? <img src={assetUrl(p.images[0].url)} alt="" /> : null}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span className="muted sm">{money(p.price)}</span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}

      {scope === 'categories' && (
        !cats ? <Loading /> : (
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            {cats.length === 0 ? <div className="muted sm" style={{ padding: 14 }}>No categories</div> : cats.map((c) => (
              <label key={c.id} className="check" style={{ display: 'flex', width: '100%', padding: '8px 10px', borderBottom: '1px solid var(--line)', gap: 10 }}>
                <input type="checkbox" checked={cids.includes(c.id)} onChange={() => tog('category_ids', cids, c.id)} />
                <span>{c.parent_id ? '↳ ' : ''}{c.name}</span>
              </label>
            ))}
            <div className="muted sm" style={{ padding: 8 }}>Sub-categories of a chosen category are included automatically.</div>
          </div>
        )
      )}
    </Field>
  );
}
