import { ArrowUpRight, Check } from 'lucide-react';
import { Button, Card, CardHeader, CountUp, Progress, Ring, Sparkline, Checkbox, Pill } from '../../ui/kit';
import { Leaf, Star } from '../../ui/brand';
import { SETUP_STEPS, setupStore } from '../../data/seed';
import { navigate } from '../../store';
import { cn } from '../../lib/format';

export function TryOnCard({ factor }: { factor: number }) {
  const used = Math.round(1240 * Math.min(1, Math.max(0.12, factor / 30))), limit = 2000;
  const spark = Array.from({ length: 14 }, (_, i) => 40 + Math.round(Math.sin(i * 0.8) * 14 + i * 3));
  return (
    <Card className="h-full">
      <CardHeader title="Try-on usage" sub="Virtual try-on sessions this period" action={<Button size="sm" variant="ghost" icon={ArrowUpRight} onClick={() => navigate('/tryon?tab=usage')}>Details</Button>} />
      <div className="flex items-end justify-between gap-4">
        <div><div className="text-[32px] font-semibold leading-none"><CountUp value={used} /></div><div className="text-muted text-[13px] mt-1.5">of {limit.toLocaleString('en-IN')} sessions in your plan</div></div>
        <Sparkline key={used} data={spark} width={120} height={40} fill />
      </div>
      <Progress className="mt-5" value={(used / limit) * 100} />
      <div className="grid grid-cols-3 gap-4 mt-5 text-[13px]">
        {[['Tried on', Math.round(used * 0.82)], ['Added to bag', Math.round(used * 0.19)], ['Bought', Math.round(used * 0.07)]].map(([l, v]) => (
          <div key={l as string}><div className="label-caps">{l}</div><div className="text-[18px] font-semibold mt-1"><CountUp value={v as number} /></div></div>
        ))}
      </div>
    </Card>
  );
}

export function SetupCard() {
  const [done, setDone] = setupStore.use();
  const p = done.length / SETUP_STEPS.length;
  const toggle = (id: string) => setDone(done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);
  return (
    <Card className="h-full">
      <CardHeader title="Store setup" sub={`${done.length} of ${SETUP_STEPS.length} steps done`} action={p === 1 ? <Pill tone="sage" icon={Check}>All set</Pill> : undefined} />
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div className="relative">
          <Ring value={p * 100} size={112} stroke={6} color="var(--sage)">
            <div style={{ transform: `scale(${0.55 + p * 0.75})`, transition: 'transform 700ms var(--ease)' }} className="text-sage"><Leaf size={44} /></div>
          </Ring>
          {p === 1 && <Star size={18} twinkle className="absolute -top-1 -right-1" />}
        </div>
        <ul className="flex-1 w-full divide-y divide-line">
          {SETUP_STEPS.map((s) => {
            const on = done.includes(s.id);
            return (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <Checkbox checked={on} onChange={() => toggle(s.id)} />
                <span className={cn('flex-1 text-[14px] transition-colors', on && 'text-muted line-through')}>{s.title}</span>
                <button onClick={() => navigate(s.route)} className="text-muted hover:text-fg text-[13px] inline-flex items-center gap-1 transition-colors">Open<ArrowUpRight size={13} strokeWidth={1.5} /></button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
