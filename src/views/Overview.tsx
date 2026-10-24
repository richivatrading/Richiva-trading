import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Banknote, Boxes, CalendarDays, ChevronLeft, ChevronRight, CreditCard, ExternalLink, MessageSquare, PackageCheck, RefreshCw, Undo2 } from 'lucide-react';
import { Button, Card, CardHeader, CountUp, Delta, EmptyState, ErrorState, Field, Modal, PageHeader, Ring, Skeleton, StatusPill, stagger, useFakeLoad } from '../ui/kit';
import { ordersStore, PRODUCTS, photo } from '../data/seed';
import { navigate } from '../store';
import { cn, rs } from '../lib/format';
import OrderDrawer from './orders/OrderDrawer';
import { SetupCard } from './overview/Bottom';
import { buildBundle, iso, NOW, rangeDays, rangeLabel, type Metric, type Period, type Range } from './overview/data';

type Preset = 'Day' | 'Week' | 'Month' | 'Year' | 'Custom';
const PRESETS: Preset[] = ['Day', 'Week', 'Month', 'Year'];
const SINCE: Record<Preset, string> = { Day: 'from yesterday', Week: 'from last week', Month: 'from last month', Year: 'from last year', Custom: 'from previous period' };
const PILL_W = 76;

const KPIS: { id: Metric; label: string; inverse?: boolean; fmt: (n: number) => string; dec?: number }[] = [
  { id: 'revenue', label: 'Total revenue', fmt: rs },
  { id: 'orders', label: 'Orders placed', fmt: (n) => n.toLocaleString('en-IN') },
  { id: 'conv', label: 'Conversion rate', fmt: (n) => `${n.toFixed(2)}%`, dec: 2 },
  { id: 'aov', label: 'Average order value', fmt: rs },
];
const ATTENTION = [
  { label: 'Orders to confirm', n: 12, icon: PackageCheck, to: '/orders?tab=To confirm' },
  { label: 'COD to verify', n: 5, icon: Banknote, to: '/risk' },
  { label: 'Returns waiting', n: 3, icon: Undo2, to: '/returns' },
  { label: 'Failed payments', n: 2, icon: CreditCard, to: '/payments?tab=transactions&status=Failed' },
  { label: 'Low stock', n: 7, icon: Boxes, to: '/inventory?filter=Low' },
  { label: 'Reviews to approve', n: 9, icon: MessageSquare, to: '/reviews?tab=Pending' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_W = 52;

const compact = (v: number) => (v >= 100000 ? `${+(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`);

function bucket(values: { label: string; v: number }[], max = 12) {
  if (values.length <= max) return values;
  const size = Math.ceil(values.length / max), out: { label: string; v: number }[] = [];
  for (let i = 0; i < values.length; i += size) {
    const part = values.slice(i, i + size);
    out.push({ label: part[0].label, v: part.reduce((a, x) => a + x.v, 0) });
  }
  return out;
}

function IconCircle({ icon: I, label, onClick }: { icon: typeof ArrowUpRight; label: string; onClick?: () => void }) {
  return <button aria-label={label} title={label} onClick={onClick} className="size-10 rounded-full bg-soft text-fg flex items-center justify-center hover:bg-stone transition-colors duration-200"><I size={18} strokeWidth={1.5} /></button>;
}

function SkeletonPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[148px] rounded-[28px]" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Skeleton className="h-[360px] rounded-[28px] lg:col-span-2" /><Skeleton className="h-[360px] rounded-[28px]" /></div>
      <Skeleton className="h-[420px] rounded-[28px]" />
    </div>
  );
}

function CalendarCard({ style }: { style?: React.CSSProperties }) {
  const [view, setView] = useState({ y: NOW.getFullYear(), m: NOW.getMonth() });
  const [sel, setSel] = useState(NOW.getDate());
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const day = Math.min(sel, count);
  const step = (d: number) => { const t = new Date(view.y, view.m + d, 1); setView({ y: t.getFullYear(), m: t.getMonth() }); };
  const dispatches = 2 + ((day * 7 + view.m) % 6), pickups = 1 + ((day * 3) % 4);
  return (
    <Card style={style} className="h-full">
      <CardHeader title={`${MONTHS[view.m]} ${view.y}`} sub="Dispatch schedule" action={
        <div className="flex gap-2"><IconCircle icon={ChevronLeft} label="Previous month" onClick={() => step(-1)} /><IconCircle icon={ChevronRight} label="Next month" onClick={() => step(1)} /></div>} />
      <div className="overflow-x-auto range-scroll">
        <div className="relative flex" style={{ width: count * DAY_W }}>
          <span className="absolute top-0 left-0 h-[84px] rounded-full bg-mid transition-transform duration-300" style={{ width: 44, marginLeft: (DAY_W - 44) / 2, transform: `translateX(${(day - 1) * DAY_W}px)`, transitionTimingFunction: 'var(--ease)' }} />
          {Array.from({ length: count }, (_, i) => {
            const d = i + 1, on = d === day;
            return (
              <button key={d} onClick={() => setSel(d)} style={{ width: DAY_W }} className={cn('relative h-[84px] flex flex-col items-center justify-center gap-2 transition-colors duration-200', on ? 'text-white' : 'text-muted hover:text-fg')}>
                <span className="text-[13px]">{DOW[new Date(view.y, view.m, d).getDay()]}</span>
                <span className="text-[16px] font-semibold num">{d}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-soft p-4"><div className="label-caps">Dispatches</div><div className="text-[22px] font-bold mt-1"><CountUp key={`${view.m}-${day}`} value={dispatches} duration={500} /></div></div>
        <div className="rounded-2xl bg-soft p-4"><div className="label-caps">Courier pickups</div><div className="text-[22px] font-bold mt-1"><CountUp key={`${view.m}-${day}-p`} value={pickups} duration={500} /></div></div>
      </div>
      <div className="text-muted text-[13px] mt-3">{day} {MONTHS[view.m]}: pickups at the Kathmandu and Lalitpur hubs.</div>
    </Card>
  );
}

export default function Overview() {
  const [preset, setPreset] = useState<Preset>('Week');
  const [range, setRange] = useState<Range>({ from: iso(new Date(2026, 9, 1)), to: iso(NOW) });
  const [pickOpen, setPickOpen] = useState(false);
  const [draft, setDraft] = useState<Range>(range);
  const [rangeErr, setRangeErr] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [orders] = ordersStore.use();
  const loading = useFakeLoad(600, [preset, range.from, range.to, tick]);

  const bundle = useMemo(() => {
    try {
      const yr: Range = { from: iso(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 364)), to: iso(NOW) };
      const [p, r]: [Period, Range] = preset === 'Day' ? ['Today', range] : preset === 'Week' ? ['7D', range] : preset === 'Month' ? ['30D', range] : preset === 'Year' ? ['Custom', yr] : ['Custom', range];
      return buildBundle(p, r);
    } catch { return null; }
  }, [preset, range, tick]);

  const bars = useMemo(() => (bundle ? bucket(bundle.points.map((p) => ({ label: p.label, v: p.revenue }))) : []), [bundle]);
  const barMax = Math.max(1, ...bars.map((x) => x.v));
  const selected = sel !== null && sel < bars.length ? sel : bars.length - 1;
  const recent = useMemo(() => orders.slice(0, 6), [orders]);

  const applyRange = () => {
    if (!draft.from || !draft.to) return setRangeErr('Please choose both dates.');
    if (draft.from > draft.to) return setRangeErr('The start date must be before the end date.');
    if (draft.to > iso(NOW)) return setRangeErr('The end date cannot be in the future.');
    if (rangeDays(draft) > 365) return setRangeErr('Please choose a range of up to one year.');
    setRangeErr(''); setRange(draft); setPreset('Custom'); setSel(null); setPickOpen(false);
  };
  const choose = (p: Preset) => { setPreset(p); setSel(null); };
  const delta = (id: Metric) => (bundle ? ((bundle.totals[id] - bundle.prevTotals[id]) / bundle.prevTotals[id]) * 100 : 0);
  const fulfil = bundle ? 88 + (bundle.days % 7) : 0;
  const idx = PILL_W * Math.max(0, PRESETS.indexOf(preset));

  return (
    <div>
      <PageHeader title="Overview" />
      <div className="flex flex-wrap items-center gap-3 mb-4 anim-fade-up">
        <div className="relative flex bg-card rounded-full p-1 shadow-[var(--shadow)]">
          {preset !== 'Custom' && <span className="absolute top-1 left-1 h-9 rounded-full bg-mid transition-transform duration-300" style={{ width: PILL_W, transform: `translateX(${idx}px)`, transitionTimingFunction: 'var(--ease)' }} />}
          {PRESETS.map((p) => (
            <button key={p} onClick={() => choose(p)} style={{ width: PILL_W }} className={cn('relative h-9 rounded-full text-[14px] font-semibold transition-colors duration-200', preset === p ? 'text-white' : 'text-muted hover:text-fg')}>{p}</button>
          ))}
        </div>
        <button onClick={() => { setDraft(range); setRangeErr(''); setPickOpen(true); }} className={cn('h-11 px-5 rounded-full bg-card shadow-[var(--shadow)] inline-flex items-center gap-2.5 text-[14px] font-semibold hover:bg-soft transition-colors', preset === 'Custom' && 'ring-2 ring-mid')}>
          <CalendarDays size={18} strokeWidth={1.5} className="text-muted" />{rangeLabel(range)}
        </button>
      </div>

      {loading ? <SkeletonPage /> : !bundle ? <Card><ErrorState onRetry={() => setTick((t) => t + 1)} /></Card> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {KPIS.map((k, i) => (
              <Card key={k.id} style={stagger(i)} className={cn(i === 0 && 'feature')}>
                <div className={cn('text-[14px] font-medium', i === 0 ? 'text-white/70' : 'text-muted')}>{k.label}</div>
                <div className="text-[30px] font-bold leading-none mt-4 tracking-tight"><CountUp value={bundle.totals[k.id]} format={k.fmt} decimals={k.dec ?? 0} /></div>
                <div className="mt-4 text-[13px]"><Delta value={delta(k.id)} inverse={k.inverse} suffix={` ${SINCE[preset]}`} /></div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2" style={stagger(4)}>
              <CardHeader title="Sales" sub={preset === 'Day' ? 'Hourly, today so far' : preset === 'Custom' ? rangeLabel(range) : `Revenue, ${preset === 'Year' ? 'last 12 months' : `last ${bundle.days} days`}`}
                action={<IconCircle icon={ArrowUpRight} label="Open analytics" onClick={() => navigate('/analytics?tab=sales')} />} />
              <div className="h-[260px] flex">
                <div className="flex flex-col justify-between text-[12px] text-muted pb-7 pr-3 w-12 text-right shrink-0">{[1, 0.75, 0.5, 0.25, 0].map((f) => <span key={f}>{compact(barMax * f)}</span>)}</div>
                <div className="flex-1 min-w-0 flex items-end gap-2 sm:gap-3 pt-8">
                  {bars.map((b, i) => {
                    const on = i === selected;
                    return (
                      <button key={b.label + i} onClick={() => setSel(i)} className="group flex-1 min-w-0 h-full flex flex-col items-center gap-2" aria-label={`${b.label}: ${rs(b.v)}`}>
                        <div className="w-full flex-1 flex items-end justify-center">
                          <div style={{ height: `${Math.max(4, (b.v / barMax) * 100)}%`, maxWidth: 40, animationDelay: `${i * 40}ms` }} className={cn('relative w-full rounded-full anim-bar transition-colors duration-200', on ? 'bg-[#8A888D]' : 'bar-stripe group-hover:opacity-80')}>
                            {on && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-[12px] rounded-full px-3 py-1 whitespace-nowrap num">{rs(b.v)}</span>}
                          </div>
                        </div>
                        <span className={cn('text-[12px] truncate max-w-full h-5', on ? 'text-fg font-semibold' : 'text-muted')}>{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
            <Card style={stagger(5)} className="flex flex-col">
              <CardHeader title="Fulfilment rate" sub={<Delta value={2.4} suffix={` ${SINCE[preset]}`} />} />
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Ring value={fulfil} size={160} stroke={10} color="var(--mid)" track="#d9d7db"><span className="text-[32px] font-bold">{fulfil}%</span></Ring>
                <div className="text-muted text-[14px] text-center">Orders packed and handed to the courier within 24 hours.</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><CalendarCard style={stagger(6)} /></div>
            <Card style={stagger(7)}>
              <CardHeader title="Needs your attention" sub="Tap a row to jump straight in" />
              <ul className="-my-1">
                {ATTENTION.map((a) => (
                  <li key={a.label}>
                    <button onClick={() => navigate(a.to)} className="group w-full flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-left">
                      <span className="size-9 rounded-full bg-soft flex items-center justify-center text-muted group-hover:bg-stone group-hover:text-fg transition-colors"><a.icon size={16} strokeWidth={1.5} /></span>
                      <span className="flex-1 text-[14px]">{a.label}</span>
                      <span className="text-[15px] font-bold num"><CountUp value={a.n} duration={600} /></span>
                      <ArrowRight size={16} strokeWidth={1.5} className="text-muted group-hover:translate-x-1 transition-transform" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card pad={false} style={stagger(8)}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h3 className="text-[18px] font-medium tracking-[-0.01em]">Recent orders</h3>
              <div className="flex gap-2"><IconCircle icon={RefreshCw} label="Refresh" onClick={() => setTick((t) => t + 1)} /><IconCircle icon={ExternalLink} label="Open all orders" onClick={() => navigate('/orders')} /></div>
            </div>
            {recent.length === 0 ? <div className="pb-6"><EmptyState title="No orders yet" body="New orders will show up here." /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <tbody>
                    {recent.map((o) => {
                      const pi = Math.max(0, PRODUCTS.findIndex((p) => p.id === o.items[0]?.productId));
                      return (
                        <tr key={o.id} onClick={() => setOrderId(o.id)} className="h-16 border-t border-line cursor-pointer hover:bg-soft/70 transition-colors">
                          <td className="pl-6"><div className="flex items-center gap-3"><img src={photo(pi, 80, 80)} alt="" className="size-10 rounded-full object-cover bg-stone" /><div><div className="text-[14px] font-semibold">{o.customer}</div><div className="text-muted text-[12px]">{o.city}</div></div></div></td>
                          <td className="text-[14px] font-medium">{o.id}</td>
                          <td className="text-muted text-[14px]">{o.date}</td>
                          <td className="text-[14px]">{o.pay}</td>
                          <td><StatusPill status={o.status} /></td>
                          <td className="pr-6 text-right text-[14px] font-bold num">{rs(o.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <SetupCard />
        </div>
      )}

      <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />
      <Modal open={pickOpen} onClose={() => setPickOpen(false)} title="Custom date range" size="sm"
        footer={<><Button variant="ghost" onClick={() => setPickOpen(false)}>Cancel</Button><Button onClick={applyRange}>Apply range</Button></>}>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <Field label="From" type="date" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })} />
          <Field label="To" type="date" value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} />
        </div>
        {rangeErr ? <div className="text-bad text-[12px] mt-3 anim-fade-in">{rangeErr}</div> : <div className="text-muted text-[12px] mt-3">Choose any range up to one year, ending today or earlier.</div>}
      </Modal>
    </div>
  );
}
