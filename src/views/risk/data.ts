import { CUSTOMERS, ordersStore } from '../../data/seed';
import { makeStore } from '../../store';
import { rs } from '../../lib/format';

export type Level = 'Low' | 'Medium' | 'High';
export interface QItem { id: string; customer: string; phone: string; city: string; address: string; amount: number; first: boolean; ageHours: number; extra: boolean; flagged: boolean }
export interface Factor { label: string; pts: number; why: string }
export interface LogEvent { title: string; meta: string }

export interface Rule { id: string; text: string; on: boolean; cust: string; amt: number; where: string; cod: boolean; action: string }
export const rulesStore = makeStore<Rule[]>([
  { id: 'r1', text: 'First-time customer and COD over Rs 5,000 needs a confirmation call', on: true, cust: 'first', amt: 5000, where: 'any', cod: true, action: 'needs a confirmation call' },
  { id: 'r2', text: 'COD over Rs 15,000 needs a confirmation call', on: true, cust: 'any', amt: 15000, where: 'any', cod: true, action: 'needs a confirmation call' },
  { id: 'r3', text: 'COD and delivery outside the Valley is held for review', on: false, cust: 'any', amt: 0, where: 'outside', cod: true, action: 'is held for review' },
]);

export interface Block { id: string; type: 'Phones' | 'Addresses' | 'Emails'; value: string; reason: string; added: string }
export const blockStore = makeStore<Block[]>([
  { id: 'b1', type: 'Phones', value: '+977 9803-114520', reason: 'Refused three COD parcels', added: '12 Oct' },
  { id: 'b2', type: 'Phones', value: '+977 9841-902277', reason: 'Fake address given twice', added: '3 Oct' },
  { id: 'b3', type: 'Addresses', value: 'Plot 9, Sinamangal, Kathmandu', reason: 'Repeated failed deliveries', added: '28 Sep' },
  { id: 'b4', type: 'Emails', value: 'orders.fast77@mailinator.com', reason: 'Disposable email, chargebacks', added: '20 Sep' },
]);

export const riskLog = makeStore<{ events: Record<string, LogEvent[]>; attempts: Record<string, number>; done: Record<string, string>; stats: { confirmed: number; refused: number; unreachable: number; saved: number } }>({
  events: {}, attempts: {}, done: {}, stats: { confirmed: 142, refused: 11, unreachable: 9, saved: 186400 },
});

const EXTRAS: QItem[] = [
  { id: 'RCV-10497', customer: 'Binita Ghimire', phone: '+977 9812-448201', city: 'Kathmandu', address: 'Near the temple, Sinamangal', amount: 14800, first: true, ageHours: 52, extra: true, flagged: false },
  { id: 'RCV-10498', customer: 'Mamata Subedi', phone: '+977 9867-330914', city: 'Butwal', address: 'House 14, Traffic Chowk, Butwal', amount: 6900, first: true, ageHours: 30, extra: true, flagged: false },
  { id: 'RCV-10499', customer: 'Asmita Neupane', phone: '+977 9851-207733', city: 'Lalitpur', address: 'House 31, Jawalakhel, Lalitpur', amount: 3200, first: false, ageHours: 9, extra: true, flagged: false },
  { id: 'RCV-10500', customer: 'Laxmi Khadka', phone: '+977 9823-651190', city: 'Dharan', address: 'Ward 4, Dharan', amount: 9400, first: false, ageHours: 21, extra: true, flagged: true },
  { id: 'RCV-10501', customer: 'Trishna Dahal', phone: '+977 9845-118872', city: 'Pokhara', address: 'House 7, Lakeside, Pokhara', amount: 4100, first: true, ageHours: 5, extra: true, flagged: false },
];

const INITIAL_REAL = ordersStore.get().filter((o) => o.pay === 'COD' && o.status === 'To confirm').length;
export const buildQueue = (): QItem[] => {
  const done = riskLog.get().done;
  const real: QItem[] = ordersStore.get().filter((o) => o.pay === 'COD' && o.status === 'To confirm').map((o) => {
    const m = o.date.match(/^(\d+) .*?, (\d+):(\d+)/); const day = m ? +m[1] : 18, hh = m ? +m[2] : 12;
    const c = CUSTOMERS.find((x) => x.name === o.customer);
    return { id: o.id, customer: o.customer, phone: o.phone, city: o.city, address: o.address, amount: o.total, first: c ? c.orders <= 1 : true, ageHours: (18 - day) * 24 + (22 - hh), extra: false, flagged: o.risk === 'High' };
  });
  const need = Math.max(0, 5 - INITIAL_REAL);
  return [...real, ...EXTRAS.slice(0, need)].filter((q) => !done[q.id]).sort((a, b) => b.ageHours - a.ageHours);
};

const VALLEY = ['Kathmandu', 'Lalitpur', 'Bhaktapur'];
export const matches = (r: Rule, q: QItem) =>
  (r.cust === 'any' || (r.cust === 'first') === q.first) && (!r.amt || q.amount > r.amt) && (r.where === 'any' || (r.where === 'outside' ? !VALLEY.includes(q.city) : false));

export function scoreOf(q: QItem, rules: Rule[], attempts: number, blocked: boolean) {
  const f: Factor[] = [{ label: 'Cash on delivery', pts: 15, why: 'Cash is collected at the door, so every COD order starts with a small base score.' }];
  if (q.first) f.push({ label: 'First order', pts: 25, why: 'We have no history with this customer yet, so we cannot tell how they usually behave.' });
  if (q.amount > 8000) f.push({ label: 'High amount', pts: 20, why: `${rs(q.amount)} is above Rs 8,000. Larger parcels hurt more when they come back.` });
  if (/near|opposite|behind/i.test(q.address) || q.address.split(',').length < 3) f.push({ label: 'Address looks incomplete', pts: 20, why: 'The address has no house number or clear landmark, which makes delivery harder.' });
  if (q.flagged) f.push({ label: 'Area with failed deliveries', pts: 18, why: 'Couriers had trouble delivering in this area recently.' });
  if (!VALLEY.includes(q.city)) f.push({ label: 'Outside the Valley', pts: 8, why: 'Longer journeys give more time for a customer to change their mind.' });
  const hit = rules.filter((r) => r.on && matches(r, q));
  if (hit.length) f.push({ label: 'Matches your rule', pts: 10, why: `This order matches: "${hit[0].text}".` });
  if (attempts) f.push({ label: `${attempts} unanswered ${attempts === 1 ? 'call' : 'calls'}`, pts: 12 * attempts, why: 'We called and nobody picked up. That makes a refused parcel more likely.' });
  if (blocked) f.push({ label: 'Phone is on the blocklist', pts: 50, why: 'This number was blocked earlier, for example after refused parcels.' });
  const score = Math.min(99, f.reduce((a, x) => a + x.pts, 0));
  const level: Level = score < 40 ? 'Low' : score < 65 ? 'Medium' : 'High';
  return { score, level, factors: f };
}
