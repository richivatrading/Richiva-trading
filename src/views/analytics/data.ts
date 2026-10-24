import { PRODUCTS, ORDERS, orderSub } from '../../data/seed';

export type Range = '7d' | '30d' | '90d' | '12m';
export const RANGES: { value: Range; label: string }[] = [{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: '12m', label: 'Last 12 months' }];
export const CATS = ['Dresses', 'Tops', 'Bottoms', 'Outerwear'];
export const CHANNELS = ['Direct', 'Instagram', 'Facebook', 'Google', 'Email', 'WhatsApp'];
const CAT_SHARE: Record<string, number> = { All: 1, Dresses: 0.34, Tops: 0.27, Bottoms: 0.22, Outerwear: 0.17 };
const CH_SHARE: Record<string, number> = { All: 1, Direct: 0.2, Instagram: 0.28, Facebook: 0.16, Google: 0.17, Email: 0.08, WhatsApp: 0.11 };
const CONV: Record<string, number> = { Direct: 3.4, Instagram: 2.1, Facebook: 1.6, Google: 2.8, Email: 5.2, WhatsApp: 6.1 };
const PROVINCES: [string, number][] = [['Bagmati', 0.52], ['Gandaki', 0.14], ['Koshi', 0.1], ['Lumbini', 0.1], ['Madhesh', 0.07], ['Sudurpashchim', 0.04], ['Karnali', 0.03]];
const CITY_SHARE: [string, number][] = [['Kathmandu', 0.36], ['Lalitpur', 0.17], ['Pokhara', 0.14], ['Bhaktapur', 0.1], ['Biratnagar', 0.07], ['Butwal', 0.06], ['Chitwan', 0.05], ['Dharan', 0.05]];
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MO = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const SEARCHES = ['satin dress', 'kurta set', 'pashmina', 'linen blouse', 'wedding lehenga', 'blazer', 'maxi dress', 'winter coat', 'palazzo', 'anarkali'];
const NORES = ['sari blouse readymade', 'maternity dress', 'plus size kurta', 'denim jacket', 'school uniform', 'men shirt'];

export const hash = (s: string) => { let h = 11; for (const c of s) h = (h * 33 + c.charCodeAt(0)) % 1000003; return h; };
const wob = (s: string, i = 0) => (hash(s + i) % 1000) / 1000 - 0.5;
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export function build(range: Range, cat: string, ch: string) {
  const n = { '7d': 7, '30d': 30, '90d': 13, '12m': 12 }[range];
  const per = { '7d': 1, '30d': 1, '90d': 7, '12m': 30 }[range];
  const labels = range === '7d' ? WD : range === '12m' ? MO : Array.from({ length: n }, (_, i) => (range === '30d' ? `${i + 1} Oct` : `Wk ${i + 1}`));
  const f = CAT_SHARE[cat], cf = CH_SHARE[ch], key = `${range}${cat}${ch}`;
  const rev = labels.map((_, i) => Math.round(56000 * per * f * (0.82 + (i / n) * 0.3 + Math.sin(i * 0.9) * 0.08 + wob('r' + range, i) * 0.16)));
  const prev = labels.map((_, i) => Math.round(rev[i] * (0.82 + wob('p' + range, i) * 0.12)));
  const total = sum(rev), prevTotal = sum(prev);
  const allTotal = total / f;
  const revenue = labels.map((l, i) => ({ name: l, Revenue: rev[i], 'Previous period': prev[i] }));
  const byCat = CATS.map((c) => ({ name: c, Revenue: Math.round(allTotal * CAT_SHARE[c] * (0.96 + wob(c + range) * 0.1)) }));
  const byCity = CITY_SHARE.map(([c, s]) => ({ name: c, Revenue: Math.round(total * s * (0.95 + wob(c + key) * 0.1)) }));
  const byPay = [['ConnectIPS', 0.31], ['NPX', 0.22], ['COD', 0.47]].map(([c, s]) => ({ name: c as string, Revenue: Math.round(total * (s as number)) }));
  const orders = Math.round(total / 6900);

  const pool = PRODUCTS.filter((p) => p.status === 'Published' && (cat === 'All' || p.category === cat));
  const sold = pool.map((p) => ({ name: p.name, Units: Math.max(2, Math.round((hash(p.id + range) % 90) * (per ** 0.7) * 0.4 + 4)), Stock: p.stock })).sort((a, b) => b.Units - a.Units);
  const best = sold.slice(0, 6), worst = sold.slice(-6).reverse();
  const catRows = CATS.map((c) => ({ name: c, 'Sell-through': 48 + (hash(c + range) % 38), Margin: 42 + (hash(c + 'm') % 24), Returns: 3 + (hash(c + 'r') % 70) / 10 }));

  const newC = labels.map((_, i) => Math.round((rev[i] / 7600) * (0.42 + wob('n', i) * 0.1)));
  const retC = labels.map((_, i) => Math.round((rev[i] / 7600) * (0.34 + wob('t', i) * 0.1)));
  const ltv = (['Bronze', 'Silver', 'Gold'] as const).map((t, i) => ({ name: t, 'Lifetime value': Math.round([8400, 29500, 96800][i] * (0.9 + f * 0.1) * (1 + wob(t + range) * 0.06)) }));
  const prov = PROVINCES.map(([p, s]) => ({ name: p, Customers: Math.round(orders * 0.8 * s * (0.95 + wob(p + key) * 0.08)) }));

  const visitsAll = Math.round(total / 6900 / 0.026);
  const traffic = CHANNELS.map((c) => { const visits = Math.round(visitsAll * CH_SHARE[c] * (0.95 + wob(c + range) * 0.1) * (cat === 'All' ? 1 : f * 1.2)); const conv = +(CONV[c] * (0.95 + wob(c + 'v') * 0.1)).toFixed(1); return { name: c, Visits: visits, Orders: Math.round((visits * conv) / 100), Conversion: conv }; });
  const tv = ch === 'All' ? sum(traffic.map((t) => t.Visits)) : traffic.find((t) => t.name === ch)!.Visits;
  const cr = ch === 'All' ? 0.028 : CONV[ch] / 100 * 1.4;
  const stages = [['Visits', 1], ['Product views', 0.54], ['Added to bag', 0.54 * 0.31 * (1 + cr)], ['Checkout started', 0.54 * 0.31 * 0.52 * (1 + cr)], ['Paid', cr * 0.42 * 1]].map(([name, r]) => ({ name: name as string, value: Math.round(tv * (r as number)) }));
  stages[4].value = Math.round(stages[3].value * 0.55);
  const funnel = stages.map((s, i) => ({ ...s, drop: i === 0 ? 0 : +(100 - (s.value / stages[i - 1].value) * 100).toFixed(1), pct: +((s.value / stages[0].value) * 100).toFixed(1) }));

  const cohorts = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((m, r) => ({ name: m, size: Math.round(180 * f * (0.8 + wob(m + cat) * 0.6) + 40), vals: Array.from({ length: 8 - r }, (_, j) => (j === 0 ? 100 : Math.max(4, Math.round(100 * Math.exp(-0.42 * j) * (0.8 + wob(m + j + cat) * 0.5) + 6)))) }));

  const sf = (total / 400000) * CH_SHARE[ch] ** 0.5;
  const searches = SEARCHES.map((t, i) => ({ name: t, Searches: Math.round((460 - i * 38) * sf * (0.9 + wob(t + range) * 0.2)), 'Click-through': 58 + (hash(t) % 30) }));
  const nores = NORES.map((t, i) => ({ name: t, Searches: Math.round((120 - i * 15) * sf * (0.9 + wob(t) * 0.2)) }));

  return { labels, revenue, total, prevTotal, orders, byCat, byCity, byPay, best, worst, catRows, newC, retC, ltvs: ltv, prov, traffic, funnel, cohorts, searches, nores, newRet: labels.map((l, i) => ({ name: l, New: newC[i], Returning: retC[i] })), visits: tv };
}
export type Data = ReturnType<typeof build>;

export interface Drill { title: string; sub: string; value: string; parts: { name: string; v: number }[]; rows: { id: string; customer: string; city: string; total: number }[] }
export function makeDrill(title: string, value: string, num: number, seed: string): Drill {
  const names = ['Website', 'Mobile app', 'Phone', 'Returning'];
  const w = names.map((n) => 1 + (hash(seed + n) % 60) / 30); const s = sum(w);
  const start = hash(seed) % (ORDERS.length - 6);
  return { title, sub: 'Breakdown and sample orders', value, parts: names.map((name, i) => ({ name, v: Math.round((num * w[i]) / s) })), rows: ORDERS.slice(start, start + 6).map((o) => ({ id: o.id, customer: o.customer, city: o.city, total: orderSub(o) })) };
}

export function csvOf(tab: string, d: Data): (string | number)[][] {
  const t = (name: string, rows: Record<string, string | number>[]) => [[name], Object.keys(rows[0] ?? {}), ...rows.map((r) => Object.values(r)), []];
  switch (tab) {
    case 'sales': return [...t('Revenue', d.revenue), ...t('By category', d.byCat), ...t('By city', d.byCity), ...t('By payment', d.byPay)];
    case 'products': return [...t('Best sellers', d.best), ...t('Worst sellers', d.worst), ...t('Category health', d.catRows)];
    case 'customers': return [...t('New vs returning', d.newRet), ...t('Lifetime value', d.ltvs), ...t('Provinces', d.prov)];
    case 'traffic': return t('Channels', d.traffic);
    case 'funnel': return t('Funnel', d.funnel);
    case 'cohorts': return [['Cohort', 'Size', ...d.cohorts[0].vals.map((_, i) => `Month ${i}`)], ...d.cohorts.map((c) => [c.name, c.size, ...c.vals])];
    default: return [...t('Top searches', d.searches), ...t('No results', d.nores)];
  }
}
