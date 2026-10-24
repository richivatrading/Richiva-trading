import { ORDERS } from '../../data/seed';

export type ApiStatus = 'Connected' | 'Slow' | 'Down';
export interface Courier { id: string; name: string; status: ApiStatus; on: boolean; districts: number; days: number; codFee: number; pickups: number; mult: number; extraDays: number; tests: number }
export const COURIER_SEED: Courier[] = [
  { id: 'pathao', name: 'Pathao', status: 'Connected', on: true, districts: 58, days: 2.1, codFee: 50, pickups: 14, mult: 1, extraDays: 0, tests: 0 },
  { id: 'ncm', name: 'Nepal Can Move', status: 'Slow', on: true, districts: 77, days: 3.2, codFee: 40, pickups: 9, mult: 0.9, extraDays: 1, tests: 0 },
];

export interface Zone { id: string; name: string; districts: string[]; days: string; minDays: number; prices: number[]; codFee: number }
export const BANDS = ['Up to 0.5 kg', '0.5 – 1 kg', '1 – 2 kg', '2 kg and above'];
export const ZONE_SEED: Zone[] = [
  { id: 'valley', name: 'Valley', districts: ['Kathmandu', 'Lalitpur', 'Bhaktapur'], days: '1 – 2 days', minDays: 1, prices: [100, 130, 160, 210], codFee: 30 },
  { id: 'cities', name: 'Major cities', districts: ['Pokhara', 'Biratnagar', 'Butwal', 'Chitwan', 'Dharan', 'Birgunj', 'Hetauda'], days: '2 – 3 days', minDays: 2, prices: [150, 190, 240, 320], codFee: 50 },
  { id: 'rest', name: 'Rest of Nepal', districts: ['Nuwakot', 'Dhading', 'Gorkha', 'Lamjung', 'Palpa', 'Ilam', 'Dang', 'Banke'], days: '3 – 5 days', minDays: 3, prices: [200, 260, 330, 450], codFee: 70 },
  { id: 'remote', name: 'Remote', districts: ['Mustang', 'Humla', 'Jumla', 'Dolpa', 'Mugu', 'Rasuwa'], days: '5 – 9 days', minDays: 5, prices: [320, 420, 560, 780], codFee: 120 },
];
export const ALL_DISTRICTS = ZONE_SEED.flatMap((z) => z.districts).sort();

export type ShipStatus = 'Pickup scheduled' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Failed' | 'Returned';
export interface ShipEvent { title: string; meta: string }
export interface Shipment { id: string; waybill: string; order: string; customer: string; phone: string; address: string; cod: number; courier: string; status: ShipStatus; updated: string; age: number; reason?: string; note?: string; events: ShipEvent[] }

const FAIL_REASONS = ['Customer not reachable', 'Address could not be found', 'Customer asked to deliver later', 'Premises closed'];
export const eventsFor = (status: ShipStatus, city: string, reason?: string): ShipEvent[] => {
  const e: ShipEvent[] = [{ title: 'Order packed', meta: 'Warehouse, Kathmandu' }, { title: 'Pickup scheduled', meta: 'Courier notified' }];
  if (status === 'Pickup scheduled') return e;
  e.push({ title: 'Picked up', meta: 'Kathmandu hub' }, { title: `In transit to ${city}`, meta: 'Sorting centre' });
  if (status === 'Shipped') return e;
  e.push({ title: `Arrived at ${city} hub`, meta: 'Local delivery hub' }, { title: 'Out for delivery', meta: 'Rider assigned' });
  if (status === 'Out for delivery') return e;
  if (status === 'Delivered') e.push({ title: 'Delivered', meta: 'Signed by recipient' });
  if (status === 'Failed') e.push({ title: 'Delivery attempt failed', meta: reason ?? FAIL_REASONS[0] });
  if (status === 'Returned') e.push({ title: 'Delivery attempt failed', meta: FAIL_REASONS[0] }, { title: 'Returned to warehouse', meta: 'Awaiting restock' });
  return e;
};

let shippedSeen = 0;
export const SHIPMENTS: Shipment[] = ORDERS.filter((o) => ['Packed', 'Shipped', 'Delivered', 'Returned'].includes(o.status)).map((o, i) => {
  let status: ShipStatus = o.status === 'Packed' ? 'Pickup scheduled' : o.status === 'Delivered' ? 'Delivered' : o.status === 'Returned' ? 'Returned' : 'Shipped';
  if (o.status === 'Shipped') { const k = shippedSeen++; status = k < 4 ? 'Failed' : k === 4 ? 'Shipped' : 'Out for delivery'; }
  const reason = FAIL_REASONS[i % 4];
  return {
    id: o.id, waybill: o.tracking ?? `WB${482100 + i * 37}NP`, order: o.id, customer: o.customer, phone: o.phone, address: o.address, cod: o.pay === 'COD' ? o.total : 0,
    courier: o.courier === '—' ? 'Pathao' : o.courier, status, updated: status === 'Delivered' ? `${2 + (i % 5)} days ago` : `${1 + (i % 6)} hours ago`, age: status === 'Delivered' ? 3 + (i % 3) : 1 + (i % 4),
    reason: status === 'Failed' ? reason : undefined, events: eventsFor(status, o.city, reason),
  };
});
