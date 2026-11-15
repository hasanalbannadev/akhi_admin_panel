'use client';
/** Send a product card from a chat: Messenger / Instagram = card with picture + "View & order" button, WhatsApp = catalog product (or photo + link). */
import { useEffect, useState } from 'react';
import { Empty } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';

export default function ChatProductPicker({ thread, onClose, onSent }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(0);

  useEffect(() => {
    let live = true;
    const h = setTimeout(() => {
      api(`/admin/meta-catalog/products?q=${encodeURIComponent(q)}`).then((r) => live && setItems(r.items)).catch((e) => { toast.error(e.message); live && setItems([]); });
    }, 250);
    return () => { live = false; clearTimeout(h); };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(p) {
    setBusy(p.id);
    try { await api(`/admin/chat/threads/${thread.id}/send-product`, { method: 'POST', body: { product_id: p.id } }); toast.ok('Product sent'); onSent(); }
    catch (e) { toast.error(e.message); } finally { setBusy(0); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,18,40,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 460, maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="flex center sp" style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
          <b>Send a product</b>
          <button type="button" className="btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '10px 14px 6px' }}><input className="input" style={{ width: '100%' }} placeholder="Search product or SKU…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
        <div style={{ overflowY: 'auto', padding: '0 14px 12px' }}>
          {items === null ? <div className="muted sm" style={{ padding: 12 }}>Loading…</div>
            : items.length === 0 ? <Empty icon="search" text="No product" />
              : items.map((p) => (
                <div key={p.id} className="flex center gap" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                  {p.image ? <img src={p.image} alt="" width={44} height={44} style={{ objectFit: 'cover', borderRadius: 8, flex: '0 0 44px' }} /> : <span style={{ width: 44, height: 44, borderRadius: 8, background: '#eee', flex: '0 0 44px' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><b>{p.name}</b></div>
                    <div className="muted sm">{p.price} Tk{p.stock <= 0 ? ' · out of stock' : ''}</div>
                  </div>
                  <button type="button" className="btn pri" disabled={busy === p.id} onClick={() => send(p)}>{busy === p.id ? '…' : 'Send'}</button>
                </div>))}
        </div>
      </div>
    </div>
  );
}
