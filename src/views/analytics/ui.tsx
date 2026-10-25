"use client";
import { useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CountUp, ChartTip, Drawer, KV, Progress, Label, stagger } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { cn, rs } from '../../lib/format';
import type { Drill } from './data';

export const ax = { tick: { fontSize: 11, fill: 'var(--muted)' }, axisLine: false, tickLine: false } as const;
export const grid = <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />;
export const compact = (n: number) => (n >= 10000000 ? `${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`);

export const Insight = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-3 mb-8 anim-fade-up"><Star size={20} twinkle className="mt-2" /><p className="font-title text-[30px] leading-snug max-w-3xl">{children}</p></div>
);

export function useLegend() {
  const [hidden, setHidden] = useState<string[]>([]);
  return { hidden, off: (k: string) => hidden.includes(k), toggle: (k: string) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k])) };
}
export function Legend({ items, hidden, toggle }: { items: { k: string; color: string; dash?: boolean }[]; hidden: string[]; toggle: (k: string) => void }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {items.map((it) => (
        <button key={it.k} onClick={() => toggle(it.k)} className={cn('flex items-center gap-1.5 text-[12px] transition-opacity', hidden.includes(it.k) ? 'opacity-40 line-through' : 'text-fg')}>
          <span className="w-4 h-0 border-t-2" style={{ borderColor: it.color, borderStyle: it.dash ? 'dashed' : 'solid' }} />{it.k}
        </button>
      ))}
    </div>
  );
}

export function Panel({ title, sub, action, children, className, h = 340, i = 0 }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; h?: number; i?: number }) {
  return (
    <Card className={cn('!p-7', className)} style={stagger(i)}>
      <CardHeader title={title} sub={sub} action={action} />
      <div style={{ height: h }}>{children}</div>
    </Card>
  );
}

type Pick = (name: string, value: number) => void;
export function VBars({ data, keys, hidden = [], onPick, fmt, stack, hl, hlKey = 'name', fixedColor }: { data: Record<string, string | number>[]; keys: { k: string; color: string }[]; hidden?: string[]; onPick?: Pick; fmt?: (n: number) => string; stack?: boolean; hl?: string; hlKey?: string; fixedColor?: boolean }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} barGap={4} margin={{ top: 8, right: 8 }}>
        {grid}<XAxis dataKey="name" {...ax} interval="preserveStartEnd" /><YAxis {...ax} width={44} tickFormatter={fmt ? (v) => (fmt === rs ? compact(v) : fmt(v)) : compact} />
        <Tooltip content={<ChartTip fmt={fmt} />} cursor={{ fill: 'var(--soft)' }} />
        {keys.map((k, ki) => (
          <Bar key={k.k} dataKey={k.k} fill={k.color} hide={hidden.includes(k.k)} stackId={stack ? 's' : undefined} radius={stack ? 0 : [20, 20, 20, 20]} animationDuration={800} cursor="pointer" onClick={(_: unknown, i: number) => onPick?.(String(data[i].name), Number(data[i][k.k]))}>
            {!fixedColor && keys.length === 1 && data.map((d, i) => <Cell key={i} fill={k.color} fillOpacity={hl && hl !== 'All' && d[hlKey] !== hl ? 0.25 : 1} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
export function HBars({ data, k, color = 'var(--ink)', onPick, fmt, width = 120, hl }: { data: Record<string, string | number>[]; k: string; color?: string; onPick?: Pick; fmt?: (n: number) => string; width?: number; hl?: string }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24 }}>
        <XAxis type="number" hide /><YAxis dataKey="name" type="category" {...ax} width={width} tick={{ fontSize: 12, fill: 'var(--fg)' }} />
        <Tooltip content={<ChartTip fmt={fmt} />} cursor={{ fill: 'var(--soft)' }} />
        <Bar dataKey={k} fill={color} radius={[20, 20, 20, 20]} barSize={18} animationDuration={800} cursor="pointer" onClick={(_: unknown, i: number) => onPick?.(String(data[i].name), Number(data[i][k]))}>
          {data.map((d, i) => <Cell key={i} fill={color} fillOpacity={hl && hl !== 'All' && d.name !== hl ? 0.25 : 1} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Stats({ items }: { items: { label: string; value: number; format?: (n: number) => string; decimals?: number }[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3 mb-8">
      {items.map((s, i) => (
        <div key={s.label} className="anim-fade-up" style={stagger(i)}><Label>{s.label}</Label><div className="text-[32px] font-semibold mt-1"><CountUp value={s.value} format={s.format} decimals={s.decimals} /></div></div>
      ))}
    </div>
  );
}

export function useHoverTip() {
  const [t, setT] = useState<{ x: number; y: number; label: string; rows: { name: string; value: number; color: string }[]; fmt?: (n: number) => string } | null>(null);
  return {
    move: (e: React.MouseEvent, label: string, rows: { name: string; value: number; color: string }[], fmt?: (n: number) => string) => setT({ x: e.clientX, y: e.clientY, label, rows, fmt }),
    leave: () => setT(null),
    node: t && <div className="fixed z-[60] pointer-events-none" style={{ left: t.x + 14, top: t.y + 14 }}><ChartTip active label={t.label} payload={t.rows} fmt={t.fmt} /></div>,
  };
}

export function DrillDrawer({ drill, onClose }: { drill: Drill | null; onClose: () => void }) {
  const tot = drill?.parts.reduce((a, p) => a + p.v, 0) ?? 1;
  return (
    <Drawer open={!!drill} onClose={onClose} title={drill?.title} subtitle={drill?.sub}>
      {drill && <div>
        <div className="font-title text-[44px] leading-none mb-6">{drill.value}</div>
        <Label className="mb-3">Breakdown</Label>
        <div className="space-y-4 mb-8">{drill.parts.map((p) => <div key={p.name}><div className="flex justify-between text-[13px] mb-1.5"><span>{p.name}</span><span className="num text-muted">{p.v.toLocaleString('en-IN')} ({Math.round((p.v / tot) * 100)}%)</span></div><Progress value={(p.v / tot) * 100} color="var(--champagne)" /></div>)}</div>
        <Label className="mb-2">Sample orders</Label>
        {drill.rows.map((r) => <KV key={r.id} k={<span><span className="text-fg font-medium">{r.id}</span> <span className="ml-1">{r.customer}, {r.city}</span></span>}><span className="num">{rs(r.total)}</span></KV>)}
      </div>}
    </Drawer>
  );
}

