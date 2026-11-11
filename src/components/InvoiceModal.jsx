'use client';
/**
 * InvoiceModal — invoice of ANY order (by order number): view, print, download PDF, share.
 * API: GET /admin/orders/{no}/invoice
 */
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Loading, Modal } from '@/components/ui';
import { useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { dt, label, methodName, money } from '@/lib/format';
import { downloadInvoice, shareInvoice } from '@/lib/invoicePdf';

const SHOP = { name: 'Akhi Lifestyle', phone: '', email: '' };

export default function InvoiceModal({ orderNo, onClose }) {
  const toast = useToast();
  const [inv, setInv] = useState(null);
  const [busy, setBusy] = useState(false);
  const [withCourier, setWithCourier] = useState(true);
  const view = inv && !withCourier ? { ...inv, courier: null, consignment_id: null } : inv;

  useEffect(() => {
    let live = true;
    api(`/admin/orders/${orderNo}/invoice`).then((r) => live && setInv(r)).catch((e) => { toast.error(e.message); onClose(); });
    return () => { live = false; };
  }, [orderNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => { try { downloadInvoice(view, SHOP); } catch (e) { toast.error('Could not create the PDF'); } };
  async function share() {
    setBusy(true);
    try {
      const r = await shareInvoice(view, SHOP);
      if (r === 'downloaded') toast.ok('Sharing is not supported here — PDF downloaded');
    } catch (e) { toast.error('Could not share the invoice'); } finally { setBusy(false); }
  }

  return (
    <Modal title={inv ? `Invoice ${inv.invoice_no}` : `Invoice ${orderNo}`} onClose={onClose}
      footer={inv && (
        <>
          {inv.tracking_code && <label className="sm no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}><input type="checkbox" checked={withCourier} onChange={(e) => setWithCourier(e.target.checked)} /> Courier info</label>}
          <button className="btn sm" onClick={download}><Icon name="download" size={15} /> Download</button>
          <button className="btn sm" disabled={busy} onClick={share}><Icon name="send" size={15} /> Share</button>
          <button className="btn sm pri" onClick={() => window.print()}><Icon name="print" size={15} /> Print</button>
        </>
      )}>
      {!inv ? <Loading /> : (
        <div id="invoice">
          <div className="flex sp"><div><b style={{ fontSize: 18 }}>{SHOP.name}</b><div className="muted sm">Invoice {inv.invoice_no}</div>{inv.invoice_no !== orderNo && <div className="muted sm">Site order no. {orderNo}</div>}</div><div className="muted sm">{dt(inv.date)}</div></div>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
          <div className="sm"><b>{inv.customer.name}</b> · {inv.customer.phone}<br />{inv.ship_to.address}, {inv.ship_to.area ? `${inv.ship_to.area}, ` : ''}{inv.ship_to.district}</div>
          <table className="tbl compact" style={{ margin: '14px 0', minWidth: 0 }}>
            <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Total</th></tr></thead>
            <tbody>{inv.items.map((i, k) => <tr key={k}><td>{i.name}</td><td className="r">{i.quantity}</td><td className="r">{money(i.unit_price)}</td><td className="r">{money(i.line_total)}</td></tr>)}</tbody>
          </table>
          <div className="sum-row"><span>Subtotal</span><span>{money(inv.subtotal)}</span></div>
          {inv.discount > 0 && <div className="sum-row"><span>Discount{inv.coupon_code ? ` (${inv.coupon_code})` : ''}</span><span>−{money(inv.discount)}</span></div>}
          <div className="sum-row"><span>Shipping</span><span>{money(inv.shipping_fee)}</span></div>
          <div className="sum-row tot"><span>Total</span><span>{money(inv.total)}</span></div>
          <div className="muted sm" style={{ marginTop: 10 }}>{methodName(inv.payment_method, inv.payment_label)} · {label(inv.payment_status)}</div>
          {view.tracking_code && <div className="muted sm" style={{ marginTop: 4 }}>{view.courier ? <>Courier: <b>{label(view.courier)}</b> · </> : null}Tracking: <b>{view.tracking_code}</b>{view.consignment_id ? <> · Consignment: <b>{view.consignment_id}</b></> : null}</div>}
        </div>
      )}
    </Modal>
  );
}
