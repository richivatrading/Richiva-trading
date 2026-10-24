import { Card, CountUp, Label, PageHeader, stagger } from '../ui/kit';
import { rs } from '../lib/format';
import { ordersStore } from '../data/seed';
import { buildQueue, riskLog } from './risk/data';
import Queue from './risk/Queue';
import Side from './risk/Side';

export default function Risk() {
  const [log] = riskLog.use();
  ordersStore.use();
  const waiting = buildQueue().length;
  const { confirmed, refused, unreachable, saved } = log.stats;
  const total = confirmed + refused + unreachable;
  const cards: { l: string; v: number; f: (n: number) => string; d?: number; sub: string }[] = [
    { l: 'COD orders waiting', v: waiting, f: (n) => String(n), sub: 'Need a confirmation call' },
    { l: 'Confirmation rate this week', v: (confirmed / total) * 100, f: (n) => `${n}%`, d: 1, sub: `${confirmed} of ${total} COD orders` },
    { l: 'Refused or unreachable rate', v: ((refused + unreachable) / total) * 100, f: (n) => `${n}%`, d: 1, sub: `${refused} refused, ${unreachable} unreachable` },
    { l: 'Estimated money saved', v: saved, f: rs, sub: 'Cancelled before shipping' },
  ];
  return (
    <div>
      <PageHeader title="Risk and COD confirmation" subtitle="A calm desk for confirming cash on delivery orders before they ship." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {cards.map((c, i) => (
          <Card key={c.l} style={stagger(i)} className={i === 0 ? "feature [&_.label-caps]:!text-white/70 [&_.text-muted]:!text-white/60" : undefined}><Label>{c.l}</Label><div className="text-[32px] leading-tight font-semibold mt-1.5"><CountUp value={c.v} format={c.f} decimals={c.d} /></div><div className="text-muted text-[12.5px] mt-1">{c.sub}</div></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start"><Queue /><Side /></div>
    </div>
  );
}
