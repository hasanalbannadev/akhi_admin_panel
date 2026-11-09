'use client';
/**
 * COMPANY ACCOUNTS (owner only) - the business's own income / expense book.
 * Separate from the order-based "Accounts" section. Income = delivered + paid orders (automatic) + income you add by hand.
 * APIs:
 *   GET    /admin/company-accounts?kind=&category=&date_from=&date_to=&q=&page=
 *            { summary:{income,expense,profit,count}, by_category, categories:{income,expense}, items, total }
 *   POST   /admin/company-accounts          { kind: income|expense, amount, category, note, entry_date? }
 *   PATCH  /admin/company-accounts/{id}
 *   DELETE /admin/company-accounts/{id}
 */
import { useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, DataTable, Empty, ErrorBox, Field, Loading, Modal, Pager } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt, money } from '@/lib/format';

const PAGE = 30;
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;   // local date, not UTC
const today = () => ymd(new Date());
const monthStart = () => { const d = new Date(); return ymd(new Date(d.getFullYear(), d.getMonth(), 1)); };

export default function CompanyAccountsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [period, setPeriod] = useState('month');           // all | today | month | custom
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [kind, setKind] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);                // { kind } to add | { entry } to edit

  const range = period === 'today' ? [today(), today()] : period === 'month' ? [monthStart(), today()]
    : period === 'custom' ? [from, to] : ['', ''];
  const list = useAsync(() => api('/admin/company-accounts', {
    query: { kind: kind || undefined, category: category || undefined, date_from: range[0] || undefined,
      date_to: range[1] || undefined, q: q.trim() || undefined, page, page_size: PAGE },
  }), [kind, category, period, from, to, q, page]);
  const s = list.data?.summary;
  const rows = list.data?.items || [];
  const cats = list.data?.categories || { income: [], expense: [] };
  const allCats = [...new Set([...(list.data?.auto_category ? [list.data.auto_category] : []), ...cats.income, ...cats.expense])];
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  async function remove(e) {
    if (!(await confirm({ title: 'Delete this entry?', text: `${money(e.amount)} · ${e.category} · ${e.note}`, confirmText: 'Delete', danger: true }))) return;
    try { await api(`/admin/company-accounts/${e.id}`, { method: 'DELETE' }); toast.ok('Entry deleted'); list.reload(); }
    catch (er) { toast.error(er.message); }
  }

  const KPIS = s ? [
    { l: 'Total income', v: money(s.income), s: s.auto_orders ? `incl. ${money(s.auto_income)} from ${s.auto_orders} delivered orders` : 'money in', ic: 'trend', bg: '#e6f6ec', c: '#1b9e5a' },
    { l: 'Total expense', v: money(s.expense), s: 'money out', ic: 'undo', bg: '#fdecea', c: '#d93025' },
    { l: s.profit >= 0 ? 'Profit' : 'Loss', v: money(Math.abs(s.profit)), s: 'income minus expense', ic: 'wallet', bg: s.profit >= 0 ? '#fde7ef' : '#fdecea', c: s.profit >= 0 ? '#d6336c' : '#d93025' },
    { l: 'Entries', v: String(s.count), s: 'in this view', ic: 'clip', bg: '#e8f0fe', c: '#3b6fd8' },
  ] : [];

  const sign = (e) => (e.kind === 'income' ? '+' : '−');
  const color = (e) => (e.kind === 'income' ? '#1b9e5a' : '#d93025');
  const columns = [
    { h: 'Date', cell: (e) => <span className="muted">{dt(e.entry_date, false)}</span> },
    { h: 'Type', cell: (e) => <Badge tone={e.kind === 'income' ? 'green' : 'red'}>{e.kind === 'income' ? 'Income' : 'Expense'}</Badge> },
    { h: 'Category', cell: (e) => <b>{e.category}</b> },
    { h: 'Note', cell: (e) => <span style={{ overflowWrap: 'anywhere' }}>{e.note}</span> },
    { h: 'Amount', cls: 'r', cell: (e) => <b style={{ color: color(e) }}>{sign(e)}{money(e.amount)}</b> },
    { h: '', cls: 'r', noClick: true, cell: (e) => (
      <span className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
        <button className="btn sm" onClick={() => setModal({ entry: e })}><Icon name="edit" size={14} /> Edit</button>
        <button className="btn sm danger" onClick={() => remove(e)}><Icon name="trash" size={14} /></button>
      </span>) },
  ];

  const breakdown = (list.data?.by_category || []).filter((c) => !kind || c.kind === kind);

  return (
    <div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {s && (
        <div className="grid g4 mb">
          {KPIS.map((k) => (
            <div className="card kpi" key={k.l}>
              <div className="ic" style={{ background: k.bg, color: k.c }}><Icon name={k.ic === 'clip' ? 'package' : k.ic} size={22} /></div>
              <div style={{ minWidth: 0 }}><div className="v">{k.v}</div><div className="l">{k.l}</div><div className="s">{k.s}</div></div>
            </div>
          ))}
        </div>
      )}

      <div className="toolbar">
        <select className="input" style={{ width: 150 }} value={period} onChange={reset(setPeriod)}>
          <option value="month">This month</option><option value="today">Today</option>
          <option value="all">All time</option><option value="custom">Pick dates</option>
        </select>
        {period === 'custom' && (
          <>
            <input className="input" style={{ width: 150 }} type="date" value={from} onChange={reset(setFrom)} />
            <input className="input" style={{ width: 150 }} type="date" value={to} onChange={reset(setTo)} />
          </>
        )}
        <select className="input" style={{ width: 130 }} value={kind} onChange={reset(setKind)}>
          <option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option>
        </select>
        <select className="input" style={{ width: 150 }} value={category} onChange={reset(setCategory)}>
          <option value="">All categories</option>
          {allCats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" style={{ width: 170 }} placeholder="Search note…" value={q} onChange={reset(setQ)} />
        <div className="grow" />
        <button className="btn" onClick={() => setModal({ kind: 'income' })}><Icon name="plus" size={15} /> Add income</button>
        <button className="btn pri" onClick={() => setModal({ kind: 'expense' })}><Icon name="plus" size={15} /> Add expense</button>
      </div>

      {breakdown.length > 0 && (
        <div className="card mb"><div className="bd">
          <div className="muted sm" style={{ marginBottom: 8 }}>By category</div>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
            {breakdown.map((c) => (
              <span key={c.kind + c.category} className="badge gray" style={{ fontSize: 13 }}>
                {c.category}: <b style={{ color: c.kind === 'income' ? '#1b9e5a' : '#d93025', marginLeft: 4 }}>{c.kind === 'income' ? '+' : '−'}{money(c.amount)}</b>
              </span>
            ))}
          </div>
        </div></div>
      )}

      {s?.auto_orders > 0 && <div className="muted sm mb">Delivered &amp; paid orders ({s.auto_orders}) are added to income automatically. The list below shows the entries you added by hand.</div>}
      <div className="card flush"><div className="bd">
        {list.loading && !list.data ? <Loading /> : rows.length === 0 && page === 1 ? <Empty icon="wallet" text="No entries in this view" /> : (
          <>
            <DataTable columns={columns} rows={rows} mobile={(e) => (
              <div>
                <div className="flex sp center"><b>{e.category}</b><b style={{ color: color(e) }}>{sign(e)}{money(e.amount)}</b></div>
                <div style={{ overflowWrap: 'anywhere' }}>{e.note}</div>
                <div className="muted sm">{dt(e.entry_date, false)} · {e.kind === 'income' ? 'Income' : 'Expense'}</div>
                <div className="flex" style={{ marginTop: 8, gap: 6 }}>
                  <button className="btn sm" onClick={() => setModal({ entry: e })}>Edit</button>
                  <button className="btn sm danger" onClick={() => remove(e)}>Delete</button>
                </div>
              </div>
            )} />
            <Pager page={page} pageSize={PAGE} total={list.data?.total} count={rows.length} onPage={setPage} />
          </>
        )}
      </div></div>
      {modal && <EntryModal kind={modal.kind} entry={modal.entry} cats={cats} onClose={() => setModal(null)}
        onSaved={() => { setModal(null); list.reload(); }} />}
    </div>
  );
}

function EntryModal({ kind: kind0, entry, cats, onClose, onSaved }) {
  const toast = useToast();
  const edit = !!entry;
  const [kind, setKind] = useState(entry?.kind || kind0);
  const [f, setF] = useState({
    amount: entry ? String(entry.amount) : '', category: entry?.category || (cats[kind0] || [])[0] || '',
    note: entry?.note || '', entry_date: entry?.entry_date || today(),
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const list = cats[kind] || [];

  async function save() {
    const amount = Number(f.amount);
    if (!(amount > 0)) return toast.error('Enter an amount above 0');
    if (!f.category.trim()) return toast.error('Choose or write a category');
    if (f.note.trim().length < 2) return toast.error('Write a short note');
    setBusy(true);
    try {
      const body = { kind, amount, category: f.category.trim(), note: f.note.trim(), entry_date: f.entry_date || null };
      if (edit) await api(`/admin/company-accounts/${entry.id}`, { method: 'PATCH', body });
      else await api('/admin/company-accounts', { method: 'POST', body });
      toast.ok(edit ? 'Entry updated' : kind === 'income' ? 'Income added' : 'Expense added');
      onSaved();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <Modal title={edit ? 'Edit entry' : kind === 'income' ? 'Add income (+)' : 'Add expense (−)'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
      {edit && (
        <Field label="Type">
          <select className="input" value={kind} onChange={(e) => { setKind(e.target.value); setF((s) => ({ ...s, category: (cats[e.target.value] || [])[0] || '' })); }}>
            <option value="income">Income</option><option value="expense">Expense</option>
          </select>
        </Field>
      )}
      <Field label="Amount (৳) *"><input className="input" type="number" min={0} inputMode="decimal" value={f.amount} onChange={set('amount')} autoFocus /></Field>
      <Field label="Category *" hint="Pick one, or write a new category name">
        <input className="input" list="co-cats" maxLength={40} value={f.category} onChange={set('category')} />
        <datalist id="co-cats">{list.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Note *" hint={kind === 'expense' ? 'e.g. Paid provider for 5 orders, Facebook ads' : 'e.g. Sales received'}>
        <input className="input" maxLength={200} value={f.note} onChange={set('note')} />
      </Field>
      <Field label="Date"><input className="input" type="date" value={f.entry_date} onChange={set('entry_date')} /></Field>
    </Modal>
  );
}
