import { CUSTOMERS, ORDERS, TEAM } from '../../data/seed';

export type Health = 'Healthy' | 'Slow' | 'Down';
export type Day = 'up' | 'slow' | 'down';
export interface Service { id: string; name: string; group: string; status: Health; ms: number; checked: number; days: Day[]; step: { label: string; to: string } }

const mk = (slow: number[] = []): Day[] => Array.from({ length: 30 }, (_, i) => (slow.includes(i) ? 'slow' : 'up'));
const MIN = 60000;
export const SERVICES0: Service[] = [
  { id: 'cips', name: 'ConnectIPS', group: 'Payments', status: 'Healthy', ms: 412, checked: Date.now() - 2 * MIN, days: mk([11]), step: { label: 'Offer NPX and COD only', to: '/payments?tab=transactions' } },
  { id: 'npx', name: 'NPX', group: 'Payments', status: 'Healthy', ms: 356, checked: Date.now() - 3 * MIN, days: mk(), step: { label: 'Offer ConnectIPS and COD only', to: '/payments?tab=transactions' } },
  { id: 'pathao', name: 'Courier 1 (Pathao)', group: 'Shipping', status: 'Healthy', ms: 540, checked: Date.now() - 1 * MIN, days: mk([4, 19]), step: { label: 'Switch to manual shipping', to: '/shipping?tab=couriers' } },
  { id: 'ncm', name: 'Courier 2 (Nepal Can Move)', group: 'Shipping', status: 'Slow', ms: 3180, checked: Date.now() - 4 * MIN, days: mk([22, 25, 26, 27, 28, 29]), step: { label: 'Switch to manual shipping', to: '/shipping?tab=couriers' } },
  { id: 'sms', name: 'SMS', group: 'Messaging', status: 'Healthy', ms: 220, checked: Date.now() - 5 * MIN, days: mk(), step: { label: 'Send through WhatsApp instead', to: '/notifications?tab=settings' } },
  { id: 'wa', name: 'WhatsApp', group: 'Messaging', status: 'Healthy', ms: 305, checked: Date.now() - 2 * MIN, days: mk([7]), step: { label: 'Send through SMS instead', to: '/notifications?tab=settings' } },
  { id: 'email', name: 'Email', group: 'Messaging', status: 'Healthy', ms: 188, checked: Date.now() - 6 * MIN, days: mk(), step: { label: 'Check the delivery log', to: '/notifications?tab=log' } },
  { id: 'push', name: 'Push', group: 'Messaging', status: 'Healthy', ms: 164, checked: Date.now() - 3 * MIN, days: mk([15]), step: { label: 'Check the delivery log', to: '/notifications?tab=log' } },
  { id: 'tryon', name: 'Try-on provider', group: 'AI', status: 'Healthy', ms: 960, checked: Date.now() - 7 * MIN, days: mk([2, 3]), step: { label: 'Pause try-on for shoppers', to: '/tryon?tab=settings' } },
  { id: 'web', name: 'Website', group: 'Platform', status: 'Healthy', ms: 142, checked: Date.now() - 1 * MIN, days: mk(), step: { label: 'Open the website settings', to: '/settings?section=domains' } },
  { id: 'api', name: 'Mobile API', group: 'Platform', status: 'Healthy', ms: 118, checked: Date.now() - 1 * MIN, days: mk([9]), step: { label: 'Check recent errors', to: '/integrations' } },
];

export interface ErrorRow { id: string; time: string; service: string; message: string; order: string }
const O = ORDERS.map((o) => o.id);
export const ERRORS0: ErrorRow[] = [
  { id: 'e1', time: 'Today, 10:42', service: 'Courier 2 (Nepal Can Move)', message: 'Booking timed out after 3 seconds', order: O[3] },
  { id: 'e2', time: 'Today, 10:31', service: 'Courier 2 (Nepal Can Move)', message: 'Could not fetch tracking update', order: O[6] },
  { id: 'e3', time: 'Today, 09:58', service: 'SMS', message: 'Message to +977 9841-223344 was rejected by the operator', order: O[9] },
  { id: 'e4', time: 'Yesterday, 19:20', service: 'ConnectIPS', message: 'Payment confirmation came back late', order: O[12] },
  { id: 'e5', time: 'Yesterday, 14:05', service: 'WhatsApp', message: 'Template message was not delivered', order: O[15] },
  { id: 'e6', time: '16 Oct, 11:12', service: 'Courier 1 (Pathao)', message: 'Pickup request was declined: address unclear', order: O[18] },
];

export interface Hook { id: string; time: string; source: string; event: string; status: 'Delivered' | 'Failed'; ref: string }
export const HOOKS0: Hook[] = [
  { id: 'h1', time: '10:44', source: 'ConnectIPS', event: 'payment.succeeded', status: 'Delivered', ref: O[1] },
  { id: 'h2', time: '10:40', source: 'NPX', event: 'payment.succeeded', status: 'Delivered', ref: O[4] },
  { id: 'h3', time: '10:33', source: 'Nepal Can Move', event: 'shipment.status_changed', status: 'Failed', ref: O[3] },
  { id: 'h4', time: '10:12', source: 'Pathao', event: 'shipment.delivered', status: 'Delivered', ref: O[20] },
  { id: 'h5', time: '09:51', source: 'Pathao', event: 'shipment.picked_up', status: 'Delivered', ref: O[8] },
  { id: 'h6', time: '09:20', source: 'WhatsApp', event: 'message.read', status: 'Failed', ref: O[10] },
  { id: 'h7', time: '08:47', source: 'ConnectIPS', event: 'payment.refunded', status: 'Delivered', ref: O[14] },
];

export interface Backup { id: string; date: string; size: string; test: 'Passed' | 'Failed' | 'Not tested' }
export const BACKUPS0: Backup[] = ['18 Oct', '17 Oct', '16 Oct', '15 Oct', '14 Oct', '13 Oct', '12 Oct'].map((d, i) => ({ id: `b${i}`, date: `${d} 2026, 02:00`, size: `${(2.41 - i * 0.03).toFixed(2)} GB`, test: i === 4 ? 'Not tested' : 'Passed' }));

export interface Release { id: string; name: string; version: string; date: string; log: string[] }
export const RELEASES: Release[] = [
  { id: 'admin', name: 'Admin', version: 'v2.14.0', date: '14 Oct 2026', log: ['Support desk now suggests replies with AI', 'Faster order list on slow connections', 'Fixed a rounding issue in Nepali rupee totals'] },
  { id: 'web', name: 'Website', version: 'v3.8.2', date: '11 Oct 2026', log: ['New Dashain collection page', 'Size guide opens as a side panel', 'Smaller product images load quicker'] },
  { id: 'api', name: 'Mobile API', version: 'v1.22.1', date: '9 Oct 2026', log: ['Push tokens refresh automatically', 'Order tracking returns courier phone number', 'Fixed duplicate wishlist entries'] },
];

export const PEOPLE = TEAM.filter((t) => ['Owner', 'Manager', 'Warehouse', 'Support'].includes(t.role));
export const customerCount = CUSTOMERS.length;
