// ইনভয়েস থেকে PDF বানানো (কোনো বাইরের লাইব্রেরি ছাড়া): ক্যানভাসে A4 আঁকা → JPEG → ছোট PDF ফাইল।
// ডাউনলোড ও শেয়ারে ব্যবহার হয়। সব লেখা ইংরেজি।

const W = 794, H = 1123, S = 2; // A4 @96dpi, ২ গুণ স্কেল
const INK = "#1f1720", MUTED = "#6b6270", LINE = "#e6dde6", BRAND = "#d6336c", TINT = "#fbeff5";

function pay(m, label) {
  if (m === "cod") return "Cash on delivery";
  if (m === "sslcommerz") return "Online payment (SSLCommerz)";
  return label || (m === "manual_bkash" ? "bKash" : m === "manual_nagad" ? "Nagad" : m);
}
const tk = (n) => `Tk ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const fdate = (d) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return d; } };

function render(inv, shop) {
  const M = 48, FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  const probe = document.createElement("canvas").getContext("2d");
  const wrap = (text, font, maxW) => {
    probe.font = font;
    const out = []; let line = "";
    for (const w of String(text).split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (probe.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    return out.length ? out : [""];
  };
  // প্রথমে উচ্চতা মাপি
  const rows = inv.items.map((it) => wrap(it.name, `14px ${FONT}`, W - M * 2 - 290));
  const bodyH = rows.reduce((a, r) => a + Math.max(34, r.length * 19 + 14), 0);
  const total = 300 + bodyH + 190 + 90;
  const pages = Math.max(1, Math.ceil(total / H));
  const c = document.createElement("canvas");
  c.width = W * S; c.height = pages * H * S;
  const g = c.getContext("2d");
  g.scale(S, S);
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, pages * H);
  const text = (t, x, y, o = {}) => {
    g.font = `${o.bold ? "700" : "400"} ${o.size || 14}px ${FONT}`; g.fillStyle = o.color || INK; g.textAlign = o.align || "left"; g.fillText(t, x, y);
  };
  const hr = (y, color = LINE, w = 1) => { g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.moveTo(M, y); g.lineTo(W - M, y); g.stroke(); };

  text(shop.name, M, M + 20, { size: 28, bold: true, color: BRAND });
  if (shop.phone) text(shop.phone, M, M + 42, { size: 13, color: MUTED });
  if (shop.email) text(shop.email, M, M + 60, { size: 13, color: MUTED });
  text("INVOICE", W - M, M + 18, { size: 20, bold: true, align: "right" });
  text(`#${inv.invoice_no}`, W - M, M + 42, { size: 15, bold: true, align: "right" });
  text(fdate(inv.date), W - M, M + 62, { size: 13, color: MUTED, align: "right" });
  hr(M + 78, BRAND, 2);

  let y = M + 100;
  const box = (x, w, title, lines) => {
    g.fillStyle = TINT; g.fillRect(x, y, w, 88);
    text(title, x + 12, y + 20, { size: 11, bold: true, color: MUTED });
    lines.slice(0, 3).forEach((l, i) => text(l, x + 12, y + 42 + i * 18, { size: 14, bold: i === 0 }));
  };
  const half = (W - M * 2 - 16) / 2;
  box(M, half, "BILL TO", [inv.customer.name, inv.customer.phone]);
  const addr = wrap(`${inv.ship_to.address}${inv.ship_to.area ? `, ${inv.ship_to.area}` : ""}, ${inv.ship_to.district}`, `14px ${FONT}`, half - 24);
  box(M + half + 16, half, "SHIP TO", addr);
  y += 108;

  const xq = W - M - 140, xp = W - M - 230, xt = W - M;
  g.fillStyle = TINT; g.fillRect(M, y, W - M * 2, 30);
  text("#", M + 8, y + 20, { size: 11, bold: true, color: MUTED });
  text("ITEM", M + 34, y + 20, { size: 11, bold: true, color: MUTED });
  text("PRICE", xp, y + 20, { size: 11, bold: true, color: MUTED, align: "right" });
  text("QTY", xq + 30, y + 20, { size: 11, bold: true, color: MUTED, align: "center" });
  text("TOTAL", xt - 8, y + 20, { size: 11, bold: true, color: MUTED, align: "right" });
  y += 30;
  inv.items.forEach((it, i) => {
    const r = rows[i], h = Math.max(34, r.length * 19 + 14);
    text(String(i + 1), M + 8, y + 22, { color: MUTED });
    r.forEach((l, k) => text(l, M + 34, y + 22 + k * 19));
    text(tk(it.unit_price), xp, y + 22, { align: "right" });
    text(String(it.quantity), xq + 30, y + 22, { align: "center" });
    text(tk(it.line_total), xt - 8, y + 22, { bold: true, align: "right" });
    y += h; hr(y);
  });

  y += 22;
  const lx = W - M - 270;
  const line = (k, v) => { text(k, lx, y, { color: MUTED }); text(v, W - M, y, { align: "right" }); y += 24; };
  line("Subtotal", tk(inv.subtotal));
  if (inv.discount > 0) line(`Discount${inv.coupon_code ? ` (${inv.coupon_code})` : ""}`, `- ${tk(inv.discount)}`);
  line("Delivery charge", inv.shipping_fee ? tk(inv.shipping_fee) : "Free");
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, y - 12); g.lineTo(W - M, y - 12); g.stroke();
  y += 8;
  text("Grand total", lx, y, { size: 17, bold: true }); text(tk(inv.total), W - M, y, { size: 17, bold: true, align: "right" });
  y += 40; hr(y);
  y += 26;
  text(`Payment: ${pay(inv.payment_method, inv.payment_label)} (${inv.payment_status === "paid" ? "Paid" : "Unpaid"})`, M, y, { size: 13, color: MUTED });
  if (inv.tracking_code) {
    let ty = y;
    if (inv.courier) { text(`Courier: ${String(inv.courier).charAt(0).toUpperCase()}${String(inv.courier).slice(1)}`, W - M, ty, { size: 13, color: MUTED, align: "right" }); ty += 22; }
    text(`Tracking: ${inv.tracking_code}`, W - M, ty, { size: 13, color: MUTED, align: "right" });
    if (inv.consignment_id) { ty += 22; text(`Consignment: ${inv.consignment_id}`, W - M, ty, { size: 13, color: MUTED, align: "right" }); }
    y = ty;
  }
  y += 44;
  text(`Thank you for shopping with ${shop.name}!`, W / 2, y, { size: 13, color: MUTED, align: "center" });

  // পাতায় ভাগ
  const out = [];
  const used = Math.min(pages, Math.max(1, Math.ceil((y + 50) / H)));
  for (let p = 0; p < used; p++) {
    const pc = document.createElement("canvas"); pc.width = W * S; pc.height = H * S;
    const pg = pc.getContext("2d"); pg.fillStyle = "#fff"; pg.fillRect(0, 0, pc.width, pc.height);
    pg.drawImage(c, 0, p * H * S, W * S, H * S, 0, 0, W * S, H * S);
    out.push(pc);
  }
  return out;
}

function jpegBytes(cv) {
  const b64 = cv.toDataURL("image/jpeg", 0.92).split(",")[1];
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

function buildPdf(pages) {
  const enc = new TextEncoder();
  const parts = []; const offs = []; let len = 0;
  const push = (d) => { const u = typeof d === "string" ? enc.encode(d) : d; parts.push(u); len += u.length; };
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); if (typeof body === "string") push(body); else body(); push("\nendobj\n"); };
  const PW = 595.28, PH = 841.89;
  push("%PDF-1.4\n");
  const n = pages.length;
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] >>`);
  pages.forEach((cv, i) => {
    const pg = 3 + i * 3, ct = pg + 1, im = pg + 2;
    obj(pg, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
    const cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(ct, `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
    const jb = jpegBytes(cv);
    obj(im, () => { push(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jb.length} >>\nstream\n`); push(jb); push("\nendstream"); });
  });
  const total = 3 + n * 3; const xref = len;
  push(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let i = 1; i < total; i++) push(`${String(offs[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}

export function invoicePdf(inv, shop) { return buildPdf(render(inv, shop)); }

const fname = (inv) => `Invoice-${String(inv.invoice_no).replace(/[^\w-]+/g, "_")}.pdf`;

export function downloadInvoice(inv, shop) {
  const url = URL.createObjectURL(invoicePdf(inv, shop));
  const a = document.createElement("a"); a.href = url; a.download = fname(inv);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** শেয়ার: ফোন/সাপোর্টেড ব্রাউজারে PDF ফাইল সহ শেয়ার-শিট; না হলে লেখা শেয়ার; তাও না হলে ডাউনলোড। */
export async function shareInvoice(inv, shop) {
  const blob = invoicePdf(inv, shop);
  const file = new File([blob], fname(inv), { type: "application/pdf" });
  const nav = navigator;
  try {
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: `Invoice #${inv.invoice_no}`, text: `${shop.name} invoice #${inv.invoice_no} - ${tk(inv.total)}` });
      return "shared";
    }
    if (nav.share) {
      await nav.share({ title: `Invoice #${inv.invoice_no}`, text: `${shop.name} invoice #${inv.invoice_no}\nTotal: ${tk(inv.total)}\nCustomer: ${inv.customer.name}` });
      return "shared";
    }
  } catch (e) {
    if (e.name === "AbortError") return "cancelled";
  }
  downloadInvoice(inv, shop);
  return "downloaded";
}
