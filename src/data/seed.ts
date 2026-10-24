import { makeStore } from '../store';
import { img } from '../lib/format';

let s = 7;
export const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
export const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
export const ri = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));

export const PHOTO_IDS = ['1662532577856-e8ee8b138a8b', '1664076458686-3449062080ac', '1659522761084-79196b64abe4', '1653152707179-125e4e184a0b', '1618244965061-1d27b208d6e8', '1733322991133-2de13aa12c57', '1737188550207-df877c6392dc', '1733324961705-97bd6cd7f4ba', '1678189211831-3404f430e267', '1637690048998-1e41c61c254d', '1750064773510-bbbf549db4d2', '1602303894456-398ce544d90b', '1607973259090-0f86a2225ca7', '1779398968962-b3ad149b57b6'];
export const FABRIC_IDS = ['1593250816874-8edf4f732edb', '1619459074324-33d5f591c53e', '1633655442330-0b44ca0cce9b', '1594332495179-d979bcd18142', '1593510472612-b992b424f883', '1636716018960-eb737dccb185'];
export const photo = (i: number, w = 400, h = 500) => img(PHOTO_IDS[i % PHOTO_IDS.length], w, h);
export const fabric = (i: number, w = 400, h = 300) => img(FABRIC_IDS[i % FABRIC_IDS.length], w, h);

export type ProductStatus = 'Published' | 'Draft' | 'Scheduled' | 'Archived';
export interface Variant { size: string; color: string; sku: string; stock: number }
export interface Product { id: string; name: string; sku: string; category: string; collection: string; price: number; salePrice?: number; stock: number; status: ProductStatus; mto: boolean; updated: string; photo: number; variants: Variant[]; }

const BASE = ['Satin Slip Dress', 'Linen Wrap Blouse', 'Silk Palazzo Pants', 'Himal Kurta Set', 'Embroidered Anarkali', 'Cotton Wide Trouser', 'Wool Blend Coat', 'Pashmina Shawl', 'Tailored Blazer', 'Denim Midi Skirt', 'Chiffon Blouse', 'Cropped Cardigan', 'Pleated Maxi Dress', 'Ruched Tee', 'Bamboo Lounge Set', 'Floral Sundress', 'Velvet Evening Gown', 'Ribbed Knit Top', 'Ivory Shirt Dress', 'Culotte Pants', 'Lehenga Skirt', 'Quilted Jacket', 'Peplum Top', 'Organza Gown'];
const CATS = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Bottoms', 'Outerwear', 'Outerwear', 'Outerwear', 'Bottoms', 'Tops', 'Tops', 'Dresses', 'Tops', 'Bottoms', 'Dresses', 'Dresses', 'Tops', 'Dresses', 'Bottoms', 'Bottoms', 'Outerwear', 'Tops', 'Dresses'];
const COLS = ['Ivory', 'Sage', 'Ink', 'Champagne', 'Rose', 'Sand'];
const COLL = ['Autumn Atelier', 'Festive Edit', 'Everyday Linen', 'Himalayan Weave'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
export const PRODUCTS: Product[] = Array.from({ length: 62 }, (_, i) => {
  const b = i % 24; const c = COLS[Math.floor(i / 24) + (i % 3)] ?? 'Ivory';
  const price = ri(18, 140) * 100 + 900; const sale = rand() < 0.28 ? Math.round(price * 0.85 / 100) * 100 : undefined;
  const variants = SIZES.slice(0, ri(3, 5)).map((sz) => ({ size: sz, color: c, sku: `RV-${(1000 + i)}-${c.slice(0, 2).toUpperCase()}-${sz}`, stock: i < 7 ? ri(0, 4) : ri(3, 28) }));
  const stock = variants.reduce((a, v) => a + v.stock, 0);
  const status: ProductStatus = i === 3 ? 'Scheduled' : i % 11 === 5 ? 'Draft' : i % 17 === 9 ? 'Archived' : 'Published';
  return { id: `p${i + 1}`, name: i < 24 ? BASE[b] : `${BASE[b]} · ${c}`, sku: `RV-${1000 + i}`, category: CATS[b], collection: COLL[i % 4], price, salePrice: sale, stock, status, mto: [4, 8, 16, 23, 20].includes(b), updated: `${ri(1, 28)} Oct`, photo: i, variants };
});
export const productsStore = makeStore<Product[]>(PRODUCTS);

export type OrderStatus = 'To confirm' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
export type PayMethod = 'ConnectIPS' | 'NPX' | 'COD';
export interface OrderItem { productId: string; qty: number; size: string; color: string }
export interface Order { id: string; date: string; customer: string; phone: string; city: string; address: string; items: OrderItem[]; total: number; pay: PayMethod; status: OrderStatus; courier: string; risk: 'Low' | 'Medium' | 'High'; channel: 'Website' | 'Mobile app' | 'Phone'; codVerified: boolean; tracking?: string }

export const CUSTOMER_NAMES = ['Sunita Gurung', 'Priya Maharjan', 'Anjali Thapa', 'Sabina Rai', 'Nisha Karki', 'Rojina Tamang', 'Manisha Adhikari', 'Bipana Shrestha', 'Kritika Basnet', 'Samjhana Pandey', 'Pooja Joshi', 'Aastha Bhandari', 'Rina Limbu', 'Sarita Magar', 'Deepa Koirala', 'Mamata Subedi', 'Asmita Neupane', 'Laxmi Khadka', 'Trishna Dahal', 'Binita Ghimire'];
export const CITIES = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Butwal', 'Chitwan', 'Dharan', 'Birgunj', 'Hetauda'];
const phone = () => `+977 98${ri(10, 99)}-${ri(100000, 999999)}`;
const STATUS_PLAN: OrderStatus[] = [...Array(12).fill('To confirm'), ...Array(8).fill('Processing'), ...Array(4).fill('Packed'), ...Array(6).fill('Shipped'), ...Array(12).fill('Delivered'), 'Cancelled', 'Cancelled', 'Returned', 'Returned'] as OrderStatus[];
export const ORDERS: Order[] = STATUS_PLAN.map((status, i) => {
  const items: OrderItem[] = Array.from({ length: ri(1, 3) }, () => { const p = pick(PRODUCTS.slice(7)); return { productId: p.id, qty: ri(1, 2), size: pick(SIZES), color: p.variants[0].color }; });
  const sub = items.reduce((a, it) => { const p = PRODUCTS.find((x) => x.id === it.productId)!; return a + (p.salePrice ?? p.price) * it.qty; }, 0);
  const pay: PayMethod = pick(['ConnectIPS', 'NPX', 'COD', 'COD']);
  const c = i % CUSTOMER_NAMES.length;
  const cityIdx = (i * 3) % CITIES.length;
  return {
    id: `RCV-${10482 - i}`, date: `${Math.max(1, 18 - Math.floor(i / 3))} Oct 2026, ${ri(8, 21)}:${pick(['05', '20', '42', '58'])}`, customer: CUSTOMER_NAMES[c], phone: phone(), city: CITIES[cityIdx],
    address: `House ${ri(2, 90)}, ${pick(['Baneshwor', 'Lazimpat', 'Jawalakhel', 'Lakeside', 'Thamel', 'Patan Dhoka', 'Boudha'])}, ${CITIES[cityIdx]}`,
    items, total: sub + (sub > 8000 ? 0 : 150), pay, status, courier: ['To confirm'].includes(status) ? '—' : pick(['Pathao', 'Nepal Can Move']), risk: pay === 'COD' ? pick(['Low', 'Medium', 'High', 'Low']) : 'Low',
    channel: pick(['Website', 'Website', 'Mobile app', 'Phone']), codVerified: pay !== 'COD' || status !== 'To confirm', tracking: ['Shipped', 'Delivered'].includes(status) ? `WB${ri(100000, 999999)}NP` : undefined,
  };
});
export const ordersStore = makeStore<Order[]>(ORDERS);
export const orderSub = (o: Order) => o.items.reduce((a, it) => { const p = PRODUCTS.find((x) => x.id === it.productId)!; return a + (p.salePrice ?? p.price) * it.qty; }, 0);

export type Tier = 'Bronze' | 'Silver' | 'Gold';
export interface Customer { id: string; name: string; phone: string; email: string; city: string; orders: number; spent: number; tier: Tier; last: string; status: 'Active' | 'Blocked' | 'New' | 'At risk'; tags: string[]; points: number; credit: number }
export const CUSTOMERS: Customer[] = Array.from({ length: 36 }, (_, i) => {
  const name = i < 20 ? CUSTOMER_NAMES[i] : `${pick(['Alisha', 'Reema', 'Kabita', 'Sushma', 'Ishani', 'Rachana', 'Smriti', 'Nirmala'])} ${pick(['Gurung', 'Sherpa', 'Shahi', 'Bista', 'Pun', 'Chaudhary', 'Rana', 'Acharya'])}`;
  const orders = i % 9 === 0 ? ri(12, 26) : i % 4 === 0 ? ri(5, 9) : ri(1, 4); const spent = orders * ri(4200, 9800);
  return { id: `c${i + 1}`, name, phone: phone(), email: `${name.toLowerCase().replace(' ', '.')}@gmail.com`, city: CITIES[i % CITIES.length], orders, spent, tier: spent > 90000 ? 'Gold' : spent > 35000 ? 'Silver' : 'Bronze', last: `${ri(1, 28)} ${pick(['Oct', 'Sep'])} 2026`, status: i === 13 ? 'Blocked' : i % 7 === 2 ? 'At risk' : orders <= 1 ? 'New' : 'Active', tags: i % 5 === 0 ? ['VIP'] : i % 6 === 1 ? ['Festive buyer'] : [], points: ri(100, 4800), credit: i % 8 === 0 ? 1500 : 0 };
});
export const customersStore = makeStore<Customer[]>(CUSTOMERS);

export const TEAM = [
  { id: 'u1', name: 'Anita Shrestha', email: 'owner@richiva.com', role: 'Owner', mfa: true, last: 'Now', status: 'Active' },
  { id: 'u2', name: 'Bikram Thapa', email: 'bikram@richiva.com', role: 'Manager', mfa: true, last: '12 min ago', status: 'Active' },
  { id: 'u3', name: 'Sneha Pradhan', email: 'sneha@richiva.com', role: 'Marketing', mfa: true, last: '2 hours ago', status: 'Active' },
  { id: 'u4', name: 'Rajan Khatri', email: 'rajan@richiva.com', role: 'Finance', mfa: false, last: 'Yesterday', status: 'Active' },
  { id: 'u5', name: 'Dipesh Lama', email: 'dipesh@richiva.com', role: 'Warehouse', mfa: true, last: '5 min ago', status: 'Active' },
  { id: 'u6', name: 'Maya Tuladhar', email: 'maya@richiva.com', role: 'Support', mfa: false, last: '1 hour ago', status: 'Active' },
];
export const COURIERS = ['Pathao', 'Nepal Can Move'];

export const setupStore = makeStore<string[]>([]);
export const SETUP_STEPS = [
  { id: 'products', title: 'Add products', route: '/products' },
  { id: 'payments', title: 'Connect payments', route: '/settings?section=payments' },
  { id: 'courier', title: 'Connect a courier', route: '/shipping' },
  { id: 'home', title: 'Publish your home page', route: '/cms?tab=home' },
];

export interface AuditEntry { id: string; time: string; user: string; module: string; action: string; item: string; ip: string; device: string; before?: string; after?: string }
export const auditStore = makeStore<AuditEntry[]>([
  { id: 'a1', time: 'Today, 09:42', user: 'Bikram Thapa', module: 'Orders', action: 'Confirmed order', item: 'RCV-10479', ip: '202.79.32.14', device: 'Chrome on Windows', before: 'status: To confirm', after: 'status: Processing' },
  { id: 'a2', time: 'Today, 09:10', user: 'Sneha Pradhan', module: 'Marketing', action: 'Edited discount', item: 'DASHAIN15', ip: '202.79.32.40', device: 'Safari on macOS', before: 'value: 10%', after: 'value: 15%' },
  { id: 'a3', time: 'Yesterday, 18:25', user: 'Rajan Khatri', module: 'Payments', action: 'Approved refund', item: 'RCV-10431', ip: '103.10.28.7', device: 'Chrome on Windows', before: 'refund: Pending', after: 'refund: Approved (Rs 4,500)' },
  { id: 'a4', time: 'Yesterday, 15:02', user: 'Anita Shrestha', module: 'Products', action: 'Changed price', item: 'Satin Slip Dress', ip: '202.79.32.11', device: 'Chrome on macOS', before: 'price: Rs 6,500', after: 'price: Rs 5,900' },
]);
let au = 100;
export const logAudit = (e: Omit<AuditEntry, 'id' | 'time' | 'ip' | 'device'>) => auditStore.set((a) => [{ ...e, id: `a${++au}`, time: 'Just now', ip: '202.79.32.11', device: 'Chrome on macOS' }, ...a]);

export interface ReorderNote { id: string; product: string; qty: number; by: string; time: string }
export const reorderNotesStore = makeStore<ReorderNote[]>([]);
export const deletedCustomersStore = makeStore<string[]>([]);
export const blockedCustomersStore = makeStore<string[]>(['c14']);
