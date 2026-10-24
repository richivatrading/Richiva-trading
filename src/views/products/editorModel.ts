import { PHOTO_IDS, photo, type Product, type ProductStatus } from '../../data/seed';
import { TODAY, prodImg, type PX } from './shared';

export interface VRow { id: string; size: string; color: string; sku: string; barcode: string; price: string; sale: string; stock: string; on: boolean }
export interface Img { id: string; url: string; alt: string }
export interface Draft {
  sku: string; title: string; description: string; highlights: string[]; images: Img[]; sizes: string[]; colors: string[]; variants: VRow[];
  price: string; sale: string; saleFrom: string; saleTo: string; cost: string; track: boolean; lowLevel: string; allowOOS: boolean;
  mto: boolean; prodDays: string; template: string; slug: string; slugEdited: boolean; metaTitle: string; metaDesc: string;
  status: ProductStatus; schedule: string; web: boolean; app: boolean; category: string; collections: string[]; tags: string[]; sizeGuide: string; tryon: boolean;
}
export const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
export const COLORS = [{ name: 'Ivory', hex: '#efe9dc' }, { name: 'Sage', hex: '#a9b8a2' }, { name: 'Ink', hex: '#1a1a1a' }, { name: 'Champagne', hex: '#d8c39a' }, { name: 'Rose', hex: '#d9a9a4' }, { name: 'Sand', hex: '#cdb99b' }];
export const TEMPLATES = ['Standard made-to-measure', 'Anarkali with measurements', 'Lehenga custom fit', 'Blouse custom fit', 'Kurta set sizing'];
export const SIZE_GUIDES = ['None', 'Women tops', 'Women bottoms', 'Dresses and gowns', 'Outerwear'];
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const rid = () => Math.random().toString(36).slice(2, 9);
export const barcode = () => '9770' + String(100000000 + Math.floor(Math.random() * 899999999));
export const variantSku = (base: string, color: string, size: string) => `${base}-${color.slice(0, 2).toUpperCase()}-${size}`;

export const blankDraft = (count: number): Draft => ({
  sku: `RV-${1000 + count}`, title: '', description: '', highlights: ['', '', ''], images: [], sizes: [], colors: [], variants: [], price: '', sale: '', saleFrom: '', saleTo: '', cost: '',
  track: true, lowLevel: '5', allowOOS: false, mto: false, prodDays: '14', template: TEMPLATES[0], slug: '', slugEdited: false, metaTitle: '', metaDesc: '',
  status: 'Draft', schedule: '', web: true, app: true, category: '', collections: [], tags: [], sizeGuide: 'None', tryon: false,
});

export function loadDraft(p: Product | undefined, count: number): Draft {
  if (!p) return blankDraft(count);
  const colors = [...new Set(p.variants.map((v) => v.color))];
  return {
    sku: p.sku, title: p.name, description: `<p>${p.name} is cut from soft, breathable fabric with a clean line that moves with you. Made in small batches in Kathmandu by our atelier team.</p><p>Pair it with flats for the day or heels for the evening.</p>`,
    highlights: ['Breathable, skin-friendly fabric', 'Relaxed fit with a flattering drape', 'Handcrafted in Kathmandu'],
    images: [0, 1, 2].map((o) => ({ id: rid(), url: p.id && (p as PX).image && o === 0 ? (p as PX).image! : photo(p.photo + o, 800, 1000), alt: `${p.name}, view ${o + 1}` })),
    sizes: [...new Set(p.variants.map((v) => v.size))], colors,
    variants: p.variants.map((v, i) => ({ id: rid(), size: v.size, color: v.color, sku: v.sku, barcode: `9770${String(200000000 + p.photo * 1357 + i * 91).slice(0, 9)}`, price: String(p.price), sale: p.salePrice ? String(p.salePrice) : '', stock: String(v.stock), on: true })),
    price: String(p.price), sale: p.salePrice ? String(p.salePrice) : '', saleFrom: p.salePrice ? '2026-10-20' : '', saleTo: p.salePrice ? '2026-11-05' : '', cost: String(Math.round(p.price * 0.42 / 10) * 10),
    track: true, lowLevel: '5', allowOOS: false, mto: p.mto, prodDays: '14', template: TEMPLATES[0], slug: slugify(p.name), slugEdited: true, metaTitle: `${p.name} | Richiva`, metaDesc: '',
    status: p.status, schedule: p.status === 'Scheduled' ? '2026-10-25T10:00' : '', web: true, app: true, category: p.category, collections: [p.collection], tags: [], sizeGuide: p.category === 'Dresses' ? 'Dresses and gowns' : p.category === 'Bottoms' ? 'Women bottoms' : p.category === 'Outerwear' ? 'Outerwear' : 'Women tops', tryon: p.category === 'Dresses',
  };
}

export const textOf = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
export const completeness = (d: Draft) => {
  const items = [
    { label: 'Title', done: !!d.title.trim() }, { label: 'Description', done: textOf(d.description).length > 20 }, { label: 'Highlights', done: d.highlights.some((h) => h.trim()) },
    { label: 'Main image', done: d.images.length > 0 }, { label: 'Variants', done: d.variants.length > 0 }, { label: 'Price', done: Number(d.price) > 0 },
    { label: 'Category', done: !!d.category }, { label: 'Size guide', done: d.sizeGuide !== 'None' }, { label: 'Tags', done: d.tags.length > 0 }, { label: 'Meta description', done: !!d.metaDesc.trim() },
  ];
  return { items, pct: Math.round((items.filter((i) => i.done).length / items.length) * 100) };
};

export function draftToProduct(d: Draft, status: ProductStatus, existing: Product | undefined, id: string): Product {
  const on = d.variants.filter((v) => v.on);
  const url = d.images[0]?.url ?? '';
  const idx = PHOTO_IDS.findIndex((x) => url.includes(x));
  const prod: PX = {
    id, name: d.title.trim() || 'Untitled product', sku: d.sku, category: d.category || 'Tops', collection: d.collections[0] ?? existing?.collection ?? 'Autumn Atelier', price: Number(d.price) || 0,
    salePrice: Number(d.sale) > 0 ? Number(d.sale) : undefined, stock: on.reduce((a, v) => a + (Number(v.stock) || 0), 0), status, mto: d.mto, updated: TODAY,
    photo: idx >= 0 ? idx : existing?.photo ?? 0, variants: on.map((v) => ({ size: v.size, color: v.color, sku: v.sku, stock: Number(v.stock) || 0 })),
  };
  if (url && idx < 0) prod.image = url;
  return prod;
}

export interface Version { id: string; label: string; time: string; by: string; snap: Draft }
const vmap = new Map<string, Version[]>();
export const getVersions = (key: string, cur: Draft): Version[] => {
  if (!vmap.has(key)) {
    const p = Number(cur.price) || 0;
    vmap.set(key, [
      { id: rid(), label: 'Current version', time: 'Yesterday, 15:02', by: 'Anita Shrestha', snap: cur },
      { id: rid(), label: 'Changed price', time: '12 Oct, 11:20', by: 'Bikram Thapa', snap: { ...cur, price: String(Math.round(p * 1.1 / 100) * 100), sale: '' } },
      { id: rid(), label: 'First draft', time: '3 Oct, 16:45', by: 'Anita Shrestha', snap: { ...cur, price: String(Math.round(p * 1.1 / 100) * 100), sale: '', highlights: ['', '', ''], tags: [], metaTitle: '', status: 'Draft' } },
    ]);
  }
  return vmap.get(key)!;
};
export const pushVersion = (key: string, cur: Draft, label: string) => { const l = getVersions(key, cur); vmap.set(key, [{ id: rid(), label, time: 'Just now', by: 'Anita Shrestha', snap: cur }, ...l.map((v, i) => (i === 0 && v.label === 'Current version' ? { ...v, label: 'Previous version' } : v))]); };
export { prodImg };
