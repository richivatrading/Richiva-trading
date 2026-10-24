import { useMemo, useState } from 'react';
import { Ban, MessageCircle, Phone, Check, PhoneOff, X } from 'lucide-react';
import { Avatar, Button, Card, CardHeader, CelebrateState, Drawer, ErrorState, Field, Modal, Pill, Select, Skeleton, StatusPill, Timeline, useFakeLoad } from '../../ui/kit';
import { cn, rs } from '../../lib/format';
import { logAudit, ordersStore } from '../../data/seed';
import { useApp } from '../../store';
import { blockStore, buildQueue, riskLog, rulesStore, scoreOf, type QItem } from './data';

const ago = (h: number) => (h >= 24 ? `${Math.floor(h / 24)} ${Math.floor(h / 24) === 1 ? 'day' : 'days'} ago` : `${Math.max(h, 1)} h ago`);
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Queue() {
  const { toast } = useApp();
  const [rules] = rulesStore.use();
  const [blocks, setBlocks] = blockStore.use();
  const [log, setLog] = riskLog.use();
  const loading = useFakeLoad(600);
  const [items, setItems] = useState<QItem[]>(buildQueue);
  const [leaving, setLeaving] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [blk, setBlk] = useState(false);
  const [reason, setReason] = useState('Refused parcels before');
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState('');

  const blocked = (q: QItem) => blocks.some((b) => b.type === 'Phones' && b.value === q.phone);
  const sc = useMemo(() => Object.fromEntries(items.map((q) => [q.id, scoreOf(q, rules, log.attempts[q.id] ?? 0, blocked(q))])), [items, rules, log.attempts, blocks]); // eslint-disable-line
  const open = items.find((q) => q.id === openId) ?? null;

  const addEvent = (id: string, title: string, meta: string) => setLog((l) => ({ ...l, events: { ...l.events, [id]: [...(l.events[id] ?? []), { title, meta }] } }));
  const slideOut = (id: string) => { setLeaving((a) => [...a, id]); setOpenId(null); setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), 520); };
  const setOrder = (q: QItem, status: 'Processing' | 'Cancelled') => { if (!q.extra) ordersStore.set((os) => os.map((o) => o.id === q.id ? { ...o, status, codVerified: status === 'Processing' } : o)); };

  const outcome = (q: QItem, kind: 'Confirmed' | 'Unreachable' | 'Refused') => {
    if (kind === 'Confirmed') {
      addEvent(q.id, 'Confirmed by phone', `${now()} · moved to Processing`); setOrder(q, 'Processing');
      setLog((l) => ({ ...l, done: { ...l.done, [q.id]: kind }, stats: { ...l.stats, confirmed: l.stats.confirmed + 1 } }));
      logAudit({ user: 'You', module: 'Risk', action: 'Confirmed COD order', item: q.id, before: 'status: To confirm', after: 'status: Processing' });
      toast('Order confirmed', { body: `${q.customer} · ${q.id} goes to Processing.`, star: true }); slideOut(q.id);
    } else if (kind === 'Refused') {
      addEvent(q.id, 'Refused by customer', `${now()} · order cancelled`); setOrder(q, 'Cancelled');
      setLog((l) => ({ ...l, done: { ...l.done, [q.id]: kind }, stats: { ...l.stats, refused: l.stats.refused + 1, saved: l.stats.saved + q.amount } }));
      logAudit({ user: 'You', module: 'Risk', action: 'Customer refused COD order', item: q.id, before: 'status: To confirm', after: 'status: Cancelled' });
      toast('Order cancelled', { body: `${rs(q.amount)} saved from a likely return.` }); slideOut(q.id);
    } else {
      const n = (log.attempts[q.id] ?? 0) + 1;
      addEvent(q.id, `Call attempt ${n} of 3`, `${now()} · no answer`);
      if (n >= 3) {
        setOrder(q, 'Cancelled');
        setLog((l) => ({ ...l, attempts: { ...l.attempts, [q.id]: n }, done: { ...l.done, [q.id]: kind }, stats: { ...l.stats, unreachable: l.stats.unreachable + 1, saved: l.stats.saved + q.amount } }));
        toast('Cancelled after 3 attempts', { body: `${q.customer} could not be reached.` }); slideOut(q.id);
      } else { setLog((l) => ({ ...l, attempts: { ...l.attempts, [q.id]: n } })); toast(`Attempt ${n} of 3 logged`, { body: 'The order stays in the queue.' }); }
    }
  };

  const addBlock = () => {
    if (!open) return;
    if (reason === 'Other' && note.trim().length < 4) return setNoteErr('Tell us the reason in a few words.');
    setBlocks((b) => [{ id: `b${Date.now()}`, type: 'Phones', value: open.phone, reason: reason === 'Other' ? note.trim() : reason, added: 'Today' }, ...b]);
    addEvent(open.id, 'Phone added to blocklist', `${now()} · ${reason}`);
    setBlk(false); setNote(''); setNoteErr(''); toast('Added to blocklist', { body: open.phone });
  };

  const events = open ? [...(log.events[open.id] ?? []).slice().reverse(), { title: 'Added to confirmation queue', meta: 'Waiting for a call' }, { title: 'Order placed', meta: `${ago(open.ageHours)} · COD ${rs(open.amount)}` }] : [];
  const s = open ? sc[open.id] : null;
  const attempts = open ? log.attempts[open.id] ?? 0 : 0;

  return (
    <Card pad={false} hover={false}>
      <div className="p-6 pb-3"><CardHeader title="Confirmation queue" sub={`${items.length - leaving.length} COD ${items.length - leaving.length === 1 ? 'order' : 'orders'} waiting, oldest first`} className="mb-0" /></div>
      {err ? <ErrorState onRetry={() => setErr(false)} title="Could not load the queue" /> : loading ? <div className="px-6 pb-6 space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div> :
        items.length === 0 ? <CelebrateState title="All COD orders confirmed" body="Nothing waiting for a call. Well done." /> : (
          <ul className="px-3 pb-3">
            {items.map((q, i) => {
              const x = sc[q.id], out = leaving.includes(q.id);
              const reasons = x.factors.slice(1).filter((f) => !f.label.startsWith('Matches')).slice(0, 3).map((f) => f.label);
              return (
                <li key={q.id} className={cn('overflow-hidden transition-all duration-500 ease-[var(--ease)]', out ? 'max-h-0 opacity-0 translate-x-16' : 'max-h-28')}>
                  <button onClick={() => setOpenId(q.id)} style={{ animationDelay: `${i * 40}ms` }} className="anim-fade-up w-full text-left flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-soft transition-colors border-b border-line/60 last:border-0">
                    <Avatar name={q.customer} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="font-medium truncate">{q.customer}</span>{!!log.attempts[q.id] && <Pill tone="neutral">Attempt {log.attempts[q.id]} of 3</Pill>}</div>
                      <div className="text-muted text-[12.5px] num">{q.phone} · {ago(q.ageHours)}</div>
                      <div className="text-[12.5px] text-muted mt-0.5 truncate">{reasons.length ? reasons.join(' · ') : 'Nothing unusual'}</div>
                    </div>
                    <div className="text-right shrink-0"><div className="num font-semibold">{rs(q.amount)}</div><div className="mt-1"><StatusPill status={x.level} /></div></div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.customer} subtitle={open && <span className="num">{open.phone} · {open.city}</span>} width={500}>
        {open && s && <div className="space-y-7">
          <div className="flex items-end justify-between"><div><div className="label-caps">COD amount</div><div className="text-[32px] font-semibold num">{rs(open.amount)}</div></div><div className="text-right"><StatusPill status={s.level} /><div className="text-muted text-[12px] mt-1">Score <span className="num">{s.score}</span> of 100</div></div></div>
          <div className="text-[13.5px] text-muted">{open.address}, {open.city}</div>
          <div className="flex gap-2">
            <Button icon={Phone} onClick={() => { window.location.href = `tel:${open.phone.replace(/[\s-]/g, '')}`; addEvent(open.id, 'Call started', now()); }}>Call</Button>
            <Button variant="secondary" icon={MessageCircle} onClick={() => { window.open(`https://wa.me/${open.phone.replace(/\D/g, '')}`, '_blank'); addEvent(open.id, 'WhatsApp message opened', now()); }}>WhatsApp</Button>
          </div>
          <div>
            <div className="label-caps mb-3">Outcome of the call</div>
            <div className="grid grid-cols-3 gap-2">
              <Button icon={Check} onClick={() => outcome(open, 'Confirmed')}>Confirmed</Button>
              <Button variant="secondary" icon={PhoneOff} onClick={() => outcome(open, 'Unreachable')}>Unreachable</Button>
              <Button variant="secondary" icon={X} onClick={() => outcome(open, 'Refused')}>Refused</Button>
            </div>
            <div className="text-muted text-[12px] mt-2">Unreachable: attempt {Math.min(attempts + 1, 3)} of 3. The order is cancelled after the third.</div>
          </div>
          <div>
            <div className="label-caps mb-3">Why this score</div>
            <div className="rounded-xl border border-line divide-y divide-line">
              {s.factors.map((f) => (
                <div key={f.label} className="px-4 py-3"><div className="flex justify-between text-[13.5px]"><span className="font-medium">{f.label}</span><span className="num text-muted">+{f.pts}</span></div><div className="text-muted text-[12.5px] mt-0.5">{f.why}</div></div>
              ))}
            </div>
            <p className="text-[13px] mt-3">Total <b className="num font-semibold">{s.score}</b>. Under 40 is Low, 40 to 64 is Medium, 65 and over is High.</p>
          </div>
          <div><div className="label-caps mb-3">Timeline</div><Timeline key={events.length} items={events} /></div>
          <Button variant="ghost" icon={Ban} disabled={blocked(open)} onClick={() => { setReason('Refused parcels before'); setNote(''); setNoteErr(''); setBlk(true); }}>{blocked(open) ? 'On the blocklist' : 'Add to blocklist'}</Button>
        </div>}
      </Drawer>
      <Modal open={blk} onClose={() => setBlk(false)} title="Add to blocklist" size="sm" footer={<><Button variant="secondary" onClick={() => setBlk(false)}>Cancel</Button><Button onClick={addBlock}>Add to blocklist</Button></>}>
        <div className="space-y-4"><p className="text-muted text-[13.5px]">{open?.phone} will be flagged on every future order. Please tell us why.</p>
          <Select label="Reason" value={reason} onChange={setReason} options={['Refused parcels before', 'Gave a fake address', 'Suspected fraud', 'Other']} />
          {reason === 'Other' && <Field label="Reason in your words" value={note} onChange={(v) => { setNote(v); setNoteErr(''); }} error={noteErr} />}</div>
      </Modal>
    </Card>
  );
}
