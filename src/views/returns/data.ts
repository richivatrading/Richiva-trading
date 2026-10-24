import { makeStore } from '../../store';
import { CUSTOMERS, ORDERS, PRODUCTS, customersStore, ordersStore, productsStore, type OrderItem, type Product } from '../../data/seed';

export const STATUSES = ['Requested', 'Approved', 'Pickup scheduled', 'Received', 'Inspected', 'Completed', 'Rejected'] as const;
export type RStatus = (typeof STATUSES)[number];
export type Outcome = 'Refund to original payment' | 'Store credit' | 'Exchange';
export const OUTCOMES: Outcome[] = ['Refund to original payment', 'Store credit', 'Exchange'];
export const REASONS = ['Wrong size', 'Not as pictured', 'Damaged on arrival', 'Changed my mind', 'Colour differs', 'Arrived late'];
export const REJECT_TEMPLATES = [
  'The return window has closed for this order.',
  'This item is marked as non-returnable under our policy.',
  'The photos show signs of wear or washing.',
  'We could not match this request to a delivered order.',
];
export const NON_RETURNABLE_OPTIONS = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Made to order', 'Sale items'];
export interface Ev { title: string; meta: string }
export interface Ret {
  id: string; customer: string; orderId: string; items: OrderItem[]; reason: string; note: string; days: number; status: RStatus; outcome: Outcome;
  refund: number; photos: number[]; timeline: Ev[]; courier?: string; pickupDate?: string; inspection?: 'Restock' | 'Damaged' | 'Discard';
  exchange?: { size: string; color: string; reserved: boolean }; rejectReason?: string; handling: number; value: number;
}
export interface Policy { windowDays: number; autoApprove: boolean; autoLimit: number; nonReturnable: string[] }
export const policyStore = makeStore<Policy>({ windowDays: 30, autoApprove: false, autoLimit: 8000, nonReturnable: ['Made to order'] });

export const productOf = (id: string) => PRODUCTS.find((p) => p.id === id)!;
export const unit = (p: Product) => p.salePrice ?? p.price;
export const baseName = (p: Product) => p.name.split(' · ')[0];
export const itemsValue = (items: OrderItem[]) => items.reduce((a, it) => a + unit(productOf(it.productId)) * it.qty, 0);
export const isReturnable = (r: Ret, pol: Policy) => r.items.every((it) => {
  const p = productOf(it.productId);
  return !pol.nonReturnable.includes(p.category) && !(p.mto && pol.nonReturnable.includes('Made to order')) && !(p.salePrice && pol.nonReturnable.includes('Sale items'));
});
export const inWindow = (r: Ret, pol: Policy) => r.days <= pol.windowDays;
export const customerId = (name: string) => customersStore.get().find((c) => c.name === name)?.id;

const PLAN: [RStatus, number, string][] = [
  ['Requested', 4, 'Wrong size'], ['Approved', 12, 'Not as pictured'], ['Requested', 35, 'Changed my mind'], ['Pickup scheduled', 8, 'Wrong size'],
  ['Received', 19, 'Damaged on arrival'], ['Completed', 41, 'Colour differs'], ['Requested', 6, 'Wrong size'], ['Inspected', 22, 'Not as pictured'],
  ['Approved', 14, 'Arrived late'], ['Completed', 28, 'Wrong size'], ['Requested', 9, 'Colour differs'], ['Rejected', 33, 'Changed my mind'],
  ['Received', 17, 'Damaged on arrival'], ['Pickup scheduled', 25, 'Wrong size'],
];
const NOTES: Record<string, string> = {
  'Wrong size': 'Ordered my usual size but it runs a little small around the waist.', 'Not as pictured': 'The fabric feels thinner than it looked on the site.',
  'Damaged on arrival': 'There is a small tear near the seam. Photos attached.', 'Changed my mind': 'Lovely piece, but it does not suit my plans anymore.',
  'Colour differs': 'The shade is warmer than the photos on the website.', 'Arrived late': 'It arrived after the festival so I no longer need it.',
};
const STEPS: [RStatus, string][] = [['Requested', 'Request received'], ['Approved', 'Request approved'], ['Pickup scheduled', 'Pickup scheduled'], ['Received', 'Parcel received at warehouse'], ['Inspected', 'Inspection finished'], ['Completed', 'Return completed']];
export const SEED: Ret[] = PLAN.map(([status, days, reason], i) => {
  const o = ORDERS[i]; const items = [{ ...o.items[0] }]; const value = itemsValue(items);
  const idx = STEPS.findIndex((s) => s[0] === status); const upto = status === 'Rejected' ? 1 : idx + 1;
  const timeline: Ev[] = STEPS.slice(0, upto).map(([, t], k) => ({ title: t, meta: `${Math.max(1, 17 - i - (upto - k) + 2)} Oct, 1${k}:20` })).reverse();
  if (status === 'Rejected') timeline.unshift({ title: 'Request rejected', meta: '10 Oct, 15:40' });
  const exch = i % 4 === 0 && status !== 'Rejected';
  return {
    id: `RET-${2041 - i}`, customer: o.customer, orderId: o.id, items, reason, note: NOTES[reason], days, status,
    outcome: exch ? 'Exchange' : i % 5 === 1 ? 'Store credit' : 'Refund to original payment', refund: value, value,
    photos: [i + 2, i + 5, i + 9], timeline, handling: 1.2 + ((i * 7) % 13) / 5,
    courier: ['Pickup scheduled', 'Received', 'Inspected', 'Completed'].includes(status) ? 'Pathao' : undefined, pickupDate: ['Pickup scheduled', 'Received', 'Inspected', 'Completed'].includes(status) ? '12 Oct 2026' : undefined,
    inspection: ['Inspected', 'Completed'].includes(status) ? 'Restock' : undefined,
    exchange: exch ? { size: items[0].size === 'M' ? 'L' : 'M', color: items[0].color, reserved: ['Pickup scheduled', 'Received', 'Inspected', 'Completed'].includes(status) } : undefined,
    rejectReason: status === 'Rejected' ? REJECT_TEMPLATES[0] : undefined,
  };
});
export const returnsStore = makeStore<Ret[]>(SEED);

export const patchReturn = (id: string, fn: (r: Ret) => Partial<Ret>, ev?: string) =>
  returnsStore.set((rs) => rs.map((r) => (r.id === id ? { ...r, ...fn(r), timeline: ev ? [{ title: ev, meta: 'Just now · You' }, ...r.timeline] : r.timeline } : r)));

export const stockOf = (p: Product, size: string, color: string) => {
  const sib = productsStore.get().find((x) => baseName(x) === baseName(p) && x.variants.some((v) => v.size === size && v.color === color));
  const v = sib?.variants.find((x) => x.size === size && x.color === color);
  return { product: sib, stock: v?.stock ?? 0 };
};
export const adjustStock = (productId: string, size: string, color: string, delta: number) =>
  productsStore.set((ps) => ps.map((p) => p.id !== productId ? p : { ...p, stock: p.stock + delta, variants: p.variants.map((v) => v.size === size && v.color === color ? { ...v, stock: Math.max(0, v.stock + delta) } : v) }));

export function finishReturn(r: Ret, toast: (t: string, o?: { body?: string; star?: boolean }) => void) {
  if (r.status === 'Completed') return;
  let body = '';
  if (r.outcome === 'Exchange' && r.exchange) {
    const it = r.items[0]; const oid = `RCV-${10500 + Math.floor(Math.random() * 400)}`; const src = ORDERS.find((o) => o.id === r.orderId)!;
    ordersStore.set((os) => [{ ...src, id: oid, date: '18 Oct 2026, 10:00', items: [{ ...it, size: r.exchange!.size, color: r.exchange!.color }], total: 0, status: 'Processing', pay: 'COD', codVerified: true, tracking: undefined, courier: 'Pathao' }, ...os]);
    body = `Exchange order ${oid} created`;
  } else if (r.outcome === 'Store credit') {
    const c = CUSTOMERS.find((x) => x.name === r.customer);
    if (c) customersStore.set((cs) => cs.map((x) => (x.id === c.id ? { ...x, credit: x.credit + r.refund } : x)));
    body = `Rs ${r.refund.toLocaleString('en-IN')} added as store credit`;
  } else body = `Refund of Rs ${r.refund.toLocaleString('en-IN')} sent to original payment`;
  patchReturn(r.id, () => ({ status: 'Completed' }), body);
  toast('Return completed', { body, star: true });
}
