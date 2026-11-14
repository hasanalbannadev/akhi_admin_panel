'use client';
/**
 * CHAT & MESSAGES — Messenger (Facebook page) + Instagram + WhatsApp inbox: threads, conversation, reply, delete.
 * APIs: GET /admin/chat/threads?unread_only=&page=&page_size= · GET /admin/chat/threads/{id}/messages (marks read)
 *       POST /admin/chat/threads/{id}/reply {text, reply_to?, attachment?} · POST /admin/chat/upload · POST /admin/chat/messages/{id}/forward · POST /admin/chat/messages/{id}/react {emoji} · DELETE /admin/chat/threads/{id} · GET /admin/chat/unread-count
 */
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, ErrorBox, Loading, Pager } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt, timeAgo } from '@/lib/format';

const CHANNELS = [
  { key: 'messenger', label: 'Messenger' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'fbcomments', label: 'Facebook comments' },
  { key: 'igcomments', label: 'Instagram comments' },
];
const REACTS = ['❤️', '👍', '😂', '😮', '😢', '😡'];
const CH_LABEL = { messenger: 'Messenger', instagram: 'Instagram', whatsapp: 'WhatsApp', comment: 'Comment' };
const CH_TONE = { messenger: 'blue', instagram: 'pink', whatsapp: 'green', comment: 'blue' };
const SRC_LABEL = { facebook: 'Facebook', instagram: 'Instagram' };


let warnedSetup = false;

/** Comments, post by post: every Facebook / Instagram post with its comments underneath, reply right here. */
function PostsView({ header, toast, onRead, src, confirm }) {
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [rep, setRep] = useState(null);
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const [mentions, setMentions] = useState({});
  const [mentionMenu, setMentionMenu] = useState(false);
  const fileRef = useRef(null);

  async function load(after) {
    setLoading(true);
    try {
      const r = await api('/admin/chat/posts', { query: { source: src, after: after || undefined } });
      if (r.error) { setErr(r.error); toast.error(r.error); } else setErr(null);
      setItems((prev) => (after ? [...prev, ...(r.posts || [])] : (r.posts || [])));
      setNext(r.next || null);
    } catch (e) { setErr(e.message); toast.error(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    setItems([]); setRep(null); setNext(null); load();
    api('/admin/chat/comments/mark-read', { method: 'POST', query: { source: src } }).then(() => { window.dispatchEvent(new CustomEvent('badges-refresh')); if (onRead) onRead(); }).catch(() => {});
  }, [src]);
  useEffect(() => {
    const rt = (e) => { if (e.detail && e.detail.t === 'chat') load(); };
    window.addEventListener('rt-push', rt);
    return () => window.removeEventListener('rt-push', rt);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  async function pick(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setUp(true);
    try { const fd = new FormData(); fd.append('file', f); const r = await api('/admin/chat/upload', { method: 'POST', form: fd }); if (r.type !== 'image') throw new Error('Only a photo can be sent in a comment reply'); setImg(r); }
    catch (er) { toast.error(er.message); } finally { setUp(false); }
  }
  async function send() {
    if (!rep || busy || up || (!text.trim() && !img)) return;
    setBusy(true);
    try {
      await api('/admin/chat/comments/reply', { method: 'POST', body: { source: src, comment_id: rep.target, text: Object.entries(mentions).reduce((t, [n, u]) => t.split(`@${n}`).join(`@[${u}]`), text.trim()), image_url: img ? img.url : undefined } });
      setText(''); setImg(null); setRep(null); setMentions({}); setMentionMenu(false); toast.ok('Reply sent'); load();
    } catch (er) { toast.error(er.message); } finally { setBusy(false); }
  }

  async function act(c, action) {
    if (action === 'delete' && !(await confirm({ title: 'Delete this comment?', text: 'It will be removed from the post for everyone.', confirmText: 'Delete', danger: true }))) return;
    try { await api('/admin/chat/comments/action', { method: 'POST', body: { source: src, comment_id: c.id, action } }); toast.ok('Done'); load(); }
    catch (er) { toast.error(er.message); }
  }
  const comment = (c, d, top, post) => (
    <div key={c.id} style={{ marginLeft: d ? 26 : 0, padding: '8px 10px', borderRadius: 10, background: c.mine ? 'var(--pink-l, #fde8f1)' : 'transparent', marginTop: 4 }}>
      <div className="flex gap" style={{ alignItems: 'flex-start' }}>
        <div className="avatar" style={{ width: 28, height: 28, fontSize: 12, flex: '0 0 28px' }}>{(c.name || '?').slice(0, 1).toUpperCase()}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex gap center" style={{ flexWrap: 'wrap' }}><b>{c.name}</b>{c.mine && <Badge tone="pink">You</Badge>}<span className="muted sm">{c.time ? timeAgo(c.time) : ''}{c.likes ? ` · 👍 ${c.likes}` : ''}</span></div>
          {c.text && <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.text}</div>}
          {c.image && <img src={c.image} alt="" style={{ display: 'block', maxWidth: 200, maxHeight: 200, borderRadius: 8, marginTop: 4 }} />}
          {c.hidden && <span className="muted sm">🙈 hidden</span>}
          <div className="flex gap muted sm" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="muted sm" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 600 }} onClick={() => { setRep({ id: c.id, target: src === 'instagram' && d > 0 ? top : c.id, name: c.name }); setText(src === 'instagram' && !c.mine ? `@${c.name} ` : ''); setImg(null); }}>↩ Reply</button>
            <button type="button" className="muted sm" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 600 }} onClick={() => act(c, c.liked ? 'unlike' : 'like')}>{c.liked ? '👍 Liked' : '👍 Like'}</button>
            {src === 'instagram' && <button type="button" className="muted sm" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 600 }} onClick={() => act(c, 'unlike')}>Unlike</button>}
            <button type="button" className="muted sm" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 600 }} onClick={() => act(c, c.hidden ? 'unhide' : 'hide')}>{c.hidden ? 'Unhide' : 'Hide'}</button>
            <button type="button" className="muted sm" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 600, color: '#b42318' }} onClick={() => act(c, 'delete')}>Delete</button>
          </div>
        </div>
      </div>
      {rep && rep.id === c.id && (
        <div style={{ marginTop: 6 }}>
          {(img || up) && <div className="sm muted" style={{ marginBottom: 4 }}>{up ? '⏳ Uploading…' : `📷 ${img.name}`} {img && <button type="button" className="btn sm" onClick={() => setImg(null)}>✕</button>}</div>}
          <div className="flex gap">
            {src === 'facebook' && <>
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={pick} />
              <button type="button" className="btn" aria-label="Attach a photo" disabled={up} onClick={() => fileRef.current && fileRef.current.click()}>📷</button>
            </>}
            <input className="input" style={{ flex: 1, minWidth: 0 }} autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder={`Reply to ${c.name}…`} maxLength={1900} />
            {src === 'facebook' && <button type="button" className="btn" aria-label="Mention someone" title="Mention" onClick={() => setMentionMenu(!mentionMenu)}>@</button>}
            <button type="button" className="btn pri" aria-label="Send reply" disabled={busy || up || (!text.trim() && !img)} onClick={send}><Icon name="send" size={15} /></button>
            <button type="button" className="btn" onClick={() => setRep(null)} aria-label="Cancel">✕</button>
          </div>
        </div>
      )}
      {rep && rep.id === c.id && mentionMenu && src === 'facebook' && (
        <div className="card" style={{ marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
          {[...new Map(((post && post.comments) || []).flatMap((x) => [x, ...(x.replies || [])]).filter((x) => x.uid && !x.mine).map((x) => [x.uid, x])).values()].map((x) => (
            <button key={x.uid} type="button" className="btn sm" style={{ display: 'block', width: '100%', textAlign: 'left', border: 0 }} onClick={() => { setMentions({ ...mentions, [x.name]: x.uid }); setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}@${x.name} `); setMentionMenu(false); }}>@ {x.name}</button>
          ))}
        </div>
      )}
      {(c.replies || []).map((r) => comment(r, 1, top, post))}
    </div>
  );

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {header}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
        <b style={{ alignSelf: 'center' }}>{src === 'instagram' ? 'Instagram posts' : 'Facebook posts'}</b>
        <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => load()} disabled={loading}>↻ Refresh</button>
      </div>
      <div style={{ padding: 12, background: '#f8f9fc' }}>
        {err && <div className="sm" style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>⚠ {err}</div>}
        {loading && items.length === 0 ? <Loading /> : items.length === 0 && !err ? <Empty icon="chat" text="No posts yet" /> : items.map((p) => (
          <div key={p.id} className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
            {p.image && <div style={{ background: '#eef0f6', textAlign: 'center' }}><img src={p.image} alt="" style={{ display: 'block', margin: '0 auto', maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} /></div>}
            <div style={{ padding: '10px 12px' }}>
              {p.text && <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.text}</div>}
              <div className="muted sm" style={{ marginTop: 4 }}>{p.time ? dt(p.time) : ''} · 👍 {p.likes} · 💬 {p.comments_count}{p.link && <> · <a href={p.link} target="_blank" rel="noreferrer">View post ↗</a></>}</div>
            </div>
            <div style={{ padding: '0 8px 8px', borderTop: '1px solid var(--line)' }}>
              {(p.comments || []).length === 0 ? <div className="muted sm" style={{ padding: 10 }}>No comments</div> : p.comments.map((c) => comment(c, 0, c.id, p))}
            </div>
          </div>
        ))}
        {next && <button className="btn" style={{ width: '100%' }} disabled={loading} onClick={() => load(next)}>{loading ? 'Loading…' : 'Load more posts'}</button>}
      </div>
    </div>
  );
}

export default function ChatSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [channel, setChannel] = useState('messenger');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pick, setPick] = useState(null);
  const [quote, setQuote] = useState(null);
  const [menu, setMenu] = useState(null);
  const [att, setAtt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fwd, setFwd] = useState(null);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const [cview, setCview] = useState('posts');
  const [prof, setProf] = useState(null);
  const [q, setQ] = useState('');
  const isCom = channel === 'fbcomments' || channel === 'igcomments';
  const [health, setHealth] = useState(null);
  const [showIssues, setShowIssues] = useState(false);
  const [fixing, setFixing] = useState(false);

  const threads = useAsync(() => api('/admin/chat/threads', { query: { unread_only: unreadOnly, channel: channel || undefined, q: q.trim() || undefined, page, page_size: 30 } }), [unreadOnly, channel, page, q], { every: 2000 });
  const counts = useAsync(() => api('/admin/chat/channel-counts'), [], { every: 3000 });
  const msgs = useAsync(() => (sel ? api(`/admin/chat/threads/${sel.id}/messages`) : Promise.resolve([])), [sel?.id], { every: 1000 });

  useEffect(() => {
    setProf(null);
    if (!sel) return;
    let off = false;
    api(`/admin/chat/threads/${sel.id}/profile`).then((p) => { if (!off) { setProf(p); if (p.name && p.name !== sel.name) threads.reload(); } }).catch(() => {});
    return () => { off = true; };
  }, [sel && sel.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function checkHealth() {
    try {
      const h = await api('/admin/chat/health');
      setHealth(h);
      if (!h.ok && !warnedSetup) { warnedSetup = true; toast.error(`Chat setup: ${h.issues[0].channel} — ${h.issues[0].issue}${h.issues.length > 1 ? ` (+${h.issues.length - 1} more)` : ''}`); }
    } catch { /* health check is optional */ }
  }
  async function fixNow(action) {
    setFixing(true);
    try { await api('/admin/chat/health/fix', { method: 'POST', body: { action } }); toast.ok('Subscribed'); await checkHealth(); }
    catch (e) { toast.error(e.message); } finally { setFixing(false); }
  }
  useEffect(() => { checkHealth(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.data]);
  useEffect(() => { if (msgs.data && sel) { window.dispatchEvent(new CustomEvent('badges-refresh')); counts.reload(); threads.reload(); } }, [sel?.id, msgs.data?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const rt = (e) => { if (e.detail && e.detail.t === 'chat') { threads.reload(); msgs.reload(); counts.reload(); } };
    window.addEventListener('rt-push', rt);
    return () => window.removeEventListener('rt-push', rt);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(e) {
    e.preventDefault();
    const t = text.trim();
    if ((!t && !att) || !sel || uploading) return;
    setSending(true);
    try { await api(`/admin/chat/threads/${sel.id}/reply`, { method: 'POST', body: { text: t, reply_to: quote ? quote.id : undefined, attachment: att || undefined } }); setText(''); setQuote(null); setAtt(null); msgs.reload(); threads.reload(); }
    catch (err) { toast.error(err.message); } finally { setSending(false); }
  }
  async function react(m, emoji) {
    setPick(null);
    try { await api(`/admin/chat/messages/${m.id}/react`, { method: 'POST', body: { emoji: m.reaction === emoji ? '' : emoji } }); msgs.reload(); }
    catch (err) { toast.error(err.message); }
  }
  async function pickFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append('file', f); setAtt(await api('/admin/chat/upload', { method: 'POST', form: fd })); }
    catch (err) { toast.error(err.message); } finally { setUploading(false); }
  }
  function openFwd(m) { setMenu(null); setFwd({ m, ids: [], q: '', sending: false, list: null }); api('/admin/chat/threads', { query: { page_size: 100 } }).then((l) => setFwd((f) => f && { ...f, list: (l || []).filter((x) => !x.is_comment) })).catch((er) => toast.error(er.message)); }
  async function doFwd() {
    if (!fwd || fwd.ids.length === 0) return;
    setFwd({ ...fwd, sending: true });
    try {
      const r = await api(`/admin/chat/messages/${fwd.m.id}/forward`, { method: 'POST', body: { thread_ids: fwd.ids } });
      const bad = (r.results || []).filter((x) => !x.ok);
      if (bad.length) toast.error(bad.map((x) => x.error).join('; ')); else toast.ok('Forwarded');
      setFwd(null); msgs.reload(); threads.reload();
    } catch (er) { toast.error(er.message); setFwd((f) => f && { ...f, sending: false }); }
  }
  async function remove() {
    if (!(await confirm({ title: 'Delete conversation?', text: `All messages with ${sel.name} will be deleted here.`, confirmText: 'Delete', danger: true }))) return;
    try { await api(`/admin/chat/threads/${sel.id}`, { method: 'DELETE' }); toast.ok('Conversation deleted'); setSel(null); threads.reload(); }
    catch (e) { toast.error(e.message); }
  }
  const list = threads.data || [];
  const tabsRow = (
    <div style={{ padding: '10px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
      {CHANNELS.map((c) => {
        const n = (counts.data && counts.data[c.key]) || 0;
        return (
          <button key={c.key} className={`tab ${channel === c.key ? 'on' : ''}`} style={{ padding: '6px 10px' }} onClick={() => { setChannel(c.key); setPage(1); setSel(null); setQuote(null); setAtt(null); }}>
            {c.label}{n > 0 && <span className="badge pink" style={{ marginLeft: 6 }}>{n}</span>}
          </button>
        );
      })}
    </div>
  );
  const subRow = isCom ? (
    <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderBottom: '1px solid var(--line)' }}>
      <button className={`tab ${cview === 'posts' ? 'on' : ''}`} onClick={() => { setCview('posts'); setSel(null); }}>By post</button>
      <button className={`tab ${cview === 'people' ? 'on' : ''}`} onClick={() => setCview('people')}>By person</button>
    </div>
  ) : null;
  const issues = health && !health.ok ? health.issues : [];

  return (
    <div>
      <ErrorBox error={threads.error} onRetry={threads.reload} />
      {issues.length > 0 && (
        <div className="sm" style={{ background: '#fffaeb', border: '1px solid #fedf89', color: '#93370d', borderRadius: 12, padding: '8px 12px', marginBottom: 10 }}>
          <div className="flex sp center gap" style={{ flexWrap: 'wrap' }}>
            <b>⚠ {issues.length} setup issue{issues.length > 1 ? 's' : ''} — some messages / comments may not arrive</b>
            <span className="flex gap"><button type="button" className="btn sm" onClick={() => setShowIssues(!showIssues)}>{showIssues ? 'Hide' : 'Details'}</button><button type="button" className="btn sm" onClick={checkHealth}>Re-check</button></span>
          </div>
          {showIssues && issues.map((x, i) => (
            <div key={i} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #fedf89' }}>
              <b>{x.channel}:</b> {x.issue}<br /><span style={{ opacity: 0.9 }}>Fix: {x.fix}</span>
              {x.action && <div style={{ marginTop: 4 }}><button type="button" className="btn sm pri" disabled={fixing} onClick={() => fixNow(x.action)}>{fixing ? 'Working…' : 'Subscribe now'}</button></div>}
            </div>
          ))}
        </div>
      )}
      {isCom && cview === 'posts' ? (
        <PostsView key={channel} src={channel === 'igcomments' ? 'instagram' : 'facebook'} confirm={confirm} header={<>{tabsRow}{subRow}</>} toast={toast} onRead={() => counts.reload()} />
      ) : (
      <div className={`card chat ${sel ? 'open' : ''}`}>
        <div className="threads">
          {tabsRow}
          {subRow}
          <div style={{ padding: 12, display: 'flex', gap: 8, borderBottom: '1px solid var(--line)' }}>
            <button className={`tab ${!unreadOnly ? 'on' : ''}`} onClick={() => { setUnreadOnly(false); setPage(1); }}>All</button>
            <button className={`tab ${unreadOnly ? 'on' : ''}`} onClick={() => { setUnreadOnly(true); setPage(1); }}>Unread</button>
            <input className="input" style={{ flex: 1, minWidth: 0, padding: '6px 10px' }} placeholder="Search name…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          {threads.loading && !threads.data ? <Loading /> : list.length === 0 ? <Empty icon="chat" text="No conversations" /> : list.map((t) => (
            <div key={t.id} className={`th ${sel?.id === t.id ? 'on' : ''}`} onClick={() => { setSel(t); setQuote(null); setAtt(null); }}>
              <div className="avatar">{(t.name || '?').slice(0, 1).toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex sp"><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</b><span className="muted sm">{timeAgo(t.last_message_at)}</span></div>
                {t.phone && <div className="muted sm">+{t.phone}</div>}
                <div className="flex sp center gap">
                  <span className="muted sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last_text || '—'}</span>
                  {t.unread > 0 && <span className="badge pink">{t.unread}</span>}
                </div>
                {t.channel && t.channel !== 'messenger' && <Badge tone={CH_TONE[t.channel] || 'blue'}>{t.channel === 'comment' ? `${SRC_LABEL[t.src] || ''} comment`.trim() : (CH_LABEL[t.channel] || t.channel)}</Badge>}
              </div>
            </div>
          ))}
          {(list.length > 0 || page > 1) && <Pager page={page} pageSize={30} count={list.length} onPage={setPage} />}
        </div>

        <div className="conv">
          {!sel ? <Empty icon="chat" text="Select a conversation" /> : (
            <>
              <div className="flex center gap" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <button className="btn sm back" onClick={() => setSel(null)}><Icon name="back" size={14} /></button>
                {prof && prof.pic ? <img src={prof.pic} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flex: '0 0 38px' }} /> : <div className="avatar">{((prof && prof.name) || sel.name || '?').slice(0, 1).toUpperCase()}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(prof && prof.name) || sel.name}</b>
                  {((prof && prof.sub) || sel.phone) && <span className="muted sm">{(prof && prof.sub) || `+${sel.phone}`}</span>}
                </div>
                {sel.channel && <Badge tone={CH_TONE[sel.channel] || 'blue'}>{sel.channel === 'comment' ? `${SRC_LABEL[sel.src] || ''} comment`.trim() : (CH_LABEL[sel.channel] || sel.channel)}</Badge>}
                <button className="btn sm danger" onClick={remove}><Icon name="trash" size={14} /></button>
              </div>
              {sel.channel === 'whatsapp' && (() => { const last = [...(msgs.data || [])].reverse().find((x) => x.direction === 'in'); return last && Date.now() - new Date(last.created_at).getTime() > 86400000 ? <div className="sm" style={{ background: '#fffaeb', color: '#93370d', padding: '6px 14px', borderBottom: '1px solid #fedf89' }}>⏰ The customer's last message is over 24 hours old — WhatsApp only allows free replies within 24 hours.</div> : null; })()}
              <div className="msgs">
                {msgs.loading && !msgs.data ? <Loading /> : (msgs.data || []).map((m) => (
                  <div key={m.id} className={`bubble ${m.direction === 'out' ? 'out' : ''}`} style={{ position: 'relative', marginBottom: m.reaction ? 14 : undefined }}>
                    {(m.media || []).map((a, i) => (a.type === 'post' ? (
                      <a key={i} href={a.link || undefined} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 8, maxWidth: 260, background: 'rgba(0,0,0,.03)' }}>
                        {a.image && <img src={a.image} alt="" style={{ display: 'block', width: '100%', maxHeight: 150, objectFit: 'cover' }} />}
                        <div className="sm" style={{ padding: '6px 8px' }}><b>On this {a.src === 'instagram' ? 'Instagram post' : 'Facebook post'}{a.link ? ' ↗' : ''}</b>{a.text && <div style={{ opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.text}</div>}</div>
                      </a>
                    ) : a.type === 'quote' ? <div key={i} className="sm" style={{ borderLeft: '3px solid currentColor', opacity: 0.75, padding: '2px 8px', marginBottom: 6, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↩ {a.text}</div> : a.url ? (
                      a.type === 'image' ? <a key={i} href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt="" style={{ display: 'block', maxWidth: 240, maxHeight: 280, borderRadius: 8, marginBottom: 6 }} /></a>
                        : a.type === 'video' ? <video key={i} src={a.url} controls preload="metadata" style={{ display: 'block', maxWidth: 260, maxHeight: 300, borderRadius: 8, marginBottom: 6 }} />
                          : a.type === 'audio' ? <audio key={i} src={a.url} controls style={{ display: 'block', maxWidth: 260, marginBottom: 6 }} />
                            : <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: 6 }}>📎 {a.name || 'File'}</a>
                    ) : <div key={i} className="muted sm" style={{ marginBottom: 6 }}>{a.failed ? `⚠ ${a.type} could not be loaded` : `⏳ ${a.type} loading…`}</div>)) }
                    {m.kind === 'comment' && <><Badge tone="blue">comment</Badge>{' '}</>}{m.text}
                    <small>{dt(m.created_at)}</small>
                    {m.reaction && <span title="Your reaction" style={{ position: 'absolute', right: 8, bottom: -10, background: 'var(--card, #fff)', border: '1px solid var(--line)', borderRadius: 12, padding: '0 5px', fontSize: 14, lineHeight: '20px' }}>{m.reaction}</span>}
                    {(m.can_quote || m.can_react || m.text || (m.media || []).some((a) => a.url)) && (
                      <span style={{ position: 'absolute', top: 2, [m.direction === 'out' ? 'left' : 'right']: -24 }}>
                        <button type="button" aria-label="Message actions" onClick={() => setMenu(menu === m.id ? null : m.id)} style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: 0.6, color: 'inherit', padding: '2px 4px' }}>⋯</button>
                      </span>
                    )}
                    {menu === m.id && (
                      <>
                        <span onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                        <span style={{ position: 'absolute', top: '100%', [m.direction === 'out' ? 'right' : 'left']: 0, zIndex: 41, background: '#fff', color: '#222', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 6px 22px rgba(0,0,0,.18)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190, whiteSpace: 'normal' }}>
                          {m.can_react && <span style={{ display: 'flex', gap: 2, justifyContent: 'space-between', padding: '2px 2px 6px', borderBottom: '1px solid var(--line)' }}>
                            {REACTS.map((e) => <button key={e} type="button" aria-label={`React ${e}`} onClick={() => react(m, e)} style={{ border: 0, background: m.reaction === e ? 'var(--line)' : 'none', borderRadius: 10, cursor: 'pointer', fontSize: 20, padding: '2px 3px' }}>{e}</button>)}
                          </span>}
                          {m.can_quote && <button type="button" className="btn sm" style={{ justifyContent: 'flex-start', border: 0 }} onClick={() => { setQuote(m); setMenu(null); }}>↩ Reply{m.kind === 'comment' ? ' to this comment' : ''}</button>}
                          {(m.text || (m.media || []).some((a) => a.url && a.type !== 'post')) && <button type="button" className="btn sm" style={{ justifyContent: 'flex-start', border: 0 }} onClick={() => openFwd(m)}>↪ Forward</button>}
                        </span>
                      </>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              {quote && (
                <div className="flex center sp gap sm" style={{ padding: '6px 14px', borderTop: '1px solid var(--line)', background: 'var(--bg, #f6f6f9)' }}>
                  <span style={{ borderLeft: '3px solid var(--pink, #e91e8c)', paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>↩ Replying to: {(quote.text || (quote.media && quote.media.length ? '📎 ' + quote.media[0].type : '')).slice(0, 80)}</span>
                  <button type="button" className="btn sm" onClick={() => setQuote(null)} aria-label="Cancel reply">✕</button>
                </div>
              )}
              {(att || uploading) && (
                <div className="flex center sp gap sm" style={{ padding: '6px 14px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{uploading ? '⏳ Uploading…' : `📎 ${att.name || att.type} (${att.type})`}</span>
                  {att && <button type="button" className="btn sm" onClick={() => setAtt(null)} aria-label="Remove file">✕</button>}
                </div>
              )}
              {sel.channel === 'comment' && !quote && <div className="muted sm" style={{ padding: '4px 14px' }}>Replying to the latest comment · open ⋯ on a comment to answer a specific one</div>}
              <form className="composer" onSubmit={send}>
                {sel.channel !== 'comment' && <>
                  <input ref={fileRef} type="file" hidden onChange={pickFile} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" />
                  <button type="button" className="btn" aria-label="Attach a file" disabled={uploading} onClick={() => fileRef.current && fileRef.current.click()}>📎</button>
                </>}
                <input className="input" style={{ minWidth: 0 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={att ? 'Add a caption…' : sel.channel === 'comment' ? 'Reply to the comment…' : 'Write a reply…'} maxLength={1900} />
                <button className="btn pri" disabled={sending || uploading || (!text.trim() && !att)}><Icon name="send" size={15} /> Send</button>
              </form>
            </>
          )}
        </div>
      </div>
      )}
      {fwd && (
        <div onClick={() => setFwd(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,18,40,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 440, maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="flex center sp" style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
              <b>Forward to…</b>
              <button type="button" className="btn sm" onClick={() => setFwd(null)} aria-label="Close">✕</button>
            </div>
            <div className="muted sm" style={{ padding: '8px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fwd.m.text || `📎 ${(fwd.m.media || []).find((a) => a.url)?.type || 'file'}`}</div>
            <div style={{ padding: '0 14px 8px' }}><input className="input" style={{ width: '100%' }} placeholder="Search a customer…" value={fwd.q} onChange={(e) => setFwd({ ...fwd, q: e.target.value })} /></div>
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 120 }}>
              {!fwd.list ? <Loading /> : fwd.list.filter((x) => (x.name || '').toLowerCase().includes(fwd.q.toLowerCase())).map((x) => (
                <label key={x.id} className="flex center gap" style={{ padding: '9px 14px', borderTop: '1px solid var(--line)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fwd.ids.includes(x.id)} onChange={() => setFwd({ ...fwd, ids: fwd.ids.includes(x.id) ? fwd.ids.filter((i) => i !== x.id) : [...fwd.ids, x.id] })} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span>
                  <Badge tone={CH_TONE[x.channel] || 'blue'}>{CH_LABEL[x.channel] || x.channel}</Badge>
                </label>
              ))}
              {fwd.list && fwd.list.length === 0 && <Empty icon="chat" text="No conversations" />}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
              <button type="button" className="btn pri" style={{ width: '100%' }} disabled={fwd.sending || fwd.ids.length === 0} onClick={doFwd}>{fwd.sending ? 'Sending…' : `Forward${fwd.ids.length ? ` to ${fwd.ids.length}` : ''}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
