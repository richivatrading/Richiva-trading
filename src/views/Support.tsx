import { useCallback, useEffect, useRef, useState } from 'react';
import { Inbox, Zap } from 'lucide-react';
import { Avatar, Button, Card, CelebrateState, Chip, EmptyState, Modal, PageHeader, SearchInput, Skeleton, Tabs, useFakeLoad } from '../ui/kit';
import { cn } from '../lib/format';
import { useApp } from '../store';
import { AGENTS, TICKETS0, hhmm, type Priority, type Ticket, type TStatus } from './support/data';
import { ChannelIcon, SlaRing, TPill, waitText } from './support/bits';
import Chat, { NoChat } from './support/Chat';
import Side from './support/Side';
import Reports from './support/Reports';

const priTone: Record<Priority, string> = { High: 'text-bad', Medium: 'text-warn', Low: 'text-ok' };
function useWide() {
  const q = '(min-width: 1100px)';
  const [w, setW] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => setW(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return w;
}

export default function Support() {
  const { confirm, toast } = useApp();
  const loading = useFakeLoad(600);
  const wide = useWide();
  const [tab, setTab] = useState<'inbox' | 'reports'>('inbox');
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS0);
  const [sel, setSel] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'chat' | 'info'>('list');
  const [filter, setFilter] = useState<'All' | TStatus>('All');
  const [q, setQ] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [rating, setRating] = useState<{ id: string; v: number; hover: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const followed = useRef(new Set<string>());
  const timers = useRef<number[]>([]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => { clearInterval(t); timers.current.forEach(clearTimeout); }; }, []);

  const patch = useCallback((id: string, f: (t: Ticket) => Partial<Ticket>) => setTickets((all) => all.map((t) => (t.id === id ? { ...t, ...f(t) } : t))), []);
  const addMsg = (id: string, from: 'customer' | 'agent' | 'note', text: string, extra: { files?: string[]; order?: string } = {}) =>
    patch(id, (t) => ({ msgs: [...t.msgs, { id: `${id}-${Date.now()}-${t.msgs.length}`, from, text, time: hhmm(), ...extra }] }));

  const open = (id: string) => {
    setSel(id); setView('chat'); setNote(false); setTyping(null);
    patch(id, () => ({ unread: 0 }));
    const t = tickets.find((x) => x.id === id);
    if (t && t.status !== 'Closed' && t.follow && !followed.current.has(id)) {
      followed.current.add(id);
      timers.current.push(window.setTimeout(() => setTyping(id), 700));
      timers.current.push(window.setTimeout(() => { setTyping((c) => (c === id ? null : c)); addMsg(id, 'customer', t.follow); patch(id, (x) => ({ status: 'Open', since: Date.now() })); }, 3200));
    }
  };

  const cur = tickets.find((t) => t.id === sel) ?? null;
  const counts = (s: TStatus) => tickets.filter((t) => t.status === s).length;
  const list = tickets.filter((t) => (filter === 'All' || t.status === filter) && (!q || (t.name + t.subject + t.topic + t.id).toLowerCase().includes(q.toLowerCase())));
  const allClosed = tickets.every((t) => t.status === 'Closed');

  const send = (text: string, files: string[]) => {
    if (!cur) return;
    if (note) { addMsg(cur.id, 'note', text); setDraft(''); toast('Note added'); return; }
    addMsg(cur.id, 'agent', text, { files });
    patch(cur.id, () => ({ status: 'Waiting', since: Date.now(), dueAt: Date.now() + 4 * 3600000, total: 240 }));
    setDraft(''); toast('Reply sent', { body: `To ${cur.name}` });
  };
  const setDraft = (s: string) => cur && setDrafts((d) => ({ ...d, [cur.id]: s }));
  const escalate = async () => {
    if (!cur) return;
    if (await confirm({ title: 'Escalate this ticket?', body: 'It will go to Anita Shrestha (Owner) as high priority.', confirmLabel: 'Escalate' })) {
      patch(cur.id, () => ({ status: 'Escalated', priority: 'High', assignee: 'Anita Shrestha' })); addMsg(cur.id, 'note', 'Escalated to Anita Shrestha as high priority.'); toast('Ticket escalated');
    }
  };
  const merge = (otherId: string) => {
    const o = tickets.find((t) => t.id === otherId); if (!cur || !o) return;
    setTickets((all) => all.filter((t) => t.id !== otherId).map((t) => t.id === cur.id ? { ...t, msgs: [...t.msgs, { id: `m-${otherId}`, from: 'note', text: `Merged ticket ${o.id} (${o.subject})`, time: hhmm() }, ...o.msgs.map((m) => ({ ...m, id: `${otherId}-${m.id}` }))], orders: [...new Set([...t.orders, ...o.orders])] } : t));
    setMerging(false); toast('Tickets merged', { body: `${o.id} is now part of ${cur.id}` });
  };
  const close = () => { if (!cur) return; patch(cur.id, () => ({ status: 'Closed' })); setRating({ id: cur.id, v: 0, hover: 0 }); };
  const saveRating = () => { if (!rating) return; if (rating.v) { patch(rating.id, () => ({ rating: rating.v })); toast('Rating saved', { body: `${rating.v} of 5 stars`, star: true }); } setRating(null); };

  const header = (
    <PageHeader title="Support desk" subtitle="Friendly, quick answers for every customer." chip={<span className="inline-flex items-center gap-1.5"><Zap size={12} />Fastest reply today: 2 min</span>} />
  );
  const tabs = <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: 'inbox', label: 'Inbox', count: tickets.filter((t) => t.status !== 'Closed').length }, { id: 'reports', label: 'Reports' }]} />;

  if (loading) return <div>{header}<Skeleton className="h-11 w-60 mb-5" /><div className="grid lg:grid-cols-[340px_1fr_340px] gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: 560 }}>{[0, 1, 2].map((i) => <Skeleton key={i} className="rounded-2xl h-full" />)}</div></div>;
  if (tab === 'reports') return <div>{header}{tabs}<div className="anim-fade-up"><Reports tickets={tickets} /></div></div>;

  const listPane = (
    <div className="h-full flex flex-col min-w-0">
      <div className="p-4 space-y-3 border-b border-line">
        <SearchInput value={q} onChange={setQ} placeholder="Search conversations" />
        <div className="flex gap-1.5 overflow-x-auto hide-scroll">
          {(['All', 'Open', 'Waiting', 'Escalated', 'Closed'] as const).map((s) => <Chip key={s} active={filter === s} onClick={() => setFilter(s)} count={s === 'All' ? tickets.length : counts(s)}>{s}</Chip>)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? <EmptyState icon={Inbox} title="No conversations" body="Try another filter or search." /> : list.map((t, i) => (
          <button key={t.id} onClick={() => open(t.id)} style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }} className={cn('w-full text-left px-4 py-3.5 border-b border-line flex gap-3 anim-fade-up transition-colors', sel === t.id ? 'bg-soft shadow-[inset_3px_0_0_var(--champagne)]' : 'hover:bg-soft/70')}>
            <div className="relative"><Avatar name={t.name} size={38} />{t.unread > 0 && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-champagne border-2 border-card" />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5"><span className={cn('text-[14px] truncate', t.unread ? 'font-semibold' : 'font-medium')}>{t.name}</span><ChannelIcon c={t.channel} size={13} /><span className="ml-auto text-[11.5px] text-muted whitespace-nowrap">{t.status === 'Closed' ? 'Closed' : `Waiting ${waitText(t.since, now)}`}</span></div>
              <div className="text-[13px] text-muted truncate">{t.subject}</div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap"><TPill s={t.status} /><span className={cn('text-[11.5px] font-medium', priTone[t.priority])}>{t.priority}</span><span className="text-[11.5px] text-muted truncate">{t.assignee}</span></div>
            </div>
            <div className="self-center"><SlaRing t={t} now={now} size={34} /></div>
          </button>
        ))}
      </div>
    </div>
  );
  const chatPane = cur ? <Chat t={cur} now={now} typing={typing === cur.id} draft={drafts[cur.id] ?? ''} setDraft={setDraft} note={note} setNote={setNote} onSend={send} onEscalate={escalate} onMerge={() => setMerging(true)} onClose={close}
    onReopen={() => patch(cur.id, () => ({ status: 'Open', since: Date.now(), dueAt: Date.now() + 3600000, total: 60, rating: undefined }))} onBack={wide ? undefined : () => setView('list')} onInfo={wide ? undefined : () => setView('info')} /> : <NoChat />;
  const sidePane = cur ? <Side key={cur.id} t={cur} onAttach={(id) => { patch(cur.id, (t) => ({ orders: [...new Set([...t.orders, id])] })); addMsg(cur.id, 'agent', 'I have attached your order for reference.', { order: id }); toast('Order attached', { body: id }); }} onUseReply={(s) => { setDraft(s); setNote(false); toast('Reply added to the composer', { body: 'Review it, then press Send.' }); }} onPriority={(p) => { patch(cur.id, () => ({ priority: p })); toast(`Priority set to ${p}`); }} onBack={wide ? undefined : () => setView('chat')} /> : <div className="p-6 text-muted text-[13px]">Customer details appear here.</div>;

  return (
    <div>
      {header}{tabs}
      {allClosed ? <Card hover={false}><CelebrateState title="Inbox zero" body="Every conversation is closed. Lovely work." /></Card> : (
        <Card pad={false} hover={false} className="overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: 560 }}>
          {wide ? (
            <div className="grid h-full" style={{ gridTemplateColumns: '340px minmax(0,1fr) 340px' }}>
              <div className="border-r border-line min-h-0">{listPane}</div>
              <div className="min-h-0 min-w-0">{chatPane}</div>
              <div className="border-l border-line min-h-0">{sidePane}</div>
            </div>
          ) : <div className="h-full" key={view}>{view === 'list' || !cur ? listPane : view === 'chat' ? chatPane : sidePane}</div>}
        </Card>
      )}
      <Modal open={merging} onClose={() => setMerging(false)} title="Merge with another ticket" size="md">
        <div className="text-muted text-[13px] mb-3">Pick the ticket to fold into {cur?.id}. Its messages move here.</div>
        <div className="space-y-2">
          {tickets.filter((t) => t.id !== cur?.id && t.status !== 'Closed').map((t) => (
            <button key={t.id} onClick={() => merge(t.id)} className="w-full flex items-center gap-3 text-left rounded-xl border border-line px-4 py-2.5 hover:border-champagne hover:bg-soft transition-colors"><Avatar name={t.name} size={32} /><div className="min-w-0 flex-1"><div className="text-[14px] font-medium">{t.name} <span className="text-muted font-normal num">{t.id}</span></div><div className="text-muted text-[12.5px] truncate">{t.subject}</div></div></button>
          ))}
        </div>
      </Modal>
      <Modal open={!!rating} onClose={saveRating} title="How was this conversation?" size="sm" footer={<><Button variant="ghost" onClick={() => setRating(null)}>Skip</Button><Button onClick={saveRating} disabled={!rating?.v}>Save rating</Button></>}>
        <div className="text-muted text-[13px] mb-4">Ticket closed. Ask the customer to rate their experience, then record it here.</div>
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((n) => { const on = n <= (rating?.hover || rating?.v || 0); return (
            <button key={n} onMouseEnter={() => rating && setRating({ ...rating, hover: n })} onMouseLeave={() => rating && setRating({ ...rating, hover: 0 })} onClick={() => rating && setRating({ ...rating, v: n })} aria-label={`${n} stars`} className="transition-transform active:scale-90 hover:scale-110">
              <svg width="38" height="38" viewBox="0 0 24 24" fill={on ? 'var(--champagne)' : 'none'} stroke={on ? 'var(--champagne)' : 'var(--muted)'} strokeWidth="1.4" strokeLinejoin="round"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </button>); })}
        </div>
      </Modal>
    </div>
  );
}
