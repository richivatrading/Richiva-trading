import type { Product, Variant } from '../../data/seed';

export interface Row { id: string; product: Product; v: Variant; onHand: number; reserved: number; available: number; reorder: number; rate: number; cover: number; status: 'Healthy' | 'Low' | 'Out' | 'Overstock' }
export const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; };

export function buildRows(products: Product[]): Row[] {
  return products.filter((p) => p.status !== 'Archived').flatMap((p) => p.variants.map((v) => {
    const h = hash(v.sku);
    const reserved = Math.min(v.stock, h % 4);
    const available = v.stock - reserved;
    const reorder = 5 + (h % 4);
    const rate = 0.22 + (h % 9) / 14;
    const cover = available <= 0 ? 0 : Math.min(365, Math.round(available / rate));
    const status: Row['status'] = v.stock === 0 ? 'Out' : available <= reorder ? 'Low' : cover > 120 ? 'Overstock' : 'Healthy';
    return { id: v.sku, product: p, v, onHand: v.stock, reserved, available, reorder, rate, cover, status };
  }));
}
export const suggestQty = (r: Row) => Math.max(10, Math.ceil((r.reorder * 3 + r.rate * 30 - r.available) / 5) * 5);

export function history(r: Row) {
  const days = 30; const out: { label: string; stock: number }[] = []; let s = r.onHand;
  const moves: number[] = [];
  for (let i = 0; i < days; i++) { const h = hash(r.id + i); moves.push(h % 11 === 0 ? -(2 + (h % 3)) : h % 13 === 0 ? 0 : -(h % 2)); }
  const arr = [s]; for (let i = 0; i < days - 1; i++) { s -= moves[i]; arr.unshift(Math.max(0, s)); }
  arr.forEach((v, i) => { const d = new Date(2026, 9, 18 - (days - 1 - i)); out.push({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), stock: v }); });
  return out;
}
export const movements = (r: Row) => [
  { title: `Sold ${1 + (hash(r.id) % 2)} units`, meta: `Order RCV-${10470 + (hash(r.id) % 10)} · Today, 10:12` },
  { title: `Reserved ${r.reserved} for open orders`, meta: 'Yesterday, 17:40' },
  { title: `Restocked ${10 + (hash(r.id) % 3) * 5} units`, meta: `${4 + (hash(r.id) % 9)} Oct 2026 · Warehouse` },
  { title: '1 unit returned and shelved', meta: '2 Oct 2026' },
  { title: 'Stock count adjusted by 0', meta: '28 Sep 2026' },
];

export const deadStock = (products: Product[]) => products.filter((p) => p.status === 'Published' && p.stock >= 8 && hash(p.id) % 6 === 0).slice(0, 6)
  .map((p) => ({ p, days: 92 + (hash(p.id) % 60), value: p.stock * p.price }));
