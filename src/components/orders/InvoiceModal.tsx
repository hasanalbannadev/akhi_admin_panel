"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ordersApi } from "@/lib/api/orders";
import { errorMessage } from "@/lib/errors";
import { formatDate, taka } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { Invoice } from "@/types";
import { downloadInvoice, shareInvoice } from "@/lib/invoicePdf";

// একটি পরিষ্কার A4 ইনভয়েস। পর্দায় পপআপে দেখায়, প্রিন্টে শুধু এই ইনভয়েসটাই পুরো পাতায় ছাপা হয় (বাকি সাইট নয়)।
// ইনভয়েসে সব লেখা ইংরেজি
function invPay(method: string, label?: string | null): string {
  if (method === "cod") return "Cash on delivery";
  if (method === "sslcommerz") return "Online payment (SSLCommerz)";
  return label || (method === "manual_bkash" ? "bKash" : method === "manual_nagad" ? "Nagad" : method);
}

function Sheet({ inv, print = false }: { inv: Invoice; print?: boolean }) {
  const th = "px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted";
  const td = "px-2 py-2.5 align-top";
  return (
    <div className={`bg-white text-ink ${print ? "text-[13px]" : "text-[13px] sm:text-sm"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-brand-600 pb-4">
        <div>
          <p className="font-script text-3xl font-bold text-brand-600">{SITE.name}</p>
          <p className="mt-1 text-muted">{SITE.phone}</p>
          <p className="text-muted">{SITE.email}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold uppercase tracking-wide">Invoice</p>
          <p className="font-bold">#{inv.invoice_no}</p>
          <p className="text-muted">{formatDate(inv.date)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-brand-50/60 p-3">
          <p className="text-xs font-semibold uppercase text-muted">Bill to</p>
          <p className="font-semibold">{inv.customer.name}</p>
          <p>{inv.customer.phone}</p>
        </div>
        <div className="rounded-lg bg-brand-50/60 p-3">
          <p className="text-xs font-semibold uppercase text-muted">Ship to</p>
          <p className="break-words">{inv.ship_to.address}{inv.ship_to.area ? `, ${inv.ship_to.area}` : ""}, {inv.ship_to.district}</p>
        </div>
      </div>

      <table className="mt-4 w-full table-fixed border-collapse">
        <colgroup><col className="w-8" /><col /><col className="w-[4.5rem] sm:w-24" /><col className="w-10 sm:w-14" /><col className="w-[4.75rem] sm:w-24" /></colgroup>
        <thead>
          <tr className="border-y border-line bg-brand-50/50 text-left">
            <th className={th}>#</th><th className={th}>Item</th><th className={`${th} text-right`}>Price</th><th className={`${th} text-center`}>Qty</th><th className={`${th} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i} className="border-b border-line/70 [break-inside:avoid]">
              <td className={`${td} text-muted`}>{i + 1}</td>
              <td className={`${td} break-words`}>{it.name}</td>
              <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{taka(it.unit_price)}</td>
              <td className={`${td} text-center tabular-nums`}>{it.quantity}</td>
              <td className={`${td} whitespace-nowrap text-right font-semibold tabular-nums`}>{taka(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-full max-w-72 space-y-1.5 [break-inside:avoid]">
        <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="tabular-nums">{taka(inv.subtotal)}</span></div>
        {inv.discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount{inv.coupon_code ? ` (${inv.coupon_code})` : ""}</span><span className="tabular-nums">- {taka(inv.discount)}</span></div>}
        <div className="flex justify-between"><span className="text-muted">Delivery charge</span><span className="tabular-nums">{inv.shipping_fee ? taka(inv.shipping_fee) : "Free"}</span></div>
        <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-extrabold"><span>Grand total</span><span className="tabular-nums">{taka(inv.total)}</span></div>
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-muted [break-inside:avoid]">
        <p>Payment: <b className="text-ink">{invPay(inv.payment_method, inv.payment_label)}</b> ({inv.payment_status === "paid" ? "Paid" : "Unpaid"})</p>
        
      </div>
      <p className="mt-6 text-center text-muted">Thank you for shopping with {SITE.name}!</p>
    </div>
  );
}

export function InvoiceModal({ orderNo, open, onClose }: { orderNo: string; open: boolean; onClose: () => void }) {
  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || inv) return;
    ordersApi.invoice(orderNo).then(setInv).catch((e) => setError(errorMessage(e)));
  }, [open, inv, orderNo]);

  const shop = { name: SITE.name, phone: SITE.phone, email: SITE.email };
  const [note, setNote] = useState("");
  const download = () => { try { downloadInvoice(inv!, shop); } catch { setNote("PDF তৈরি করা যায়নি"); } };
  const share = async () => {
    try { const r = await shareInvoice(inv!, shop); setNote(r === "downloaded" ? "এই ডিভাইসে শেয়ার সাপোর্ট নেই — PDF ডাউনলোড হয়েছে" : ""); }
    catch { setNote("শেয়ার করা যায়নি"); }
  };
  const print = () => {
    const cls = "printing-invoice";
    const done = () => { document.body.classList.remove(cls); window.removeEventListener("afterprint", done); };
    document.body.classList.add(cls);
    window.addEventListener("afterprint", done);
    setTimeout(done, 60000);
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Invoice #${orderNo}`} wide>
      {!inv && !error && <div className="grid place-items-center py-10"><Spinner className="h-7 w-7 text-brand-600" /></div>}
      {error && <p className="text-brand-600">{error}</p>}
      {inv && (
        <div className="space-y-4">
          <Sheet inv={inv} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={print} variant="outline">Print</Button>
            <Button onClick={download} variant="outline">Download PDF</Button>
            <Button onClick={share} variant="outline">Share</Button>
          </div>
          {note && <p className="text-sm text-muted">{note}</p>}
          {/* প্রিন্টের জন্য আলাদা কপি: পর্দায় লুকানো, প্রিন্টে পুরো A4 জুড়ে */}
          {createPortal(<div id="invoice-print-portal" className="hidden"><Sheet inv={inv} print /></div>, document.body)}
        </div>
      )}
    </Modal>
  );
}
