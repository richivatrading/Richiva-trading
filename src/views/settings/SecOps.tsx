"use client";
import { useEffect, useRef, useState } from 'react';
import { Globe, Lock, Mail, MessageSquare, RotateCw, TriangleAlert } from 'lucide-react';
import { Button, Checkbox, ErrorState, Field, Pill, Progress, Select, Modal, KV } from '../../ui/kit';
import { useApp } from '../../store';
import { logAudit } from '../../data/seed';
import { Grid2, SettingCard, DrawnCheck, type Ask, type SecProps } from './common';

export function DomainsSection() {
  const { toast } = useApp();
  const [dns, setDns] = useState<'idle' | 'busy' | 'fail' | 'ok'>('idle');
  const tries = useRef(0);
  const check = () => { setDns('busy'); setTimeout(() => { tries.current += 1; setDns(tries.current === 1 ? 'fail' : 'ok'); if (tries.current > 1) toast('DNS looks good', { body: 'All records point to Richiva' }); }, 1200); };
  const recs = [['richiva.com.np', 'Primary', 'Connected'], ['www.richiva.com.np', 'Redirects to primary', 'Connected'], ['admin.richiva.com.np', 'Back office', 'Connected']];
  return (
    <div className="flex flex-col gap-6">
      <SettingCard title="Domains and SSL" sub="Where your shop lives online.">
        <div className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3 text-warn bg-[color-mix(in_srgb,var(--warn)_14%,transparent)]">
          <TriangleAlert size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <div className="text-[13.5px]"><b className="font-semibold">richiva.com.np renews in 41 days</b> (28 Nov 2026). Renew early so the shop never goes offline.</div>
          <Button size="sm" variant="secondary" className="ml-auto shrink-0" onClick={() => toast('Renewal reminder set', { body: 'We will email owner@richiva.com' })}>Remind me</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-line p-4"><div className="flex items-center gap-2 mb-1"><Globe size={16} strokeWidth={1.5} /><span className="label-caps">Domain</span></div><div className="text-[20px] font-medium">richiva.com.np</div><div className="mt-2"><Pill tone="warning" dot>Expires in 41 days</Pill></div></div>
          <div className="rounded-xl border border-line p-4"><div className="flex items-center gap-2 mb-1"><Lock size={16} strokeWidth={1.5} /><span className="label-caps">SSL certificate</span></div><div className="text-[20px] font-medium">Valid for 212 days</div><div className="mt-2 flex items-center gap-2"><Pill tone="success" dot>Renews itself</Pill><span className="text-muted text-[12.5px]">until 18 May 2027</span></div></div>
        </div>
      </SettingCard>
      <SettingCard i={1} title="Connected addresses" sub="Check that each one points to Richiva." action={dns !== 'fail' && <Button variant="secondary" size="sm" icon={RotateCw} loading={dns === 'busy'} onClick={check}>Re-check DNS</Button>}>
        {dns === 'fail' ? <ErrorState title="We could not reach the DNS check" body="This is usually brief. Please try again." onRetry={check} /> : recs.map(([d, n]) => (
          <div key={d} className="flex items-center justify-between py-3 border-b border-line last:border-0">
            <div><div className="text-[14px]">{d}</div><div className="text-muted text-[12.5px]">{n}</div></div>
            <span className="inline-flex items-center gap-1.5 text-ok text-[13px]"><DrawnCheck size={16} />Connected</span>
          </div>
        ))}
      </SettingCard>
    </div>
  );
}

export function BackupsSection({ form, patch, err }: SecProps) {
  const { toast } = useApp();
  const b = form.backups; const up = (d: Partial<typeof b>) => patch('backups', d);
  const [last, setLast] = useState('2 hours ago');
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    if (pct === null || pct >= 100) return;
    const t = setTimeout(() => setPct((p) => Math.min(100, (p ?? 0) + 6 + Math.random() * 12)), 260);
    return () => clearTimeout(t);
  }, [pct]);
  useEffect(() => { if (pct !== null && pct >= 100) { setLast('Just now'); toast('Backup finished', { body: '1.8 GB saved', star: true }); const t = setTimeout(() => setPct(null), 1400); return () => clearTimeout(t); } }, [pct]); // eslint-disable-line
  const running = pct !== null;
  return (
    <div className="flex flex-col gap-6">
      <SettingCard title="Backups" sub="Copies of your shop, kept safe off-site." action={<Button loading={running && pct! < 100} onClick={() => setPct(2)} disabled={running}>Run backup now</Button>}>
        {running && <div className="mb-5 anim-fade-in"><div className="flex justify-between text-[13px] mb-2"><span>{pct! >= 100 ? 'Backup complete' : 'Backing up…'}</span><span className="num">{Math.round(pct!)}%</span></div><Progress value={pct!} /></div>}
        <KV k="Last backup"><b className="font-medium">{last}</b> <Pill tone="success" dot className="ml-2">Healthy</Pill></KV>
        <KV k="Last restore test">3 Oct 2026 <Pill tone="success" className="ml-2">Passed</Pill></KV>
        <KV k="Stored in">Mumbai and Singapore regions</KV>
        <KV k="Kept for">30 days</KV>
      </SettingCard>
      <SettingCard i={1} title="Schedule and targets" sub="What gets saved, and how often.">
        <Select label="Schedule" value={b.schedule} onChange={(v) => up({ schedule: v })} options={['Every 6 hours', 'Every 12 hours', 'Daily at 02:00', 'Weekly on Saturday']} className="md:w-1/2" />
        <div className="mt-5 flex flex-col gap-3">
          <Checkbox checked={b.orders} onChange={(v) => up({ orders: v })} label="Orders, customers and payments" />
          <Checkbox checked={b.media} onChange={(v) => up({ media: v })} label="Product photos and media library" />
          <Checkbox checked={b.config} onChange={(v) => up({ config: v })} label="Settings, pages and home layout" />
          {err['backups.targets'] && <div className="text-bad text-[12px] anim-fade-in">{err['backups.targets']}</div>}
        </div>
        <Field className="mt-5 md:w-1/2" label="Send backup reports to" value={b.email} onChange={(v) => up({ email: v })} error={err['backups.email']} />
      </SettingCard>
    </div>
  );
}

export function MessagingSection({ form, patch, err }: SecProps) {
  const { toast } = useApp();
  const m = form.messaging; const up = (d: Partial<typeof m>) => patch('messaging', d);
  const [busy, setBusy] = useState(false);
  const test = () => { setBusy(true); setTimeout(() => { setBusy(false); toast('Test email sent', { body: `To ${m.replyTo}` }); }, 1200); };
  return (
    <div className="flex flex-col gap-6">
      <SettingCard title="Email and SMS" sub="Who messages come from.">
        <Grid2>
          <Field label="Sender name" value={m.senderName} onChange={(v) => up({ senderName: v })} error={err['messaging.senderName']} />
          <Field label="Sender email" value={m.senderEmail} onChange={(v) => up({ senderEmail: v })} error={err['messaging.senderEmail']} />
          <Field label="Reply-to email" value={m.replyTo} onChange={(v) => up({ replyTo: v })} error={err['messaging.replyTo']} />
          <Field label="SMS sender ID" value={m.smsId} onChange={(v) => up({ smsId: v.toUpperCase() })} error={err['messaging.smsId']} hint="Shown on the customer's phone." />
        </Grid2>
        <div className="mt-4"><Button variant="secondary" size="sm" icon={Mail} loading={busy} onClick={test}>Send a test email</Button></div>
      </SettingCard>
      <SettingCard i={1} title="Provider status" sub="Both are working right now.">
        {[[Mail, 'Email', 'Amazon SES', '4,820 sent this month'], [MessageSquare, 'SMS', 'Sparrow SMS', '1,260 credits left']].map(([I, n, p, d], i) => {
          const Ic = I as typeof Mail;
          return <div key={i} className="flex items-center justify-between py-3 border-b border-line last:border-0"><div className="flex items-center gap-3"><div className="size-10 rounded-full bg-stone flex items-center justify-center"><Ic size={18} strokeWidth={1.5} /></div><div><div className="text-[14px]">{n as string} · {p as string}</div><div className="text-muted text-[12.5px]">{d as string}</div></div></div><Pill tone="success" dot>Connected</Pill></div>;
        })}
      </SettingCard>
    </div>
  );
}

function DangerModal({ title, body, phrase, cta, onClose, onGo, ask }: { title: string; body: string; phrase: string; cta: string; onClose: () => void; onGo: () => void; ask: Ask }) {
  const [t, setT] = useState(''); const [touched, setTouched] = useState(false);
  const ok = t.trim() === phrase;
  const go = async () => { setTouched(true); if (!ok) return; if (await ask('Please type your password to continue.')) { onGo(); onClose(); } };
  return (
    <Modal open onClose={onClose} title={title} size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={go}>{cta}</Button></>}>
      <div className="text-muted mb-4">{body}</div>
      <Field label={`Type ${phrase} to confirm`} value={t} onChange={setT} autoFocus error={touched && !ok ? `Please type exactly: ${phrase}` : undefined} onKeyDown={(e) => e.key === 'Enter' && go()} />
    </Modal>
  );
}
export function DangerSection({ ask }: SecProps) {
  const { toast } = useApp();
  const [open, setOpen] = useState<null | 'clear' | 'close'>(null);
  const [closed, setClosed] = useState(false);
  const clear = () => { logAudit({ user: 'Anita Shrestha', module: 'Settings', action: 'Cleared test data', item: 'Test orders and customers', before: '14 test orders, 5 test customers', after: '0' }); toast('Test data cleared', { body: '14 orders, 5 customers removed' }); };
  const close = () => { logAudit({ user: 'Anita Shrestha', module: 'Settings', action: 'Closed store temporarily', item: 'richiva.com.np', before: 'Open', after: 'Closed' }); setClosed(true); toast('Store is now closed', { body: 'Customers see a friendly notice' }); };
  const reopen = () => { logAudit({ user: 'Anita Shrestha', module: 'Settings', action: 'Reopened store', item: 'richiva.com.np', before: 'Closed', after: 'Open' }); setClosed(false); toast('Store reopened', { star: true }); };
  return (
    <>
      <SettingCard title="Danger zone" sub="Careful actions. Each one asks for a typed phrase and your password.">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-line">
          <div className="max-w-md"><div className="text-[14.5px]">Clear test data</div><div className="text-muted text-[12.5px] mt-0.5">Removes orders, customers and payments made in test mode. Real orders are never touched.</div></div>
          <Button variant="danger" size="sm" onClick={() => setOpen('clear')}>Clear test data</Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="max-w-md"><div className="text-[14.5px] flex items-center gap-2">Close store temporarily {closed && <Pill tone="danger" dot>Closed</Pill>}</div><div className="text-muted text-[12.5px] mt-0.5">Customers see a notice and cannot check out. You can reopen any time.</div></div>
          {closed ? <Button variant="secondary" size="sm" onClick={reopen}>Reopen store</Button> : <Button variant="danger" size="sm" onClick={() => setOpen('close')}>Close store temporarily</Button>}
        </div>
      </SettingCard>
      {open === 'clear' && <DangerModal ask={ask} title="Clear test data" body="This permanently removes all test orders, test customers and test payments." phrase="CLEAR TEST DATA" cta="Clear test data" onClose={() => setOpen(null)} onGo={clear} />}
      {open === 'close' && <DangerModal ask={ask} title="Close store temporarily" body="Checkout will stop for all customers until you reopen the store." phrase="CLOSE STORE" cta="Close store" onClose={() => setOpen(null)} onGo={close} />}
    </>
  );
}

