import { useEffect, useState } from 'react';
import { Gift, MapPin, Plus, Sparkles, Timer } from 'lucide-react';
import { Button, CountUp, DataTable, EmptyState, KV, Label, Pill, Progress, StatusPill, Timeline, Ring } from '../../ui/kit';
import { Star as StarMark } from '../../ui/brand';
import { rs } from '../../lib/format';
import { PRODUCTS, type Customer, type Order } from '../../data/seed';
import { TierBadge, redact } from './shared';

export interface Ctx {
  c: Customer; name: string; isDeleted: boolean; myOrders: Order[]; openOrder: (id: string) => void; ledger: { title: string; amount: number; time: string }[];
  adjustPoints: () => void; issueCredit: () => void; tryUsed: number; resetTry: () => void; notes: { text: string; time: string }[]; addNote: () => void;
  activity: { title: string; meta: string }[]; patch: (p: Partial<Customer>) => void; setTab: (t: string) => void; msg: () => void;
}
const first = (o: Order) => PRODUCTS.find((p) => p.id === o.items[0].productId)?.name ?? 'Item';
const NEXT: Record<string, [string, number] | null> = { Bronze: ['Silver', 35000], Silver: ['Gold', 90000], Gold: null };

function OrdersTable({ ctx, limit }: { ctx: Ctx; limit?: number }) {
  const rows = limit ? ctx.myOrders.slice(0, limit) : ctx.myOrders;
  return (
    <DataTable<Order> rows={rows} rowId={(o) => o.id} onRowClick={(o) => ctx.openOrder(o.id)} dense empty={<EmptyState title="No orders yet" body="Orders from this customer will show up here." />}
      columns={[
        { key: 'id', header: 'Order', render: (o) => <span className="num font-medium">{o.id}</span> },
        { key: 'item', header: 'Items', hideBelow: 'lg', render: (o) => <span className="text-muted">{first(o)}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</span> },
        { key: 'date', header: 'Date', render: (o) => <span className="text-muted">{o.date.split(',')[0]}</span> },
        { key: 'status', header: 'Status', render: (o) => <StatusPill status={o.status} /> },
        { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="num font-medium">{rs(o.total)}</span> },
      ]} />
  );
}

function Loyalty({ ctx }: { ctx: Ctx }) {
  const { c } = ctx; const nx = NEXT[c.tier]; const target = nx ? Math.min(100, (c.spent / nx[1]) * 100) : 100;
  const [w, setW] = useState(0); useEffect(() => { const t = setTimeout(() => setW(target), 80); return () => clearTimeout(t); }, [target]);
  const base = ctx.myOrders.slice(0, 5).map((o, i) => ({ title: `Order ${o.id}`, amount: Math.round(o.total / 100), time: o.date.split(',')[0] }));
  const rows = [...ctx.ledger, ...base, { title: 'Welcome bonus', amount: 200, time: 'Joined' }];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8">
      <div>
        <div className="flex items-center gap-3 mb-1"><TierBadge tier={c.tier} /><span className="text-[14px] text-muted">{nx ? `${rs(nx[1] - c.spent > 0 ? nx[1] - c.spent : 0)} to ${nx[0]}` : 'Top tier reached'}</span></div>
        <div className="text-[34px] font-semibold mt-3"><CountUp value={c.points} /> <span className="text-[14px] text-muted font-normal">points</span></div>
        <div className="mt-4"><div className="h-2 rounded-full bg-stone overflow-hidden"><div className="h-full rounded-full bg-champagne" style={{ width: `${w}%`, transition: 'width 1200ms var(--ease)' }} /></div>
          <div className="flex justify-between text-[11px] text-muted mt-1.5"><span>{c.tier}</span><span>{nx ? nx[0] : 'Gold'}</span></div></div>
        <div className="flex gap-2 mt-6 flex-wrap"><Button icon={Sparkles} onClick={ctx.adjustPoints}>Adjust points</Button><Button variant="secondary" icon={Gift} onClick={ctx.issueCredit}>Issue credit</Button></div>
        <div className="text-[13px] text-muted mt-3">Store credit balance: <b className="text-fg font-medium num">{rs(c.credit)}</b></div>
      </div>
      <div><Label className="mb-3">Points ledger</Label>
        <div>{rows.map((r, i) => <div key={i} className="flex items-center justify-between py-2.5 border-b border-line last:border-0 anim-slide-in" style={{ animationDelay: `${i * 40}ms` }}><div><div className="text-[14px]">{r.title}</div><div className="text-[12px] text-muted">{r.time}</div></div><span className={`num font-medium ${r.amount < 0 ? 'text-bad' : 'text-ok'}`}>{r.amount > 0 ? '+' : ''}{r.amount}</span></div>)}</div>
      </div>
    </div>
  );
}

export function TabBody({ tab, ctx }: { tab: string; ctx: Ctx }) {
  const { c, isDeleted } = ctx; const pv = (s: string) => (isDeleted ? redact(s) : s);
  if (tab === 'Overview') return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div><Label className="mb-2">Contact</Label>
        <KV k="Phone"><span className="num">{pv(c.phone)}</span></KV><KV k="Email">{pv(c.email)}</KV><KV k="City">{isDeleted ? '•••••' : c.city}</KV><KV k="Last order">{c.last}</KV><KV k="Tier"><TierBadge tier={c.tier} /></KV>
        <div className="mt-5 flex gap-2"><Button variant="secondary" size="sm" disabled={isDeleted} onClick={ctx.msg}>Send message</Button><Button variant="secondary" size="sm" onClick={() => ctx.setTab('Orders')}>See all orders</Button></div></div>
      <div><Label className="mb-3">Recent orders</Label><OrdersTable ctx={ctx} limit={3} /></div>
    </div>
  );
  if (tab === 'Orders') return <OrdersTable ctx={ctx} />;
  if (tab === 'Addresses') {
    const list = [...new Map(ctx.myOrders.map((o) => [o.address, o])).values()].slice(0, 3);
    return list.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{list.map((o, i) => <div key={o.address} className="rounded-xl border border-line p-4 flex gap-3"><MapPin size={18} strokeWidth={1.5} className="text-muted mt-0.5" /><div><div className="flex items-center gap-2 mb-1"><b className="font-medium">{i === 0 ? 'Home' : `Address ${i + 1}`}</b>{i === 0 && <Pill tone="champagne">Default</Pill>}</div><div className="text-[14px] text-muted">{pv(o.address)}</div><div className="text-[13px] text-muted num mt-1">{pv(o.phone)}</div></div></div>)}</div> : <EmptyState icon={MapPin} title="No saved addresses" body="Addresses appear after the first delivery." />;
  }
  if (tab === 'Loyalty') return <Loyalty ctx={ctx} />;
  if (tab === 'Try-on') return (
    <div className="flex flex-wrap items-center gap-10">
      <Ring value={(ctx.tryUsed / 3) * 100} size={120} stroke={8}><span className="text-[20px] font-semibold num">{ctx.tryUsed}/3</span></Ring>
      <div><Label>Today</Label><div className="text-[22px] mt-1 font-medium">{ctx.tryUsed} of 3 min used</div><div className="text-[13px] text-muted mt-1">{3 - ctx.tryUsed} min left. Resets at midnight Nepal time.</div>
        <Button className="mt-4" variant="secondary" icon={Timer} onClick={ctx.resetTry}>Reset today&apos;s time</Button></div>
      <div className="w-full"><Label className="mb-2">Recent sessions</Label>{[['Satin Slip Dress', '1 min', 'Today'], ['Himal Kurta Set', '1 min', 'Today'], ['Pashmina Shawl', '2 min', 'Yesterday']].map(([p, m, d]) => <div key={p + d} className="flex justify-between py-2.5 border-b border-line last:border-0 text-[14px]"><span>{p}</span><span className="text-muted">{m} · {d}</span></div>)}</div>
    </div>
  );
  if (tab === 'Reviews') return c.orders < 2 ? <EmptyState title="No reviews yet" body="This customer has not reviewed anything." /> : (
    <div className="space-y-4">{ctx.myOrders.slice(0, 2).map((o, i) => <div key={o.id} className="rounded-xl border border-line p-4"><div className="flex items-center justify-between"><b className="font-medium">{first(o)}</b><span className="flex gap-0.5">{Array.from({ length: i ? 4 : 5 }).map((_, k) => <StarMark key={k} size={12} />)}</span></div><p className="text-[14px] text-muted mt-1.5">{i ? 'Lovely fabric, the fit is slightly generous.' : 'Beautifully made and arrived quickly to Kathmandu. Will order again.'}</p></div>)}</div>
  );
  if (tab === 'Notes') return (
    <div><Button size="sm" icon={Plus} onClick={ctx.addNote}>Add note</Button>
      <div className="mt-5 space-y-3">{ctx.notes.map((n, i) => <div key={i} className="rounded-xl bg-soft p-4 anim-fade-up"><div className="text-[14px]">{n.text}</div><div className="text-[12px] text-muted mt-1.5">{n.time}</div></div>)}</div></div>
  );
  return <Timeline items={ctx.activity} />;
}
