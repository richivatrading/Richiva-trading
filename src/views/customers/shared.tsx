import { makeStore } from '../../store';
import { blockedCustomersStore, deletedCustomersStore, type Customer } from '../../data/seed';
import { cn } from '../../lib/format';

export type EffStatus = 'Active' | 'Blocked' | 'New' | 'At risk' | 'Deleted';
export function useEffStatus() {
  const [blocked] = blockedCustomersStore.use(); const [deleted] = deletedCustomersStore.use();
  return (c: Customer): EffStatus => deleted.includes(c.id) ? 'Deleted' : blocked.includes(c.id) ? 'Blocked' : c.status === 'Blocked' ? 'Active' : c.status;
}
export const redact = (s: string) => s.replace(/[^\s@.+-]/g, '•');

export interface PrivacyReq { id: string; customerId: string; kind: 'Export' | 'Delete'; time: string }
export const privacyStore = makeStore<PrivacyReq[]>([]);
export function createPrivacy(customerId: string, kind: 'Export' | 'Delete') {
  const id = `PRV-${1000 + Math.floor(Math.random() * 9000)}`;
  privacyStore.set((p) => [{ id, customerId, kind, time: 'Just now' }, ...p]);
  return id;
}

export const SEGMENTS = ['Festive buyers', 'Win-back: 60 days', 'New this month'];
export const csvDownload = (rows: Customer[], name = 'customers.csv') => {
  const head = ['Name', 'Phone', 'Email', 'City', 'Orders', 'Spent', 'Last order', 'Status', 'Tags'];
  const body = rows.map((c) => [c.name, c.phone, c.email, c.city, c.orders, c.spent, c.last, c.status, c.tags.join('|')].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const url = URL.createObjectURL(new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500);
};