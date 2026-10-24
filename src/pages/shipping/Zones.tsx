import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardHeader, Label, Pill, SaveBar, Select, Slider, Switch, stagger } from '../../ui/kit';
import { cn, rs } from '../../lib/format';
import { useApp } from '../../store';
import { ALL_DISTRICTS, BANDS, ZONE_SEED, type Courier, type Zone } from './data';

function Num({ value, onChange, className }: { value: number; onChange: (n: number) => void; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted">Rs</span>
      <input type="number" min={0} value={value || ''} onChange={(e) => onChange(Math.max(0, +e.target.value))} className="w-full h-9 rounded-lg border border-line bg-card pl-8 pr-2 text-right text-[14px] num outline-none focus:border-champagne focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--champagne)_22%,transparent)] transition-all" />
    </div>
  );
}

export default function Zones({ couriers }: { couriers: Courier[] }) {
  const { toast } = useApp();
  const [saved, setSaved] = useState<{ zones: Zone[]; free: boolean; thr: number }>({ zones: ZONE_SEED, free: true, thr: 8000 });
  const [zones, setZones] = useState<Zone[]>(ZONE_SEED);
  const [free, setFree] = useState(true);
  const [thr, setThr] = useState(8000);
  const [district, setDistrict] = useState('Pokhara');
  const [kg, setKg] = useState(0.8);
  const dirty = JSON.stringify({ zones, free, thr }) !== JSON.stringify(saved);
  const edit = (id: string, f: (z: Zone) => Zone) => setZones((a) => a.map((z) => z.id === id ? f(z) : z));
  const bad = zones.some((z) => z.prices.some((p) => !p));

  const zone = zones.find((z) => z.districts.includes(district)) ?? zones[2];
  const band = kg <= 0.5 ? 0 : kg <= 1 ? 1 : kg <= 2 ? 2 : 3;
  const quotes = useMemo(() => couriers.map((c) => ({ c, ok: c.on && c.status !== 'Down', price: Math.round((zone.prices[band] * c.mult) / 5) * 5, days: zone.minDays + c.extraDays })), [couriers, zone, band]);
  const live = quotes.filter((q) => q.ok);
  const cheap = live.length ? Math.min(...live.map((q) => q.price)) : 0, fast = live.length ? Math.min(...live.map((q) => q.days)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6 items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((z, i) => (
            <Card key={z.id} style={stagger(i)}>
              <div className="flex items-start justify-between gap-3"><div className="font-title text-[26px] leading-none">{z.name}</div><Pill tone="neutral">{z.days}</Pill></div>
              <div className="flex flex-wrap gap-1.5 mt-3">{z.districts.map((d) => <span key={d} className="text-[12px] px-2 py-0.5 rounded-full bg-stone text-muted">{d}</span>)}</div>
              <Label className="mt-5 mb-2">Price by weight</Label>
              <div className="space-y-2">
                {BANDS.map((b, k) => <div key={b} className="flex items-center justify-between gap-3"><span className="text-[13px] text-muted">{b}</span><Num className="w-28" value={z.prices[k]} onChange={(n) => edit(z.id, (x) => ({ ...x, prices: x.prices.map((p, j) => j === k ? n : p) }))} /></div>)}
              </div>
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line"><span className="text-[13px]">COD fee</span><Num className="w-28" value={z.codFee} onChange={(n) => edit(z.id, (x) => ({ ...x, codFee: n }))} /></div>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Card style={stagger(4)}>
            <CardHeader title="Free shipping" sub="Waive the delivery price above a basket size" action={<Switch checked={free} onChange={setFree} label="Free shipping threshold" />} />
            <div className={cn('transition-opacity duration-300', !free && 'opacity-40 pointer-events-none')}>
              <div className="flex items-center justify-between gap-3"><span className="text-[13px] text-muted">Free above</span><Num className="w-32" value={thr} onChange={setThr} /></div>
              <p className="text-[12.5px] text-muted mt-2">Orders over {rs(thr)} ship free in every zone.</p>
            </div>
          </Card>
          <Card style={stagger(5)}>
            <CardHeader title="Rate calculator" sub="Check what a parcel would cost" />
            <div className="space-y-4">
              <Select label="District" value={district} onChange={setDistrict} options={ALL_DISTRICTS} />
              <div><div className="flex justify-between text-[13px] mb-1"><span className="text-muted">Weight</span><span className="num font-medium">{kg.toFixed(1)} kg</span></div><Slider value={kg} onChange={setKg} min={0.2} max={5} step={0.1} /></div>
              <div className="text-[12.5px] text-muted flex items-center gap-1.5"><Calculator size={13} />{zone.name} zone · {BANDS[band]}</div>
              <div className="divide-y divide-line border-t border-line">
                {quotes.map(({ c, ok, price, days }) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div><div className="font-medium">{c.name}</div>{ok ? <div className="text-[12.5px] text-muted num">{days} {days === 1 ? 'day' : 'days'}</div> : <div className="text-[12.5px] text-bad">Unavailable right now</div>}</div>
                    {ok && <div className="text-right"><div key={price} className="num font-semibold anim-fade-in">{rs(price)}</div><div className="flex gap-1 justify-end mt-0.5">{price === cheap && live.length > 1 && <Pill tone="sage">Cheapest</Pill>}{days === fast && live.length > 1 && <Pill tone="champagne">Fastest</Pill>}</div></div>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
      <SaveBar show={dirty} onDiscard={() => { setZones(saved.zones); setFree(saved.free); setThr(saved.thr); }} onSave={() => { if (bad) return toast('Fill in every price first', { body: 'A price cannot be empty or zero.' }); setSaved({ zones, free, thr }); toast('Rates saved', { star: true }); }} />
    </div>
  );
}
