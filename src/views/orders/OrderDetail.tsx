import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CircleDollarSign, FileText, MoreHorizontal, PackageSearch, Send, Truck } from 'lucide-react';
import { navigate, useApp } from '../../store';
import { customersStore, ordersStore, photo, TEAM, type Order, type OrderStatus } from '../../data/seed';
import { Avatar, Button, Card, CardHeader, DropdownMenu, EmptyState, Field, KV, Label, Modal, Photo, Pill, Segmented, Skeleton, StatusPill, toneOf, useFakeLoad } from '../../ui/kit';
import { cn, rs } from '../../lib/format';
import { ALLOWED, COURIER_INFO, NEXT, addEvent, eventsFor, eventsStore, flash, notesStore, nowStamp, patchOrder, payStatusOf, payStore, productOf, setStatus, totalsOf, txnOf, unitPrice } from './shared';
import { canRefund, useOrderFlow, type Flow } from './Dialogs';

function Check() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="shrink-0">
      <circle cx="22" cy="22" r="20" stroke="var(--sage)" strokeWidth="1.5" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 700ms var(--ease) forwards' }} />
      <path d="M13 23l6 6 12-13" stroke="var(--sage)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 600ms var(--ease) 600ms forwards' }} />
    </svg>
  );
}

const ACTION_FOR: Partial<Record<OrderStatus, Flow>> = { Processing: 'confirm', Packed: 'pack', Shipped: 'ship', Delivered: 'deliver', Cancelled: 'cancel' };
const MOVE_LABEL: Record<string, string> = { Processing: 'Confirm', Packed: 'Pack', Shipped: 'Ship', Delivered: 'Mark delivered', Cancelled: 'Cancel order', Returned: 'Mark returned' };

function Notes({ id }: { id: string }) {
  const { user, toast } = useApp();
  const [all, setAll] = notesStore.use();
  const [text, setText] = useState('');
  const notes = all[id] ?? [];
  const m = text.match(/@(\w*)$/);
  const sugg = m ? TEAM.filter((t) => t.name.toLowerCase().startsWith(m[1].toLowerCase()) || t.name.split(' ')[0].toLowerCase().startsWith(m[1].toLowerCase())) : [];
  const post = () => {
    if (!text.trim()) return;
    setAll({ ...all, [id]: [{ by: user.name, at: nowStamp(), text: text.trim() }, ...notes] });
    const men = text.match(/@[A-Z]\w+/g); setText(''); toast('Note posted', { body: men ? `Mentioned ${men.join(', ')}` : undefined });
  };
  const render = (t: string) => t.split(/(@[A-Z]\w+)/g).map((p, i) => p.startsWith('@') ? <span key={i} className="text-fg font-medium">{p}</span> : p);
  return (
    <Card>
      <CardHeader title="Internal notes" sub="Only your team can see these. Type @ to mention someone." />
      <div className="relative">
        <Field label="Write a note" multiline rows={2} value={text} onChange={setText} />
        {sugg.length > 0 && m && (
          <div className="absolute z-20 left-0 top-full mt-1 w-64 bg-card border border-line rounded-xl shadow-[var(--shadow-lg)] py-1 anim-fade-up" style={{ animationDuration: '200ms' }}>
            {sugg.map((t) => <button key={t.id} onClick={() => setText(text.replace(/@\w*$/, `@${t.name.split(' ')[0]} `))} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-stone"><Avatar name={t.name} size={24} /><span className="flex-1 text-[13.5px]">{t.name}</span><span className="text-muted text-[11px]">{t.role}</span></button>)}
          </div>
        )}
      </div>
      <div className="flex justify-end mt-3"><Button size="sm" icon={Send} onClick={post} disabled={!text.trim()}>Post note</Button></div>
      <div className="grid gap-4 mt-4">
        {notes.length === 0 && <div className="text-muted text-[13px]">No notes yet.</div>}
        {notes.map((n) => (
          <div key={n.at + n.text} className="flex gap-3 anim-slide-in"><Avatar name={n.by} size={30} /><div className="flex-1"><div className="text-[12px] text-muted"><span className="text-fg font-medium">{n.by}</span> · {n.at}</div><div className="text-[14px] mt-0.5">{render(n.text)}</div></div></div>
        ))}
      </div>
    </Card>
  );
}

function ShipEdit({ order, onClose, initial }: { order: Order; onClose: () => void; initial: boolean }) {
  const { user, toast } = useApp();
  const [manual, setManual] = useState(initial); const [sel, setSel] = useState(COURIER_INFO.find((c) => c.name === order.courier)?.name ?? COURIER_INFO[0].name);
  const [n, setN] = useState(''); const [t, setT] = useState(''); const [err, setErr] = useState('');
  const save = () => {
    if (manual && (!n.trim() || !t.trim())) return setErr('Enter the courier name and tracking number.');
    const courier = manual ? n.trim() : sel;
    patchOrder(order.id, manual ? { courier, tracking: t.trim() } : { courier }); addEvent(order.id, manual ? `Switched to manual shipping with ${courier}` : `Courier changed to ${courier}`, user.name); flash([order.id]);
    toast('Shipping updated', { body: courier }); onClose();
  };
  return (
    <Modal open onClose={onClose} size="sm" title={manual ? 'Use manual shipping' : 'Change courier'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <Segmented value={manual ? 'm' : 'c'} onChange={(v) => { setManual(v === 'm'); setErr(''); }} options={[{ value: 'c', label: 'Courier' }, { value: 'm', label: 'Manual' }]} />
      {manual ? <div className="grid gap-4 mt-4"><Field label="Courier name" value={n} onChange={setN} /><Field label="Tracking number" value={t} onChange={setT} /></div> : (
        <div className="grid gap-2 mt-4">{COURIER_INFO.map((c) => (
          <button key={c.name} onClick={() => setSel(c.name)} className={cn('flex items-center justify-between rounded-xl border p-3.5 text-left transition-all', sel === c.name ? 'border-champagne bg-soft' : 'border-line hover:border-fg/30')}><span><span className="block font-medium">{c.name}</span><span className="text-muted text-[12.5px]">{c.days} days</span></span><span className="num">{rs(c.price)}</span></button>
        ))}</div>
      )}
      {err && <div className="text-bad text-[12px] mt-2">{err}</div>}
    </Modal>
  );
}

function TrackModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const steps = [['Waybill created', true], ['Picked up from Jawalakhel hub', true], [`In transit to ${order.city}`, true], ['Out for delivery', order.status === 'Delivered'], ['Delivered', order.status === 'Delivered']] as const;
  return (
    <Modal open onClose={onClose} size="sm" title={`Track ${order.tracking}`}>
      <ol className="grid gap-3">{steps.map(([s, d], i) => <li key={s} className="flex items-center gap-3 anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}><span className={cn('size-3 rounded-full', d ? 'bg-sage' : 'bg-line')} /><span className={cn('text-[14px]', !d && 'text-muted')}>{s}</span></li>)}</ol>
      <div className="text-muted text-[12.5px] mt-4">With {order.courier}</div>
    </Modal>
  );
}

export default function OrderDetail({ id }: { id: string }) {
  const { user, role, toast, confirm } = useApp();
  const loading = useFakeLoad(600, [id]);
  const [orders] = ordersStore.use(); const [evs] = eventsStore.use(); const [pay] = payStore.use(); const [custs] = customersStore.use();
  const o = orders.find((x) => x.id === id);
  const flow = useOrderFlow(o, pay[id]?.refunded ?? 0);
  const [edit, setEdit] = useState<null | 'c' | 'm'>(null); const [track, setTrack] = useState(false);
  const cust = useMemo(() => o && custs.find((c) => c.name === o.customer), [o, custs]);

  if (loading) return (
    <div className="grid gap-6"><Skeleton className="h-10 w-72" /><div className="grid lg:grid-cols-[1.6fr_1fr] gap-6"><div className="grid gap-6"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div><div className="grid gap-6"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div></div></div>
  );
  if (!o) return <EmptyState title="We could not find that order" body={`There is no order called ${id}. It may have been typed wrongly or removed.`} action={<Button onClick={() => navigate('/orders')}>Back to orders</Button>} />;

  const t = totalsOf(o); const ps = payStatusOf(o, pay); const next = NEXT[o.status]; const allowed = ALLOWED[o.status];
  const refundable = ps === 'Paid' || ps === 'Partially refunded';
  const refundLabel = canRefund(role) ? 'Refund' : 'Request approval';
  const move = async (s: OrderStatus) => {
    const f = ACTION_FOR[s];
    if (f) return flow.run(f);
    if (await confirm({ title: 'Mark as returned?', body: 'The order will move to Returned.', confirmLabel: 'Mark returned', danger: true })) { setStatus(o, 'Returned', 'Marked as returned', user.name); toast('Marked as returned', { body: o.id }); }
  };
  const events = eventsFor(o, evs);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-muted mb-3 anim-fade-in">
        <button onClick={() => navigate('/orders')} className="hover:text-fg transition-colors">Orders</button><ChevronRight size={13} /><span className="text-fg">{o.id}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6 anim-fade-up">
        <div>
          <div className="flex items-center gap-3 flex-wrap"><h1 className="font-title text-[40px] leading-[1.05]">{o.id}</h1><Pill tone="neutral">{o.pay}</Pill><StatusPill status={o.status} /></div>
          <div className="text-muted mt-1.5">{o.date} · {o.channel} · {o.customer}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu align="right" width={220} items={allowed.length ? allowed.map((s) => ({ label: MOVE_LABEL[s], hint: s, danger: s === 'Cancelled' || s === 'Returned', onClick: () => move(s) })) : [{ label: 'No further steps' }]}
            trigger={<button className="h-10 pl-3 pr-3.5 rounded-full border border-line bg-card hover:border-fg/40 inline-flex items-center gap-2 text-[14px] transition-colors"><span className={cn('size-2 rounded-full bg-current transition-colors duration-500', ({ success: 'text-ok', warning: 'text-warn', danger: 'text-bad', info: 'text-info' } as Record<string, string>)[toneOf(o.status)])} />Status: {o.status}<ChevronDown size={15} /></button>} />
          {next && <Button onClick={() => flow.run(next.action)}>{next.label}</Button>}
          <Button variant="secondary" icon={FileText} onClick={() => flow.run('invoice')}>Print invoice</Button>
          <DropdownMenu trigger={<Button variant="secondary" icon={MoreHorizontal} aria-label="More actions">More</Button>} items={[
            ...(ALLOWED[o.status].includes('Cancelled') ? [{ label: 'Cancel order', danger: true, onClick: () => flow.run('cancel') }] : []),
            ...(refundable ? [{ label: refundLabel, icon: CircleDollarSign, onClick: () => flow.run('refund') }] : []),
            { label: 'Resend notification', icon: Send, onClick: () => flow.run('notify') },
          ]} />
        </div>
      </div>

      {flow.shipped && o.status === 'Shipped' && (
        <Card className="mb-6 flex items-center gap-4" hover={false}><Check /><div className="font-title text-[24px]">On its way. Customer has been told by SMS and email.</div></Card>
      )}

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <div className="grid gap-6 min-w-0">
          <Card>
            <CardHeader title="Items" sub={`${o.items.length} ${o.items.length === 1 ? 'product' : 'products'}`} />
            <div className="grid">
              {o.items.map((i, k) => { const p = productOf(i.productId); return (
                <div key={k} className="flex items-center gap-4 py-3.5 border-b border-line first:pt-0 anim-fade-up" style={{ animationDelay: `${k * 50}ms` }}>
                  <Photo src={photo(p.photo, 140, 180)} size={60} />
                  <div className="flex-1 min-w-0"><div className="font-medium truncate">{p.name}</div><div className="text-muted text-[12.5px]">{i.color} · Size {i.size} · SKU {p.sku}</div></div>
                  <div className="text-muted num text-[13px]">{i.qty} x {rs(unitPrice(i.productId))}</div>
                  <div className="num w-24 text-right font-medium">{rs(unitPrice(i.productId) * i.qty)}</div>
                </div>); })}
            </div>
            <div className="ml-auto mt-4 w-full max-w-xs">
              <KV k="Subtotal"><span className="num">{rs(t.sub)}</span></KV>
              <KV k="Discount"><span className="num">{t.discount ? `-${rs(t.discount)}` : rs(0)}</span></KV>
              <KV k="Shipping"><span className="num">{t.shipping ? rs(t.shipping) : 'Free'}</span></KV>
              <KV k="VAT 13% (included)"><span className="num">{rs(t.vat)}</span></KV>
              <div className="flex justify-between pt-3 text-[16px] font-semibold"><span>Total</span><span className="num">{rs(t.total)}</span></div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Timeline" sub="Newest first" />
            <ol className="relative pl-6">
              <span className="absolute left-[7px] top-2 bottom-2 w-px bg-line" />
              {events.map((e, i) => (
                <li key={e.at + e.title} className="relative pb-5 last:pb-0 anim-slide-in">
                  <span className={cn('absolute -left-6 top-1.5 size-[15px] rounded-full border-2 border-card', i === 0 ? 'bg-champagne' : 'bg-line')} />
                  <div className="text-[14px]">{e.title}</div><div className="text-muted text-[12px] mt-0.5">{e.at} · {e.by}</div>
                </li>
              ))}
            </ol>
          </Card>
          <Notes id={o.id} />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Customer" action={<Pill tone={toneOf(o.risk)} dot>{o.risk} risk</Pill>} />
            <div className="flex items-center gap-3 mb-3"><Avatar name={o.customer} size={42} /><div><div className="font-medium">{o.customer}</div><div className="text-muted text-[13px]">{o.phone}</div></div></div>
            <KV k="Email">{cust?.email ?? `${o.customer.toLowerCase().replace(' ', '.')}@gmail.com`}</KV>
            <KV k="Address">{o.address}</KV>
            <Button variant="secondary" size="sm" className="mt-4" disabled={!cust} onClick={() => cust && navigate(`/customers/${cust.id}`)}>View customer<ChevronRight size={14} /></Button>
          </Card>
          <Card>
            <CardHeader title="Payment" />
            <KV k="Method">{o.pay}</KV>
            <KV k="Transaction ID"><span className="num">{txnOf(o)}</span></KV>
            <KV k="Status"><StatusPill status={ps === 'Approval requested' ? 'Pending' : ps === 'Partially refunded' ? 'Processing' : ps === 'Refunded' ? 'Returned' : ps} />{ps !== 'Paid' && ps !== 'Pending' && <span className="text-muted text-[12px] ml-2">{ps}</span>}</KV>
            {refundable && <Button variant="secondary" size="sm" className="mt-4" icon={CircleDollarSign} onClick={() => flow.run('refund')}>{refundLabel}</Button>}
          </Card>
          <Card>
            <CardHeader title="Shipping" />
            <KV k="Courier">{o.courier}</KV>
            <KV k="Tracking number"><span className="num">{o.tracking ?? '—'}</span></KV>
            <KV k="Status"><StatusPill status={['Shipped', 'Delivered', 'Packed'].includes(o.status) ? o.status : 'Pending'} /></KV>
            <div className="flex flex-wrap gap-2 mt-4">
              {o.tracking && <Button variant="secondary" size="sm" icon={PackageSearch} onClick={() => setTrack(true)}>Track</Button>}
              {!['Cancelled', 'Returned', 'Delivered', 'To confirm'].includes(o.status) && <><Button variant="secondary" size="sm" icon={Truck} onClick={() => setEdit('c')}>Change courier</Button><Button variant="ghost" size="sm" onClick={() => setEdit('m')}>Use manual shipping</Button></>}
              {o.status === 'To confirm' && <div className="text-muted text-[13px]">Confirm the order to arrange shipping.</div>}
            </div>
          </Card>
        </div>
      </div>
      {flow.node}
      {edit && <ShipEdit order={o} initial={edit === 'm'} onClose={() => setEdit(null)} />}
      {track && <TrackModal order={o} onClose={() => setTrack(false)} />}
    </div>
  );
}
