export type Period = 'Today' | '7D' | '30D' | '90D' | 'Custom';
export type Metric = 'revenue' | 'orders' | 'conv' | 'aov' | 'returns';
export const NOW = new Date(2026, 9, 18);
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const noise = (i: number, s: number) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };

export interface Range { from: string; to: string }
export const rangeDays = (r: Range) => Math.max(1, Math.round((parseIso(r.to).getTime() - parseIso(r.from).getTime()) / 86400000) + 1);

export interface Point { label: string; revenue: number; orders: number; conv: number; aov: number; returns: number }
export interface Bundle { points: Point[]; prev: Point[]; totals: Record<Metric, number>; prevTotals: Record<Metric, number>; days: number; factor: number }

function gen(n: number, hourly: boolean, end: Date, seed: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const wave = 1 + 0.2 * Math.sin(i * 0.85 + seed) + 0.18 * (noise(i, seed) - 0.5);
    const trend = 1 + (hourly ? 0 : (i / n) * 0.1);
    const dayBase = 185000 * (hourly ? (0.35 + 0.65 * Math.sin((i / 24) * Math.PI * 1.1 + 0.2) ** 2) / 11 : 1);
    const revenue = Math.round(dayBase * wave * trend / 100) * 100;
    const aov = 4700 + noise(i, seed + 3) * 500;
    const orders = Math.max(1, Math.round(revenue / aov));
    const label = hourly ? `${String(i).padStart(2, '0')}:00` : shortDate(addDays(end, i - n + 1));
    return { label, revenue, orders, conv: +(3.1 + 0.5 * Math.sin(i * 0.6 + seed) + (noise(i, seed + 5) - 0.5) * 0.4).toFixed(2), aov: Math.round(revenue / orders), returns: +(4.2 + 0.8 * Math.sin(i * 0.4 + seed + 1) + (noise(i, seed + 7) - 0.5) * 0.6).toFixed(2) };
  });
}
const tot = (p: Point[]): Record<Metric, number> => {
  const revenue = p.reduce((a, x) => a + x.revenue, 0), orders = p.reduce((a, x) => a + x.orders, 0);
  return { revenue, orders, aov: Math.round(revenue / Math.max(1, orders)), conv: +(p.reduce((a, x) => a + x.conv, 0) / p.length).toFixed(2), returns: +(p.reduce((a, x) => a + x.returns, 0) / p.length).toFixed(2) };
};
export function buildBundle(period: Period, range: Range): Bundle {
  const hourly = period === 'Today';
  const days = period === 'Today' ? 1 : period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : rangeDays(range);
  const end = period === 'Custom' ? parseIso(range.to) : NOW;
  const n = hourly ? 11 : days;
  const seed = { Today: 1, '7D': 2, '30D': 3, '90D': 4, Custom: 5 + (days % 7) }[period];
  const points = gen(n, hourly, end, seed);
  const prev = gen(n, hourly, addDays(end, -days), seed + 11);
  return { points, prev, totals: tot(points), prevTotals: tot(prev), days, factor: hourly ? 0.35 : days };
}
export const rangeLabel = (r: Range) => `${shortDate(parseIso(r.from))} – ${shortDate(parseIso(r.to))}`;
