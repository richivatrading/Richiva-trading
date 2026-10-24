import { Star } from '../../ui/brand';
import { Pill } from '../../ui/kit';
import { makeStore } from '../../store';
import { blockedCustomersStore, deletedCustomersStore, type Customer, type Tier } from '../../data/seed';
import { cn } from '../../lib/format';

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  if (tier === 'Gold') return <span className={cn('inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[12px] font-medium bg-champagne text-white', className)}><Star size={10} />Gold</span>;
  return <Pill tone={tier === 'Silver' ? 'champagne' : 'neutral'} className={className}>{tier}</Pill>;
}

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

export const SEGMENTS = ['VIP customers', 'Festive buyers', 'Win-back: 60 days', 'New this month'];
export const csvDownload = (rows: Customer[], name = 'customers.csv') => {
  const head = ['Name', 'Phone', 'Email', 'City', 'Orders', 'Spent', 'Tier', 'Last order', 'Status', 'Tags'];
  const body = rows.map((c) => [c.name, c.phone, c.email, c.city, c.orders, c.spent, c.tier, c.last, c.status, c.tags.join('|')].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const url = URL.createObjectURL(new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500);
};
