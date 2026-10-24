import { Globe, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { Pill, Ring } from '../../ui/kit';
import type { Channel, Ticket } from './data';

export const CH_ICON = { Web: Globe, App: Smartphone, Email: Mail, WhatsApp: MessageCircle } as const;
export const ChannelIcon = ({ c, size = 14 }: { c: Channel; size?: number }) => { const I = CH_ICON[c]; return <I size={size} strokeWidth={1.5} className="text-muted" aria-label={c} />; };

export const fmtLeft = (ms: number) => {
  if (ms <= 0) return 'Overdue';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  if (m < 10) return `${m}:${String(s % 60).padStart(2, '0')}`;
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
export function SlaRing({ t, now, size = 40 }: { t: Ticket; now: number; size?: number }) {
  if (t.status === 'Closed') return <Pill tone="neutral">Closed</Pill>;
  const rem = t.dueAt - now, pct = Math.max(0, Math.min(100, (rem / (t.total * 60000)) * 100));
  const color = rem <= 0 || pct < 12 ? 'var(--bad)' : pct < 45 ? 'var(--champagne)' : 'var(--ink)';
  return <span title={`First reply due in ${fmtLeft(rem)}`}><Ring value={pct} size={size} stroke={3.5} color={color}><span className="text-[9.5px] num font-medium leading-none" style={{ color: rem <= 0 || pct < 12 ? 'var(--bad)' : undefined }}>{fmtLeft(rem).replace('Overdue', 'Late')}</span></Ring></span>;
};
export const waitText = (since: number, now: number) => { const m = Math.max(0, Math.floor((now - since) / 60000)); return m < 1 ? 'Just now' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`; };

export const TPill = ({ s }: { s: string }) => <Pill tone={s === 'Escalated' ? 'danger' : s === 'Waiting' ? 'warning' : s === 'Closed' ? 'neutral' : 'info'} dot>{s}</Pill>;
