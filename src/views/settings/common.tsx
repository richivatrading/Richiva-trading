import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button, Card, CardHeader, Field, Modal, Switch, stagger } from '../../ui/kit';
import { cn } from '../../lib/format';

export const PASSWORD = 'Richiva@2026';

export interface Hours { day: string; open: boolean; from: string; to: string }
export interface Form {
  store: { name: string; email: string; phone: string; address: string; city: string; logo: string; logoName: string; hours: Hours[]; instagram: string; facebook: string; tiktok: string };
  tax: { incl: boolean; pan: string; prefix: string; next: string; footer: string };
  currency: { dateFmt: string; decimals: string };
  pay: { ips: { on: boolean; merchant: string; key: string }; npx: { on: boolean; merchant: string; key: string }; cod: { on: boolean; min: string; max: string; fee: string } };
  couriers: { pathao: { on: boolean; id: string; key: string }; ncm: { on: boolean; id: string; key: string }; pickup: string; contact: string; phone: string };
  checkout: { guest: boolean; minOrder: string; phoneReq: boolean; terms: string };
  backups: { schedule: string; orders: boolean; media: boolean; config: boolean; email: string };
  messaging: { senderName: string; senderEmail: string; replyTo: string; smsId: string };
}
export const INITIAL: Form = {
  store: {
    name: 'Richiva', email: 'hello@richiva.com.np', phone: '+977 9801-234567', address: 'Jawalakhel Chowk, Lalitpur', city: 'Lalitpur', logo: '', logoName: '',
    hours: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => ({ day, open: i !== 6, from: '10:00', to: i === 5 ? '17:00' : '19:00' })),
    instagram: 'instagram.com/richiva.np', facebook: 'facebook.com/richiva.np', tiktok: '',
  },
  tax: { incl: true, pan: '604218735', prefix: 'RCV', next: '2048', footer: 'Thank you for choosing Richiva. Exchanges are accepted within 7 days with the tag attached.' },
  currency: { dateFmt: 'DD MMM YYYY', decimals: '0' },
  pay: { ips: { on: true, merchant: 'RICHIVA-IPS-0042', key: 'ips_live_8f21c7d94e3a7f3a' }, npx: { on: true, merchant: 'RICHIVA-NPX-1187', key: 'npx_live_5b19a0c2d6e4b91c' }, cod: { on: true, min: '500', max: '50000', fee: '100' } },
  couriers: { pathao: { on: true, id: 'richiva-pathao', key: 'pth_live_41d8e2a97c05b3e1' }, ncm: { on: true, id: 'richiva-ncm', key: 'ncm_live_9a60f7b2c1d84e57' }, pickup: 'Richiva Studio, Jawalakhel Chowk, Lalitpur', contact: 'Dipesh Lama', phone: '+977 9812-345678' },
  checkout: { guest: true, minOrder: '1000', phoneReq: true, terms: 'By placing this order you agree to our delivery, exchange and privacy policies. Made-to-order items cannot be returned.' },
  backups: { schedule: 'Every 6 hours', orders: true, media: true, config: true, email: 'owner@richiva.com' },
  messaging: { senderName: 'Richiva', senderEmail: 'orders@richiva.com.np', replyTo: 'hello@richiva.com.np', smsId: 'RICHIVA' },
};
export type Patch = <K extends keyof Form>(k: K, p: Partial<Form[K]>) => void;
export type Ask = (reason: string) => Promise<boolean>;
export interface SecProps { form: Form; patch: Patch; err: Record<string, string>; ask: Ask }

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const phoneOk = (s: string) => { const d = s.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13; };
const num = (s: string) => (/^\d+$/.test(s.trim()) ? +s : NaN);
const webOk = (s: string) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(s);
export function validate(f: Form) {
  const e: Record<string, string> = {};
  const s = f.store;
  if (s.name.trim().length < 2) e['store.name'] = 'Store name needs at least 2 letters.';
  if (!emailOk(s.email)) e['store.email'] = 'Please enter an email like hello@richiva.com.np.';
  if (!phoneOk(s.phone)) e['store.phone'] = 'Please enter a phone number with 10 to 13 digits.';
  if (s.address.trim().length < 5) e['store.address'] = 'Please enter the street or area.';
  if (s.city.trim().length < 2) e['store.city'] = 'Please enter the city.';
  s.hours.forEach((h, i) => { if (h.open && h.from >= h.to) e[`store.hours.${i}`] = 'Closing must be after opening.'; });
  (['instagram', 'facebook', 'tiktok'] as const).forEach((k) => { if (s[k] && !webOk(s[k])) e[`store.${k}`] = 'Please enter a web address like instagram.com/richiva.np.'; });
  const t = f.tax;
  if (!/^\d{9}$/.test(t.pan)) e['tax.pan'] = 'PAN or VAT number has 9 digits.';
  if (!/^[A-Za-z0-9-]{2,8}$/.test(t.prefix)) e['tax.prefix'] = 'Use 2 to 8 letters or numbers.';
  if (!(num(t.next) > 0)) e['tax.next'] = 'Enter a whole number above 0.';
  if (t.footer.length > 160) e['tax.footer'] = `Keep it under 160 characters (now ${t.footer.length}).`;
  (['ips', 'npx'] as const).forEach((k) => {
    const p = f.pay[k]; if (!p.on) return;
    if (p.merchant.trim().length < 4) e[`pay.${k}.merchant`] = 'Merchant ID needs at least 4 characters.';
    if (p.key.trim().length < 8) e[`pay.${k}.key`] = 'The key looks too short.';
  });
  const c = f.pay.cod;
  if (isNaN(num(c.min))) e['pay.cod.min'] = 'Enter a whole number.';
  if (isNaN(num(c.max))) e['pay.cod.max'] = 'Enter a whole number.'; else if (num(c.max) <= num(c.min)) e['pay.cod.max'] = 'Maximum must be above the minimum.';
  if (isNaN(num(c.fee))) e['pay.cod.fee'] = 'Enter a whole number (0 for free).';
  (['pathao', 'ncm'] as const).forEach((k) => {
    const p = f.couriers[k]; if (!p.on) return;
    if (p.id.trim().length < 3) e[`couriers.${k}.id`] = 'Account ID needs at least 3 characters.';
    if (p.key.trim().length < 8) e[`couriers.${k}.key`] = 'The key looks too short.';
  });
  if (f.couriers.pickup.trim().length < 8) e['couriers.pickup'] = 'Please enter the full pickup address.';
  if (f.couriers.contact.trim().length < 2) e['couriers.contact'] = 'Who should the rider ask for?';
  if (!phoneOk(f.couriers.phone)) e['couriers.phone'] = 'Please enter a phone number with 10 to 13 digits.';
  if (isNaN(num(f.checkout.minOrder))) e['checkout.minOrder'] = 'Enter a whole number (0 for none).';
  if (f.checkout.terms.trim().length < 20) e['checkout.terms'] = 'Terms text should be at least 20 characters.';
  const b = f.backups;
  if (!b.orders && !b.media && !b.config) e['backups.targets'] = 'Pick at least one thing to back up.';
  if (!emailOk(b.email)) e['backups.email'] = 'Please enter a valid email for backup reports.';
  const m = f.messaging;
  if (m.senderName.trim().length < 2) e['messaging.senderName'] = 'Sender name needs at least 2 letters.';
  if (!emailOk(m.senderEmail)) e['messaging.senderEmail'] = 'Please enter a valid sender email.';
  if (!emailOk(m.replyTo)) e['messaging.replyTo'] = 'Please enter a valid reply-to email.';
  if (!/^[A-Za-z0-9]{3,11}$/.test(m.smsId)) e['messaging.smsId'] = 'SMS sender ID is 3 to 11 letters or numbers.';
  return e;
}

/* ---------- password modal ---------- */
function PasswordModal({ reason, onDone }: { reason: string; onDone: (ok: boolean) => void }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [shake, setShake] = useState(0);
  const go = () => {
    if (!pw) return setErr('Please type your password.');
    if (pw !== PASSWORD) { setErr('That password is not right. Please try again.'); setShake((s) => s + 1); return; }
    onDone(true);
  };
  return (
    <Modal open onClose={() => onDone(false)} title="Please confirm it is you" size="sm"
      footer={<><Button variant="secondary" onClick={() => onDone(false)}>Cancel</Button><Button onClick={go}>Confirm</Button></>}>
      <div className="text-muted mb-4">{reason}</div>
      <div key={shake} className={shake ? 'anim-shake' : ''}>
        <Field label="Your password" type="password" value={pw} onChange={(v) => { setPw(v); setErr(''); }} error={err} autoFocus onKeyDown={(e) => e.key === 'Enter' && go()} />
      </div>
    </Modal>
  );
}
export function usePasswordAsk() {
  const [st, setSt] = useState<null | { reason: string; resolve: (b: boolean) => void }>(null);
  const ask: Ask = (reason) => new Promise((resolve) => setSt({ reason, resolve }));
  const node = st ? <PasswordModal reason={st.reason} onDone={(ok) => { st.resolve(ok); setSt(null); }} /> : null;
  return [ask, node] as const;
}

/* ---------- small building blocks ---------- */
export function SettingCard({ title, sub, children, i = 0, action }: { title: ReactNode; sub?: ReactNode; children: ReactNode; i?: number; action?: ReactNode }) {
  return <Card hover={false} style={stagger(i)}><CardHeader title={title} sub={sub} action={action} />{children}</Card>;
}
export function SwitchRow({ title, sub, checked, onChange, disabled }: { title: ReactNode; sub?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-line last:border-0">
      <div><div className="text-[14px]">{title}</div>{sub && <div className="text-muted text-[12.5px] mt-0.5">{sub}</div>}</div>
      <Switch checked={checked} onChange={onChange} label={typeof title === 'string' ? title : undefined} disabled={disabled} />
    </div>
  );
}
export function DrawnCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6.5" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 500ms var(--ease) forwards' }} />
    </svg>
  );
}
export function VerifyButton({ label = 'Verify connection' }: { label?: string }) {
  const [st, setSt] = useState<'idle' | 'busy' | 'ok'>('idle');
  const go = () => { setSt('busy'); setTimeout(() => setSt('ok'), 1600); };
  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" loading={st === 'busy'} onClick={go}>{st === 'busy' ? 'Checking' : label}</Button>
      {st === 'ok' && <span className="inline-flex items-center gap-1.5 text-ok text-[13px] anim-fade-in"><DrawnCheck />Connected</span>}
    </div>
  );
}
export function SecretField({ label, value, onChange, ask, error }: { label: string; value: string; onChange: (v: string) => void; ask: Ask; error?: string }) {
  const [shown, setShown] = useState(false);
  const toggle = async () => { if (shown) return setShown(false); if (await ask(`Please type your password to reveal the ${label.toLowerCase()}.`)) setShown(true); };
  const masked = '•'.repeat(14) + value.slice(-4);
  return (
    <Field label={label} value={shown ? value : masked} onChange={onChange} disabled={!shown} error={error}
      right={<button type="button" onClick={toggle} className={cn('h-8 px-3 rounded-full text-[12.5px] border border-line hover:border-champagne transition-colors', shown && 'bg-stone')}>{shown ? 'Hide' : 'Show'}</button>} />
  );
}
export const Grid2 = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>{children}</div>;
export const Saved = () => <span className="inline-flex items-center gap-1 text-ok text-[12.5px]"><Check size={14} />Saved</span>;
