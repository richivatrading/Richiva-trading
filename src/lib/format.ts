export function inr(n: number): string {
  const neg = n < 0;
  const s = Math.abs(Math.round(n)).toString();
  let out = s;
  if (s.length > 3) {
    const last = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = rest + ',' + last;
  }
  return (neg ? '-' : '') + out;
}
export const rs = (n: number) => `Rs ${inr(n)}`;
export const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;
export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const initials = (n: string) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}`;
export const img = (id: string, w = 400, h = 500) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;
