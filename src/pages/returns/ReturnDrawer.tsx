import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, CircleAlert, Truck, PackageCheck, X as XIcon } from 'lucide-react';
import { Avatar, Button, Card, CountUp, Drawer, Field, Label, Lightbox, Modal, Photo, Pill, Select, StatusPill, Timeline } from '../../ui/kit';
import { cn, rs } from '../../lib/format';
import { COURIERS, photo } from '../../data/seed';
import { navigate, useApp } from '../../store';
import { OUTCOMES, REJECT_TEMPLATES, adjustStock, customerId, finishReturn, inWindow, isReturnable, itemsValue, patchReturn, policyStore, productOf, returnsStore, stockOf, unit, type Ret } from './data';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const COLORS = ['Ivory', 'Sage', 'Ink', 'Champagne', 'Rose', 'Sand'];

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-7"><Label className="mb-3">{title}</Label>{children}</section>; }

export default function ReturnDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [rows] = returnsStore.use(); const [pol] = policyStore.use(); const { toast } = useApp();
  const r = rows.find((x) => x.id === id) ?? null;
  const [zoom, setZoom] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false); const [reason, setReason] = useState(''); const [rErr, setRErr] = useState('');
  const [courier, setCourier] = useState(COURIERS[0]); const [date, setDate] = useState('2026-10-20'); const [dErr, setDErr] = useState('');
  const [insp, setInsp] = useState<'Restock' | 'Damaged' | 'Discard'>('Restock');
  const [refundText, setRefundText] = useState('');
  useEffect(() => { if (r) setRefundText(String(r.refund)); }, [id]); // eslint-disable-line
  if (!r) return <Drawer open={false} onClose={onClose} children={null} />;
  const done = r.status === 'Completed' || r.status === 'Rejected';
  const it = r.items[0]; const p = productOf(it.productId);
  const notify = (title: string, body: string) => toast(title, { body });
  const cid = customerId(r.customer);
  const ex = r.exchange ?? { size: it.size, color: it.color, reserved: false };
  const live = stockOf(p, ex.size, ex.color);
  const setOutcome = (o: Ret['outcome']) => patchReturn(r.id, () => ({ outcome: o, exchange: o === 'Exchange' ? ex : r.exchange }));
  const setEx = (patch: Partial<typeof ex>) => {
    if (ex.reserved) { const old = stockOf(p, ex.size, ex.color); if (old.product) adjustStock(old.product.id, ex.size, ex.color, 1); }
    patchReturn(r.id, () => ({ exchange: { ...ex, ...patch, reserved: false } }));
  };
  const reserve = () => {
    if (!live.product || live.stock < 1) return;
    adjustStock(live.product.id, ex.size, ex.color, -1);
    patchReturn(r.id, () => ({ exchange: { ...ex, reserved: true } }), `Reserved ${ex.color} / ${ex.size} for the exchange`);
    notify('Stock reserved', `1 x ${ex.color} / ${ex.size} held for ${r.customer}.`);
  };
  const commitRefund = (v: string) => { setRefundText(v); patchReturn(r.id, () => ({ refund: Math.max(0, Math.round(+v) || 0) })); };

  const approve = () => { patchReturn(r.id, () => ({ status: 'Approved' }), 'Request approved'); notify('Customer notified', `${r.customer} was told the request is approved.`); };
  const reject = () => {
    if (!reason.trim()) return setRErr('Please add a reason for the customer.');
    patchReturn(r.id, () => ({ status: 'Rejected', rejectReason: reason }), `Request rejected: ${reason}`); setRejecting(false); setReason(''); setRErr('');
    notify('Customer notified', `${r.customer} received your reason by message.`);
  };
  const schedule = () => {
    if (!date) return setDErr('Pick a pickup date.');
    const label = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    patchReturn(r.id, () => ({ status: 'Pickup scheduled', courier, pickupDate: label }), `Pickup scheduled with ${courier} on ${label}`); setDErr('');
    notify('Customer notified', `${courier} will collect on ${label}.`);
  };
  const received = () => { patchReturn(r.id, () => ({ status: 'Received' }), 'Parcel received at warehouse'); notify('Customer notified', 'We have received your parcel.'); };
  const inspect = () => {
    if (insp === 'Restock') adjustStock(it.productId, it.size, it.color, it.qty);
    patchReturn(r.id, () => ({ status: 'Inspected', inspection: insp }), `Inspection: ${insp}${insp === 'Restock' ? ' (stock updated)' : ''}`);
    notify('Inspection saved', insp === 'Restock' ? `${it.qty} item back in stock.` : `Item marked as ${insp.toLowerCase()}.`);
  };

  const policyList = [
    { ok: inWindow(r, pol), t: inWindow(r, pol) ? `Requested ${r.days} days after the order, inside the ${pol.windowDays}-day window` : `Requested ${r.days} days after the order, past the ${pol.windowDays}-day window` },
    { ok: isReturnable(r, pol), t: isReturnable(r, pol) ? 'Item is returnable' : 'Item is marked as non-returnable' },
    { ok: r.photos.length > 0, t: 'Photos supplied by the customer' },
    { ok: r.reason !== 'Changed my mind', t: r.reason === 'Changed my mind' ? 'Reason is a change of mind (customer pays pickup)' : 'Reason is covered by the policy' },
  ];
  const outcomeLocked = done || r.status === 'Inspected' && false;

  return (
    <>
      <Drawer open onClose={onClose} width={680} title={r.id} subtitle={<span className="flex items-center gap-2 flex-wrap"><StatusPill status={r.status} /><span>{r.outcome === 'Exchange' ? 'Exchange' : 'Return'} request</span></span>}>
        {/* next step */}
        {!done && (
          <Card hover={false} className="mb-7 !bg-soft">
            <Label className="mb-3">Next step</Label>
            {r.status === 'Requested' && <div className="flex items-center justify-between gap-3 flex-wrap"><span className="text-[14px]">Approve this request or send a polite no.</span><div className="flex gap-2"><Button variant="secondary" icon={XIcon} onClick={() => setRejecting(true)}>Reject</Button><Button icon={Check} onClick={approve}>Approve</Button></div></div>}
            {r.status === 'Approved' && <div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Select label="Courier" value={courier} onChange={setCourier} options={COURIERS} /><Field label="Pickup date" type="date" value={date} onChange={setDate} error={dErr} /></div><div className="mt-4 flex justify-end"><Button icon={Truck} onClick={schedule}>Schedule pickup</Button></div></div>}
            {r.status === 'Pickup scheduled' && <div className="flex items-center justify-between gap-3 flex-wrap"><span className="text-[14px]">{r.courier} collects on <b className="font-medium">{r.pickupDate}</b>.</span><Button icon={PackageCheck} onClick={received}>Mark received</Button></div>}
            {r.status === 'Received' && <div><div className="text-[14px] mb-3">Inspect the item. What condition is it in?</div><div className="grid grid-cols-3 gap-2">{(['Restock', 'Damaged', 'Discard'] as const).map((o) => <button key={o} onClick={() => setInsp(o)} className={cn('h-11 rounded-xl border text-[14px] transition-all duration-200', insp === o ? 'bg-ink text-inkfg border-ink' : 'bg-card border-line hover:border-champagne')}>{o}</button>)}</div><div className="mt-4 flex justify-between items-center gap-3"><span className="text-[12.5px] text-muted">{insp === 'Restock' ? 'The item goes back into stock.' : 'Stock will not change.'}</span><Button onClick={inspect}>Save inspection</Button></div></div>}
            {r.status === 'Inspected' && <div className="flex items-center justify-between gap-3 flex-wrap"><span className="text-[14px]">{r.outcome === 'Exchange' ? 'Create the exchange order.' : `Send ${rs(r.refund)} ${r.outcome === 'Store credit' ? 'as store credit' : 'to the original payment'}.`}</span><Button variant="champagne" onClick={() => finishReturn(r, toast)}>Complete</Button></div>}
          </Card>
        )}
        {r.status === 'Rejected' && <div className="mb-7 rounded-xl bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] text-bad p-4 text-[14px] flex gap-2.5"><CircleAlert size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" /><span>Rejected: {r.rejectReason}</span></div>}
        {r.status === 'Completed' && <div className="mb-7 rounded-xl bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] text-ok p-4 text-[14px] flex gap-2.5"><Check size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" /><span>Completed. {r.outcome === 'Exchange' ? 'Exchange order created.' : `${rs(r.refund)} sent.`}</span></div>}

        <Section title="Customer and order">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3"><Avatar name={r.customer} size={44} /><div><button className="font-medium hover:text-champagne transition-colors" onClick={() => cid && navigate(`/customers/${cid}`)}>{r.customer}</button><div className="text-[13px] text-muted">Requested {r.days} days after delivery</div></div></div>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${r.orderId}`)}>{r.orderId}<ArrowUpRight size={14} strokeWidth={1.5} /></Button>
          </div>
        </Section>
        <Section title="Returned items">
          <div className="flex items-center gap-4 rounded-xl border border-line p-3">
            <Photo src={photo(p.photo, 120, 150)} size={56} className="!h-[70px]" />
            <div className="flex-1 min-w-0"><div className="font-medium truncate">{p.name}</div><div className="text-[13px] text-muted">{it.color} / {it.size} / Qty {it.qty}</div></div>
            <div className="num font-medium">{rs(unit(p) * it.qty)}</div>
          </div>
        </Section>
        <Section title="Reason and note">
          <Pill>{r.reason}</Pill><p className="text-[14px] mt-3 text-fg/90">{r.note}</p>
        </Section>
        <Section title="Photos from the customer">
          <div className="flex gap-3">{r.photos.map((n) => <button key={n} onClick={() => setZoom(photo(n, 1000, 1250))} className="overflow-hidden rounded-xl group"><img src={photo(n, 200, 240)} alt="" className="h-24 w-20 object-cover transition-transform duration-500 group-hover:scale-110 cursor-zoom-in" /></button>)}</div>
        </Section>
        <Section title="Policy checks">
          <ul className="space-y-2">{policyList.map((x, i) => <li key={i} className="flex items-start gap-2.5 text-[14px]"><span className={cn('mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0', x.ok ? 'bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] text-ok' : 'bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-bad')}>{x.ok ? <Check size={12} strokeWidth={2.5} /> : <XIcon size={12} strokeWidth={2.5} />}</span>{x.t}</li>)}</ul>
        </Section>
        <Section title="Outcome">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{OUTCOMES.map((o) => <button key={o} disabled={outcomeLocked} onClick={() => setOutcome(o)} className={cn('rounded-xl border px-3 py-3 text-[13.5px] text-left transition-all duration-200 disabled:opacity-60', r.outcome === o ? 'border-champagne bg-soft ring-2 ring-champagne/30' : 'border-line hover:border-champagne')}>{o}</button>)}</div>
          {r.outcome === 'Exchange' ? (
            <div className="mt-4 anim-fade-up">
              <div className="grid grid-cols-2 gap-3"><Select label="New size" value={ex.size} onChange={(v) => !done && setEx({ size: v })} options={SIZES} /><Select label="New colour" value={ex.color} onChange={(v) => !done && setEx({ color: v })} options={COLORS} /></div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
                <div className="text-[14px]">{ex.color} / {ex.size}: <b className={cn('font-medium num', live.stock === 0 ? 'text-bad' : live.stock < 4 ? 'text-warn' : 'text-ok')}>{live.stock === 0 ? 'Out of stock' : `${live.stock} in stock`}</b></div>
                {ex.reserved ? <Pill tone="success" icon={Check}>Reserved</Pill> : <Button size="sm" disabled={done || live.stock < 1} onClick={reserve}>Reserve</Button>}
              </div>
              {live.stock === 0 && !done && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[color-mix(in_srgb,var(--warn)_10%,transparent)] p-3.5 text-[13.5px]"><span>This combination is out of stock. A refund may be kinder.</span><Button size="sm" variant="secondary" onClick={() => { setOutcome('Refund to original payment'); notify('Refund suggested', 'Outcome switched to a refund.'); }}>Refund instead</Button></div>}
            </div>
          ) : (
            <div className="mt-4 anim-fade-up">
              <div className="flex items-end gap-4"><Field className="flex-1" label="Amount" prefix="Rs" type="number" disabled={done} value={refundText} onChange={commitRefund} hint={`Order value ${rs(itemsValue(r.items))}`} />
                <div className="pb-6 text-[26px] font-semibold min-w-[130px] text-right"><Rs v={r.refund} /></div></div>
            </div>
          )}
        </Section>
        <Section title="Timeline"><Timeline items={r.timeline.map((t) => ({ title: t.title, meta: t.meta }))} /></Section>
      </Drawer>
      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Reject this request" footer={<><Button variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button><Button variant="danger" onClick={reject}>Reject and notify</Button></>}>
        <div className="text-[13px] text-muted mb-3">Choose a template, then edit it so it feels personal.</div>
        <div className="flex flex-col gap-2 mb-4">{REJECT_TEMPLATES.map((t) => <button key={t} onClick={() => { setReason(t); setRErr(''); }} className={cn('text-left text-[13.5px] rounded-xl border px-3.5 py-2.5 transition-all', reason === t ? 'border-champagne bg-soft' : 'border-line hover:border-champagne')}>{t}</button>)}</div>
        <Field multiline rows={4} label="Message to customer" value={reason} onChange={(v) => { setReason(v); setRErr(''); }} error={rErr} />
      </Modal>
      <Lightbox src={zoom} onClose={() => setZoom(null)} caption={r.id} />
    </>
  );
}

function Rs({ v }: { v: number }) { return <CountUp value={v} format={(n) => rs(n)} duration={600} />; }
