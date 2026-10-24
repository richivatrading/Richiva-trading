import { makeStore } from '../../store';
import { ordersStore, productsStore, PRODUCTS, TEAM, type Order, type OrderStatus } from '../../data/seed';

export const COURIER_INFO = [
  { name: 'Pathao', price: 150, days: 2 },
  { name: 'Nepal Can Move', price: 120, days: 3 },
];
export const STATUSES: OrderStatus[] = ['To confirm', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
export const PAY_METHODS = ['ConnectIPS', 'NPX', 'COD'];
export const CHANNELS = ['Website', 'Mobile app', 'Phone'];

export interface Ev { title: string; by: string; at: string }
export interface Note { by: string; at: string; text: string }
export type PayStatus = 'Paid' | 'Pending' | 'Refunded' | 'Partially refunded' | 'Approval requested';
export const eventsStore = makeStore<Record<string, Ev[]>>({});
export const notesStore = makeStore<Record<string, Note[]>>({});
export const payStore = makeStore<Record<string, { status: PayStatus; refunded: number }>>({});
export const flashStore = makeStore<string[]>([]);

export const NEXT: Partial<Record<OrderStatus, { label: string; action: 'confirm' | 'pack' | 'ship' | 'deliver' }>> = {
  'To confirm': { label: 'Confirm order', action: 'confirm' },
  Processing: { label: 'Pack order', action: 'pack' },
  Packed: { label: 'Ship order', action: 'ship' },
  Shipped: { label: 'Mark delivered', action: 'deliver' },
};
export const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  'To confirm': ['Processing', 'Cancelled'],
  Processing: ['Packed', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Returned'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: [],
};

export const productOf = (id: string) => PRODUCTS.find((p) => p.id === id)!;
export const unitPrice = (id: string) => { const p = productOf(id); return p.salePrice ?? p.price; };
export const nowStamp = () => { const d = new Date(); return `${d.getDate()} Oct 2026, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
export const nowShort = () => 'Just now';

const addMin = (date: string, m: number) => {
  const mt = date.match(/^(.*), (\d+):(\d+)$/); if (!mt) return date;
  const t = +mt[2] * 60 + +mt[3] + m; return `${mt[1]}, ${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
export const txnOf = (o: Order) => o.pay === 'COD' ? (o.status === 'Delivered' ? `COD-${hash(o.id)}` : '—') : `${o.pay === 'NPX' ? 'NPX' : 'CIPS'}${900000 + hash(o.id) * 7}`;

export function basePayStatus(o: Order): PayStatus {
  if (o.pay === 'COD') return o.status === 'Delivered' ? 'Paid' : 'Pending';
  return o.status === 'Returned' ? 'Refunded' : 'Paid';
}
export const payStatusOf = (o: Order, m: Record<string, { status: PayStatus; refunded: number }>) => m[o.id]?.status ?? basePayStatus(o);

export function baseEvents(o: Order): Ev[] {
  const ops = TEAM.filter((t) => ['Manager', 'Warehouse', 'Support'].includes(t.role));
  const who = (i: number) => ops[(hash(o.id) + i) % ops.length].name;
  const ev: Ev[] = [{ title: `Order placed on ${o.channel === 'Phone' ? 'phone' : o.channel.toLowerCase()}`, by: o.channel === 'Phone' ? who(0) : o.customer, at: o.date }];
  if (o.pay !== 'COD') ev.push({ title: `Payment received via ${o.pay}`, by: 'System', at: addMin(o.date, 1) });
  const order: OrderStatus[] = ['To confirm', 'Processing', 'Packed', 'Shipped', 'Delivered'];
  const idx = o.status === 'Cancelled' ? 0 : o.status === 'Returned' ? 4 : order.indexOf(o.status);
  if (idx >= 1) ev.push({ title: o.pay === 'COD' ? 'Confirmed after phone call' : 'Order confirmed', by: who(1), at: addMin(o.date, 35) });
  if (idx >= 2) ev.push({ title: 'Packed and ready for pickup', by: TEAM[4].name, at: addMin(o.date, 190) });
  if (idx >= 3) ev.push({ title: `Handed to ${o.courier}`, by: TEAM[4].name, at: addMin(o.date, 300) });
  if (idx >= 4) ev.push({ title: 'Delivered to customer', by: o.courier, at: addMin(o.date, 1700) });
  if (o.status === 'Cancelled') ev.push({ title: 'Order cancelled', by: who(2), at: addMin(o.date, 80) });
  if (o.status === 'Returned') ev.push({ title: 'Return received at warehouse', by: TEAM[4].name, at: addMin(o.date, 4300) });
  return ev.reverse();
}
export const eventsFor = (o: Order, m: Record<string, Ev[]>) => [...(m[o.id] ?? []), ...baseEvents(o)];

export function addEvent(id: string, title: string, by: string) {
  eventsStore.set((m) => ({ ...m, [id]: [{ title, by, at: nowStamp() }, ...(m[id] ?? [])] }));
}
export function flash(ids: string[]) {
  flashStore.set(ids); setTimeout(() => flashStore.set([]), 1600);
}
export function patchOrder(id: string, patch: Partial<Order>) {
  ordersStore.set((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o)));
}
export function setStatus(o: Order, status: OrderStatus, title: string, by: string, patch: Partial<Order> = {}) {
  patchOrder(o.id, { status, ...patch }); addEvent(o.id, title, by); flash([o.id]);
}
export function restock(o: Order) {
  productsStore.set((ps) => ps.map((p) => {
    const its = o.items.filter((i) => i.productId === p.id); if (!its.length) return p;
    const variants = p.variants.map((v, vi) => { const q = its.filter((i) => i.size === v.size || (vi === 0 && !p.variants.some((x) => x.size === i.size))).reduce((a, i) => a + i.qty, 0); return { ...v, stock: v.stock + q }; });
    return { ...p, variants, stock: variants.reduce((a, v) => a + v.stock, 0) };
  }));
}
export const waybill = () => `WB${Math.floor(100000 + Math.random() * 899999)}NP`;
export const itemsCount = (o: Order) => o.items.reduce((a, i) => a + i.qty, 0);
export const subtotalOf = (o: Order) => o.items.reduce((a, i) => a + unitPrice(i.productId) * i.qty, 0);
export function totalsOf(o: Order) {
  const sub = subtotalOf(o); const shipping = o.total > sub ? o.total - sub : 0; const discount = o.total < sub ? sub - o.total : 0;
  const vat = Math.round(o.total - o.total / 1.13);
  return { sub, shipping, discount, vat, total: o.total };
}
export const dateNum = (o: Order) => { const m = o.date.match(/^(\d+) \w+ \d+, (\d+):(\d+)/); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0; };
export const dayOf = (o: Order) => +o.date.split(' ')[0];
