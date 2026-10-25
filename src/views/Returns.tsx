"use client";
import { useMemo, useState } from 'react';
import { Settings2, LayoutGrid, Rows3, Clock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, Cell } from 'recharts';
import { Button, PageHeader, Card, ChartTip, CountUp, DataTable, ErrorState, IconButton, Label, Pill, Segmented, Skeleton, StatusPill, EmptyState, Photo, Avatar, stagger, useFakeLoad, C } from '../ui/kit';
import { cn } from '../lib/format';
import { photo } from '../data/seed';
import { useApp, useRoute } from '../store';
import { STATUSES, finishReturn, inWindow, isReturnable, patchReturn, policyStore, productOf, returnsStore, type RStatus, type Ret } from './returns/data';
import ReturnDrawer from './returns/ReturnDrawer';
import RulesDrawer from './returns/RulesDrawer';

function PolicyBadge({ r }: { r: Ret }) {
  const [pol] = policyStore.use();
  const ok = inWindow(r, pol); const ret = isReturnable(r, pol);
  return <Pill tone={ok && ret ? 'success' : 'danger'}>{!ret ? 'Non-returnable' : ok ? `Within ${pol.windowDays} days` : 'Past window'}</Pill>;
}

function ReturnCard({ r, dragging, settled, onDragStart, onDragEnd, onOpen, i }: { r: Ret; dragging: boolean; settled: boolean; onDragStart: () => void; onDragEnd: () => void; onOpen: () => void; i: number }) {
  const p = productOf(r.items[0].productId);
  return (
    <div draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(); }} onDragEnd={onDragEnd} onClick={onOpen} style={stagger(i, 30)}
      className={cn('bg-card rounded-xl border border-line p-3.5 cursor-grab active:cursor-grabbing select-none anim-fade-up transition-all duration-300 ease-[var(--ease)]',
        dragging ? 'opacity-50 scale-[1.04] rotate-2 shadow-[var(--shadow-lg)]' : 'shadow-[var(--shadow)] hover:-translate-y-0.5 hover:border-champagne', settled && 'anim-pop')}>
      <div className="flex items-start gap-3">
        <Photo src={photo(p.photo, 120, 150)} size={48} className="!h-14 !w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><span className="num font-medium text-[13px]">{r.id}</span><span className="text-[11px] text-muted num">{r.days}d ago</span></div>
          <div className="flex items-center gap-1.5 mt-1 text-[13px] truncate"><Avatar name={r.customer} size={18} />{r.customer}</div>
          <div className="text-[12px] text-muted truncate mt-0.5">{p.name}</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <Pill tone="neutral">{r.reason}</Pill><PolicyBadge r={r} />
      </div>
    </div>
  );
}

export default function Returns() {
  const route = useRoute(); const { toast } = useApp();
  const loading = useFakeLoad(600);
  const [failed, setFailed] = useState(route.query.error === '1');
  const [rows] = returnsStore.use(); const [pol] = policyStore.use();
  const [view, setView] = useState<'board' | 'table'>('board');
  const [openId, setOpenId] = useState<string | null>(null);
  const [rules, setRules] = useState(false);
  const [drag, setDrag] = useState<string | null>(null); const [over, setOver] = useState<RStatus | null>(null); const [settled, setSettled] = useState<string | null>(null);

  const open = rows.filter((r) => r.status !== 'Completed' && r.status !== 'Rejected').length;
  const avg = rows.reduce((a, r) => a + r.handling, 0) / rows.length;
  const reasons = useMemo(() => Object.entries(rows.reduce<Record<string, number>>((m, r) => ({ ...m, [r.reason]: (m[r.reason] ?? 0) + 1 }), {})).map(([name, v]) => ({ name: name.split(' ').slice(0, 2).join(' '), full: name, v })).sort((a, b) => b.v - a.v).slice(0, 5), [rows]);

  const move = (id: string, to: RStatus) => {
    const r = rows.find((x) => x.id === id); setDrag(null); setOver(null);
    if (!r || r.status === to) return;
    if (to === 'Completed') finishReturn(r, toast);
    else { patchReturn(id, () => ({ status: to, rejectReason: to === 'Rejected' ? r.rejectReason ?? 'Moved on the board' : r.rejectReason }), `Moved to ${to}`); toast(`${id} moved to ${to}`, { body: `${r.customer} has been notified.` }); }
    setSettled(id); setTimeout(() => setSettled(null), 600);
  };

  return (
    <div>
      <PageHeader2 view={view} setView={setView} onRules={() => setRules(true)} />
      {failed ? <Card><ErrorState onRetry={() => setFailed(false)} /></Card> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.4fr] gap-6 mb-6">
            <Card className="feature [&_.label-caps]:!text-white/70 [&_.text-muted]:!text-white/60"><Label>Open requests</Label><div className="text-[32px] font-semibold mt-2 leading-none">{loading ? <Skeleton className="h-8 w-16" /> : <CountUp value={open} />}</div><div className="text-muted text-[13px] mt-2">{rows.filter((r) => r.status === 'Requested').length} waiting for a decision</div></Card>
            <Card><Label>Average handling time</Label><div className="text-[32px] font-semibold mt-2 leading-none flex items-baseline gap-1.5">{loading ? <Skeleton className="h-8 w-24" /> : <><CountUp value={avg} decimals={1} /><span className="text-[14px] text-muted font-normal">days</span></>}</div><div className="text-muted text-[13px] mt-2 flex items-center gap-1.5"><Clock size={14} strokeWidth={1.5} />From request to completion</div></Card>
            <Card className="!py-4">
              <Label>Top reasons</Label>
              <div className="h-[84px] mt-1">{loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={reasons} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={0} />
                  <Tooltip cursor={false} content={<ChartTip />} />
                  <Bar dataKey="v" name="Requests" radius={[20, 20, 20, 20]} animationDuration={800}>{reasons.map((_, i) => <Cell key={i} fill={i === 0 ? C.champagne : C.ink} />)}</Bar>
                </BarChart></ResponsiveContainer>)}
              </div>
            </Card>
          </div>
          {view === 'board' ? (
            loading ? <div className="flex gap-4 overflow-hidden">{STATUSES.map((s) => <Skeleton key={s} className="h-[360px] w-[280px] shrink-0 rounded-2xl" />)}</div> : (
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 items-start">
                {STATUSES.map((s) => {
                  const col = rows.filter((r) => r.status === s);
                  return (
                    <div key={s} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver((o) => (o === s ? null : o))} onDrop={(e) => { e.preventDefault(); move(e.dataTransfer.getData('text/plain') || drag || '', s); }}
                      className={cn('w-[284px] shrink-0 rounded-2xl p-3 border transition-all duration-300 min-h-[220px]', over === s && drag ? 'bg-soft border-champagne border-dashed' : 'bg-stone/50 border-transparent')}>
                      <div className="flex items-center justify-between px-1.5 pb-3"><div className="flex items-center gap-2"><span className="text-[14px] font-medium">{s}</span></div><span className="text-[12px] text-muted bg-card rounded-full px-2 num">{col.length}</span></div>
                      <div className="flex flex-col gap-3">
                        {col.map((r, i) => <ReturnCard key={r.id} r={r} i={i} dragging={drag === r.id} settled={settled === r.id} onDragStart={() => setDrag(r.id)} onDragEnd={() => { setDrag(null); setOver(null); }} onOpen={() => setOpenId(r.id)} />)}
                        {col.length === 0 && <div className="text-center text-[12.5px] text-muted py-8 border border-dashed border-line rounded-xl">Drop a card here</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <Card pad={false} hover={false}>
              <div className="px-5 pt-4 text-[14px] text-muted">{`${rows.filter((r) => r.status === 'Requested').length} requests are waiting for a decision.`}</div>
              <DataTable<Ret> rows={rows} rowId={(r) => r.id} loading={loading} onRowClick={(r) => setOpenId(r.id)} activeId={openId} flashIds={settled ? [settled] : []} defaultSort={{ key: 'days', dir: 'asc' }}
                empty={<EmptyState title="No requests" body="New return and exchange requests will appear here." />}
                columns={[
                  { key: 'id', header: 'Request', sort: (r) => r.id, render: (r) => <span className="num font-medium">{r.id}</span> },
                  { key: 'customer', header: 'Customer', sort: (r) => r.customer, render: (r) => <span className="flex items-center gap-2"><Avatar name={r.customer} size={26} />{r.customer}</span> },
                  { key: 'item', header: 'Item', hideBelow: 'lg', render: (r) => { const p = productOf(r.items[0].productId); return <span className="flex items-center gap-2"><Photo src={photo(p.photo, 80, 100)} size={32} className="!h-10 !rounded-lg" />{p.name}</span>; } },
                  { key: 'reason', header: 'Reason', sort: (r) => r.reason, render: (r) => <Pill>{r.reason}</Pill> },
                  { key: 'days', header: 'Days', sort: (r) => r.days, align: 'right', render: (r) => <span className="num">{r.days}</span> },
                  { key: 'policy', header: 'Policy', render: (r) => <PolicyBadge r={r} /> },
                  { key: 'status', header: 'Status', sort: (r) => STATUSES.indexOf(r.status), render: (r) => <StatusPill status={r.status} /> },
                ]} />
            </Card>
          )}
        </>
      )}
      <ReturnDrawer id={openId} onClose={() => setOpenId(null)} />
      <RulesDrawer open={rules} onClose={() => setRules(false)} />
      <span className="hidden">{pol.windowDays}</span>
    </div>
  );
}

function PageHeader2({ view, setView, onRules }: { view: 'board' | 'table'; setView: (v: 'board' | 'table') => void; onRules: () => void }) {
  return (
    <PageHeader title="Returns and exchanges" subtitle="Move each request along, one step at a time." actions={<>
      <Segmented value={view} onChange={setView} options={[{ value: 'board', label: <><LayoutGrid size={14} strokeWidth={1.5} />Board</> }, { value: 'table', label: <><Rows3 size={14} strokeWidth={1.5} />Table</> }]} />
      <IconButton icon={Settings2} label="Return rules" onClick={onRules} className="border border-line" />
    </>} />
  );
}

