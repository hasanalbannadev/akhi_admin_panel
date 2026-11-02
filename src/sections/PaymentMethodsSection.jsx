'use client';
/**
 * PAYMENT ACCOUNTS — the bKash / Nagad / bank accounts customers pay to. Add, edit, hide, delete.
 * Customers see the account details at checkout and type the number they paid from + the TrxID.
 * (Cash on delivery and SSLCommerz are on/off switches in Settings.)
 * APIs: GET/POST /admin/payment-methods · PUT/DELETE /admin/payment-methods/{id}
 */
import { useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, ErrorBox, Field, Loading, Modal, Switch } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';

const KINDS = [['bkash', 'bKash'], ['nagad', 'Nagad'], ['rocket', 'Rocket'], ['upay', 'Upay'], ['bank', 'Bank account'], ['other', 'Other']];
const BLANK = { kind: 'bkash', title: '', account_number: '', account_name: '', bank_name: '', branch: '', instructions: '', sort_order: 0, is_active: true };

export default function PaymentMethodsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => api('/admin/payment-methods'), []);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data || [];
  const set = (k) => (e) => setEdit((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const isBank = edit?.kind === 'bank';

  const body = (m) => ({
    kind: m.kind, title: (m.title || '').trim(), account_number: (m.account_number || '').trim() || null, account_name: (m.account_name || '').trim() || null,
    bank_name: (m.bank_name || '').trim() || null, branch: (m.branch || '').trim() || null, instructions: (m.instructions || '').trim() || null,
    sort_order: parseInt(m.sort_order, 10) || 0, is_active: !!m.is_active,
  });

  async function save() {
    if (!edit.title.trim()) return toast.error('Give it a name, e.g. "bKash Personal"');
    if (!edit.account_number.trim()) return toast.error('Enter the account / mobile number');
    setBusy(true);
    try {
      if (edit.id) await api(`/admin/payment-methods/${edit.id}`, { method: 'PUT', body: body(edit) });
      else await api('/admin/payment-methods', { method: 'POST', body: body(edit) });
      toast.ok('Saved'); setEdit(null); reload();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function toggle(m, v) {
    try { await api(`/admin/payment-methods/${m.id}`, { method: 'PUT', body: body({ ...m, is_active: v }) }); toast.ok(v ? 'Shown at checkout' : 'Hidden from checkout'); reload(); }
    catch (e) { toast.error(e.message); }
  }
  async function remove(m) {
    if (!(await confirm({ title: 'Delete this account?', text: `${m.title} will no longer be offered. Old orders keep its name.`, confirmText: 'Delete', danger: true }))) return;
    try { const r = await api(`/admin/payment-methods/${m.id}`, { method: 'DELETE' }); toast.ok(r.hidden ? 'Used by old orders, so it was hidden instead' : 'Deleted'); reload(); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="toolbar"><div className="muted">{rows.length} accounts</div><div className="grow" />
        <button className="btn pri" onClick={() => setEdit({ ...BLANK, sort_order: rows.length })}><Icon name="plus" size={16} /> Add account</button></div>
      <div className="infobox" style={{ marginBottom: 14 }}>
        Customers who choose one of these pay <b>before</b> the order is confirmed and <b>no delivery charge</b> is added. When you check the TrxID and approve it in <b>Payments</b>, the order is confirmed and an SMS goes out.
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : rows.length === 0 ? <div className="card"><Empty icon="card" text="No payment accounts yet" /></div> : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))' }}>
          {rows.map((m) => (
            <div className="card" key={m.id}>
              <div className="bd">
                <div className="flex sp center"><b>{m.title}</b><Badge tone="pink">{(KINDS.find((k) => k[0] === m.kind) || [0, m.kind])[1]}</Badge></div>
                {m.bank_name && <div className="muted sm">{m.bank_name}{m.branch ? `, ${m.branch}` : ''}</div>}
                <div style={{ fontSize: 18, fontWeight: 700, margin: '6px 0', wordBreak: 'break-all' }}>{m.account_number}</div>
                {m.account_name && <div className="muted sm">{m.account_name}</div>}
                <div className="flex sp center" style={{ marginTop: 12 }}>
                  <div className="flex center gap"><Switch checked={m.is_active} onChange={(v) => toggle(m, v)} /><span className="muted sm">{m.is_active ? 'Shown' : 'Hidden'}</span></div>
                  <div className="flex gap">
                    <button className="btn sm" onClick={() => setEdit({ ...BLANK, ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v ?? ''])) })} aria-label="Edit"><Icon name="edit" size={14} /></button>
                    <button className="btn sm danger" onClick={() => remove(m)} aria-label="Delete"><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <Modal title={edit.id ? 'Edit payment account' : 'New payment account'} onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn pri" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
          <div className="row2">
            <Field label="Type"><select className="input" value={edit.kind} onChange={set('kind')}>{KINDS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Name shown to customers *"><input className="input" value={edit.title} onChange={set('title')} placeholder={isBank ? 'City Bank' : 'bKash Personal'} maxLength={80} /></Field>
          </div>
          {isBank && (
            <div className="row2">
              <Field label="Bank name"><input className="input" value={edit.bank_name} onChange={set('bank_name')} /></Field>
              <Field label="Branch"><input className="input" value={edit.branch} onChange={set('branch')} /></Field>
            </div>
          )}
          <Field label={isBank ? 'Account number *' : 'Mobile number *'}><input className="input" value={edit.account_number} onChange={set('account_number')} maxLength={60} /></Field>
          <Field label="Account holder name"><input className="input" value={edit.account_name} onChange={set('account_name')} maxLength={100} /></Field>
          <Field label="Instructions (optional)" hint="e.g. Use Send Money, not Payment. Write the order number in the reference.">
            <textarea className="input" rows={3} value={edit.instructions} onChange={set('instructions')} maxLength={1000} />
          </Field>
          <div className="row2">
            <Field label="Sort order"><input className="input" type="number" value={edit.sort_order} onChange={set('sort_order')} /></Field>
            <Field label=" "><label className="check" style={{ marginTop: 8 }}><input type="checkbox" checked={edit.is_active} onChange={set('is_active')} /> Show at checkout</label></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
