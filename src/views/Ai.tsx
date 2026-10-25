"use client";
import { useEffect, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check } from 'lucide-react';
import { Avatar, Button, Card, CelebrateState, ChartTip, Delta, PageHeader, Progress, Ring, Skeleton, Switch, C, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { customersStore, productsStore, reorderNotesStore } from '../data/seed';
import { navigate, useApp } from '../store';
import { cn, uid } from '../lib/format';
import { AiCard, type Vote } from './ai/Shell';

const CARD_IDS = ['forecast', 'restock', 'returns', 'risk', 'size', 'search'] as const;
type CardId = (typeof CARD_IDS)[number];
const READY = [
  { name: 'Recommendations', pct: 80, ids: ['search'] as CardId[] },
  { name: 'Size advice', pct: 65, ids: ['size', 'returns'] as CardId[] },
  { name: 'Forecast', pct: 90, ids: ['forecast', 'restock'] as CardId[] },
];
const WHY: Record<string, string> = {
  forecast: 'Based on your last 12 months of orders, Dashain demand and this week&apos;s steady rise in visits.',
  restock: 'These items sell faster than your current stock covers, even after allowing for the festive weeks ahead.',
  returns: 'Past returns for these products mention the same issue most often, so a small fix should help.',
  risk: 'These customers used to buy about once a month but have not ordered in over 60 days.',
  size: 'We compared the size customers chose with the size they kept after delivery.',
  search: 'Searches that end in a purchase tell us which words shoppers use for your products.',
};
const TOP3 = [
  { id: 't1', title: 'Reorder Satin Slip Dress in M and L', why: 'It will run out in about 6 days at the current pace.' },
  { id: 't2', title: 'Send an offer to 6 customers at risk', why: 'A small thank-you usually brings 1 in 4 of them back within two weeks.' },
  { id: 't3', title: 'Add a "runs small" note to Ruched Tee', why: 'Most of its returns say the fit was smaller than expected.' },
];
const FORECAST = Array.from({ length: 30 }, (_, i) => { const mid = Math.round(150 + i * 3.2 + 28 * Math.sin(i * 0.5)); const w = 12 + i * 1.3; return { label: `${19 + i > 31 ? 19 + i - 31 : 19 + i} ${19 + i > 31 ? 'Nov' : 'Oct'}`, mid, band: [Math.round(mid - w), Math.round(mid + w)] }; });
const RETURNS = [{ name: 'Ruched Tee', reason: 'Runs small', pct: 31 }, { name: 'Satin Slip Dress', reason: 'Colour looks different', pct: 22 }, { name: 'Tailored Blazer', reason: 'Shoulders feel tight', pct: 18 }, { name: 'Cotton Wide Trouser', reason: 'Length too long', pct: 14 }];
const SIZES = [{ s: 'XS', v: 82 }, { s: 'S', v: 88 }, { s: 'M', v: 91 }, { s: 'L', v: 86 }, { s: 'XL', v: 79 }];
const SEARCH = [{ q: 'linen blouse', d: 14.2, v: 82 }, { q: 'kurta set', d: 9.6, v: 74 }, { q: 'festive gown', d: 6.1, v: 63 }, { q: 'pashmina', d: -3.4, v: 48 }];

export default function Ai() {
  const { toast, user } = useApp();
  const loading = useFakeLoad(700);
  const [shim, setShim] = useState(true);
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(CARD_IDS.map((c) => [c, true])));
  const [gone, setGone] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [done, setDone] = useState<string[]>([]);
  const [whyTop, setWhyTop] = useState<string | null>(null);
  const [products] = productsStore.use();
  const [customers] = customersStore.use();

  useEffect(() => { if (loading) return; setShim(true); const t = setTimeout(() => setShim(false), 2600); return () => clearTimeout(t); }, [loading]);

  const restock = useMemo(() => products.filter((p) => p.status === 'Published').sort((a, b) => a.stock - b.stock).slice(0, 4).map((p) => ({ p, qty: Math.max(15, Math.ceil((45 - p.stock) / 5) * 5) })), [products]);
  const atRisk = useMemo(() => customers.filter((c) => c.status === 'At risk').slice(0, 4), [customers]);

  const note = (name: string, qty: number) => reorderNotesStore.set((n) => [{ id: uid('rn'), product: name, qty, by: user.name, time: 'Just now' }, ...n]);
  const vote = (id: string, v: 'up' | 'down') => { const was = votes[id]; setVotes({ ...votes, [id]: was === v ? undefined : v }); toast(was === v ? 'Feedback removed' : v === 'up' ? 'Thanks, glad it helped' : 'Thanks, we will do better', { star: v === 'up' && was !== v }); };
  const dismiss = (id: string, title: string) => { setGone((g) => [...g, id]); toast(`${title} dismissed`, { undo: () => setGone((g) => g.filter((x) => x !== id)) }); };
  const toggleGroup = (ids: CardId[], v: boolean) => { setOn((o) => ({ ...o, ...Object.fromEntries(ids.map((i) => [i, v])) })); toast(v ? 'Feature turned on' : 'Feature turned off'); };
  const topAction = (id: string) => {
    if (id === 't1') { note('Satin Slip Dress (M, L)', 20); toast('Reorder note sent', { body: '20 units suggested to the warehouse team.' }); }
    else if (id === 't2') { navigate('/marketing?tab=campaigns&create=1&segment=At%20risk%20customers'); return; }
    else toast('Size note added', { body: 'Ruched Tee now shows a "runs small" note.', star: true });
    setDone((d) => [...d, id]);
  };
  const applyRestock = () => { restock.forEach((r) => note(`${r.p.name} (${r.p.sku})`, r.qty)); toast(`${restock.length} reorder notes sent`, { body: 'The warehouse team can see them now.' }); };

  const common = (id: CardId, title: string, index: number) => ({
    index, title, why: WHY[id].replace('&apos;', "'"), enabled: on[id], onToggle: (v: boolean) => setOn({ ...on, [id]: v }), vote: votes[id], onVote: (v: 'up' | 'down') => vote(id, v), onDismiss: () => dismiss(id, title), shim,
  });
  const visible = (id: CardId) => !gone.includes(id);
  const allGone = CARD_IDS.every((c) => gone.includes(c));

  return (
    <div>
      <PageHeader title="AI insights" subtitle="Quiet, helpful suggestions based on your own store data." badge={<Star size={18} twinkle />} />
      {loading ? (
        <div className="space-y-6"><Skeleton className="h-[240px] rounded-2xl" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[110px] rounded-2xl" />)}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[320px] rounded-2xl" />)}</div></div>
      ) : (
        <div className="space-y-6">
          <Card className="relative overflow-hidden">
            {shim && <div className="absolute inset-0 ai-shimmer pointer-events-none" />}
            <div className="flex items-center gap-2 mb-1"><Star size={14} twinkle /><span className="text-[11px] text-muted">AI suggestion</span></div>
            <h2 className="font-title text-[28px] leading-tight mb-4">Top 3 things to do this week</h2>
            <ul className="divide-y divide-line">
              {TOP3.map((t, i) => {
                const d = done.includes(t.id);
                return (
                  <li key={t.id} className="py-3.5 anim-fade-up" style={stagger(i, 120)}>
                    <div className="flex items-center gap-4">
                      <span className={cn('size-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 transition-colors', d ? 'bg-sage text-white' : 'bg-stone')}>{d ? <Check size={15} className="anim-pop" /> : i + 1}</span>
                      <div className={cn('flex-1 transition-colors', d && 'text-muted line-through')}>{t.title}</div>
                      <button onClick={() => setWhyTop(whyTop === t.id ? null : t.id)} className="text-[13px] underline underline-offset-4 decoration-line hover:decoration-champagne">Why?</button>
                      <Button size="sm" variant={d ? 'secondary' : 'primary'} disabled={d} onClick={() => topAction(t.id)}>{d ? 'Done' : i === 0 ? 'Create reorder note' : i === 1 ? 'Send offer' : 'Add note'}</Button>
                    </div>
                    {whyTop === t.id && <div className="ml-12 mt-2 text-[13px] text-muted anim-fade-up">{t.why}</div>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <div>
            <div className="label-caps mb-3">Data readiness</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {READY.map((r, i) => {
                const enabled = r.ids.every((id) => on[id]);
                return (
                  <Card key={r.name} style={stagger(i)} className="!p-5 flex items-center gap-4">
                    <Ring value={r.pct} size={64} color={C.champagne} />
                    <div className="flex-1"><div className="font-medium">{r.name}</div><div className="text-muted text-[12px] mt-0.5">{r.pct >= 80 ? 'Ready to use' : 'Still learning'}</div></div>
                    <Switch checked={enabled} onChange={(v) => toggleGroup(r.ids, v)} label={`${r.name} on or off`} />
                  </Card>
                );
              })}
            </div>
          </div>

          {allGone ? (
            <Card><CelebrateState title="All caught up" body="You have dismissed every suggestion. New ones will appear next week." />
              <div className="text-center -mt-6 pb-6"><Button variant="secondary" onClick={() => setGone([])}>Bring them back</Button></div></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visible('forecast') && (
                <AiCard {...common('forecast', 'Demand forecast', 0)} onApply={() => toast('Forecast shared', { body: 'The warehouse team can now plan around it.' })} applyLabel="Share forecast">
                  <div className="text-muted text-[13px] mb-2">Expected orders per day, next 30 days</div>
                  <div className="h-[220px] -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={FORECAST} margin={{ right: 8, top: 6 }}>
                        <CartesianGrid vertical={false} stroke="var(--line)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} minTickGap={36} />
                        <YAxis tickLine={false} axisLine={false} width={34} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                        <Tooltip content={<ChartTip />} />
                        <Area type="monotone" dataKey="band" name="Range" stroke="none" fill={C.champagne} fillOpacity={0.25} animationDuration={1400} />
                        <Line type="monotone" dataKey="mid" name="Expected" stroke={C.ink} strokeWidth={2} dot={false} animationDuration={1000} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </AiCard>
              )}
              {visible('restock') && (
                <AiCard {...common('restock', 'Restock suggestions', 1)} onApply={applyRestock} applyLabel="Apply all">
                  <ul className="divide-y divide-line">
                    {restock.map((r, i) => (
                      <li key={r.p.id} className="flex items-center gap-3 py-2.5 anim-fade-up" style={stagger(i, 80)}>
                        <div className="flex-1 min-w-0"><div className="truncate text-[14px]">{r.p.name}</div><div className="text-muted text-[12px]">{r.p.stock} in stock</div></div>
                        <div className="text-[13px]">Order <b className="num">{r.qty}</b></div>
                        <Button size="sm" variant="secondary" onClick={() => { note(`${r.p.name} (${r.p.sku})`, r.qty); toast('Reorder note sent', { body: `${r.qty} units of ${r.p.name}.` }); }}>Apply</Button>
                      </li>
                    ))}
                  </ul>
                </AiCard>
              )}
              {visible('returns') && (
                <AiCard {...common('returns', 'Likely returns', 2)} onApply={() => toast('Fit notes queued', { body: 'We will add them to the product pages for review.', star: true })} applyLabel="Add fit notes">
                  <ul className="space-y-3.5">
                    {RETURNS.map((r, i) => (
                      <li key={r.name} className="anim-fade-up" style={stagger(i, 80)}>
                        <div className="flex justify-between text-[14px]"><span>{r.name}</span><span className="text-muted num text-[13px]">{r.pct}% likely</span></div>
                        <div className="text-muted text-[12px] mb-1.5">{r.reason}</div><Progress value={r.pct * 2.5} />
                      </li>
                    ))}
                  </ul>
                </AiCard>
              )}
              {visible('risk') && (
                <AiCard {...common('risk', 'Customers at risk', 3)} onApply={() => navigate('/marketing?tab=campaigns&create=1&segment=At%20risk%20customers')} applyLabel="Send offer to all">
                  <ul className="divide-y divide-line">
                    {atRisk.map((c, i) => (
                      <li key={c.id} className="flex items-center gap-3 py-2.5 anim-fade-up" style={stagger(i, 80)}>
                        <Avatar name={c.name} size={34} />
                        <div className="flex-1 min-w-0"><div className="truncate text-[14px]">{c.name}</div><div className="text-muted text-[12px]">Last order {c.last} · {c.city}</div></div>
                        <Button size="sm" variant="secondary" onClick={() => navigate('/marketing?tab=campaigns&create=1&segment=At%20risk%20customers')}>Send offer</Button>
                      </li>
                    ))}
                  </ul>
                </AiCard>
              )}
              {visible('size') && (
                <AiCard {...common('size', 'Size recommendation accuracy', 4)} onApply={() => toast('Size guide update queued', { body: 'XL guidance will be reviewed first.' })} applyLabel="Improve XL">
                  <div className="flex items-center gap-6">
                    <Ring value={87} size={92} stroke={7} color={C.sage} />
                    <div className="flex-1 space-y-2">
                      {SIZES.map((s) => <div key={s.s} className="flex items-center gap-3 text-[12px]"><span className="w-5 text-muted">{s.s}</span><Progress className="flex-1" value={s.v} color={s.v < 80 ? C.champagne : C.ink} /><span className="num w-8 text-right">{s.v}%</span></div>)}
                    </div>
                  </div>
                  <div className="text-muted text-[13px] mt-4">Customers kept the size we suggested 87% of the time.</div>
                </AiCard>
              )}
              {visible('search') && (
                <AiCard {...common('search', 'Search ranking performance', 5)} onApply={() => toast('Ranking boost applied', { body: 'Top-performing words now rank higher.', star: true })} applyLabel="Boost top words">
                  <ul className="space-y-3.5">
                    {SEARCH.map((s, i) => (
                      <li key={s.q} className="anim-fade-up" style={stagger(i, 80)}>
                        <div className="flex items-center justify-between text-[14px] mb-1.5"><span>&ldquo;{s.q}&rdquo;</span><Delta value={s.d} /></div>
                        <Progress value={s.v} />
                      </li>
                    ))}
                  </ul>
                </AiCard>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

