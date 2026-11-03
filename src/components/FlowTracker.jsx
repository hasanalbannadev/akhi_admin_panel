'use client';
/** One long line of circles for an order: filled = reached, empty = still to come.
 *  Covers the forward trip, a courier return (failed delivery) and the customer return + refund. */
import { useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { Badge } from '@/components/ui';
import { courierTone, label } from '@/lib/format';

const FORWARD = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const RETURN = [['requested', 'Return requested'], ['approved', 'Return approved'], ['pickup', 'Courier pickup'], ['received', 'Return successful'], ['refunded', 'Refund completed']];

export function flowSteps(o) {
  const ri = o.return_info;
  const at = FORWARD.indexOf(o.status);
  if (o.status === 'cancelled') return { steps: [], cancelled: true };
  if (ri && ri.status !== 'rejected') {
    const ri_at = RETURN.findIndex(([k]) => k === ri.status);
    return {
      steps: [
        ...FORWARD.map((s) => ({ k: s, t: label(s), done: true })),
        ...RETURN.map(([k, t], i) => ({ k: 'r' + k, t, done: i <= ri_at, cur: i === ri_at, note: k === 'pickup' && ri.courier_status_bn ? ri.courier_status_bn : k === 'refunded' && ri.refund_trx ? `TrxID ${ri.refund_trx}` : null })),
      ],
    };
  }
  if (o.status === 'returned') {
    return { steps: [...FORWARD.slice(0, 4).map((s) => ({ k: s, t: label(s), done: true })), { k: 'failed', t: 'Delivery failed', done: true }, { k: 'back', t: 'Returned to shop', done: true, cur: true }] };
  }
  return { steps: FORWARD.map((s, i) => ({ k: s, t: label(s), done: i <= at, cur: i === at })) };
}

export default function FlowTracker({ o }) {
  const { steps, cancelled } = flowSteps(o);
  const box = useRef(null);
  // on a small screen the line scrolls sideways: bring the current step into view
  useEffect(() => {
    const el = box.current?.querySelector('.cur') || [...(box.current?.querySelectorAll('.done') || [])].pop();
    if (el && box.current) box.current.scrollLeft = Math.max(0, el.offsetLeft - box.current.clientWidth / 2 + el.clientWidth / 2);
  }, [o.status, o.return_info?.status]);
  return (
    <div className="trackwrap">
    <div className="tracker" ref={box} aria-label="Order progress">
      {cancelled ? (
        <div className="st cancelled"><span className="dotc"><Icon name="x" size={12} /></span><small>Cancelled</small></div>
      ) : steps.map((s) => (
        <div key={s.k} className={`st ${s.done ? 'done' : ''} ${s.cur ? 'cur' : ''}`}>
          <span className="dotc">{s.done ? <Icon name="check" size={12} /> : null}</span>
          <small>{s.t}</small>
          {s.note && <small className="muted">{s.note}</small>}
        </div>
      ))}
    </div>
      {o.courier_status && (
        <div className="cs">
          <span className="muted sm">{label(o.courier || 'courier')}:</span> <Badge tone={courierTone(o.courier_status)}>{label(o.courier_status)}</Badge>
        </div>
      )}
    </div>
  );
}
