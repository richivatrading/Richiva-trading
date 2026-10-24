import { makeStore } from '../../store';
import { PRODUCTS, photo, productsStore, type Product } from '../../data/seed';

export type PX = Product & { image?: string };
export const prodImg = (p: Product, w = 200, h = 250, off = 0) => ((p as PX).image && off === 0 ? (p as PX).image! : photo(p.photo + off, w, h));
export const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Dresses'];
export const TODAY = '18 Oct';

export const LOW_IDS = new Set(PRODUCTS.slice(0, 7).map((p) => p.id));
export const isLow = (p: Product) => p.stock > 0 && LOW_IDS.has(p.id);
export const stockTone = (p: Product) => (p.stock === 0 ? 'bg-bad text-bad' : isLow(p) ? 'bg-warn text-warn' : 'bg-ok text-ok');

export const filterStore = makeStore<{ ids: string[]; label: string }>({ ids: PRODUCTS.map((p) => p.id), label: 'All products' });

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
export const CSV_HEAD = ['Name', 'SKU', 'Category', 'Collection', 'Price', 'Sale price', 'Stock', 'Status', 'Made to order'];
export const productRow = (p: Product) => [p.name, p.sku, p.category, p.collection, p.price, p.salePrice ?? '', p.stock, p.status, p.mto ? 'Yes' : 'No'];
export const productsCsv = (list: Product[]) => [CSV_HEAD, ...list.map(productRow)];

/* collections */
export interface Rule { id: string; field: 'price' | 'category' | 'stock' | 'status'; op: string; value: string }
export interface Collection { id: string; name: string; type: 'Manual' | 'Automatic'; status: 'Live' | 'Draft'; join: 'AND' | 'OR'; rules: Rule[] }
export const RULE_FIELDS: { value: Rule['field']; label: string; ops: { value: string; label: string }[] }[] = [
  { value: 'price', label: 'Price', ops: [{ value: 'lt', label: 'is less than' }, { value: 'gt', label: 'is greater than' }] },
  { value: 'category', label: 'Category', ops: [{ value: 'is', label: 'is' }, { value: 'not', label: 'is not' }] },
  { value: 'stock', label: 'Stock', ops: [{ value: 'lt', label: 'is less than' }, { value: 'gt', label: 'is greater than' }] },
  { value: 'status', label: 'Status', ops: [{ value: 'is', label: 'is' }, { value: 'not', label: 'is not' }] },
];
export const ruleMatch = (r: Rule, p: Product) => {
  const v = r.field === 'price' ? (p.salePrice ?? p.price) : r.field === 'stock' ? p.stock : r.field === 'category' ? p.category : p.status;
  if (r.field === 'price' || r.field === 'stock') return r.op === 'lt' ? (v as number) < Number(r.value) : (v as number) > Number(r.value);
  return r.op === 'is' ? v === r.value : v !== r.value;
};
export const matchesRules = (join: 'AND' | 'OR', rules: Rule[], p: Product) => rules.length > 0 && (join === 'AND' ? rules.every((r) => ruleMatch(r, p)) : rules.some((r) => ruleMatch(r, p)));
export const inCollection = (c: Collection, p: Product) => (c.type === 'Manual' ? p.collection === c.name : matchesRules(c.join, c.rules, p));
export const collectionsStore = makeStore<Collection[]>([
  { id: 'col1', name: 'Autumn Atelier', type: 'Manual', status: 'Live', join: 'AND', rules: [] },
  { id: 'col2', name: 'Festive Edit', type: 'Manual', status: 'Live', join: 'AND', rules: [] },
  { id: 'col3', name: 'Everyday Linen', type: 'Manual', status: 'Live', join: 'AND', rules: [] },
  { id: 'col4', name: 'Himalayan Weave', type: 'Manual', status: 'Draft', join: 'AND', rules: [] },
  { id: 'col5', name: 'Dresses under Rs 8,000', type: 'Automatic', status: 'Live', join: 'AND', rules: [{ id: 'r1', field: 'price', op: 'lt', value: '8000' }, { id: 'r2', field: 'category', op: 'is', value: 'Dresses' }] },
]);

/* categories */
export interface Cat { id: string; name: string; parent: string | null; visible: boolean; count: number }
const tot = (c: string) => PRODUCTS.filter((p) => p.category === c).length;
const split = (c: string, n: number) => { const t = tot(c); const b = Math.floor(t / n); return Array.from({ length: n }, (_, i) => (i === n - 1 ? t - b * (n - 1) : b)); };
const mk = (parent: string, parentName: string, id: string, kids: string[]): Cat[] => { const s = split(parentName, kids.length); return kids.map((k, i) => ({ id: `${id}${i}`, name: k, parent, visible: true, count: s[i] })); };
export const categoriesStore = makeStore<Cat[]>([
  { id: 'tops', name: 'Tops', parent: null, visible: true, count: 0 }, ...mk('tops', 'Tops', 'tp', ['Blouses', 'Tees', 'Knitwear']),
  { id: 'bottoms', name: 'Bottoms', parent: null, visible: true, count: 0 }, ...mk('bottoms', 'Bottoms', 'bt', ['Trousers', 'Skirts']),
  { id: 'outer', name: 'Outerwear', parent: null, visible: true, count: 0 }, ...mk('outer', 'Outerwear', 'ow', ['Coats', 'Jackets', 'Shawls']),
  { id: 'dresses', name: 'Dresses', parent: null, visible: true, count: 0 }, ...mk('dresses', 'Dresses', 'dr', ['Day dresses', 'Evening gowns', 'Festive']),
]);

export const addProducts = (ps: Product[]) => productsStore.set((a) => [...ps, ...a]);
