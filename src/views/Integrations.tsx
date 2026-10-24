import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleCheck, Play, TriangleAlert } from 'lucide-react';
import { Button, Card, CountUp, PageHeader, Pill, Skeleton, Tabs, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { cn } from '../lib/format';
import { navigate, useRoute } from '../store';
import { ERRORS0, SERVICES0, type Day, type Health, type Service } from './integrations/data';
import { AlertRules, BackupsTab, ErrorsTab, ReleasesTab, WebhooksTab } from './integrations/Panels';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dotCls: Record<Health, string> = { Healthy: 'text-ok', Slow: 'text-warn', Down: 'text-bad' };
const barCls: Record<Day, string> = { up: 'bg-ok/70', slow: 'bg-warn', down: 'bg-bad' };
const ago = (t: number, now: number) => { const m = Math.floor((now - t) / 60000); return m < 1 ? 'Just now' : m === 1 ? '1 min ago' : `${m} min ago`; };
type Result = { ms: number; status: Health } | 'testing';

function roll(s: Service): { ms: number; status: Health } {
  const r = Math.random();
  const p = s.id === 'ncm' ? 0.55 : 0.8;
  if (r < p) return { status: 'Healthy', ms: Math.round(s.ms > 2000 ? 600 + Math.random() * 300 : s.ms * (0.8 + Math.random() * 0.4)) };
  if (r < p + (1 - p) * 0.65) return { status: 'Slow', ms: Math.round(2400 + Math.random() * 1600) };
  return { status: 'Down', ms: 0 };
}

function ServiceCard({ s, i, now, result, onTest }: { s: Service; i: number; now: number; result?: Result; onTest: () => void }) {
  const testing = result === 'testing';
  return (
    <Card className="flex flex-col" style={stagger(i)}>
      <div className="flex items-start justify-between gap-3">
        <div><div className="label-caps">{s.group}</div><div className="font-medium text-[15px] mt-0.5">{s.name}</div></div>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[12.5px] text-muted">{s.status}</span>
          <span key={s.status} className={cn('size-2.5 rounded-full bg-current pulse-dot anim-pop', dotCls[s.status])} />
        </div>
      </div>
      <div className="flex items-end justify-between mt-4 text-[13px]">
        <div><div className="text-muted text-[12px]">Last checked</div><div>{ago(s.checked, now)}</div></div>
        <div className="text-right"><div className="text-muted text-[12px]">Response time</div><div className="num font-medium">{s.status === 'Down' ? 'No reply' : <><CountUp value={s.ms} duration={500} /> ms</>}</div></div>
      </div>
      <div className="mt-4">
        <div className="flex gap-[3px] h-7 items-end" aria-label="30 day uptime">
          {s.days.map((d, k) => <span key={k} title={`Day ${k + 1}: ${d === 'up' ? 'working' : d === 'slow' ? 'slow' : 'down'}`} className={cn('flex-1 rounded-[2px] h-full anim-grow-y', barCls[d])} style={{ animationDelay: `${i * 40 + k * 18}ms`, animationDuration: '400ms' }} />)}
        </div>
        <div className="flex justify-between text-[11px] text-muted mt-1"><span>30 days ago</span><span>Today</span></div>
      </div>
      {s.status === 'Down' && <div className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] p-3 text-[13px] anim-fade-up">
        <div className="text-bad font-medium mb-1.5">Next step</div>
        <button onClick={() => navigate(s.step.to)} className="inline-flex items-center gap-1.5 underline underline-offset-4 decoration-line hover:decoration-champagne">{s.step.label}<ArrowRight size={13} /></button>
      </div>}
      <div className="mt-auto pt-4">
        {result && result !== 'testing' && (
          <div key={result.ms + result.status} className={cn('mb-3 rounded-xl px-3 py-2 text-[13px] flex items-center justify-between anim-slide-in', result.status === 'Healthy' ? 'bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-ok' : result.status === 'Slow' ? 'bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-warn' : 'bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-bad')}>
            <span>{result.status === 'Healthy' ? 'Working well' : result.status === 'Slow' ? 'Replied slowly' : 'No reply'}</span><span className="num font-medium">{result.status === 'Down' ? 'Timed out' : `${result.ms} ms`}</span>
          </div>
        )}
        <Button variant="secondary" size="sm" className="w-full" loading={testing} icon={Play} onClick={onTest}>{testing ? 'Testing…' : 'Test now'}</Button>
      </div>
    </Card>
  );
}

export default function Integrations() {
  const route = useRoute();
  const loading = useFakeLoad(600);
  const [services, setServices] = useState<Service[]>(SERVICES0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [tab, setTab] = useState(['errors', 'webhooks', 'backups', 'releases'].includes(route.query.tab) ? route.query.tab : 'errors');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);

  const test = async (id: string) => {
    setResults((r) => ({ ...r, [id]: 'testing' }));
    await wait(1200 + Math.random() * 600);
    const s = services.find((x) => x.id === id)!;
    const out = roll(s);
    setResults((r) => ({ ...r, [id]: out }));
    setServices((all) => all.map((x) => x.id !== id ? x : { ...x, status: out.status, ms: out.ms || x.ms, checked: Date.now(), days: [...x.days.slice(0, 29), out.status === 'Healthy' ? 'up' : out.status === 'Slow' ? 'slow' : 'down'] }));
  };
  const testAll = () => services.forEach((s, i) => setTimeout(() => test(s.id), i * 120));

  const problems = useMemo(() => services.filter((s) => s.status !== 'Healthy'), [services]);
  const anyDown = problems.some((p) => p.status === 'Down');
  const streak = (() => { let n = 0; for (let k = 29; k >= 0; k--) { if (services.some((s) => s.days[k] === 'down')) break; n++; } return n; })();
  const allHealthy = problems.length === 0;

  const badge = allHealthy || !anyDown
    ? <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[color-mix(in_srgb,var(--champagne)_20%,transparent)] text-[13px] font-medium"><Star size={13} twinkle />{streak} days with no downtime</span>
    : <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-stone text-[13px] text-muted"><TriangleAlert size={13} />Streak paused: a service is down right now</span>;

  return (
    <div>
      <PageHeader title="Integrations" subtitle="A quiet look at everything Richiva depends on." badge={badge} actions={<Button variant="secondary" icon={Play} onClick={testAll}>Test everything</Button>} />
      {loading ? <><Skeleton className="h-24 rounded-2xl mb-6" /><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div></> : <>
        <div key={problems.map((p) => p.id + p.status).join()} className={cn('rounded-2xl border p-5 mb-6 anim-fade-up', allHealthy ? 'border-ok/30 bg-[color-mix(in_srgb,var(--ok)_9%,var(--card))]' : anyDown ? 'border-bad/30 bg-[color-mix(in_srgb,var(--bad)_8%,var(--card))]' : 'border-warn/30 bg-[color-mix(in_srgb,var(--warn)_10%,var(--card))]')}>
          {allHealthy ? (
            <div className="flex items-center gap-3"><CircleCheck className="text-ok" size={22} strokeWidth={1.5} /><div><div className="font-title text-[24px] leading-tight">All systems working</div><div className="text-muted text-[13px]">Every service answered its last check.</div></div></div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3"><TriangleAlert className={anyDown ? 'text-bad' : 'text-warn'} size={22} strokeWidth={1.5} /><div className="font-title text-[24px] leading-tight">{problems.length === 1 ? '1 thing needs a look' : `${problems.length} things need a look`}</div></div>
              <ul className="divide-y divide-line/70">
                {problems.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 anim-slide-in">
                    <Pill tone={p.status === 'Down' ? 'danger' : 'warning'} dot>{p.status}</Pill>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted text-[13px] flex-1 min-w-[200px]">{p.status === 'Down' ? 'Not replying to checks.' : `Answering slowly (${p.ms.toLocaleString('en-IN')} ms).`}</span>
                    <Button size="sm" variant={p.status === 'Down' ? 'primary' : 'secondary'} onClick={() => navigate(p.step.to)}>{p.step.label}</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((s, i) => <ServiceCard key={s.id} s={s} i={i} now={now} result={results[s.id]} onTest={() => test(s.id)} />)}
        </div>
        <Card pad={false} className="mt-6" hover={false}>
          <div className="px-6 pt-2"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'errors', label: 'Errors', count: ERRORS0.length }, { id: 'webhooks', label: 'Webhooks' }, { id: 'backups', label: 'Backups' }, { id: 'releases', label: 'Releases' }]} /></div>
          <div key={tab} className="anim-fade-up py-1">
            {tab === 'errors' && <ErrorsTab />}{tab === 'webhooks' && <WebhooksTab />}{tab === 'backups' && <BackupsTab />}{tab === 'releases' && <ReleasesTab />}
          </div>
        </Card>
        <div className="mt-6"><AlertRules /></div>
      </>}
    </div>
  );
}
