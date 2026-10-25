"use client";
import { useState } from 'react';
import { Gauge, Pencil, PackageOpen, Plug, Zap, MapPin } from 'lucide-react';
import { Button, Card, CardHeader, Label, Segmented, Switch, stagger } from '../../ui/kit';
import { cn, rs, sleep } from '../../lib/format';
import { useApp } from '../../store';
import type { ApiStatus, Courier } from './data';

export const DOT: Record<ApiStatus, string> = { Connected: 'text-ok', Slow: 'text-warn', Down: 'text-bad' };
export type Rule = 'Cheapest' | 'Fastest' | 'By district';

function Dot({ c }: { c: Courier }) {
  const active = c.on && c.status !== 'Down';
  return <span className={cn('inline-block size-2.5 rounded-full bg-current transition-colors duration-500', c.on ? DOT[c.status] : 'text-muted', active && 'pulse-dot')} />;
}

function CourierCard({ c, i, setC, goRates }: { c: Courier; i: number; setC: (f: (c: Courier) => Courier) => void; goRates: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  const test = async () => {
    setBusy(true); setRes(null); await sleep(1400);
    const n = c.tests + 1;
    if (c.status === 'Connected') { const ms = 118 + n * 9; setRes({ ok: true, text: `Connected in ${ms} ms` }); }
    else if (c.status === 'Slow' && n % 2 === 0) { setRes({ ok: false, text: 'No response after 5,000 ms' }); setC((x) => ({ ...x, status: 'Down', tests: n })); setBusy(false); toast(`${c.name} is down`, { body: 'Consider switching to manual shipping.' }); return; }
    else if (c.status === 'Slow') setRes({ ok: true, text: 'Responded in 1,840 ms (slow)' });
    else if (n % 2 === 0) { setRes({ ok: true, text: 'Back online in 1,210 ms' }); setC((x) => ({ ...x, status: 'Slow', tests: n })); setBusy(false); return; }
    else setRes({ ok: false, text: 'No response after 5,000 ms' });
    setC((x) => ({ ...x, tests: n })); setBusy(false);
  };
  const stats: [string, string][] = [['Coverage', `${c.districts} districts`], ['Average days', `${c.days} days`], ['COD fee', rs(c.codFee)], ["Today's pickups", String(c.pickups)]];
  return (
    <Card style={stagger(i)} className={cn(!c.on && 'opacity-75')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-stone border border-line flex items-center justify-center font-title text-[26px]">{c.name[0]}</div>
          <div><div className="font-title text-[28px] leading-none">{c.name}</div>
            <div className="flex items-center gap-2 mt-2 text-[13px]"><Dot c={c} /><span key={c.status} className="anim-fade-in">{c.on ? c.status : 'Switched off'}</span></div></div>
        </div>
        <Switch checked={c.on} onChange={(v) => { setC((x) => ({ ...x, on: v })); toast(`${c.name} ${v ? 'switched on' : 'switched off'}`); }} label={`${c.name} on or off`} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 mt-6">
        {stats.map(([k, v]) => <div key={k}><Label>{k}</Label><div className="text-[20px] font-semibold num mt-0.5">{v}</div></div>)}
      </dl>
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-line">
        <Button variant="secondary" icon={Plug} loading={busy} onClick={test}>Test connection</Button>
        <Button variant="ghost" icon={Pencil} onClick={goRates}>Edit rates</Button>
        {busy ? <span className="text-muted text-[13px]">Contacting {c.name}…</span> : res && <span key={res.text} className={cn('text-[13px] anim-pop inline-flex items-center gap-1.5', res.ok ? 'text-ok' : 'text-bad')}><span className="size-1.5 rounded-full bg-current" />{res.text}</span>}
      </div>
    </Card>
  );
}

export default function Couriers({ couriers, setCouriers, manual, setManual, rule, setRule, goZones }: { couriers: Courier[]; setCouriers: (f: (c: Courier[]) => Courier[]) => void; manual: boolean; setManual: (b: boolean) => void; rule: Rule; setRule: (r: Rule) => void; goZones: () => void }) {
  const { toast } = useApp();
  const desc: Record<Rule, string> = { Cheapest: 'Each parcel goes to the courier with the lowest price for its zone and weight.', Fastest: 'Each parcel goes to the courier with the fewest delivery days.', 'By district': 'Valley and major cities go to Pathao. Rest of Nepal and remote districts go to Nepal Can Move.' };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_0.75fr] gap-6">
        {couriers.map((c, i) => <CourierCard key={c.id} c={c} i={i} goRates={goZones} setC={(f) => setCouriers((a) => a.map((x) => x.id === c.id ? f(x) : x))} />)}
        <Card style={stagger(2)} className="bg-soft border-dashed shadow-none">
          <div className="flex items-start justify-between"><div className="size-11 rounded-full bg-card border border-line flex items-center justify-center text-muted"><PackageOpen size={20} strokeWidth={1.4} /></div><Switch checked={manual} onChange={(v) => { setManual(v); toast(v ? 'Manual shipping on' : 'Manual shipping off'); }} label="Manual shipping" /></div>
          <div className="font-title text-[24px] mt-4">Manual shipping</div>
          <p className="text-muted text-[13.5px] mt-1.5">Pack and hand over parcels yourself when a courier API is down or a district is not covered. Waybills are added by hand on the Shipments tab.</p>
          <div className="flex items-center gap-2 mt-4 text-[13px]"><MapPin size={14} className="text-muted" />{manual ? 'Active as a fallback' : 'Not active'}</div>
        </Card>
      </div>
      <Card style={stagger(3)}>
        <CardHeader title="Auto-assign rule" sub="How new parcels pick a courier" action={<Segmented<Rule> value={rule} onChange={(r) => { setRule(r); toast(`Auto-assign set to ${r}`); }} options={[{ value: 'Cheapest', label: <><Zap size={13} />Cheapest</> }, { value: 'Fastest', label: <><Gauge size={13} />Fastest</> }, { value: 'By district', label: <><MapPin size={13} />By district</> }]} />} />
        <p key={rule} className="text-[14px] anim-fade-in">{desc[rule]}</p>
      </Card>
    </div>
  );
}

