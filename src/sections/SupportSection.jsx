'use client';
/**
 * CUSTOMER MESSAGES — messages customers send from the website (/account/support). Reply, send photos, delete.
 * APIs: GET /admin/support/threads · GET /admin/support/threads/{uid} · POST /admin/support/threads/{uid}/messages {text,images}
 *       DELETE /admin/support/messages/{id} (photos deleted too) · DELETE /admin/support/threads/{uid} · POST /admin/upload
 * Only the admin can delete. Customers can only edit their own messages.
 */
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { Empty, ErrorBox, ImageUploader, Loading } from '@/components/ui';
import { useConfirm, useToast } from '@/components/Providers';
import { api, assetUrl } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { dt, timeAgo } from '@/lib/format';

export default function SupportSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [sel, setSel] = useState(null);
  const [text, setText] = useState('');
  const [imgs, setImgs] = useState([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const threads = useAsync(() => api('/admin/support/threads'), []);
  const conv = useAsync(() => (sel ? api(`/admin/support/threads/${sel.user_id}`) : Promise.resolve(null)), [sel?.user_id]);
  const msgs = conv.data?.messages || [];

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, sel?.user_id]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) { threads.reload(); if (sel) conv.reload(); } }, 20000);
    return () => clearInterval(t);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(e) {
    e.preventDefault();
    if (!sel || (!text.trim() && !imgs.length)) return;
    setSending(true);
    try {
      await api(`/admin/support/threads/${sel.user_id}/messages`, { method: 'POST', body: { text: text.trim() || null, images: imgs } });
      setText(''); setImgs([]); conv.reload(); threads.reload();
    } catch (err) { toast.error(err.message); } finally { setSending(false); }
  }
  async function delMsg(m) {
    if (!(await confirm({ title: 'Delete message?', text: 'The message and its photos are deleted for good (the customer will not see it).', confirmText: 'Delete', danger: true }))) return;
    try { await api(`/admin/support/messages/${m.id}`, { method: 'DELETE' }); conv.reload(); threads.reload(); } catch (e) { toast.error(e.message); }
  }
  async function delThread() {
    if (!(await confirm({ title: 'Delete whole conversation?', text: `Every message with ${sel.name || sel.phone} and all photos will be deleted.`, confirmText: 'Delete all', danger: true }))) return;
    try { await api(`/admin/support/threads/${sel.user_id}`, { method: 'DELETE' }); toast.ok('Conversation deleted'); setSel(null); threads.reload(); } catch (e) { toast.error(e.message); }
  }
  const list = threads.data || [];
  const who = (t) => t.name || t.phone;

  return (
    <div>
      <ErrorBox error={threads.error} onRetry={threads.reload} />
      <div className={`card chat ${sel ? 'open' : ''}`}>
        <div className="threads">
          {threads.loading && !threads.data ? <Loading /> : list.length === 0 ? <Empty icon="chat" text="No customer messages yet" /> : list.map((t) => (
            <div key={t.user_id} className={`th ${sel?.user_id === t.user_id ? 'on' : ''}`} onClick={() => setSel(t)}>
              <div className="avatar">{who(t).slice(0, 1).toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex sp"><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{who(t)}</b><span className="muted sm">{timeAgo(t.last_at)}</span></div>
                <div className="flex sp center gap">
                  <span className="muted sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last_sender === 'admin' ? 'You: ' : ''}{t.last_text || '—'}</span>
                  {t.unread > 0 && <span className="badge pink">{t.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="conv">
          {!sel ? <Empty icon="chat" text="Select a conversation" /> : (
            <>
              <div className="flex center gap" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <button className="btn sm back" onClick={() => setSel(null)}><Icon name="back" size={14} /></button>
                <div className="avatar">{who(sel).slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}><b>{who(sel)}</b><div className="muted sm">{sel.phone}</div></div>
                <button className="btn sm danger" onClick={delThread} aria-label="Delete conversation"><Icon name="trash" size={14} /></button>
              </div>
              <div className="msgs">
                {conv.loading && !conv.data ? <Loading /> : msgs.map((m) => (
                  <div key={m.id} className={`bubble ${m.sender === 'admin' ? 'out' : ''}`}>
                    {m.text}
                    {m.images?.length > 0 && <div className="flex gap" style={{ flexWrap: 'wrap', marginTop: 6 }}>{m.images.map((u) => <a key={u} href={assetUrl(u)} target="_blank" rel="noopener noreferrer"><img src={assetUrl(u)} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} /></a>)}</div>}
                    <small>{dt(m.created_at)}{m.edited ? ' · edited' : ''} · <a role="button" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => delMsg(m)}>delete</a></small>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className="composer" onSubmit={send} style={{ flexWrap: 'wrap' }}>
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" maxLength={1500} />
                <button className="btn pri" disabled={sending || (!text.trim() && !imgs.length)}><Icon name="send" size={15} /> Send</button>
                <div style={{ flexBasis: '100%' }}><ImageUploader value={imgs} onChange={setImgs} max={3} /></div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
