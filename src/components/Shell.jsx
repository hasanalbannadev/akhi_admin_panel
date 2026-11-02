'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { sep: 'Catalog' },
  { href: '/products', label: 'Products', icon: 'box' },
  { href: '/categories', label: 'Categories', icon: 'tag' },
  { href: '/inventory', label: 'Inventory', icon: 'package' },
  { sep: 'Sales' },
  { href: '/orders', label: 'Orders', icon: 'cart', badge: 'orders' },
  { href: '/payments', label: 'Payments', icon: 'card', badge: 'payments' },
  { href: '/payment-methods', label: 'Payment Accounts', icon: 'wallet' },
  { href: '/returns', label: 'Returns', icon: 'undo' },
  { href: '/customers', label: 'Customers', icon: 'users' },
  { sep: 'Marketing' },
  { href: '/offers', label: 'Offers', icon: 'tag' },
  { href: '/sms', label: 'SMS', icon: 'send' },
  { href: '/coupons', label: 'Coupons', icon: 'ticket' },
  { href: '/banners', label: 'Banners', icon: 'image' },
  { href: '/reviews', label: 'Reviews', icon: 'star' },
  { href: '/support', label: 'Customer Chat', icon: 'chat', badge: 'support' },
  { href: '/chat', label: 'Chat & Messages', icon: 'chat', badge: 'chat' },
  { sep: 'Manage' },
  { href: '/delivery-zones', label: 'Delivery Zones', icon: 'truck' },
  { href: '/reports', label: 'Reports', icon: 'chart' },
  { href: '/staff', label: 'Staff', icon: 'shield', owner: true },
  { href: '/settings', label: 'Settings', icon: 'cog' },
];

const TITLES = Object.fromEntries(NAV.filter((n) => n.href).map((n) => [n.href, n.label]));
TITLES['/notifications'] = 'Notifications';

export default function Shell({ children }) {
  const path = usePathname() || '';
  const { session, logout, isOwner } = useAuth();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ chat: 0, notif: 0, payments: 0, support: 0 });
  const [waiting, setWaiting] = useState([]);   // customers with messages you have not answered
  const [msgOpen, setMsgOpen] = useState(false);
  const popRef = useRef(null);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const [c, n, d, sp, th] = await Promise.all([
        api('/admin/chat/unread-count').catch(() => ({ unread: 0 })),
        api('/admin/notifications', { query: { unread_only: true } }).catch(() => ({ unread: 0 })),
        api('/admin/dashboard').catch(() => ({ pending_payment_checks: 0 })),
        api('/admin/support/unread').catch(() => ({ unread: 0 })),
        api('/admin/support/threads').catch(() => []),
      ]);
      setWaiting((Array.isArray(th) ? th : []).filter((t) => t.unread > 0));
      setCounts({ chat: c.unread || 0, notif: n.unread || 0, payments: d.pending_payment_checks || 0, support: sp.unread || 0 });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh, path]);

  useEffect(() => { setOpen(false); setMsgOpen(false); }, [path]);
  useEffect(() => {
    if (!msgOpen) return undefined;
    const f = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setMsgOpen(false); };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [msgOpen]);

  const base = '/' + (path.split('/')[1] || '');
  const title = TITLES[base] || 'Admin';
  const badge = (k) => (k === 'payments' ? counts.payments : k === 'chat' ? counts.chat : k === 'support' ? counts.support : 0);
  const initials = (session?.username || 'A').slice(0, 1).toUpperCase();

  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="logo"><Icon name="star" size={20} /></div>
          <div><b>Akhi Lifestyle</b><small>Admin Panel</small></div>
        </div>
        <nav className="nav">
          {NAV.filter((n) => !n.owner || isOwner).map((n, i) => n.sep ? (
            <div className="sep" key={i}>{n.sep}</div>
          ) : (
            <Link key={n.href} href={n.href} className={base === n.href ? 'on' : ''}>
              <Icon name={n.icon} size={18} /> {n.label}
              {n.badge && badge(n.badge) > 0 && <span className="tag">{badge(n.badge)}</span>}
            </Link>
          ))}
        </nav>
        <div className="me">
          <div className="avatar">{initials}</div>
          <div className="who">{session?.username}<small>{session?.role}</small></div>
          <button onClick={logout} title="Sign out" aria-label="Sign out"><Icon name="logout" /></button>
        </div>
      </aside>
      <div className={`backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="top">
          <button className="iconbtn burger" onClick={() => setOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <h1>{title}</h1>
          <div className="pop" ref={popRef}>
            <button className="iconbtn" title="Customer messages" aria-label="Customer messages" aria-expanded={msgOpen} onClick={() => { setMsgOpen((o) => !o); refresh(); }}>
              <Icon name="chat" />{waiting.length + counts.chat > 0 && <span className="dot">{waiting.length + counts.chat}</span>}
            </button>
            {msgOpen && (
              <div className="menu" role="menu">
                <div className="mh"><span>Unseen messages</span><span className="muted sm">{waiting.length} customer{waiting.length === 1 ? '' : 's'}</span></div>
                <div className="mb">
                  {waiting.length === 0 ? <div className="muted" style={{ padding: 18, textAlign: 'center' }}>No unseen customer messages</div> : waiting.map((t) => (
                    <a key={t.user_id} className="mi" href={`/support?u=${t.user_id}`} onClick={(e) => { e.preventDefault(); setMsgOpen(false); router.push(`/support?u=${t.user_id}`); setTimeout(() => window.dispatchEvent(new CustomEvent('support-open', { detail: t })), 50); }}>
                      <div className="avatar">{(t.name || t.phone || '?').slice(0, 1).toUpperCase()}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="flex sp"><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name || t.phone}</b><span className="muted sm">{timeAgo(t.last_at)}</span></div>
                        <div className="flex sp center gap"><span className="muted sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last_text || '—'}</span><span className="badge pink">{t.unread}</span></div>
                      </div>
                    </a>
                  ))}
                </div>
                <Link href="/support" className="mf" onClick={() => setMsgOpen(false)}>Open all customer chats</Link>
                {counts.chat > 0 && <Link href="/chat" className="mf" style={{ borderTop: '1px solid var(--line)' }} onClick={() => setMsgOpen(false)}>Messenger inbox ({counts.chat} unread)</Link>}
              </div>
            )}
          </div>
          <Link href="/notifications" className="iconbtn" title="Notifications" aria-label="Notifications">
            <Icon name="bell" />{counts.notif > 0 && <span className="dot">{counts.notif}</span>}
          </Link>
          <div className="avatar" title={session?.username}>{initials}</div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
