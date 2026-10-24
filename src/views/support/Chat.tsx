import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronsUp, GitMerge, Info, MessageSquareText, Paperclip, Send, StickyNote, X, CircleCheck, Undo2 } from 'lucide-react';
import { Avatar, Button, IconButton, Pill, Switch, EmptyState } from '../../ui/kit';
import { cn } from '../../lib/format';
import { ORDERS } from '../../data/seed';
import { rs } from '../../lib/format';
import { navigate } from '../../store';
import { CANNED, type Msg, type Ticket } from './data';
import { ChannelIcon, SlaRing, TPill } from './bits';

function Bubble({ m, name }: { m: Msg; name: string }) {
  const mine = m.from === 'agent', note = m.from === 'note';
  const order = m.order ? ORDERS.find((o) => o.id === m.order) : undefined;
  return (
    <div className={cn('flex', mine || note ? 'justify-end' : 'justify-start')} style={{ animation: `${mine || note ? 'slide-in-r' : 'slide-left'} 400ms var(--ease) both` }}>
      <div className={cn('max-w-[78%] px-4 py-2.5 text-[14px] leading-relaxed', note ? 'rounded-2xl rounded-br-md border border-dashed border-champagne bg-[color-mix(in_srgb,var(--champagne)_16%,transparent)]' : mine ? 'rounded-2xl rounded-br-md bg-ink text-inkfg' : 'rounded-2xl rounded-bl-md bg-stone')}>
        {note && <div className="label-caps flex items-center gap-1 mb-0.5 !text-[10px]"><StickyNote size={11} />Internal note</div>}
        {!mine && !note && <div className="text-[11px] text-muted mb-0.5">{name}</div>}
        {m.text && <div>{m.text}</div>}
        {order && <button onClick={() => navigate(`/orders/${order.id}`)} className="mt-1.5 w-full text-left rounded-xl bg-card text-fg border border-line px-3 py-2 text-[13px] hover:border-champagne transition-colors"><div className="flex justify-between gap-6"><b className="num">{order.id}</b><span className="num">{rs(order.total)}</span></div><div className="text-muted text-[12px]">{order.status} · {order.city}</div></button>}
        {m.files?.map((f) => <div key={f} className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-card/90 text-fg border border-line px-2.5 py-1 text-[12px]"><Paperclip size={12} />{f}</div>)}
        <div className={cn('text-[10.5px] mt-1 text-right', mine ? 'opacity-60' : 'text-muted')}>{m.time}</div>
      </div>
    </div>
  );
}

export default function Chat({ t, now, typing, draft, setDraft, note, setNote, onSend, onEscalate, onMerge, onClose, onReopen, onBack, onInfo }: {
  t: Ticket; now: number; typing: boolean; draft: string; setDraft: (s: string) => void; note: boolean; setNote: (b: boolean) => void;
  onSend: (text: string, files: string[]) => void; onEscalate: () => void; onMerge: () => void; onClose: () => void; onReopen: () => void; onBack?: () => void; onInfo?: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [canned, setCanned] = useState(false);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(0);
  const pop = useRef<HTMLDivElement>(null);
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' }); }, [t.msgs.length, typing, t.id]);
  useEffect(() => { setFiles([]); setErr(''); setCanned(false); }, [t.id]);
  useEffect(() => { if (!canned) return; const f = (e: MouseEvent) => !pop.current?.contains(e.target as Node) && setCanned(false); document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f); }, [canned]);
  const send = () => {
    if (!draft.trim() && !files.length) { setErr('Write a message or attach a file first.'); setShake((s) => s + 1); return; }
    setErr(''); onSend(draft.trim(), files); setFiles([]);
  };
  const closed = t.status === 'Closed';
  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="px-5 py-3.5 border-b border-line flex items-center gap-3">
        {onBack && <IconButton icon={ArrowLeft} label="Back to conversations" onClick={onBack} />}
        <Avatar name={t.name} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="font-medium truncate">{t.name}</span><ChannelIcon c={t.channel} /><TPill s={t.status} /></div>
          <div className="text-muted text-[12.5px] truncate">{t.id} · {t.subject}</div>
        </div>
        <SlaRing t={t} now={now} />
        {onInfo && <IconButton icon={Info} label="Customer details" onClick={onInfo} />}
      </div>
      <div className="px-5 py-2 border-b border-line flex items-center gap-2 flex-wrap">
        {!closed ? <>
          <Button size="sm" variant="secondary" icon={ChevronsUp} onClick={onEscalate} disabled={t.status === 'Escalated'}>Escalate</Button>
          <Button size="sm" variant="secondary" icon={GitMerge} onClick={onMerge}>Merge</Button>
          <Button size="sm" variant="secondary" icon={CircleCheck} onClick={onClose}>Close ticket</Button>
        </> : <Button size="sm" variant="secondary" icon={Undo2} onClick={onReopen}>Reopen</Button>}
        {t.rating && <Pill tone="champagne" className="ml-auto">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)} rated</Pill>}
      </div>
      <div ref={scroll} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {t.msgs.map((m) => <Bubble key={m.id} m={m} name={t.name.split(' ')[0]} />)}
        {typing && (
          <div className="flex justify-start anim-fade-in"><div className="rounded-2xl rounded-bl-md bg-stone px-4 py-3 flex items-center gap-2"><span className="text-[12px] text-muted">Customer is typing</span><span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${i * 140}ms` }} />)}</span></div></div>
        )}
      </div>
      {closed ? <div className="px-5 py-4 border-t border-line text-center text-muted text-[13px]">This ticket is closed. Reopen it to reply.</div> : (
        <div className={cn('border-t border-line p-4 transition-colors duration-300', note && 'bg-[color-mix(in_srgb,var(--champagne)_12%,transparent)]')}>
          <div key={shake} className={cn(shake > 0 && err && 'anim-shake')}>
            <textarea value={draft} onChange={(e) => { setDraft(e.target.value); setErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} rows={3} placeholder={note ? 'Write an internal note. The customer will not see it.' : `Reply to ${t.name.split(' ')[0]}`}
              className={cn('w-full rounded-xl border bg-card px-3.5 py-3 text-[14px] outline-none resize-none transition-all focus:border-champagne focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--champagne)_22%,transparent)]', note ? 'border-dashed border-champagne' : 'border-line', err && 'border-bad')} />
          </div>
          {err && <div className="text-bad text-[12px] mt-1 anim-fade-in">{err}</div>}
          {files.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{files.map((f) => <span key={f} className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-stone text-[12px] anim-pop"><Paperclip size={12} />{f}<button onClick={() => setFiles(files.filter((x) => x !== f))} aria-label="Remove"><X size={12} /></button></span>)}</div>}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="relative" ref={pop}>
              <Button size="sm" variant="secondary" icon={MessageSquareText} onClick={() => setCanned(!canned)}>Canned replies</Button>
              {canned && (
                <div className="absolute bottom-full mb-2 left-0 w-72 bg-card border border-line rounded-xl shadow-[var(--shadow-lg)] py-1.5 z-30 anim-fade-up" style={{ animationDuration: '200ms' }}>
                  {CANNED.map((c) => <button key={c.id} onClick={() => { setDraft(c.text); setCanned(false); setNote(false); }} className="w-full text-left px-3.5 py-2 hover:bg-stone transition-colors"><div className="text-[13px] font-medium">{c.label}</div><div className="text-[12px] text-muted line-clamp-1">{c.text}</div></button>)}
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[13px] border border-line bg-card hover:bg-soft hover:border-fg/40 cursor-pointer transition-all"><Paperclip size={14} strokeWidth={1.5} />Attach<input type="file" multiple className="hidden" onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? []).map((f) => f.name)]); e.target.value = ''; }} /></label>
            <label className="inline-flex items-center gap-2 text-[13px] ml-1"><Switch checked={note} onChange={setNote} label="Internal note" />Internal note</label>
            <Button className="ml-auto" size="sm" icon={Send} variant={note ? 'champagne' : 'primary'} onClick={send}>{note ? 'Add note' : 'Send'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
export const NoChat = () => <div className="h-full flex items-center justify-center"><EmptyState icon={MessageSquareText} title="Pick a conversation" body="Choose one from the list to read and reply." /></div>;
