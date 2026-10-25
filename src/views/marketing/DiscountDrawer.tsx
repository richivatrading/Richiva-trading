"use client";
import { useEffect, useState } from 'react';
import { Shuffle, Zap } from 'lucide-react';
import { Button, Drawer, Field, Label, Segmented, Switch } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { rs } from '../../lib/format';
import { discountsStore, type Discount } from './data';

const pad = (n: number) => String(n).padStart(2, '0');
function Countdown({ hours }: { hours: number }) {
  const [left, setLeft] = useState(hours * 3600);
  useEffect(() => { setLeft(hours * 3600); const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, [hours]);
  const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  return (
    <div className="flex gap-2">{[['Hours', h], ['Minutes', m], ['Seconds', s]].map(([l, v]) => (
      <div key={l as string} className="w-16 rounded-xl bg-ink text-inkfg text-center py-2"><div className="text-[22px] font-semibold num">{pad(v as number)}</div><div className="text-[10px] opacity-60 uppercase tracking-wider">{l}</div></div>
    ))}</div>
  );
}

const rnd = () => Math.random().toString(36).slice(2, 6).toUpperCase();
export default function DiscountDrawer({ open, onClose, editing, flashProducts, onSaved }: { open: boolean; onClose: () => void; editing: Discount | null; flashProducts?: number; onSaved: (d: Discount) => void }) {
  const blank = { code: '', type: 'Percent' as Discount['type'], value: '10', minCart: '5000', limit: '0', start: '2026-10-20', end: '2026-10-31', bulk: false, flash: !!flashProducts, hours: '2' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) return; setErr({});
    setF(editing ? { ...blank, code: editing.code, type: editing.type, value: String(editing.value), minCart: String(editing.minCart), limit: String(editing.limit), flash: false } : { ...blank, code: flashProducts ? 'FLASH' + rnd().slice(0, 2) : '', value: flashProducts ? '20' : '10' });
  }, [open, editing]); // eslint-disable-line
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const cart = +f.minCart > 0 ? +f.minCart : 5000;
  const saves = f.type === 'Percent' ? Math.round((cart * +f.value) / 100) : +f.value;
  const sentence = f.type === 'Free shipping' ? `Customer gets free delivery on a ${rs(cart)} cart` : `Customer saves ${rs(saves || 0)} on a ${rs(cart)} cart`;
  const save = () => {
    const e: Record<string, string> = {};
    const code = f.code.trim().toUpperCase();
    if (code.length < 4) e.code = 'Use at least 4 letters or numbers.';
    else if (!/^[A-Z0-9]+$/.test(code)) e.code = 'Only letters and numbers, no spaces.';
    else if (discountsStore.get().some((d) => d.code === code && d.id !== editing?.id)) e.code = 'This code already exists.';
    if (f.type !== 'Free shipping') { if (!(+f.value > 0)) e.value = 'Enter a value above zero.'; else if (f.type === 'Percent' && +f.value > 90) e.value = 'Percent can be 90 at most.'; }
    if (f.end < f.start) e.end = 'End date must be after the start date.';
    setErr(e); if (Object.keys(e).length) return;
    const d: Discount = { id: editing?.id ?? `d${Date.now()}`, code, type: f.type, value: f.type === 'Free shipping' ? 0 : +f.value, minCart: +f.minCart || 0, limit: +f.limit || 0, start: new Date(f.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), end: new Date(f.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), used: editing?.used ?? 0, active: true };
    discountsStore.set((a) => (editing ? a.map((x) => (x.id === d.id ? d : x)) : [d, ...a]));
    onSaved(d); onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title={editing ? `Edit ${editing.code}` : 'Create code'} subtitle={flashProducts ? `Flash sale for ${flashProducts} selected products` : undefined} width={520}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{editing ? 'Save code' : 'Create code'}</Button></>}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-soft border border-line p-5 text-center"><Star size={14} twinkle className="mb-1" /><div className="font-title text-[22px] leading-snug" key={sentence}>{sentence}</div></div>
        <Field label="Code" value={f.code} onChange={(v) => set({ code: v.toUpperCase() })} error={err.code} right={<Button size="sm" variant="ghost" icon={Shuffle} onClick={() => set({ code: 'RCV' + rnd() })}>Generate</Button>} />
        <div><Label className="mb-2">Type</Label><Segmented value={f.type} onChange={(v) => set({ type: v })} options={[{ value: 'Percent', label: 'Percent' }, { value: 'Fixed', label: 'Fixed amount' }, { value: 'Free shipping', label: 'Free shipping' }]} /></div>
        {f.type !== 'Free shipping' && <Field label={f.type === 'Percent' ? 'Percent off' : 'Amount off (Rs)'} type="number" value={f.value} onChange={(v) => set({ value: v })} error={err.value} />}
        <div className="grid grid-cols-2 gap-4"><Field label="Minimum cart (Rs)" type="number" value={f.minCart} onChange={(v) => set({ minCart: v })} /><Field label="Usage limit (0 is unlimited)" type="number" value={f.limit} onChange={(v) => set({ limit: v })} /></div>
        <div className="grid grid-cols-2 gap-4"><Field label="Starts" type="date" value={f.start} onChange={(v) => set({ start: v })} /><Field label="Ends" type="date" value={f.end} onChange={(v) => set({ end: v })} error={err.end} /></div>
        <div className="flex items-center justify-between rounded-xl border border-line p-4">
          <div><div className="font-medium">Generate 100 unique codes</div><div className="text-muted text-[13px]">One-time codes for gifting or partners</div></div>
          <Switch label="Generate 100 unique codes" checked={f.bulk} onChange={(v) => set({ bulk: v })} />
        </div>
        {f.bulk && <div className="anim-fade-up text-[13px] text-muted">Examples: {[1, 2, 3].map((i) => <code key={i} className="mx-1 px-2 py-0.5 rounded bg-stone text-fg">{(f.code || 'RCV') + '-' + rnd() + i}</code>)} and 97 more</div>}
        <div className="flex items-center justify-between rounded-xl border border-line p-4">
          <div className="flex items-center gap-3"><Zap size={18} strokeWidth={1.5} className="text-champagne" /><div><div className="font-medium">Flash sale</div><div className="text-muted text-[13px]">Show a countdown on the product page</div></div></div>
          <Switch label="Flash sale" checked={f.flash} onChange={(v) => set({ flash: v })} />
        </div>
        {f.flash && <div className="anim-fade-up rounded-2xl bg-soft border border-line p-5 space-y-4"><Field label="Sale lasts (hours)" type="number" value={f.hours} onChange={(v) => set({ hours: v })} /><div className="label-caps">Countdown preview</div><Countdown hours={Math.max(0, +f.hours || 0)} /></div>}
      </div>
    </Drawer>
  );
}

