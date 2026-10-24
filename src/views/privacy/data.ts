import { CUSTOMERS } from '../../data/seed';

export type PrvType = 'Export my data' | 'Delete my data' | 'Correct my data';
export type PrvStatus = 'New' | 'In progress' | 'Completed' | 'Rejected';
export interface Req { id: string; customer: string; type: PrvType; ago: number; status: PrvStatus; email: boolean; phone: boolean; order: string | null; note?: string }
export const LEGAL_DAYS = 30;
export const TODAY = new Date(2026, 9, 18, 9, 0, 0);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const receivedOf = (r: Req) => addDays(TODAY, -r.ago);
export const dueOf = (r: Req) => { const d = addDays(TODAY, LEGAL_DAYS - r.ago); d.setHours(17, 0, 0, 0); return d; };
export const daysLeft = (r: Req) => LEGAL_DAYS - r.ago;
export const customerOf = (name: string) => CUSTOMERS.find((c) => c.name === name);

const T: PrvType[] = ['Export my data', 'Delete my data', 'Correct my data'];
const rows: [string, PrvType, number, PrvStatus, boolean, boolean, string | null][] = [
  ['Sunita Gurung', 'Delete my data', 34, 'In progress', true, true, 'RCV-10482'],
  ['Priya Maharjan', 'Export my data', 31, 'New', true, false, 'RCV-10481'],
  ['Anjali Thapa', 'Export my data', 26, 'In progress', true, true, 'RCV-10480'],
  ['Sabina Rai', 'Correct my data', 22, 'New', true, false, null],
  ['Nisha Karki', 'Delete my data', 17, 'New', true, true, 'RCV-10478'],
  ['Rojina Tamang', 'Correct my data', 12, 'In progress', true, true, 'RCV-10477'],
  ['Manisha Adhikari', 'Export my data', 8, 'New', false, true, 'RCV-10476'],
  ['Bipana Shrestha', 'Delete my data', 5, 'New', true, true, 'RCV-10475'],
  ['Kritika Basnet', 'Export my data', 40, 'Completed', true, true, 'RCV-10401'],
  ['Samjhana Pandey', 'Delete my data', 28, 'Rejected', false, false, null],
];
export const SEED: Req[] = rows.map(([customer, type, ago, status, email, phone, order], i) => ({ id: `PRV-${4021 - i * 3}`, customer, type: type ?? T[0], ago, status, email, phone, order, note: status === 'Rejected' ? 'We could not match the email to any order.' : undefined }));

export const dataCounts = (name: string) => {
  const c = customerOf(name); const n = c ? +c.id.slice(1) : 1;
  return [
    { k: 'Profile', n: 1, note: 'Name, email, phone' },
    { k: 'Orders', n: c?.orders ?? 3, note: 'Items, totals, delivery' },
    { k: 'Addresses', n: 1 + (n % 3), note: 'Saved delivery places' },
    { k: 'Try-on usage', n: 2 + (n % 7), note: 'Photos and sessions' },
    { k: 'Reviews', n: n % 4, note: 'Text and photos' },
  ];
};
