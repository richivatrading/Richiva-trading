import { Bell, CheckCheck } from 'lucide-react';
import { Logo } from '../../ui/brand';

import { fill, type Ch } from './data';

export function Preview({ ch, subject, body }: { ch: Ch; subject: string; body: string }) {
  const b = fill(body), s = fill(subject);
  if (ch === 'email') return (
    <div className="rounded-xl border border-line overflow-hidden bg-card shadow-[var(--shadow)]">
      <div className="flex items-center gap-1.5 px-3 h-8 bg-stone"><span className="size-2.5 rounded-full bg-line" /><span className="size-2.5 rounded-full bg-line" /><span className="size-2.5 rounded-full bg-line" /><span className="ml-3 text-[11px] text-muted">Inbox</span></div>
      <div className="px-5 pt-4 pb-2 border-b border-line text-[13px]"><div className="font-medium text-[15px]">{s || 'No subject'}</div><div className="text-muted mt-0.5">From Richiva &lt;hello@richiva.com&gt; to Sunita Gurung</div></div>
      <div className="px-6 py-6 bg-soft"><div className="max-w-md mx-auto bg-card rounded-lg border border-line p-6"><Logo width={96} className="mb-5" /><div className="text-[14px] leading-relaxed whitespace-pre-line">{b}</div><div className="mt-5"><span className="inline-flex h-9 px-5 rounded-full bg-ink text-inkfg text-[13px] items-center">View my order</span></div></div></div>
    </div>
  );
  if (ch === 'sms') return (
    <div className="mx-auto w-[280px] rounded-[32px] border-[6px] border-ink/90 bg-card p-4 pt-6 min-h-[260px]">
      <div className="text-center text-[11px] text-muted mb-4">Richiva · Today 10:42</div>
      <div className="bg-stone rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13.5px] leading-snug whitespace-pre-line max-w-[90%]">{b}</div>
    </div>
  );
  if (ch === 'whatsapp') return (
    <div className="rounded-2xl p-5 min-h-[240px] bg-[color-mix(in_srgb,var(--sage)_14%,var(--soft))] border border-line">
      <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm px-3.5 py-2.5 bg-[color-mix(in_srgb,var(--sage)_30%,var(--card))] shadow-sm text-[13.5px] leading-snug whitespace-pre-line">
        {b}<div className="flex items-center justify-end gap-1 text-[10px] text-muted mt-1">10:42<CheckCheck size={13} className="text-info" /></div>
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl p-5 min-h-[200px] bg-soft border border-line">
      <div className="bg-card/95 rounded-2xl border border-line shadow-[var(--shadow)] p-3.5 flex gap-3 items-start backdrop-blur">
        <div className="size-10 rounded-xl bg-ink text-inkfg flex items-center justify-center shrink-0"><Bell size={18} strokeWidth={1.5} /></div>
        <div className="min-w-0"><div className="flex justify-between text-[11px] text-muted"><span>RICHIVA</span><span>now</span></div><div className="font-medium text-[14px] truncate">{s || 'Notification'}</div><div className="text-[13px] text-muted leading-snug">{b}</div></div>
      </div>
    </div>
  );
}

export function DrawnCheck() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="36" cy="36" r="30" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 600ms var(--ease) forwards' }} />
      <path d="M23 37l9 9 17-19" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 500ms var(--ease) 500ms forwards' }} />
    </svg>
  );
}
