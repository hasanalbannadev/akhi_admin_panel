'use client';
/**
 * SMS CENTRE — balance, delivery stats, who got a message and what failed (and why), send to anyone.
 * APIs (all /admin/sms/…): summary · balance · test · audience · logs · send · campaigns · campaigns/{id}
 *       GET /admin/customers?q= (picker)
 * Logs and campaigns are never deleted.
 */
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, DataTable, Empty, ErrorBox, Field, Loading, Modal, Pager, SearchBox } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync, useDebounce } from '@/lib/hooks';
import { dt } from '@/lib/format';

const TABS = [['overview', 'Overview'], ['send', 'Send SMS'], ['campaigns', 'Campaigns'], ['logs', 'All messages']];
const KIND = { otp: 'OTP', test: 'Test', single: 'Single', campaign: 'Campaign', order: 'Order' };
const CTONE = { running: 'amber', done: 'green', stopped: 'red' };

/** 160 chars per SMS in English, 70 when the text has Bangla (Unicode) */
function parts(t) {
  if (!t) return 0;
  const uni = /[^\x00-\x7F]/.test(t);
  const one = uni ? 70 : 160; const multi = uni ? 67 : 153;
  return t.length <= one ? 1 : Math.ceil(t.length / multi);
}

export default function SmsSection() {
  const [tab, setTab] = useState('overview');
  return (
    <div>
      <div className="toolbar"><div className="tabs">{TABS.map(([k, l]) => <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div></div>
      {tab === 'overview' && <Overview goLogs={() => setTab('logs')} />}
      {tab === 'send' && <Send done={() => setTab('campaigns')} />}
      {tab === 'campaigns' && <Campaigns />}
      {tab === 'logs' && <Logs />}
    </div>
  );
}

function Overview({ goLogs }) {
  const toast = useToast();
  const sum = useAsync(() => api('/admin/sms/summary'), []);
  const [bal, setBal] = useState({ state: 'idle' });
  const [phone, setPhone] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const s = sum.data;

  async function loadBal() {
    setBal({ state: 'loading' });
    try { const r = await api('/admin/sms/balance'); setBal({ state: 'ok', ...r }); } catch (e) { setBal({ state: 'err', msg: e.message }); }
  }
  useEffect(() => { loadBal(); }, []);
  async function test() {
    if (!phone.trim()) return toast.error('Type a phone number');
    setBusy(true); setRes(null);
    try { setRes(await api('/admin/sms/test', { method: 'POST', body: { phone: phone.trim() } })); sum.reload(); }
    catch (e) { setRes({ ok: false, reason: e.message }); } finally { setBusy(false); }
  }
  const stat = (v, l, tone) => <div className="card kpi"><div><div className="v" style={tone ? { color: tone } : null}>{v ?? '—'}</div><div className="l">{l}</div></div></div>;

  return (
    <div>
      <ErrorBox error={sum.error} onRetry={sum.reload} />
      {s && !s.configured && <div className="card" style={{ marginBottom: 14 }}><div className="bd" style={{ color: '#b45309' }}>
        SMS is not ready: provider is “{s.provider}”. Set <b>SMS_PROVIDER=bulksmsbd</b>, <b>SMS_API_KEY</b> and <b>SMS_SENDER_ID</b> in the server .env, then restart the backend.</div></div>}
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card kpi"><div>
          <div className="v">{bal.state === 'loading' ? '…' : bal.state === 'ok' ? (bal.balance ?? 'OK') : '—'}</div>
          <div className="l">bulksmsbd balance</div>
          <div className="s">{bal.state === 'err' ? <span style={{ color: '#b91c1c' }}>{bal.msg}</span> : bal.state === 'ok' && bal.balance == null ? String(bal.reply).slice(0, 80) : <button className="btn sm" onClick={loadBal}><Icon name="refresh" size={12} /> Refresh</button>}</div>
        </div></div>
        {stat(s?.today_sent, 'Sent today')}
        {stat(s?.today_failed, 'Failed today', s?.today_failed ? '#b91c1c' : null)}
        {stat(s ? `${s.total_sent} / ${s.total_failed}` : null, 'All time sent / failed')}
      </div>
      <div className="grid g2 stack">
        <div className="card"><div className="bd">
          <h3 style={{ margin: '0 0 8px' }}>OTP delivery</h3>
          <div className="muted sm">Sent: <b>{s?.otp_sent ?? '—'}</b> · Failed: <b style={{ color: s?.otp_failed ? '#b91c1c' : undefined }}>{s?.otp_failed ?? '—'}</b></div>
          {s?.last_error ? (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: '#fef2f2', color: '#7f1d1d', fontSize: 13, wordBreak: 'break-word' }}>
              <b>Last failure</b> · {dt(s.last_error.created_at)} · {s.last_error.phone} ({KIND[s.last_error.kind] || s.last_error.kind})<br />{s.last_error.error}
              <div style={{ marginTop: 8 }}><button className="btn sm" onClick={goLogs}>See all messages</button></div>
            </div>
          ) : <div className="muted sm" style={{ marginTop: 12 }}>No failed SMS recorded.</div>}
        </div></div>
        <div className="card"><div className="bd">
          <h3 style={{ margin: '0 0 8px' }}>Test the connection</h3>
          <div className="muted sm" style={{ marginBottom: 8 }}>Sends one real SMS and shows the exact reason if it fails.</div>
          <div className="flex gap"><input className="input" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="btn pri" disabled={busy} onClick={test}>{busy ? 'Sending…' : 'Send test'}</button></div>
          {res && <div style={{ marginTop: 10, padding: 10, borderRadius: 10, fontSize: 13, wordBreak: 'break-word', background: res.ok ? '#f0fdf4' : '#fef2f2', color: res.ok ? '#166534' : '#7f1d1d' }}>
            {res.ok ? 'Delivered to the provider ✔ — check the phone.' : <>Failed: {res.reason}</>}</div>}
        </div></div>
      </div>
    </div>
  );
}

function Send({ done }) {
  const toast = useToast();
  const confirm = useConfirm();
  const aud = useAsync(() => api('/admin/sms/audience'), []);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [numbers, setNumbers] = useState('');
  const [audience, setAudience] = useState('none');
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const found = useAsync(() => (dq.trim() ? api('/admin/customers', { query: { q: dq } }) : Promise.resolve([])), [dq]);
  const [busy, setBusy] = useState(false);

  const typed = numbers.split(/[\s,;]+/).filter(Boolean);
  const groupCount = audience === 'all' ? aud.data?.all : audience === 'ordered' ? aud.data?.ordered : 0;
  const approx = typed.length + picked.length + (groupCount || 0);
  const pick = (c) => setPicked((a) => (a.some((x) => x.id === c.id) ? a : [...a, c]));

  async function send() {
    if (!message.trim()) return toast.error('Write the message');
    if (!approx) return toast.error('Add a number, pick customers or choose a group');
    if (!(await confirm({ title: 'Send SMS?', text: `About ${approx} recipient(s) · ${parts(message)} SMS part(s) each. This uses your bulksmsbd balance and cannot be undone.`, confirmText: 'Send now' }))) return;
    setBusy(true);
    try {
      const r = await api('/admin/sms/send', { method: 'POST', body: { message: message.trim(), title: title.trim() || null, numbers: typed, user_ids: picked.map((c) => c.id), audience } });
      toast.ok(`Sending to ${r.total} number(s)…`);
      if (r.invalid?.length) toast.error(`Skipped invalid: ${r.invalid.slice(0, 5).join(', ')}`);
      setMessage(''); setNumbers(''); setPicked([]); setAudience('none'); done();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="card"><div className="bd">
      <Field label="Campaign name (optional)"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Eid offer" maxLength={120} /></Field>
      <Field label="Message *" hint={`${message.length} characters · ${parts(message)} SMS part(s) (Bangla text = 70 chars per part)`}>
        <textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={640} placeholder="Akhi Lifestyle: Eid offer 30% off. akhilifestyle.com" />
      </Field>
      <Field label="Phone numbers" hint="One or many — separate by comma, space or new line. Any format (017…, +88017…).">
        <textarea className="input" style={{ minHeight: 70 }} value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="01712345678, 01812345678" />
      </Field>
      <Field label="Customer group">
        <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
          <option value="none">None</option>
          <option value="all">All customers{aud.data ? ` (${aud.data.all})` : ''}</option>
          <option value="ordered">Customers who ordered{aud.data ? ` (${aud.data.ordered})` : ''}</option>
        </select>
      </Field>
      <Field label={`Pick customers (${picked.length})`}>
        <SearchBox value={q} onChange={setQ} placeholder="Search customer by name or phone…" />
        {dq.trim() && <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10, marginTop: 8 }}>
          {found.loading ? <Loading /> : (found.data || []).length === 0 ? <div className="muted sm" style={{ padding: 12 }}>No customer found</div> : found.data.map((c) => (
            <button key={c.id} type="button" className="btn" style={{ width: '100%', justifyContent: 'space-between', borderRadius: 0, border: 0, borderBottom: '1px solid var(--line)' }} onClick={() => pick(c)} disabled={c.is_blocked}>
              <span>{c.name || 'No name'} · {c.phone}</span><span className="muted sm">{c.is_blocked ? 'Blocked' : '+ Add'}</span></button>
          ))}
        </div>}
        {picked.length > 0 && <div className="flex gap" style={{ flexWrap: 'wrap', marginTop: 8 }}>
          {picked.map((c) => <span key={c.id} className="tab on" style={{ cursor: 'pointer' }} onClick={() => setPicked((a) => a.filter((x) => x.id !== c.id))}>{c.name || c.phone} ✕</span>)}
        </div>}
      </Field>
      <div className="flex sp center" style={{ marginTop: 6, gap: 10, flexWrap: 'wrap' }}>
        <div className="muted sm">About <b>{approx}</b> recipient(s). Blocked customers and duplicates are skipped automatically.</div>
        <button className="btn pri" disabled={busy} onClick={send}><Icon name="send" size={15} /> {busy ? 'Starting…' : 'Send SMS'}</button>
      </div>
    </div></div>
  );
}

function Campaigns() {
  const list = useAsync(() => api('/admin/sms/campaigns'), []);
  const [open, setOpen] = useState(null);
  const rows = list.data || [];
  const running = rows.some((c) => c.status === 'running');
  useEffect(() => { if (!running) return undefined; const t = setInterval(() => list.reload(), 3000); return () => clearInterval(t); }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  const detail = useAsync(() => (open ? api(`/admin/sms/campaigns/${open}`) : Promise.resolve(null)), [open, rows.find((c) => c.id === open)?.sent, rows.find((c) => c.id === open)?.failed]);

  const columns = [
    { h: 'Sent at', cell: (c) => <span className="muted">{dt(c.created_at)}</span> },
    { h: 'Campaign', cell: (c) => <div><b>{c.title || `#${c.id}`}</b><div className="muted sm" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</div></div> },
    { h: 'To', cell: (c) => c.total },
    { h: 'Delivered', cell: (c) => <span style={{ color: '#166534' }}>{c.sent}</span> },
    { h: 'Failed', cell: (c) => <span style={{ color: c.failed ? '#b91c1c' : undefined }}>{c.failed}</span> },
    { h: 'Status', cell: (c) => <Badge tone={CTONE[c.status] || 'gray'}>{c.status}</Badge> },
    { h: '', cls: 'r', noClick: true, cell: (c) => <button className="btn sm" onClick={() => setOpen(c.id)}>Details</button> },
  ];
  return (
    <div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      <div className="card flush"><div className="bd">
        {list.loading && !list.data ? <Loading /> : rows.length === 0 ? <Empty icon="send" text="No SMS sent from here yet" /> : (
          <DataTable columns={columns} rows={rows} mobile={(c) => (
            <div>
              <div className="flex sp center"><b>{c.title || `#${c.id}`}</b><Badge tone={CTONE[c.status] || 'gray'}>{c.status}</Badge></div>
              <div className="muted sm" style={{ margin: '5px 0 8px' }}>{dt(c.created_at)} · to {c.total} · ✔ {c.sent} · ✕ {c.failed}</div>
              <button className="btn sm" onClick={() => setOpen(c.id)}>Details</button>
            </div>
          )} />
        )}
      </div></div>
      {open && (
        <Modal title={`Campaign #${open}`} onClose={() => setOpen(null)} footer={<button className="btn" onClick={() => setOpen(null)}>Close</button>}>
          {!detail.data ? <Loading /> : (
            <div>
              <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{detail.data.message}</p>
              <div className="muted sm" style={{ margin: '8px 0' }}>To {detail.data.total} · delivered {detail.data.sent} · failed {detail.data.failed} · {detail.data.status}</div>
              {detail.data.error && <div style={{ padding: 10, borderRadius: 10, background: '#fef2f2', color: '#7f1d1d', fontSize: 13, wordBreak: 'break-word' }}>{detail.data.error}</div>}
              {detail.data.failed_numbers?.length > 0 && <>
                <h4 style={{ margin: '12px 0 6px' }}>Failed numbers</h4>
                {detail.data.failed_numbers.map((f) => <div key={f.id} className="sm" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)', wordBreak: 'break-word' }}><b>{f.phone}</b> — <span className="muted">{f.error}</span></div>)}
              </>}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Logs() {
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [dq, status, kind]);
  const list = useAsync(() => api('/admin/sms/logs', { query: { status, kind, q: dq, page, page_size: 30 } }), [status, kind, dq, page]);
  const d = list.data;
  const rows = d?.items || [];
  const columns = [
    { h: 'Time', cell: (r) => <span className="muted">{dt(r.created_at)}</span> },
    { h: 'Phone', cell: (r) => <b>{r.phone}</b> },
    { h: 'Type', cell: (r) => KIND[r.kind] || r.kind },
    { h: 'Result', cell: (r) => <Badge tone={r.status === 'sent' ? 'green' : 'red'}>{r.status === 'sent' ? 'Sent' : 'Failed'}</Badge> },
    { h: 'Message / reason', cell: (r) => <div style={{ maxWidth: 420, wordBreak: 'break-word' }}>{r.status === 'failed' ? <span style={{ color: '#b91c1c' }}>{r.error}</span> : <span className="muted">{r.message}</span>}</div> },
  ];
  return (
    <div>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search phone…" />
        <select className="input" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All results</option><option value="sent">Sent</option><option value="failed">Failed</option></select>
        <select className="input" style={{ width: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value)}><option value="">All types</option>{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      <div className="card flush"><div className="bd">
        {list.loading && !d ? <Loading /> : rows.length === 0 ? <Empty icon="chat" text="No messages found" /> : (
          <>
            <DataTable columns={columns} rows={rows} mobile={(r) => (
              <div>
                <div className="flex sp center"><b>{r.phone}</b><Badge tone={r.status === 'sent' ? 'green' : 'red'}>{r.status === 'sent' ? 'Sent' : 'Failed'}</Badge></div>
                <div className="muted sm" style={{ margin: '4px 0' }}>{dt(r.created_at)} · {KIND[r.kind] || r.kind}</div>
                <div className="sm" style={{ wordBreak: 'break-word', color: r.status === 'failed' ? '#b91c1c' : undefined }}>{r.status === 'failed' ? r.error : r.message}</div>
              </div>
            )} />
            <Pager page={page} pageSize={30} total={d.total} count={rows.length} onPage={setPage} />
          </>
        )}
      </div></div>
    </div>
  );
}
