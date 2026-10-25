"use client";
import { useState } from 'react';
import { ArrowLeft, Paperclip, Pencil, RefreshCcw, Wand2 } from 'lucide-react';
import { Avatar, Button, DropdownMenu, Modal, Pill, Progress, Label } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { ORDERS } from '../../data/seed';
import { rs, cn } from '../../lib/format';
import { navigate } from '../../store';
import { customerOf, ordersOf, type Sentiment, type Ticket } from './data';

const senTone = { Upset: 'danger', Worried: 'warning', Neutral: 'neutral', Happy: 'success' } as const;
const priTone = { High: 'danger', Medium: 'warning', Low: 'success' } as const;

export default function Side({ t, onAttach, onUseReply, onPriority, onBack }: { t: Ticket; onAttach: (id: string) => void; onUseReply: (s: string) => void; onPriority: (p: Ticket['priority']) => void; onBack?: () => void }) {
  const c = customerOf(t.name);
  const mine = ordersOf(t.name);
  const linked = t.orders.map((id) => ORDERS.find((o) => o.id === id)!).filter(Boolean);
  const all = [...linked, ...mine.filter((o) => !t.orders.includes(o.id))].slice(0, 4);
  const [pick, setPick] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(t.ai.reply);
  const next = c ? (c.tier === 'Bronze' ? 35000 : c.tier === 'Silver' ? 90000 : c.spent) : 1;
  const target = t.orders[0];
  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {onBack && <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={onBack}>Back to chat</Button>}
      <div className="flex items-center gap-3"><Avatar name={t.name} size={52} /><div className="min-w-0"><div className="font-title text-[24px] leading-tight">{t.name}</div><div className="text-muted text-[12.5px]">{c?.city ?? 'Kathmandu'} · {c?.phone ?? '+977 9841-000000'}</div></div></div>
      {c && <div className="grid grid-cols-3 gap-2 text-center">
        {[['Orders', c.orders], ['Spent', rs(c.spent)], ['Tier', c.tier]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-soft border border-line py-2"><div className="label-caps !text-[10px]">{k}</div><div className="text-[13px] font-medium num mt-0.5">{v}</div></div>)}
      </div>}
      {c && <div><div className="flex justify-between text-[12.5px] mb-1.5"><span className="text-muted">Loyalty</span><span className="num font-medium">{c.points.toLocaleString('en-IN')} points</span></div><Progress value={Math.min(100, (c.spent / next) * 100)} color="var(--champagne)" /></div>}
      <div>
        <Label className="mb-2">Orders</Label>
        <div className="space-y-2">
          {all.length === 0 && <div className="text-muted text-[13px]">No orders linked yet.</div>}
          {all.map((o) => <button key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className={cn('w-full text-left rounded-xl border px-3 py-2 text-[13px] hover:border-champagne transition-colors anim-fade-up', t.orders.includes(o.id) ? 'border-champagne/60 bg-soft' : 'border-line')}><div className="flex justify-between"><b className="num">{o.id}</b><span className="num">{rs(o.total)}</span></div><div className="text-muted text-[12px]">{o.status} · {o.date.split(',')[0]}{t.orders.includes(o.id) && ' · attached'}</div></button>)}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button size="sm" variant="secondary" icon={Paperclip} onClick={() => setPick(true)}>Attach order</Button>
          <DropdownMenu align="left" trigger={<Button size="sm" variant="secondary" icon={RefreshCcw}>Refund or exchange</Button>} items={[
            { label: 'Start a return or exchange', onClick: () => navigate('/returns') },
            { label: target ? `Open order ${target}` : 'Open orders', onClick: () => navigate(target ? `/orders/${target}` : '/orders') },
          ]} />
        </div>
      </div>

      <div key={t.id} className="relative overflow-hidden rounded-2xl border border-champagne/50 bg-[color-mix(in_srgb,var(--champagne)_7%,var(--card))] p-4">
        <div className="ai-shimmer absolute inset-0 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3"><Star size={15} twinkle /><span className="font-title text-[21px] leading-none">AI assist</span></div>
          <Label className="mb-1">Suggested reply</Label>
          {editing ? <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-xl border border-line bg-card p-3 text-[13px] outline-none focus:border-champagne resize-none" /> : <div className="text-[13.5px] leading-relaxed rounded-xl bg-card border border-line p-3">{text}</div>}
          <div className="flex gap-2 mt-3">
            <Button size="sm" icon={Wand2} onClick={() => onUseReply(text)}>Use reply</Button>
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</Button>
          </div>
          <div className="text-[12px] text-muted mt-2">You approve before anything is sent</div>
          <div className="mt-4 space-y-3 text-[13px]">
            <div><Label className="mb-1">Ticket summary</Label><div className="text-muted">{t.ai.summary}</div></div>
            <div className="flex flex-wrap gap-x-6 gap-y-2.5">
              <div><Label className="mb-1">Topic</Label><Pill tone="neutral">{t.ai.topic}</Pill></div>
              <div><Label className="mb-1">Sentiment</Label><Pill tone={senTone[t.ai.sentiment as Sentiment]} dot>{t.ai.sentiment}</Pill></div>
              <div><Label className="mb-1">Suggested category</Label><Pill tone="neutral">{t.ai.category}</Pill></div>
              <div><Label className="mb-1">Suggested priority</Label>
                <button onClick={() => onPriority(t.ai.priority)} title="Apply this priority" disabled={t.priority === t.ai.priority}><Pill tone={priTone[t.ai.priority]} dot className={t.priority !== t.ai.priority ? 'cursor-pointer hover:opacity-80' : ''}>{t.ai.priority}{t.priority === t.ai.priority ? ' (set)' : ' · apply'}</Pill></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={pick} onClose={() => setPick(false)} title="Attach an order" size="md">
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {[...mine, ...ORDERS.filter((o) => o.customer !== t.name)].slice(0, 20).map((o) => (
            <button key={o.id} onClick={() => { onAttach(o.id); setPick(false); }} className="w-full flex items-center justify-between text-left rounded-xl border border-line px-4 py-2.5 hover:border-champagne hover:bg-soft transition-colors">
              <div><div className="num font-medium">{o.id}</div><div className="text-muted text-[12px]">{o.customer} · {o.status}</div></div><span className="num text-[13px]">{rs(o.total)}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

