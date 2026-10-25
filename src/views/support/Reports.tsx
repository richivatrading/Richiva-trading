"use client";
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, ChartTip, CountUp, Label, C, stagger } from '../../ui/kit';
import type { Ticket } from './data';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FIRST = [9, 7, 6, 8, 5, 4, 3.5];
const RESOLVE = [5.1, 4.6, 4.2, 4.4, 3.8, 3.4, 3.1];
const BASE: Record<string, number> = { 'Size exchange': 22, 'COD delivery delay': 18, 'Payment failed': 13, 'Custom order': 9, Refund: 8, 'Product advice': 11 };
const axis = { fontSize: 12, fill: 'var(--muted)' };

export default function Reports({ tickets }: { tickets: Ticket[] }) {
  const topics = useMemo(() => {
    const m = { ...BASE }; tickets.forEach((t) => { m[t.ai.topic] = (m[t.ai.topic] ?? 0) + 1; });
    return Object.entries(m).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
  }, [tickets]);
  const rated = tickets.filter((t) => t.rating);
  const csat = rated.length ? (4.6 * 20 + rated.reduce((a, t) => a + (t.rating ?? 0), 0)) / (20 + rated.length) : 4.6;
  const kpi = [
    { k: 'First response time', node: <><CountUp value={3.5} decimals={1} /> min</>, sub: 'Down from 9 min on Monday' },
    { k: 'Resolution time', node: <><CountUp value={3.1} decimals={1} /> hours</>, sub: 'Target is under 4 hours' },
    { k: 'Conversations this week', node: <CountUp value={topics.reduce((a, t) => a + t.count, 0)} />, sub: 'Across web, app, email and WhatsApp' },
    { k: 'Customer rating', node: <><CountUp value={csat} decimals={1} /> / 5</>, sub: `${20 + rated.length} ratings` },
  ];
  const line = (data: number[], name: string, color: string, target: number, unit: string) => (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={DAYS.map((d, i) => ({ d, v: data[i] }))} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={C.stone} strokeDasharray="3 4" />
        <XAxis dataKey="d" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTip fmt={(n) => `${n} ${unit}`} />} cursor={{ stroke: C.stone }} />
        <ReferenceLine y={target} stroke={C.champagne} strokeDasharray="4 4" />
        <Line type="monotone" dataKey="v" name={name} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, strokeWidth: 0 }} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpi.map((x, i) => <Card key={x.k} style={stagger(i)}><Label>{x.k}</Label><div className="text-[32px] font-semibold mt-2 leading-none">{x.node}</div><div className="text-muted text-[12.5px] mt-2">{x.sub}</div></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader title="First response time" sub="Minutes, last 7 days. Dashed line is the 5 minute goal." />{line(FIRST, 'First response', C.ink, 5, 'min')}</Card>
        <Card><CardHeader title="Resolution time" sub="Hours, last 7 days. Dashed line is the 4 hour goal." />{line(RESOLVE, 'Resolution', C.sage, 4, 'h')}</Card>
      </div>
      <Card>
        <CardHeader title="Volume by topic" sub="What customers write about most." />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topics} layout="vertical" margin={{ left: 24, right: 16 }}>
            <CartesianGrid horizontal={false} stroke={C.stone} strokeDasharray="3 4" />
            <XAxis type="number" tick={axis} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="topic" width={140} tick={axis} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--soft)' }} />
            <Bar dataKey="count" name="Conversations" fill={C.ink} radius={[20, 20, 20, 20]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

