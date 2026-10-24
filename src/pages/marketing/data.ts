import { makeStore } from '../../store';
import { CUSTOMERS, type Customer } from '../../data/seed';

export type Channel = 'Email' | 'SMS' | 'WhatsApp' | 'Push';
export const CHANNEL_LIST: Channel[] = ['Email', 'SMS', 'WhatsApp', 'Push'];
export interface Campaign { id: string; name: string; channels: Channel[]; audience: string; status: 'Draft' | 'Scheduled' | 'Sent' | 'Live'; sent: number; opened: number; orders: number; revenue: number; when: string }
export interface Rule { id: string; field: 'tier' | 'city' | 'spent' | 'orders' | 'status' | 'tag'; value: string }
export interface Segment { id: string; name: string; match: 'AND' | 'OR'; rules: Rule[] }
export interface Discount { id: string; code: string; type: 'Percent' | 'Fixed' | 'Free shipping'; value: number; minCart: number; limit: number; start: string; end: string; used: number; active: boolean }
export interface Banner { id: string; name: string; placement: string; image: string; headline: string; link: string; start: string; end: string; active: boolean }

export const FIELDS: { id: Rule['field']; label: string; hint: string; options?: string[] }[] = [
  { id: 'tier', label: 'Loyalty tier is', hint: '', options: ['Bronze', 'Silver', 'Gold'] },
  { id: 'city', label: 'City is', hint: '', options: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Butwal', 'Chitwan', 'Dharan', 'Birgunj', 'Hetauda'] },
  { id: 'spent', label: 'Has spent at least (Rs)', hint: '40000' },
  { id: 'orders', label: 'Has placed at least (orders)', hint: '5' },
  { id: 'status', label: 'Status is', hint: '', options: ['Active', 'New', 'At risk', 'Blocked'] },
  { id: 'tag', label: 'Tag is', hint: '', options: ['VIP', 'Festive buyer'] },
];
const test = (c: Customer, r: Rule) => {
  switch (r.field) {
    case 'tier': return c.tier === r.value;
    case 'city': return c.city === r.value;
    case 'spent': return c.spent >= (+r.value || 0);
    case 'orders': return c.orders >= (+r.value || 0);
    case 'status': return c.status === r.value;
    default: return c.tags.includes(r.value);
  }
};
export const matching = (s: Pick<Segment, 'match' | 'rules'>) => CUSTOMERS.filter((c) => !s.rules.length || (s.match === 'AND' ? s.rules.every((r) => test(c, r)) : s.rules.some((r) => test(c, r))));
/** Scaled to the full customer list (36 sample rows stand for 1,240). */
export const reachOf = (n: number) => Math.round((n * 1240) / CUSTOMERS.length);
export const reach = (s: Pick<Segment, 'match' | 'rules'>) => reachOf(matching(s).length);

const R = (field: Rule['field'], value: string): Rule => ({ id: `r-${field}-${value}`, field, value });
export const segmentsStore = makeStore<Segment[]>([
  { id: 's1', name: 'All customers', match: 'AND', rules: [] },
  { id: 's2', name: 'VIP customers', match: 'OR', rules: [R('tier', 'Gold'), R('tag', 'VIP')] },
  { id: 's3', name: 'Kathmandu valley', match: 'OR', rules: [R('city', 'Kathmandu'), R('city', 'Lalitpur'), R('city', 'Bhaktapur')] },
  { id: 's4', name: 'At risk', match: 'AND', rules: [R('status', 'At risk')] },
  { id: 's5', name: 'New customers', match: 'AND', rules: [R('status', 'New')] },
  { id: 's6', name: 'Festive buyers', match: 'AND', rules: [R('tag', 'Festive buyer')] },
]);

export const campaignsStore = makeStore<Campaign[]>([
  { id: 'c1', name: 'Dashain Festive Edit', channels: ['Email', 'WhatsApp'], audience: 'All customers', status: 'Live', sent: 1240, opened: 612, orders: 74, revenue: 482500, when: 'Started 6 Oct' },
  { id: 'c2', name: 'Win back: we miss you', channels: ['Email', 'SMS'], audience: 'At risk', status: 'Sent', sent: 310, opened: 128, orders: 19, revenue: 96400, when: 'Sent 29 Sep' },
  { id: 'c3', name: 'Gold early access', channels: ['Push', 'WhatsApp'], audience: 'VIP customers', status: 'Sent', sent: 186, opened: 141, orders: 38, revenue: 311800, when: 'Sent 21 Sep' },
  { id: 'c4', name: 'Tihar lights collection', channels: ['Email', 'Push'], audience: 'Festive buyers', status: 'Draft', sent: 0, opened: 0, orders: 0, revenue: 0, when: 'Edited 16 Oct' },
  { id: 'c5', name: 'Welcome series', channels: ['Email'], audience: 'New customers', status: 'Live', sent: 428, opened: 301, orders: 52, revenue: 187300, when: 'Always on' },
]);

export const discountsStore = makeStore<Discount[]>([
  { id: 'd1', code: 'DASHAIN15', type: 'Percent', value: 15, minCart: 5000, limit: 500, start: '1 Oct', end: '31 Oct', used: 212, active: true },
  { id: 'd2', code: 'WELCOME10', type: 'Percent', value: 10, minCart: 2500, limit: 0, start: '1 Jan', end: '31 Dec', used: 389, active: true },
  { id: 'd3', code: 'TIHAR500', type: 'Fixed', value: 500, minCart: 6000, limit: 300, start: '20 Oct', end: '4 Nov', used: 0, active: false },
  { id: 'd4', code: 'FREESHIP', type: 'Free shipping', value: 0, minCart: 3000, limit: 0, start: '1 Sep', end: '30 Nov', used: 156, active: true },
  { id: 'd5', code: 'VIP20', type: 'Percent', value: 20, minCart: 8000, limit: 100, start: '1 Sep', end: '31 Dec', used: 41, active: true },
  { id: 'd6', code: 'MONSOON300', type: 'Fixed', value: 300, minCart: 4000, limit: 200, start: '1 Jul', end: '15 Sep', used: 200, active: false },
]);

export const bannersStore = makeStore<Banner[]>([
  { id: 'b1', name: 'Dashain hero', placement: 'Home hero', image: '', headline: 'The Festive Edit', link: '/collections/festive', start: '1 Oct', end: '31 Oct', active: true },
  { id: 'b2', name: 'Free delivery bar', placement: 'Announcement bar', image: '', headline: 'Free delivery above Rs 3,000', link: '/shipping', start: '1 Sep', end: '30 Nov', active: true },
  { id: 'b3', name: 'Winter wool', placement: 'Collection top', image: '', headline: 'Wool for cold mornings', link: '/collections/outerwear', start: '1 Nov', end: '30 Nov', active: false },
]);
export const PLACEMENTS = [
  { id: 'Home hero', size: '1600 x 600', ratio: 1600 / 600 },
  { id: 'Announcement bar', size: '1600 x 80', ratio: 1600 / 80 },
  { id: 'Collection top', size: '1200 x 400', ratio: 3 },
  { id: 'Popup', size: '600 x 600', ratio: 1 },
];

export const CARTS = [
  { id: 'k1', name: 'Priya Maharjan', items: 'Satin Slip Dress, Pashmina Shawl', value: 13400, ago: '42 minutes', stage: 'Waiting' },
  { id: 'k2', name: 'Aastha Bhandari', items: 'Embroidered Anarkali', value: 9800, ago: '3 hours', stage: '1 hour message sent' },
  { id: 'k3', name: 'Rina Limbu', items: 'Wool Blend Coat', value: 15600, ago: '1 day', stage: '24 hour message sent' },
  { id: 'k4', name: 'Deepa Koirala', items: 'Linen Wrap Blouse x2', value: 7200, ago: '5 hours', stage: '1 hour message sent' },
  { id: 'k5', name: 'Trishna Dahal', items: 'Velvet Evening Gown', value: 21500, ago: '2 days', stage: 'Recovered' },
  { id: 'k6', name: 'Mamata Subedi', items: 'Cropped Cardigan, Ribbed Knit Top', value: 6900, ago: '26 hours', stage: '24 hour message sent' },
];
export const loyaltyStore = makeStore({ points: 5, silver: 35000, gold: 90000, perks: { Bronze: { disc: 0, tryon: 5, ship: false }, Silver: { disc: 5, tryon: 10, ship: true }, Gold: { disc: 10, tryon: 20, ship: true } } as Record<string, { disc: number; tryon: number; ship: boolean }>, refFriend: 300, refYou: 500, refMin: 3000 });
export const flowStore = makeStore({ h1: { on: true, channel: 'WhatsApp', code: 'None', msg: 'Hi {{customer_name}}, you left something lovely in your bag. It is waiting for you at Richiva.' }, h24: { on: true, channel: 'Email', code: 'WELCOME10', msg: 'Still thinking it over, {{customer_name}}? Here is a little thank you to help you decide.' } });
