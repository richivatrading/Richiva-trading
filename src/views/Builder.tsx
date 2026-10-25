"use client";
import { useMemo, useState } from 'react';
import { CalendarDays, Check, Minus, Plus, Ruler, Scissors, X, Zap } from 'lucide-react';
import { Button, PageHeader, Card, CardHeader, Checkbox, CountUp, EmptyState, Field, Label, Modal, Pill, Segmented, SaveBar, Skeleton, Sortable, StatusPill, Switch, Tabs, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp } from '../store';
import { PRODUCTS, fabric, photo } from '../data/seed';
import { cn, rs, uid } from '../lib/format';

type Stock = 'In stock' | 'Low stock' | 'Out of stock';
interface Fab { id: string; name: string; comp: string; extra: number; colors: string[]; stock: Stock; on: boolean; img: number }
interface Val { id: string; label: string; extra: number }
interface Group { id: string; name: string; type: string; required: boolean; values: Val[] }
interface Meas { id: string; name: string; unit: 'cm' | 'in'; min: number; max: number; help: string }
interface Rule { id: string; text: string; on: boolean }
interface Cfg { fabrics: Fab[]; groups: Group[]; meas: Meas[]; base: number; rush: number; rules: Rule[]; std: number; rushDays: number; cap: number; blocked: string[] }

const v = (label: string, extra = 0): Val => ({ id: uid('v'), label, extra });
const INIT: Cfg = {
  fabrics: [
    { id: 'f1', name: 'Dhaka Weave', comp: '100% cotton, handloom', extra: 0, colors: ['#d9d7db', '#4a494d', '#222222'], stock: 'In stock', on: true, img: 0 },
    { id: 'f2', name: 'Mulberry Silk', comp: '100% mulberry silk', extra: 2400, colors: ['#9a989d', '#c9c7cb', '#222222'], stock: 'Low stock', on: true, img: 1 },
    { id: 'f3', name: 'Himalayan Linen', comp: '85% linen, 15% cotton', extra: 900, colors: ['#d9d7db', '#9a989d'], stock: 'In stock', on: true, img: 2 },
    { id: 'f4', name: 'Pashmina Blend', comp: '70% wool, 30% silk', extra: 3800, colors: ['#c9c7cb', '#3a3a3c', '#e6e4e7'], stock: 'In stock', on: true, img: 3 },
    { id: 'f5', name: 'Lokta Crepe', comp: '60% viscose, 40% hemp', extra: 600, colors: ['#e6e4e7', '#7d7b80'], stock: 'Out of stock', on: false, img: 4 },
    { id: 'f6', name: 'Brocade Jacquard', comp: '55% silk, 45% cotton', extra: 3100, colors: ['#9a989d', '#4a494d', '#d9d7db'], stock: 'Low stock', on: true, img: 5 },
  ],
  groups: [
    { id: 'g1', name: 'Fit', type: 'Single choice', required: true, values: [v('Slim'), v('Regular'), v('Relaxed', 300)] },
    { id: 'g2', name: 'Sleeve', type: 'Single choice', required: true, values: [v('Sleeveless'), v('Short'), v('Three quarter', 200), v('Full', 350)] },
    { id: 'g3', name: 'Neckline', type: 'Single choice', required: false, values: [v('Round'), v('V neck'), v('Mandarin collar', 250), v('Boat', 150)] },
    { id: 'g4', name: 'Length', type: 'Single choice', required: true, values: [v('Knee'), v('Midi', 400), v('Maxi', 900)] },
    { id: 'g5', name: 'Embroidery text', type: 'Text', required: false, values: [v('None'), v('Initials', 600), v('First name', 1100), v('Full name', 1600)] },
  ],
  meas: [
    { id: 'bust', name: 'Bust', unit: 'cm', min: 76, max: 125, help: 'Measure around the fullest part' },
    { id: 'waist', name: 'Waist', unit: 'cm', min: 58, max: 110, help: 'Measure at the narrowest point' },
    { id: 'hip', name: 'Hip', unit: 'cm', min: 82, max: 130, help: 'Measure around the fullest part of the hips' },
    { id: 'length', name: 'Length', unit: 'cm', min: 85, max: 160, help: 'Shoulder to desired hem' },
  ],
  base: 6500, rush: 1500,
  rules: [{ id: 'r1', text: 'Free embroidery for 2 or more items', on: true }, { id: 'r2', text: '5% off for 3 or more items', on: true }],
  std: 6, rushDays: 3, cap: 8, blocked: ['2026-10-31', '2026-11-02', '2026-11-08'],
};
const TODAY = new Date(2026, 9, 18);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const num = (s: string) => (s === '' ? 0 : Math.max(0, parseInt(s.replace(/\D/g, ''), 10) || 0));
const Tape = () => <div className="tape my-6" />;

interface Pick { fab: string; opts: Record<string, string>; m: Record<string, number>; qty: number; rush: boolean }
function useCalc(cfg: Cfg, p: Pick) {
  return useMemo(() => {
    const fab = cfg.fabrics.find((f) => f.id === p.fab);
    const freeEmb = p.qty >= 2 && cfg.rules.find((r) => r.id === 'r1')?.on;
    const lines = cfg.groups.map((g) => { const val = g.values.find((x) => x.id === p.opts[g.id]); const waived = freeEmb && g.type === 'Text'; return { name: g.name, label: val?.label ?? '—', extra: waived ? 0 : val?.extra ?? 0, waived: !!waived && !!val?.extra }; });
    const unit = cfg.base + (fab?.extra ?? 0) + lines.reduce((a, l) => a + l.extra, 0);
    const disc = p.qty >= 3 && cfg.rules.find((r) => r.id === 'r2')?.on ? 0.05 : 0;
    const total = Math.round(unit * p.qty * (1 - disc)) + (p.rush ? cfg.rush : 0);
    let days = (p.rush ? cfg.rushDays : cfg.std) + Math.max(0, Math.ceil(p.qty / Math.max(1, cfg.cap)) - 1);
    const d = new Date(TODAY);
    while (days > 0) { d.setDate(d.getDate() + 1); if (!cfg.blocked.includes(iso(d))) days--; }
    return { fab, lines, unit, disc, total, date: `${d.getDate()} ${MON[d.getMonth()]}` };
  }, [cfg, p]);
}

function Swatch({ f, active, onClick, children }: { f: Fab; active?: boolean; onClick?: () => void; children?: React.ReactNode }) {
  return (
    <div onClick={onClick} className={cn('rounded-2xl overflow-hidden bg-card border transition-all duration-300', active ? 'border-champagne ring-2 ring-champagne' : 'border-line', onClick && 'cursor-pointer hover:-translate-y-0.5', !f.on && 'opacity-55')}>
      <div className="h-28 relative overflow-hidden"><img src={fabric(f.img, 500, 300)} alt={f.name} className="size-full object-cover" />{active && <span className="absolute top-2 right-2 size-6 rounded-full bg-champagne text-white flex items-center justify-center anim-pop"><Check size={14} /></span>}</div>
      {children}
    </div>
  );
}

export default function Builder() {
  const { toast } = useApp();
  const loading = useFakeLoad(600);
  const [cfg, setCfg] = useState<Cfg>(INIT);
  const [saved, setSaved] = useState<Cfg>(INIT);
  const [tab, setTab] = useState('fabrics');
  const [published, setPublished] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  const [linked, setLinked] = useState<string[]>([]);
  const [pick, setPick] = useState<Pick>({ fab: 'f1', opts: Object.fromEntries(INIT.groups.map((g) => [g.id, g.values[0].id])), m: { bust: 88, waist: 70, hip: 96, length: 110 }, qty: 1, rush: false });
  const calc = useCalc(cfg, pick);
  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);
  const mto = PRODUCTS.filter((p) => p.mto).slice(0, 12);
  const up = (f: (c: Cfg) => Cfg) => setCfg(f);
  const setFab = (id: string, p: Partial<Fab>) => up((c) => ({ ...c, fabrics: c.fabrics.map((f) => (f.id === id ? { ...f, ...p } : f)) }));
  const setGroup = (id: string, p: Partial<Group>) => up((c) => ({ ...c, groups: c.groups.map((g) => (g.id === id ? { ...g, ...p } : g)) }));
  const setMeas = (id: string, p: Partial<Meas>) => up((c) => ({ ...c, meas: c.meas.map((m) => (m.id === id ? { ...m, ...p } : m)) }));
  const save = () => { setSaved(cfg); toast('Template saved', { body: 'Settings stored as draft' }); };
  const doPublish = () => { setSaved(cfg); setPublished(true); setPubOpen(false); toast('Template published', { body: `Linked to ${linked.length} product${linked.length === 1 ? '' : 's'}`, star: true }); };

  const Calc = (
    <Card className="lg:sticky lg:top-4">
      <CardHeader title="Live price calculator" sub="Uses the sample choices from Preview" />
      <div className="flex items-center gap-3 mb-4"><img src={fabric(calc.fab?.img ?? 0, 120, 120)} alt="" className="size-12 rounded-xl object-cover" /><div><div className="font-medium">{calc.fab?.name}</div><div className="text-[12px] text-muted">{pick.qty} item{pick.qty > 1 ? 's' : ''}{pick.rush ? ', rush' : ''}</div></div></div>
      <div className="text-[14px]">
        <div className="flex justify-between py-1.5"><span className="text-muted">Base price</span><span className="num">{rs(cfg.base)}</span></div>
        {calc.fab && calc.fab.extra > 0 && <div className="flex justify-between py-1.5"><span className="text-muted">Fabric</span><span className="num">+ {rs(calc.fab.extra)}</span></div>}
        {calc.lines.filter((l) => l.extra > 0 || l.waived).map((l) => <div key={l.name} className="flex justify-between py-1.5 anim-fade-in"><span className="text-muted">{l.name}: {l.label}</span>{l.waived ? <Pill tone="sage">Free</Pill> : <span className="num">+ {rs(l.extra)}</span>}</div>)}
        {calc.disc > 0 && <div className="flex justify-between py-1.5"><span className="text-muted">Multi-item discount</span><span className="num text-sage">- 5%</span></div>}
        {pick.rush && <div className="flex justify-between py-1.5"><span className="text-muted">Rush fee</span><span className="num">+ {rs(cfg.rush)}</span></div>}
      </div>
      <div className="tape my-3" />
      <div className="flex items-end justify-between"><Label>Total</Label><div className="text-[32px] font-semibold leading-none"><CountUp value={calc.total} format={rs} /></div></div>
      <div className="mt-4 flex items-center gap-2 text-[13px] text-muted"><CalendarDays size={15} strokeWidth={1.5} />Delivery by <b className="text-fg font-medium">{calc.date}</b></div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Segmented className="col-span-2" value={String(pick.qty)} onChange={(x) => setPick({ ...pick, qty: +x })} options={['1', '2', '3'].map((n) => ({ value: n, label: `${n} item${n === '1' ? '' : 's'}` }))} />
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader title="Custom builder" badge={published ? <StatusPill status="Published" /> : <StatusPill status="Draft" />} actions={<Button icon={Scissors} onClick={() => setPubOpen(true)}>Publish template</Button>} />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ id: 'fabrics', label: 'Fabrics' }, { id: 'options', label: 'Options' }, { id: 'measurements', label: 'Measurements' }, { id: 'price', label: 'Price rules' }, { id: 'production', label: 'Production time' }, { id: 'preview', label: 'Preview' }]} />

      {loading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div> : (
        <div key={tab} className="anim-fade-up">
          {tab === 'fabrics' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {cfg.fabrics.map((f, i) => (
                <div key={f.id} className="anim-fade-up" style={stagger(i)}>
                  <Swatch f={f}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3"><div><div className="font-title text-[22px] leading-tight">{f.name}</div><div className="text-[12.5px] text-muted">{f.comp}</div></div><Switch checked={f.on} onChange={(b) => setFab(f.id, { on: b })} label={`${f.name} on`} /></div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex -space-x-1.5">{f.colors.map((c) => <span key={c} className="size-5 rounded-full border-2 border-card" style={{ background: c }} />)}</div>
                        <Pill tone={f.stock === 'In stock' ? 'success' : f.stock === 'Low stock' ? 'warning' : 'danger'}>{f.stock}</Pill>
                      </div>
                      <div className="tape my-3" />
                      <div className="flex items-center justify-between text-[13px]"><span className="text-muted">Extra price</span><span className="flex items-center gap-1.5">+ Rs <input value={f.extra} onChange={(e) => setFab(f.id, { extra: num(e.target.value) })} className="w-20 h-8 rounded-lg border border-line bg-card px-2 text-right num outline-none focus:border-champagne" /></span></div>
                    </div>
                  </Swatch>
                </div>
              ))}
            </div>
          )}

          {tab === 'options' && (
            <div className="grid gap-6 max-w-4xl">
              {cfg.groups.map((g, i) => <OptionGroup key={g.id} g={g} i={i} onChange={(p) => setGroup(g.id, p)} />)}
            </div>
          )}

          {tab === 'measurements' && (
            <Card pad={false}>
              <div className="p-6 pb-2"><CardHeader title="Body measurements" sub="Customers enter these when they order. Values outside the range are rejected." /></div>
              {cfg.meas.map((m, i) => (
                <div key={m.id} className="px-6 py-5 border-t border-line flex flex-wrap items-center gap-5 anim-fade-up" style={stagger(i)}>
                  <div className="w-24 h-24 rounded-xl bg-soft relative overflow-hidden flex items-center justify-center shrink-0" title={m.help}>
                    <img src={photo(i + 2, 200, 200)} alt="" className="absolute inset-0 size-full object-cover opacity-25" /><Ruler size={30} strokeWidth={1.1} className="relative text-fg/70" /><div className="tape absolute inset-x-2 bottom-2" />
                  </div>
                  <div className="min-w-36"><div className="font-title text-[24px] leading-tight">{m.name}</div><div className="text-[12.5px] text-muted max-w-48">{m.help}</div></div>
                  <Segmented value={m.unit} onChange={(u) => setMeas(m.id, { unit: u })} options={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'in' }]} />
                  <Field className="w-28" label={`Min (${m.unit})`} value={m.min} onChange={(x) => setMeas(m.id, { min: num(x) })} error={m.min >= m.max ? 'Must be below max' : undefined} />
                  <Field className="w-28" label={`Max (${m.unit})`} value={m.max} onChange={(x) => setMeas(m.id, { max: num(x) })} error={m.max <= m.min ? 'Must be above min' : undefined} />
                </div>
              ))}
            </Card>
          )}

          {tab === 'price' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              <Card>
                <CardHeader title="Price rules" sub="Everything here feeds the calculator on the right" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Base price" prefix="Rs" value={cfg.base} onChange={(x) => up((c) => ({ ...c, base: num(x) }))} error={cfg.base <= 0 ? 'Enter a base price' : undefined} />
                  <Field label="Rush fee" prefix="Rs" value={cfg.rush} onChange={(x) => up((c) => ({ ...c, rush: num(x) }))} />
                </div>
                <Tape />
                <Label className="mb-3">Option adders</Label>
                <div className="grid gap-1">
                  {cfg.groups.map((g) => { const max = Math.max(...g.values.map((x) => x.extra)); return <div key={g.id} className="flex justify-between py-2 border-b border-line last:border-0 text-[14px]"><span>{g.name}</span><span className="text-muted num">{max ? `up to + ${rs(max)}` : 'No extra charge'}</span></div>; })}
                </div>
                <Tape />
                <Label className="mb-3">Rules</Label>
                <div className="grid gap-2">
                  {cfg.rules.map((r) => <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"><span className="flex items-center gap-2"><Star size={12} />{r.text}</span><Switch checked={r.on} onChange={(b) => up((c) => ({ ...c, rules: c.rules.map((x) => (x.id === r.id ? { ...x, on: b } : x)) }))} label={r.text} /></div>)}
                </div>
              </Card>
              {Calc}
            </div>
          )}

          {tab === 'production' && (
            <div className="grid gap-6">
              <Card>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Standard production (days)" value={cfg.std} onChange={(x) => up((c) => ({ ...c, std: Math.max(1, num(x)) }))} />
                  <Field label="Rush production (days)" value={cfg.rushDays} onChange={(x) => up((c) => ({ ...c, rushDays: Math.max(1, num(x)) }))} error={cfg.rushDays >= cfg.std ? 'Rush should be faster than standard' : undefined} />
                  <Field label="Daily capacity (garments)" value={cfg.cap} onChange={(x) => up((c) => ({ ...c, cap: Math.max(1, num(x)) }))} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Production calendar" sub="Click a day to block it. Blocked days are skipped when counting production time." action={<Pill tone="neutral">{cfg.blocked.length} blocked</Pill>} />
                <div className="grid md:grid-cols-2 gap-8">
                  {[9, 10].map((mo) => <Month key={mo} month={mo} blocked={cfg.blocked} onToggle={(d) => up((c) => ({ ...c, blocked: c.blocked.includes(d) ? c.blocked.filter((x) => x !== d) : [...c.blocked, d] }))} />)}
                </div>
                <div className="mt-4 text-[13px] text-muted flex items-center gap-2"><CalendarDays size={15} strokeWidth={1.5} />A standard order placed today arrives by <b className="text-fg font-medium">{calcDate(cfg, cfg.std)}</b></div>
              </Card>
            </div>
          )}

          {tab === 'preview' && <Preview cfg={cfg} pick={pick} setPick={setPick} calc={calc} />}
        </div>
      )}

      <Modal open={pubOpen} onClose={() => setPubOpen(false)} title="Publish template" footer={<><Button variant="secondary" onClick={() => setPubOpen(false)}>Cancel</Button><Button disabled={!linked.length} icon={Scissors} onClick={doPublish}>Publish to {linked.length || 'no'} product{linked.length === 1 ? '' : 's'}</Button></>}>
        <div className="text-muted mb-4">Choose the made-to-order products that should use this template.</div>
        {mto.length === 0 ? <EmptyState title="No made-to-order products" /> : (
          <div className="grid gap-1 max-h-[340px] overflow-y-auto pr-1">
            <div className="pb-2"><Checkbox checked={linked.length === mto.length} indeterminate={linked.length > 0} onChange={(b) => setLinked(b ? mto.map((p) => p.id) : [])} label="Select all" /></div>
            {mto.map((p) => (
              <div key={p.id} onClick={() => setLinked((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-soft cursor-pointer transition-colors">
                <Checkbox checked={linked.includes(p.id)} onChange={() => setLinked((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))} />
                <img src={photo(p.photo, 80, 100)} alt="" className="size-10 rounded-lg object-cover" /><div className="flex-1 min-w-0"><div className="truncate">{p.name}</div><div className="text-[12px] text-muted">{p.sku}</div></div><span className="num text-[13px] text-muted">{rs(p.price)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <SaveBar show={dirty} onSave={save} onDiscard={() => setCfg(saved)} />
    </div>
  );
}

function calcDate(cfg: Cfg, days: number) {
  const d = new Date(TODAY);
  while (days > 0) { d.setDate(d.getDate() + 1); if (!cfg.blocked.includes(iso(d))) days--; }
  return `${d.getDate()} ${MON[d.getMonth()]}`;
}

function OptionGroup({ g, i, onChange }: { g: Group; i: number; onChange: (p: Partial<Group>) => void }) {
  const [label, setLabel] = useState('');
  const [extra, setExtra] = useState('');
  const [err, setErr] = useState('');
  const add = () => {
    if (!label.trim()) return setErr('Give the value a name');
    if (g.values.some((x) => x.label.toLowerCase() === label.trim().toLowerCase())) return setErr('That value already exists');
    onChange({ values: [...g.values, v(label.trim(), num(extra))] }); setLabel(''); setExtra(''); setErr('');
  };
  return (
    <Card style={{ animationDelay: `${i * 40}ms` }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><h3 className="font-title text-[26px] leading-tight">{g.name}</h3><Pill>{g.type}</Pill></div>
        <label className="flex items-center gap-2.5 text-[13px] text-muted">Required<Switch checked={g.required} onChange={(b) => onChange({ required: b })} label={`${g.name} required`} /></label>
      </div>
      <div className="tape my-4" />
      <Sortable horizontal className="flex flex-wrap gap-3" items={g.values} getId={(x) => x.id} onChange={(values) => onChange({ values })}
        render={(x, o) => (
          <div className="inline-flex items-center gap-2 h-10 pl-2 pr-2 rounded-full border border-line bg-card hover:border-champagne transition-colors anim-pop">
            {o.handle}<span className="text-[14px]">{x.label}</span>{x.extra > 0 && <span className="text-[12px] text-muted num">+ {rs(x.extra)}</span>}
            <button aria-label={`Remove ${x.label}`} onClick={() => onChange({ values: g.values.filter((y) => y.id !== x.id) })} className="size-6 rounded-full hover:bg-stone flex items-center justify-center text-muted hover:text-fg"><X size={13} /></button>
          </div>
        )} />
      <div className="flex flex-wrap items-start gap-3 mt-4">
        <Field className="w-48" label="New value" value={label} onChange={(x) => { setLabel(x); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && add()} error={err} />
        <Field className="w-36" label="Extra price" prefix="Rs" value={extra} onChange={setExtra} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button variant="secondary" icon={Plus} className="mt-1" onClick={add}>Add</Button>
      </div>
    </Card>
  );
}

function Month({ month, blocked, onToggle }: { month: number; blocked: string[]; onToggle: (d: string) => void }) {
  const first = new Date(2026, month, 1); const n = new Date(2026, month + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  return (
    <div>
      <div className="font-title text-[22px] mb-2">{['October', 'November'][month - 9]} 2026</div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="label-caps py-1">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const date = new Date(2026, month, d); const k = iso(date); const past = date < TODAY; const isToday = iso(TODAY) === k; const b = blocked.includes(k);
          return (
            <button key={i} disabled={past} onClick={() => onToggle(k)} title={b ? 'Blocked. Click to unblock' : 'Click to block'}
              className={cn('relative aspect-square rounded-lg text-[13px] border transition-all duration-300 num', past ? 'text-muted/40 border-transparent cursor-default' : 'border-line hover:border-champagne', b && 'border-fg/30 text-muted', isToday && 'ring-2 ring-champagne')}>
              {b && <span className="absolute inset-0 rounded-lg stripe-block anim-fade-in" />}<span className="relative">{d}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Preview({ cfg, pick, setPick, calc }: { cfg: Cfg; pick: Pick; setPick: (p: Pick) => void; calc: ReturnType<typeof useCalc> }) {
  const fabs = cfg.fabrics.filter((f) => f.on);
  const errs = cfg.meas.map((m) => { const x = pick.m[m.id]; return !x ? `${m.name} is required` : x < m.min || x > m.max ? `Between ${m.min} and ${m.max} ${m.unit}` : ''; });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
      <Card>
        <CardHeader title="Customer view" sub="This is how the builder looks on a product page" />
        <Label className="mb-3">Fabric</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fabs.map((f) => <Swatch key={f.id} f={f} active={pick.fab === f.id} onClick={() => setPick({ ...pick, fab: f.id })}><div className="px-3 py-2"><div className="text-[13.5px] font-medium">{f.name}</div><div className="text-[12px] text-muted">{f.extra ? `+ ${rs(f.extra)}` : 'Included'}</div></div></Swatch>)}
        </div>
        {fabs.length === 0 && <EmptyState title="No fabrics switched on" />}
        {cfg.groups.map((g) => (
          <div key={g.id} className="mt-6">
            <Label className="mb-2.5">{g.name}{g.required && <span className="text-champagne"> *</span>}</Label>
            <div className="flex flex-wrap gap-2">
              {g.values.map((x) => { const on = pick.opts[g.id] === x.id; return <button key={x.id + String(on)} onClick={() => setPick({ ...pick, opts: { ...pick.opts, [g.id]: x.id } })} className={cn('h-9 px-4 rounded-full border text-[13.5px] transition-all duration-200', on ? 'bg-ink text-inkfg border-ink anim-pop' : 'border-line hover:border-champagne')}>{x.label}{x.extra > 0 && <span className="opacity-60 ml-1.5 text-[12px]">+{rs(x.extra)}</span>}</button>; })}
            </div>
          </div>
        ))}
        <div className="tape my-6" />
        <Label className="mb-3">Your measurements</Label>
        <div className="grid grid-cols-2 gap-4">
          {cfg.meas.map((m, i) => <Field key={m.id} label={`${m.name} (${m.unit})`} value={pick.m[m.id] ?? ''} onChange={(x) => setPick({ ...pick, m: { ...pick.m, [m.id]: num(x) } })} error={errs[i] || undefined} hint={!errs[i] ? m.help : undefined} />)}
        </div>
      </Card>
      <Card className="lg:sticky lg:top-4">
        <div className="flex items-center justify-between"><div className="font-title text-[26px]">Your garment</div><Pill tone="neutral" icon={Scissors}>Made to order</Pill></div>
        <div className="flex items-center justify-between mt-4"><span className="text-[14px]">Quantity</span>
          <div className="flex items-center gap-3"><button aria-label="Fewer" onClick={() => setPick({ ...pick, qty: Math.max(1, pick.qty - 1) })} className="size-8 rounded-full border border-line hover:border-champagne flex items-center justify-center"><Minus size={14} /></button><span className="w-5 text-center num">{pick.qty}</span><button aria-label="More" onClick={() => setPick({ ...pick, qty: Math.min(10, pick.qty + 1) })} className="size-8 rounded-full border border-line hover:border-champagne flex items-center justify-center"><Plus size={14} /></button></div>
        </div>
        <div className="flex items-center justify-between mt-4 rounded-xl bg-soft px-4 py-3"><span className="flex items-center gap-2 text-[14px]"><Zap size={15} strokeWidth={1.5} />Rush order<span className="text-muted text-[12px]">+ {rs(cfg.rush)}</span></span><Switch checked={pick.rush} onChange={(b) => setPick({ ...pick, rush: b })} label="Rush" /></div>
        <div className="tape my-4" />
        <div className="flex items-end justify-between"><Label>Price</Label><div className="text-[32px] font-semibold leading-none"><CountUp value={calc.total} format={rs} /></div></div>
        {calc.disc > 0 && <div className="text-[12px] text-sage text-right mt-1">5% multi-item discount applied</div>}
        <div key={calc.date} className="mt-4 flex items-center gap-2 text-[14px] anim-fade-up"><CalendarDays size={16} strokeWidth={1.5} className="text-champagne" />Customers will get this by {calc.date}</div>
        <Button className="w-full mt-5" size="lg" disabled={errs.some(Boolean)}>Add to bag</Button>
        {errs.some(Boolean) && <div className="text-bad text-[12px] mt-2 text-center">Check your measurements first</div>}
      </Card>
    </div>
  );
}

