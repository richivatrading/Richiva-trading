"use client";
import { useMemo, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { useApp } from '../../store';
import { CITIES, customersStore, ordersStore, photo, productsStore, type Order, type OrderItem, type PayMethod } from '../../data/seed';
import { Button, Drawer, Field, Photo, SearchInput, Segmented, Select } from '../../ui/kit';
import { cn, rs } from '../../lib/format';
import { COURIER_INFO, addEvent, flash, nowStamp, productOf, unitPrice } from './shared';

const STEPS = ['Customer', 'Products', 'Address and shipping', 'Payment and review'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function CreateOrderPanel({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { user } = useApp();
  const [custs] = customersStore.use(); const [prods] = productsStore.use();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', city: 'Kathmandu', courier: COURIER_INFO[0].name, pay: 'COD' as PayMethod, note: '' });
  const [items, setItems] = useState<OrderItem[]>([]);
  const [q, setQ] = useState(''); const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setErr((e) => ({ ...e, [k]: '' })); };
  const found = useMemo(() => q.trim().length > 0 && step === 0 ? custs.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)).slice(0, 4) : [], [q, custs, step]);
  const matches = useMemo(() => prods.filter((p) => p.status === 'Published' && (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))).slice(0, 6), [q, prods]);
  const sub = items.reduce((a, i) => a + unitPrice(i.productId) * i.qty, 0);
  const ship = sub > 8000 ? 0 : COURIER_INFO.find((c) => c.name === f.courier)!.price;
  const total = sub + ship;

  const reset = () => { setStep(0); setF({ name: '', phone: '', email: '', address: '', city: 'Kathmandu', courier: COURIER_INFO[0].name, pay: 'COD', note: '' }); setItems([]); setQ(''); setErr({}); };
  const close = () => { onClose(); setTimeout(reset, 400); };
  const add = (id: string) => { const p = productOf(id); setItems((l) => [...l, { productId: id, qty: 1, size: p.variants[0]?.size ?? 'M', color: p.variants[0]?.color ?? 'Ivory' }]); setErr((e) => ({ ...e, items: '' })); };
  const upd = (k: number, patch: Partial<OrderItem>) => setItems((l) => l.map((x, i) => (i === k ? { ...x, ...patch } : x)));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) { if (!f.name.trim()) e.name = 'Enter the customer name.'; if (!/^\+?[\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number, like +977 9801-234567.'; if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'That email does not look right.'; }
    if (s === 1 && !items.length) e.items = 'Add at least one product.';
    if (s === 2 && f.address.trim().length < 5) e.address = 'Enter the delivery address.';
    setErr(e); return !Object.keys(e).length;
  };
  const next = () => { if (validate(step)) { setStep(step + 1); setQ(''); } };
  const create = () => {
    const n = Math.max(...ordersStore.get().map((o) => +o.id.slice(4))) + 1; const id = `RCV-${n}`;
    const o: Order = { id, date: nowStamp(), customer: f.name.trim(), phone: f.phone.trim(), city: f.city, address: `${f.address.trim()}, ${f.city}`, items, total, pay: f.pay, status: 'To confirm', courier: f.courier, risk: 'Low', channel: 'Phone', codVerified: f.pay !== 'COD' };
    ordersStore.set((l) => [o, ...l]);
    addEvent(id, `Phone order created${f.note ? `: ${f.note}` : ''}`, user.name); flash([id]);
    onCreated(id); close();
  };

  return (
    <Drawer open={open} onClose={close} width={560} title="Create order" subtitle="Phone order in four steps"
      footer={<>{step > 0 && <Button variant="secondary" onClick={() => { setStep(step - 1); setQ(''); }}>Back</Button>}{step < 3 ? <Button onClick={next}>Continue</Button> : <Button onClick={create}>Create order</Button>}</>}>
      <div className="flex items-center gap-2 mb-7">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className="h-1 rounded-full bg-stone overflow-hidden"><div className="h-full bg-champagne transition-all duration-500 ease-[var(--ease)]" style={{ width: i <= step ? '100%' : '0%' }} /></div>
            <div className={cn('text-[11.5px] mt-1.5 flex items-center gap-1 transition-colors', i === step ? 'text-fg font-medium' : 'text-muted')}>{i < step && <Check size={11} className="text-sage" />}{s}</div>
          </div>
        ))}
      </div>
      <div key={step} className="anim-fade-up grid gap-4">
        {step === 0 && <>
          <div>
            <SearchInput value={q} onChange={setQ} placeholder="Find an existing customer" />
            {found.length > 0 && <div className="mt-2 border border-line rounded-xl overflow-hidden">{found.map((c) => <button key={c.id} onClick={() => { setF((x) => ({ ...x, name: c.name, phone: c.phone, email: c.email, city: c.city })); setQ(''); }} className="w-full flex justify-between px-3.5 py-2.5 text-left hover:bg-stone text-[13.5px]"><span>{c.name}</span><span className="text-muted num">{c.phone}</span></button>)}</div>}
          </div>
          <Field label="Full name" value={f.name} onChange={set('name')} error={err.name} />
          <Field label="Phone" value={f.phone} onChange={set('phone')} error={err.phone} />
          <Field label="Email (optional)" value={f.email} onChange={set('email')} error={err.email} />
        </>}
        {step === 1 && <>
          <SearchInput value={q} onChange={setQ} placeholder="Search products by name or SKU" />
          <div className="grid gap-1 max-h-56 overflow-y-auto -mx-1 px-1">
            {matches.map((p) => <button key={p.id} onClick={() => add(p.id)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone text-left transition-colors"><Photo src={photo(p.photo, 90, 110)} size={40} /><span className="flex-1 min-w-0"><span className="block truncate text-[13.5px]">{p.name}</span><span className="text-muted text-[12px]">{p.sku} · {p.stock} in stock</span></span><span className="num text-[13px]">{rs(p.salePrice ?? p.price)}</span><Plus size={15} /></button>)}
            {!matches.length && <div className="text-muted text-[13px] py-3">No matching products.</div>}
          </div>
          {err.items && <div className="text-bad text-[12px] anim-shake">{err.items}</div>}
          <div className="grid gap-2 border-t border-line pt-4">
            {items.length === 0 && <div className="text-muted text-[13px]">Nothing added yet.</div>}
            {items.map((it, k) => { const p = productOf(it.productId); return (
              <div key={k} className="flex items-center gap-3 anim-slide-in">
                <Photo src={photo(p.photo, 90, 110)} size={40} />
                <div className="flex-1 min-w-0"><div className="truncate text-[13.5px]">{p.name}</div><select value={it.size} onChange={(e) => upd(k, { size: e.target.value })} className="text-[12px] text-muted bg-transparent outline-none">{SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div className="flex items-center gap-1.5"><button className="size-7 rounded-full border border-line flex items-center justify-center hover:border-champagne" onClick={() => it.qty > 1 ? upd(k, { qty: it.qty - 1 }) : setItems(items.filter((_, i) => i !== k))}><Minus size={12} /></button><span className="w-5 text-center num">{it.qty}</span><button className="size-7 rounded-full border border-line flex items-center justify-center hover:border-champagne" onClick={() => upd(k, { qty: it.qty + 1 })}><Plus size={12} /></button></div>
                <span className="num w-20 text-right text-[13px]">{rs(unitPrice(it.productId) * it.qty)}</span>
                <button onClick={() => setItems(items.filter((_, i) => i !== k))} className="text-muted hover:text-fg" aria-label="Remove"><X size={14} /></button>
              </div>); })}
          </div>
        </>}
        {step === 2 && <>
          <Field label="Delivery address" multiline rows={2} value={f.address} onChange={set('address')} error={err.address} />
          <Select label="City" value={f.city} onChange={set('city')} options={CITIES} />
          <div className="grid gap-2">
            <div className="label-caps">Courier</div>
            {COURIER_INFO.map((c) => (
              <button key={c.name} onClick={() => set('courier')(c.name)} className={cn('flex items-center justify-between rounded-xl border p-3.5 text-left transition-all', f.courier === c.name ? 'border-champagne bg-soft' : 'border-line hover:border-fg/30')}>
                <span><span className="block font-medium">{c.name}</span><span className="text-muted text-[12.5px]">{c.days} days</span></span><span className="num">{sub > 8000 ? 'Free' : rs(c.price)}</span>
              </button>
            ))}
          </div>
        </>}
        {step === 3 && <>
          <Segmented value={f.pay} onChange={(v) => setF({ ...f, pay: v })} options={[{ value: 'COD', label: 'Cash on delivery' }, { value: 'ConnectIPS', label: 'ConnectIPS' }, { value: 'NPX', label: 'NPX' }]} />
          <Field label="Order note (optional)" value={f.note} onChange={set('note')} />
          <div className="rounded-xl bg-soft border border-line p-4 text-[13.5px] grid gap-1.5">
            <div className="font-medium">{f.name}</div><div className="text-muted">{f.phone} · {f.address}, {f.city}</div>
            <div className="border-t border-line my-2" />
            {items.map((i, k) => <div key={k} className="flex justify-between"><span>{productOf(i.productId).name} · {i.size} x {i.qty}</span><span className="num">{rs(unitPrice(i.productId) * i.qty)}</span></div>)}
            <div className="flex justify-between text-muted"><span>Shipping ({f.courier})</span><span className="num">{ship ? rs(ship) : 'Free'}</span></div>
            <div className="flex justify-between font-semibold text-[15px] pt-1"><span>Total</span><span className="num">{rs(total)}</span></div>
          </div>
        </>}
      </div>
    </Drawer>
  );
}

