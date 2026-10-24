import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { Card, CardHeader, CountUp, Label, Segmented, Button, ChartTip, C, Delta, stagger } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { PRODUCTS } from '../../data/seed';
import { rs } from '../../lib/format';
import { useApp } from '../../store';
import { series } from './state';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RATE = 2.4; // Rs per try-on minute

export default function Usage() {
  const { toast } = useApp();
  const [range, setRange] = useState<'7' | '30'>('7');
  const d = useMemo(() => {
    const n = +range; const labels = n === 7 ? DAYS : Array.from({ length: n }, (_, i) => `${i + 1}`);
    const sess = series('sess' + range, n, 320, 120);
    const total = sess.reduce((a, b) => a + b, 0); const avg = 2.4 + (n === 7 ? 0 : 0.1);
    const minutes = Math.round(total * avg);
    return {
      labels, sess, total, minutes, avg, bag: Math.round(total * 0.19), conv: n === 7 ? 4.2 : 3.8, cost: Math.round(minutes * RATE * (7 / n)),
      days: labels.map((l, i) => ({ d: l, Sessions: sess[i] })),
      device: [{ name: 'Android', value: 61 }, { name: 'iPhone', value: 31 }, { name: 'Desktop', value: 8 }],
      errors: [{ t: 'Camera blocked', n: Math.round(total * 0.021) }, { t: 'Slow network', n: Math.round(total * 0.014) }, { t: 'Low light', n: Math.round(total * 0.009) }, { t: 'Provider timeout', n: Math.round(total * 0.004) }],
      top: PRODUCTS.slice(7, 13).map((p, i) => ({ name: p.name, Tries: Math.round((total / 9) * (1 - i * 0.13)) })),
    };
  }, [range]);
  const cards = [
    { l: 'Sessions', v: d.total, f: (n: number) => n.toLocaleString('en-IN'), dl: 8.4 }, { l: 'Total minutes', v: d.minutes, f: (n: number) => n.toLocaleString('en-IN'), dl: 6.1 },
    { l: 'Average session', v: d.avg, dec: 1, f: (n: number) => `${n.toFixed(1)} min`, dl: 1.2 }, { l: 'Add-to-bag from try-on', v: 19, f: (n: number) => `${n}%`, dl: 3.3 }, { l: 'Conversion', v: d.conv, dec: 1, f: (n: number) => `${n.toFixed(1)}%`, dl: 0.6 },
  ];
  const exportCsv = () => {
    const rows = [['Day', 'Sessions'], ...d.days.map((x) => [x.d, x.Sessions]), [], ['Product', 'Tries'], ...d.top.map((x) => [x.name, x.Tries]), [], ['Error', 'Count'], ...d.errors.map((x) => [x.t, x.n])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tryon-usage-${range}d.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast('Usage report exported', { body: `tryon-usage-${range}d.csv` });
  };
  const grid = <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />;
  const ax = { tick: { fontSize: 11, fill: 'var(--muted)' }, axisLine: false, tickLine: false } as const;
  const pieC = [C.ink, C.champagne, C.sage];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={range} onChange={setRange} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }]} />
        <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c, i) => <Card key={c.l} style={stagger(i)}><Label>{c.l}</Label><div className="text-[32px] font-semibold mt-2"><CountUp key={range} value={c.v} decimals={c.dec} format={c.f} /></div><div className="mt-1"><Delta value={c.dl} /></div></Card>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" style={stagger(2)}><CardHeader title="Sessions per day" />
          <div className="h-64"><ResponsiveContainer><BarChart data={d.days}>{grid}<XAxis dataKey="d" {...ax} interval={range === '7' ? 0 : 4} /><YAxis {...ax} width={36} /><Tooltip content={<ChartTip />} cursor={{ fill: 'var(--soft)' }} /><Bar dataKey="Sessions" fill={C.ink} radius={[20, 20, 20, 20]} animationDuration={800} /></BarChart></ResponsiveContainer></div></Card>
        <Card style={stagger(3)}><CardHeader title="Device split" />
          <div className="h-48"><ResponsiveContainer><PieChart><Pie data={d.device} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none" animationDuration={800}>{d.device.map((_, i) => <Cell key={i} fill={pieC[i]} />)}</Pie><Tooltip content={<ChartTip fmt={(n) => `${n}%`} />} /></PieChart></ResponsiveContainer></div>
          <div className="flex justify-center gap-4 text-[12px] text-muted">{d.device.map((x, i) => <span key={x.name} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: pieC[i] }} />{x.name} {x.value}%</span>)}</div></Card>
        <Card style={stagger(4)}><CardHeader title="Errors by type" />
          <div className="h-56"><ResponsiveContainer><BarChart data={d.errors} layout="vertical" margin={{ left: 20 }}><XAxis type="number" hide /><YAxis dataKey="t" type="category" {...ax} width={110} /><Tooltip content={<ChartTip />} cursor={{ fill: 'var(--soft)' }} /><Bar dataKey="n" name="Errors" fill={C.champagne} radius={[20, 20, 20, 20]} animationDuration={800} /></BarChart></ResponsiveContainer></div></Card>
        <Card className="lg:col-span-2" style={stagger(5)}><CardHeader title="Most tried products" />
          <div className="h-56"><ResponsiveContainer><BarChart data={d.top} layout="vertical" margin={{ left: 40 }}><XAxis type="number" hide /><YAxis dataKey="name" type="category" {...ax} width={140} /><Tooltip content={<ChartTip />} cursor={{ fill: 'var(--soft)' }} /><Bar dataKey="Tries" fill={C.ink} radius={[20, 20, 20, 20]} animationDuration={800} /></BarChart></ResponsiveContainer></div></Card>
      </div>
      <Card className="flex items-center justify-between gap-4 flex-wrap" style={stagger(6)}>
        <div className="flex items-center gap-3"><Star size={18} twinkle /><div><Label>Weekly cost estimate</Label><div className="text-muted text-[13px] mt-0.5">{d.minutes.toLocaleString('en-IN')} minutes at about {rs(RATE)} a minute</div></div></div>
        <div className="font-title text-[40px]"><CountUp key={range} value={d.cost} format={rs} /></div>
      </Card>
    </div>
  );
}
