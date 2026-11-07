'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { startRealtime } from '@/lib/realtime';
import { useBusy } from '@/lib/store';
import Icon from './Icon';
import { Modal } from './ui';

const ToastCtx = createContext(null);
const ConfirmCtx = createContext(null);

export function useToast() { return useContext(ToastCtx); }
export function useConfirm() { return useContext(ConfirmCtx); }

function TopBar() {
  const on = useBusy();
  if (!on) return null;
  return (
    <div aria-hidden style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999, overflow: 'hidden', background: 'var(--pink-l)', pointerEvents: 'none' }}>
      <div style={{ height: '100%', width: '33%', background: 'var(--pink)', animation: 'topbar 0.9s ease-in-out infinite' }} />
    </div>
  );
}

export default function Providers({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);
  const [dlg, setDlg] = useState(null);
  useEffect(() => startRealtime(), []);

  const push = useCallback((kind, text) => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'err' ? 6000 : 3200);
  }, []);

  const toast = useMemo(() => ({
    ok: (m) => push('ok', m), error: (m) => push('err', m),
  }), [push]);

  /** const ok = await confirm({ title, text, confirmText, danger }) */
  const confirm = useCallback((opts) => new Promise((resolve) => setDlg({ ...opts, resolve })), []);
  const close = (v) => { dlg?.resolve(v); setDlg(null); };

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={confirm}>
        <TopBar />
        {children}
        <div className="toasts">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.kind}`}>
              <Icon name={t.kind === 'ok' ? 'check' : 'alert'} size={16} /> {t.text}
            </div>
          ))}
        </div>
        {dlg && (
          <Modal title={dlg.title || 'Are you sure?'} onClose={() => close(false)}
            footer={<>
              <button className="btn" onClick={() => close(false)}>Cancel</button>
              <button className={`btn ${dlg.danger ? 'danger' : 'pri'}`} onClick={() => close(true)}>{dlg.confirmText || 'Confirm'}</button>
            </>}>
            <div>{dlg.text}</div>
          </Modal>
        )}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
