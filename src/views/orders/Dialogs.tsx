import { useState, type ReactNode } from 'react';
import { Check, CircleDollarSign, PhoneCall, PhoneOff, PhoneMissed, Truck } from 'lucide-react';
import { useApp } from '../../store';
import { Button, Drawer, Field, Modal, Segmented, Select, Switch } from '../../ui/kit';
import { cn, rs } from '../../lib/format';
import type { Order } from '../../data/seed';
import { COURIER_INFO, addEvent, flash, patchOrder, payStore, restock, setStatus, waybill } from './shared';
import InvoicePreview from './InvoicePreview';

export type Flow = 'confirm' | 'pack' | 'ship' | 'deliver' | 'cancel' | 'refund' | 'invoice' | 'notify';

export function CallDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { user, toast } = useApp();
  const [out, setOut] = useState<'Confirmed' | 'Unreachable' | 'Refused' | ''>('');
  const [err, setErr] = useState('');
  const opts = [
    { v: 'Confirmed', icon: PhoneCall, d: 'Customer agreed. Move to Processing.' },
    { v: 'Unreachable', icon: PhoneMissed, d: 'No answer. Order stays in To confirm.' },
    { v: 'Refused', icon: PhoneOff, d: 'Customer declined. Cancel and restock.' },
  ] as const;
  const save = () => {
    if (!out) return setErr('Choose what happened on the call.');
    if (out === 'Confirmed') { setStatus(order, 'Processing', 'Confirmed after phone call', user.name, { codVerified: true }); toast('Order confirmed', { body: order.id }); }
    else if (out === 'Unreachable') { addEvent(order.id, 'Call attempted: customer unreachable', user.name); flash([order.id]); toast('Logged as unreachable', { body: 'Try again later' }); }
    else { setStatus(order, 'Cancelled', 'Customer refused on call. Order cancelled', user.name); restock(order); toast('Order cancelled', { body: 'Items returned to stock' }); }
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Call customer" size="sm" footer={<><Button variant="secondary" onClick={onClose}>Not now</Button><Button onClick={save}>Save outcome</Button></>}>
      <div className="rounded-xl bg-soft border border-line p-4 mb-4">
        <div className="font-medium">{order.customer}</div>
        <a href={`tel:${order.phone.replace(/\s/g, '')}`} className="text-[18px] num hover:text-champagne transition-colors">{order.phone}</a>
        <div className="text-muted text-[13px] mt-0.5">{order.address} · COD {rs(order.total)}</div>
      </div>
      <div className="grid gap-2">
        {opts.map((o) => (
          <button key={o.v} onClick={() => { setOut(o.v); setErr(''); }} className={cn('flex items-center gap-3 text-left rounded-xl border p-3 transition-all duration-200', out === o.v ? 'border-champagne bg-soft' : 'border-line hover:border-fg/30')}>
            <o.icon size={18} strokeWidth={1.5} /><span className="flex-1"><span className="block font-medium">{o.v}</span><span className="text-muted text-[12.5px]">{o.d}</span></span>
            {out === o.v && <Check size={16} className="text-champagne anim-pop" />}
          </button>
        ))}
      </div>
      {err && <div className="text-bad text-[12px] mt-2 anim-shake">{err}</div>}
    </Modal>
  );
}

export function ShipDrawer({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const { user, toast } = useApp();
  const [mode, setMode] = useState<'courier' | 'manual'>('courier');
  const [sel, setSel] = useState(order.courier !== '—' ? order.courier : COURIER_INFO[0].name);
  const [mName, setMName] = useState(''); const [track, setTrack] = useState(''); const [err, setErr] = useState('');
  const go = () => {
    if (mode === 'manual' && (!mName.trim() || !track.trim())) return setErr('Enter the courier name and tracking number.');
    const courier = mode === 'manual' ? mName.trim() : sel; const tracking = mode === 'manual' ? track.trim() : waybill();
    setStatus(order, 'Shipped', `Shipped with ${courier}. Waybill ${tracking}`, user.name, { courier, tracking });
    toast('Waybill created', { body: tracking }); onDone(); onClose();
  };
  return (
    <Drawer open onClose={onClose} title="Ship order" subtitle={`${order.id} · ${order.customer}, ${order.city}`} width={480}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Truck} onClick={go}>{mode === 'courier' ? 'Create waybill' : 'Save and ship'}</Button></>}>
      <Segmented value={mode} onChange={(v) => { setMode(v); setErr(''); }} options={[{ value: 'courier', label: 'Choose a courier' }, { value: 'manual', label: 'Manual shipping' }]} />
      {mode === 'courier' ? (
        <div className="grid gap-3 mt-5">
          {COURIER_INFO.map((c) => (
            <button key={c.name} onClick={() => setSel(c.name)} className={cn('flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200', sel === c.name ? 'border-champagne bg-soft shadow-sm' : 'border-line hover:border-fg/30')}>
              <span className={cn('size-5 rounded-full border-2 flex items-center justify-center', sel === c.name ? 'border-ink' : 'border-line')}>{sel === c.name && <span className="size-2.5 rounded-full bg-ink anim-pop" />}</span>
              <span className="flex-1"><span className="block font-medium">{c.name}</span><span className="text-muted text-[13px]">Arrives in about {c.days} days</span></span>
              <span className="num font-medium">{rs(c.price)}</span>
            </button>
          ))}
          <div className="text-muted text-[13px]">A waybill is created automatically and the customer is told by SMS and email.</div>
        </div>
      ) : (
        <div className="grid gap-4 mt-5">
          <Field label="Courier name" value={mName} onChange={setMName} />
          <Field label="Tracking number" value={track} onChange={setTrack} hint="Printed on the parcel or given by the courier." />
        </div>
      )}
      {err && <div className="text-bad text-[12px] mt-3 anim-shake">{err}</div>}
    </Drawer>
  );
}

const REASONS = ['Customer changed mind', 'Out of stock', 'Address not serviceable', 'Duplicate order', 'Suspected fraud', 'Other'];
export function CancelDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { user, toast } = useApp();
  const [reason, setReason] = useState(''); const [note, setNote] = useState(''); const [rest, setRest] = useState(true); const [err, setErr] = useState('');
  const go = () => {
    if (!reason) return setErr('Please choose a reason.');
    const prev = order;
    setStatus(order, 'Cancelled', `Order cancelled: ${reason}${note ? ` (${note})` : ''}`, user.name);
    if (rest) restock(order);
    toast('Order cancelled', { body: order.id, undo: () => { patchOrder(prev.id, { status: prev.status }); addEvent(prev.id, 'Cancellation undone', user.name); flash([prev.id]); } });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Cancel order" size="sm" footer={<><Button variant="secondary" onClick={onClose}>Keep order</Button><Button variant="danger" onClick={go}>Cancel order</Button></>}>
      <div className="grid gap-4">
        <div>
          <Select label="Reason" value={reason} onChange={(v) => { setReason(v); setErr(''); }} options={[{ value: '', label: 'Choose a reason' }, ...REASONS.map((r) => ({ value: r, label: r }))]} />
          {err && <div className="text-bad text-[12px] mt-1.5">{err}</div>}
        </div>
        <Field label="Note (optional)" value={note} onChange={setNote} />
        <div className="flex items-center justify-between rounded-xl border border-line p-3.5">
          <div><div className="font-medium">Restock items</div><div className="text-muted text-[12.5px]">Add the items back to available stock.</div></div>
          <Switch checked={rest} onChange={setRest} label="Restock" />
        </div>
      </div>
    </Modal>
  );
}

export const canRefund = (role: string) => role === 'Finance' || role === 'Owner';
export function RefundDialog({ order, refunded, onClose }: { order: Order; refunded: number; onClose: () => void }) {
  const { user, role, toast } = useApp();
  const left = Math.max(0, order.total - refunded);
  const [mode, setMode] = useState<'full' | 'partial'>('full'); const [amt, setAmt] = useState('');
  const [reason, setReason] = useState(''); const [method, setMethod] = useState(order.pay === 'COD' ? 'Bank transfer' : 'Original payment method'); const [err, setErr] = useState<Record<string, string>>({});
  const ok = canRefund(role);
  const go = () => {
    const a = mode === 'full' ? left : Number(amt); const e: Record<string, string> = {};
    if (!(a > 0)) e.amt = 'Enter an amount above zero.'; else if (a > left) e.amt = `Cannot be more than ${rs(left)}.`;
    if (!reason) e.reason = 'Please choose a reason.';
    setErr(e); if (Object.keys(e).length) return;
    if (!ok) {
      payStore.set((m) => ({ ...m, [order.id]: { status: 'Approval requested', refunded } }));
      addEvent(order.id, `Refund of ${rs(a)} requested for approval`, user.name); toast('Approval requested', { body: 'Finance has been notified' });
    } else {
      const total = refunded + a;
      payStore.set((m) => ({ ...m, [order.id]: { status: total >= order.total ? 'Refunded' : 'Partially refunded', refunded: total } }));
      addEvent(order.id, `Refunded ${rs(a)} via ${method}`, user.name); toast('Refund issued', { body: rs(a) });
    }
    flash([order.id]); onClose();
  };
  return (
    <Modal open onClose={onClose} title="Refund" size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={CircleDollarSign} onClick={go}>{ok ? 'Issue refund' : 'Request approval'}</Button></>}>
      <div className="grid gap-4">
        <div className="flex items-center justify-between"><Segmented value={mode} onChange={setMode} options={[{ value: 'full', label: 'Full' }, { value: 'partial', label: 'Partial' }]} /><span className="text-muted text-[13px]">Available {rs(left)}</span></div>
        {mode === 'partial' && <Field label="Amount" prefix="Rs" type="number" value={amt} onChange={setAmt} error={err.amt} />}
        {mode === 'full' && err.amt && <div className="text-bad text-[12px]">{err.amt}</div>}
        <div><Select label="Reason" value={reason} onChange={setReason} options={[{ value: '', label: 'Choose a reason' }, ...['Damaged item', 'Wrong item sent', 'Late delivery', 'Customer changed mind', 'Other'].map((r) => ({ value: r, label: r }))]} />{err.reason && <div className="text-bad text-[12px] mt-1.5">{err.reason}</div>}</div>
        <Select label="Refund method" value={method} onChange={setMethod} options={['Original payment method', 'Bank transfer', 'Store credit']} />
        {!ok && <div className="text-[13px] text-muted rounded-xl bg-soft p-3">Refunds need approval from Finance or the Owner. We will send this request to them.</div>}
      </div>
    </Modal>
  );
}

export function useOrderFlow(order: Order | undefined, refunded = 0) {
  const { user, toast } = useApp();
  const [dlg, setDlg] = useState<Flow | null>(null);
  const [shipped, setShipped] = useState(false);
  const run = (a: Flow) => {
    if (!order) return;
    if (a === 'confirm') { if (order.pay === 'COD' && !order.codVerified) setDlg('confirm'); else { setStatus(order, 'Processing', 'Order confirmed', user.name); toast('Order confirmed', { body: order.id }); } }
    else if (a === 'pack') { setStatus(order, 'Packed', 'Packed and ready for pickup', user.name); toast('Order packed', { body: order.id }); }
    else if (a === 'deliver') { setStatus(order, 'Delivered', 'Marked as delivered', user.name, {}); toast('Order delivered', { body: order.id, star: true }); }
    else if (a === 'notify') { addEvent(order.id, 'Notification resent by SMS and email', user.name); flash([order.id]); toast('Notification sent', { body: order.customer }); }
    else setDlg(a);
  };
  const close = () => setDlg(null);
  const node: ReactNode = order && (
    <>
      {dlg === 'confirm' && <CallDialog order={order} onClose={close} />}
      {dlg === 'ship' && <ShipDrawer order={order} onClose={close} onDone={() => setShipped(true)} />}
      {dlg === 'cancel' && <CancelDialog order={order} onClose={close} />}
      {dlg === 'refund' && <RefundDialog order={order} refunded={refunded} onClose={close} />}
      {dlg === 'invoice' && <InvoicePreview order={order} onClose={close} />}
    </>
  );
  return { run, node, shipped, setShipped };
}
