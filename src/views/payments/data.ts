import { ORDERS } from '../../data/seed';

export type Method = 'ConnectIPS' | 'NPX' | 'Cash on Delivery';
export type TxStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export interface Txn { id: string; order: string; customer: string; method: Method; amount: number; fee: number; status: TxStatus; daysAgo: number; time: string; msg: string; bank: string; checked?: number }

let s = 11;
const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const FAIL_MSG = ['Insufficient balance', 'Customer cancelled the payment', 'Session timed out at bank', 'Bank declined the request'];
const BANKS = ['Nabil Bank', 'Global IME', 'NIC Asia', 'Siddhartha Bank', 'Himalayan Bank'];

export const TXNS: Txn[] = Array.from({ length: 36 }, (_, i) => {
  const o = ORDERS[i % ORDERS.length];
  const method: Method = o.pay === 'COD' ? 'Cash on Delivery' : (o.pay as Method);
  const daysAgo = i < 8 ? 0 : 1 + Math.floor((i - 8) / 2);
  let status: TxStatus = 'Paid';
  if (method === 'Cash on Delivery') status = o.status === 'Delivered' ? 'Paid' : o.status === 'Returned' ? 'Refunded' : 'Pending';
  else if (i % 7 === 3) status = 'Failed';
  else if (i % 9 === 4) status = 'Pending';
  else if (o.status === 'Returned') status = 'Refunded';
  const fee = method === 'ConnectIPS' ? Math.round(o.total * 0.012) : method === 'NPX' ? Math.round(o.total * 0.018) : 0;
  const hh = String(8 + Math.floor(r() * 13)).padStart(2, '0'), mm = ['05', '14', '26', '41', '58'][Math.floor(r() * 5)];
  return { id: `TXN-${48310 - i * 7}`, order: o.id, customer: o.customer, method, amount: o.total, fee, status, daysAgo, time: `${18 - daysAgo} Oct, ${hh}:${mm}`, msg: FAIL_MSG[i % 4], bank: BANKS[i % 5] };
});

export const gatewayJson = (t: Txn) => {
  const ok = t.status === 'Paid' || t.status === 'Refunded';
  const pend = t.status === 'Pending';
  return JSON.stringify({
    gateway: t.method === 'Cash on Delivery' ? 'courier_cod' : t.method.toLowerCase(),
    txn_id: t.id, merchant: 'richiva-prod',
    status: ok ? 'SUCCESS' : pend ? 'PENDING' : 'FAILED',
    code: ok ? '000' : pend ? '202' : '4' + (10 + (t.amount % 7)),
    message: ok ? 'Transaction completed' : pend ? 'Awaiting confirmation' : t.msg,
    amount_paisa: t.amount * 100, fee_paisa: t.fee * 100,
    bank: t.method === 'Cash on Delivery' ? null : t.bank,
    reference: `RF${t.id.slice(4)}${t.amount % 97}`,
    timestamp: `2026-10-${String(18 - t.daysAgo).padStart(2, '0')}T${t.time.slice(-5)}:00+05:45`,
  }, null, 2);
};

export interface Settlement { id: string; period: string; gross: number; fees: number; refunds: number; status: 'Paid' | 'Pending' | 'Processing'; bank: string }
export const SETTLEMENTS: Settlement[] = [
  { id: 's1', period: '12 – 18 Oct', gross: 486200, fees: 7290, refunds: 12400, status: 'Processing', bank: 'NABIL-20261019-0418' },
  { id: 's2', period: '5 – 11 Oct', gross: 612800, fees: 9190, refunds: 8900, status: 'Pending', bank: 'NABIL-20261012-0377' },
  { id: 's3', period: '28 Sep – 4 Oct', gross: 538400, fees: 8076, refunds: 15200, status: 'Paid', bank: 'NABIL-20261005-0331' },
  { id: 's4', period: '21 – 27 Sep', gross: 421900, fees: 6328, refunds: 4500, status: 'Paid', bank: 'NABIL-20250928-0296' },
  { id: 's5', period: '14 – 20 Sep', gross: 394600, fees: 5919, refunds: 9800, status: 'Paid', bank: 'NABIL-20250921-0254' },
  { id: 's6', period: '7 – 13 Sep', gross: 356300, fees: 5344, refunds: 0, status: 'Paid', bank: 'NABIL-20250914-0219' },
];

export interface Refund { id: string; order: string; customer: string; amount: number; reason: string; requested: string; status: 'Pending' | 'Approved' | 'Rejected' }
export const REFUNDS: Refund[] = [
  { id: 'rf1', order: ORDERS[40].id, customer: ORDERS[40].customer, amount: 4500, reason: 'Wrong size, item returned', requested: 'Today, 10:12', status: 'Pending' },
  { id: 'rf2', order: ORDERS[41].id, customer: ORDERS[41].customer, amount: 7200, reason: 'Colour different from photo', requested: 'Today, 08:40', status: 'Pending' },
  { id: 'rf3', order: ORDERS[22].id, customer: ORDERS[22].customer, amount: 2850, reason: 'Order cancelled before dispatch', requested: 'Yesterday', status: 'Pending' },
  { id: 'rf4', order: ORDERS[30].id, customer: ORDERS[30].customer, amount: 9600, reason: 'Damaged on arrival', requested: '15 Oct', status: 'Approved' },
  { id: 'rf5', order: ORDERS[33].id, customer: ORDERS[33].customer, amount: 3100, reason: 'Changed mind after 10 days', requested: '14 Oct', status: 'Rejected' },
];

export interface CodBatch { id: string; courier: string; waybills: number; amount: number; age: number; remitted: boolean }
export const COD_BATCHES: CodBatch[] = [
  { id: 'cb1', courier: 'Pathao', waybills: 14, amount: 68400, age: 1, remitted: false },
  { id: 'cb2', courier: 'Nepal Can Move', waybills: 9, amount: 41200, age: 2, remitted: false },
  { id: 'cb3', courier: 'Pathao', waybills: 11, amount: 52900, age: 4, remitted: false },
  { id: 'cb4', courier: 'Nepal Can Move', waybills: 7, amount: 33800, age: 6, remitted: false },
  { id: 'cb5', courier: 'Pathao', waybills: 6, amount: 27500, age: 8, remitted: false },
  { id: 'cb6', courier: 'Nepal Can Move', waybills: 5, amount: 22100, age: 12, remitted: false },
  { id: 'cb7', courier: 'Pathao', waybills: 18, amount: 84600, age: 9, remitted: true },
  { id: 'cb8', courier: 'Nepal Can Move', waybills: 12, amount: 57300, age: 11, remitted: true },
];

export const downloadCsv = (name: string, rows: (string | number)[][]) => {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
};
