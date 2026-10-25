"use client";
import { useEffect, useState } from 'react';
import { Download, Laptop, RotateCcw, Smartphone } from 'lucide-react';
import { Button, Field, Pill, Segmented, Switch, Card, CardHeader, stagger } from '../../ui/kit';
import { useApp } from '../../store';
import { cn } from '../../lib/format';
import { PCard, PASSWORD, Row, strength, useSnap } from './parts';

type P = { hl: (id: string) => boolean };

export function PasswordCard({ hl }: P) {
  const { toast } = useApp();
  const [f, setF] = useState({ cur: '', next: '', conf: '' }); const [tried, setTried] = useState(false);
  const dirty = !!(f.cur || f.next || f.conf); const st = strength(f.next);
  const e: Record<string, string> = {};
  if (!f.cur) e.cur = 'Please enter your current password.'; else if (f.cur !== PASSWORD) e.cur = 'That is not your current password.';
  if (f.next.length < 8) e.next = 'Use at least 8 characters.'; else if (!/\d/.test(f.next) || !/[A-Za-z]/.test(f.next)) e.next = 'Mix letters and numbers.'; else if (f.next === f.cur) e.next = 'Choose something different from the current one.';
  if (f.conf !== f.next) e.conf = 'The two passwords do not match.';
  const save = () => { setTried(true); if (Object.keys(e).length) return; setF({ cur: '', next: '', conf: '' }); setTried(false); toast('Password changed', { body: 'Other devices stay signed in' }); };
  const show = (k: string) => (tried || f[k as 'cur']) ? e[k] : undefined;
  return (
    <PCard id="password" title="Password" sub="Change it every few months." dirty={dirty} onSave={save} onReset={() => { setF({ cur: '', next: '', conf: '' }); setTried(false); }} hl={hl('password')} i={0} saveLabel="Update password">
      <div className="flex flex-col gap-3">
        <Field label="Current password" type="password" value={f.cur} onChange={(v) => setF({ ...f, cur: v })} error={show('cur')} />
        <Field label="New password" type="password" value={f.next} onChange={(v) => setF({ ...f, next: v })} error={show('next')} />
        <div>
          <div className="flex gap-1.5">{[1, 2, 3, 4].map((i) => <span key={i} className="h-1.5 flex-1 rounded-full bg-stone overflow-hidden"><span className="block h-full rounded-full transition-all duration-500" style={{ width: st.n >= i ? '100%' : '0%', background: st.n <= 1 ? 'var(--bad)' : st.n === 2 ? 'var(--warn)' : 'var(--sage)' }} /></span>)}</div>
          <div className="text-[12px] text-muted mt-1.5 h-4">{st.label && `Strength: ${st.label}`}</div>
        </div>
        <Field label="Confirm new password" type="password" value={f.conf} onChange={(v) => setF({ ...f, conf: v })} error={show('conf')} />
      </div>
    </PCard>
  );
}

const qr = Array.from({ length: 169 }, (_, i) => { const x = i % 13, y = Math.floor(i / 13); const f = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8); return f ? (x % 3 === 0 || y % 3 === 0 || (x === 1 || x === 11) && (y === 1) ? 1 : 0) || ((x + y) % 2) : ((x * 7 + y * 13 + x * y) % 5 < 2 ? 1 : 0); });
export function TwoStepCard({ hl, onCodes, codesDone, onActive }: P & { onCodes: () => void; codesDone: boolean; onActive: (a: boolean) => void }) {
  const { toast, confirm } = useApp();
  const s = useSnap({ newDevice: true });
  const [state, setState] = useState<'active' | 'pending'>('active'); const [code, setCode] = useState(''); const [cerr, setCerr] = useState('');
  const reset = async () => { if (await confirm({ title: 'Reset authenticator?', body: 'Your current app stops working. You will scan a new code right away.', confirmLabel: 'Reset', danger: true })) { setState('pending'); onActive(false); setCode(''); setCerr(''); } };
  const verify = () => { if (!/^\d{6}$/.test(code)) return setCerr('Enter the 6 digits shown in your app.'); setState('active'); onActive(true); toast('Authenticator is set up again', { star: true }); };
  const download = () => {
    const codes = Array.from({ length: 8 }, () => `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase());
    const txt = `Richiva backup codes for owner@richiva.com\nCreated 18 Oct 2026. Each code works once.\n\n${codes.join('\n')}\n`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = 'richiva-backup-codes.txt'; a.click(); URL.revokeObjectURL(a.href);
    onCodes(); toast('Backup codes downloaded', { body: 'Keep the file somewhere safe' });
  };
  return (
    <PCard id="twostep" title="Two-step verification" sub="A second code when you sign in." dirty={s.dirty} onSave={() => { s.commit(); toast('Two-step settings saved'); }} onReset={s.reset} hl={hl('twostep')} i={1}>
      <div className="flex items-center gap-2 mb-4"><Pill tone={state === 'active' ? 'success' : 'warning'} dot>{state === 'active' ? 'Active' : 'Needs setup'}</Pill><span className="text-muted text-[12.5px]">Authenticator app</span></div>
      {state === 'pending' ? (
        <div className="anim-fade-in rounded-xl bg-soft border border-line p-4 flex gap-4 items-start">
          <div className="grid grid-cols-[repeat(13,1fr)] w-28 shrink-0 bg-white p-1.5 rounded-lg">{qr.map((b, i) => <span key={i} className={cn('aspect-square', b ? 'bg-[#111]' : 'bg-white')} />)}</div>
          <div className="flex-1"><div className="text-[13px] text-muted mb-2">Scan with your authenticator app, then enter the code.</div><Field label="6-digit code" value={code} onChange={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setCerr(''); }} error={cerr} /><Button size="sm" className="mt-3" onClick={verify}>Verify</Button></div>
        </div>
      ) : <Row title="Ask on every new device" sub="Recommended for owners." checked={s.v.newDevice} onChange={(v) => s.setV({ newDevice: v })} />}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>Reset authenticator</Button>
        <Button variant="secondary" size="sm" icon={Download} onClick={download}>Download backup codes</Button>
      </div>
      {!codesDone && <div className="text-muted text-[12px] mt-2">You have not saved backup codes yet.</div>}
    </PCard>
  );
}

const EVENTS = ['New orders', 'Low stock', 'Return requests', 'Customer messages', 'Privacy requests', 'Weekly summary'];
const NOTE0 = EVENTS.map((_, i) => [true, i === 0 || i === 4, i !== 5 || false]);
export function NotifyCard({ hl }: P) {
  const { toast } = useApp(); const s = useSnap<boolean[][]>(NOTE0);
  const set = (r: number, c: number, v: boolean) => s.setV(s.v.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  return (
    <PCard id="notifications" title="Notifications" sub="What you get and where." dirty={s.dirty} onSave={() => { s.commit(); toast('Notification choices saved'); }} onReset={s.reset} hl={hl('notifications')} i={2}>
      <div className="overflow-x-auto"><table className="w-full text-[14px]"><thead><tr className="label-caps text-left"><th className="pb-2 font-normal" /><th className="pb-2 font-normal text-center">Email</th><th className="pb-2 font-normal text-center">SMS</th><th className="pb-2 font-normal text-center">In app</th></tr></thead>
        <tbody>{EVENTS.map((ev, r) => <tr key={ev} className="border-t border-line"><td className="py-2.5 pr-3">{ev}</td>{[0, 1, 2].map((c) => <td key={c} className="text-center"><span className="inline-flex"><Switch checked={s.v[r][c]} onChange={(v) => set(r, c, v)} label={`${ev} ${['email', 'SMS', 'in app'][c]}`} /></span></td>)}</tr>)}</tbody></table></div>
    </PCard>
  );
}

export function LanguageCard({ hl }: P) {
  const { toast } = useApp(); const s = useSnap({ bs: false });
  return (
    <PCard id="language" title="Language" sub="More languages are on the way." dirty={s.dirty} onSave={() => { s.commit(); toast('Language settings saved'); }} onReset={s.reset} hl={hl('language')} i={4}>
      {[['English', true], ['नेपाली (Nepali)', false], ['हिन्दी (Hindi)', false]].map(([n, on]) => (
        <label key={n as string} className={cn('flex items-center justify-between py-3 border-b border-line', !on && 'opacity-55')}>
          <span className="flex items-center gap-3"><span className={cn('size-4 rounded-full border-2 flex items-center justify-center', on ? 'border-ink' : 'border-line')}>{on && <span className="size-2 rounded-full bg-ink anim-pop" />}</span>{n as string}</span>
          {!on && <Pill>Coming soon</Pill>}
        </label>
      ))}
      <Row title="Show Nepali (BS) dates too" sub="Beside every English date." checked={s.v.bs} onChange={(v) => s.setV({ bs: v })} />
    </PCard>
  );
}

const SESS = [{ id: 's1', dev: 'Chrome on macOS', place: 'Lalitpur, Nepal', when: 'This device, active now', icon: Laptop, cur: true }, { id: 's2', dev: 'Safari on iPhone', place: 'Kathmandu, Nepal', when: '2 hours ago', icon: Smartphone, cur: false }, { id: 's3', dev: 'Firefox on Windows', place: 'Pokhara, Nepal', when: 'Yesterday, 18:20', icon: Laptop, cur: false }];
export function SessionsCard({ hl }: P) {
  const { toast, logout } = useApp(); const [list, setList] = useState(SESS);
  const out = (s: (typeof SESS)[number]) => { if (s.cur) return logout(); setList((l) => l.filter((x) => x.id !== s.id)); toast('Logged out', { body: s.dev, undo: () => setList(SESS.filter((x) => x.cur || list.some((y) => y.id === x.id) || x.id === s.id)) }); };
  const others = list.filter((s) => !s.cur).length;
  return (
    <PCard id="sessions" title="Active sessions" sub="Places you are signed in." dirty={false} onSave={() => {}} hl={hl('sessions')} i={5} saveLabel="Saved automatically">
      {list.map((s) => (
        <div key={s.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0 anim-fade-in">
          <div className="size-10 rounded-full bg-stone flex items-center justify-center shrink-0"><s.icon size={18} strokeWidth={1.5} /></div>
          <div className="flex-1 min-w-0"><div className="text-[14px]">{s.dev}</div><div className="text-muted text-[12.5px]">{s.place} · {s.when}</div></div>
          <Button variant="secondary" size="sm" onClick={() => out(s)}>Log out</Button>
        </div>
      ))}
      {others > 1 && <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setList((l) => l.filter((s) => s.cur)); toast('Logged out of other devices'); }}>Log out all others</Button>}
    </PCard>
  );
}
void Segmented; void Card; void CardHeader; void stagger;

