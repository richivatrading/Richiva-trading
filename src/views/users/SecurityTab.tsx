"use client";
import { useState } from 'react';
import { Monitor, Smartphone, LogOut } from 'lucide-react';
import { Card, CardHeader, Switch, Select, Field, Button, Ring, SaveBar, Pill, Label, stagger } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { logAudit } from '../../data/seed';
import { useApp } from '../../store';

const INITIAL = { minLen: '10', upper: true, number: true, symbol: false, expire: false, mfa: false, timeout: '30 minutes', allow: false, ips: '202.79.32.0, 103.10.28.7' };
const SESSIONS = [
  { id: 's1', who: 'Anita Shrestha', dev: 'Chrome on macOS', where: 'Kathmandu', now: true, icon: Monitor },
  { id: 's2', who: 'Bikram Thapa', dev: 'Chrome on Windows', where: 'Lalitpur', icon: Monitor },
  { id: 's3', who: 'Dipesh Lama', dev: 'Chrome on Android', where: 'Bhaktapur', icon: Smartphone },
];
const validIp = (s: string) => /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(s) && s.split('/')[0].split('.').every((n) => +n <= 255);

export default function SecurityTab() {
  const { toast, confirm } = useApp();
  const [saved, setSaved] = useState(INITIAL);
  const [d, setD] = useState(INITIAL);
  const [sessions, setSessions] = useState(SESSIONS);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const set = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));
  const ipErr = d.allow ? (d.ips.split(',').map((s) => s.trim()).filter(Boolean).find((s) => !validIp(s)) ? 'One of the addresses looks wrong. Use a format like 202.79.32.14.' : d.ips.trim() ? undefined : 'Add at least one IP address.') : undefined;
  const score = Math.min(100, 20 + (+d.minLen - 8) * 4 + (d.upper ? 6 : 0) + (d.number ? 6 : 0) + (d.symbol ? 10 : 0) + (d.expire ? 8 : 0) + (d.mfa ? 25 : 0) + (['15 minutes', '30 minutes'].includes(d.timeout) ? 10 : d.timeout === '1 hour' ? 5 : 0) + (d.allow && !ipErr ? 15 : 0));
  const verdict = score >= 80 ? 'Strong' : score >= 55 ? 'Good, can improve' : 'Needs attention';
  const save = () => {
    if (ipErr) return toast('Please fix the IP list first');
    logAudit({ user: 'Anita Shrestha', module: 'Users', action: 'Updated security settings', item: 'Security', before: `score: ${INITIAL === saved ? 'earlier' : 'previous'}`, after: `score: ${score}` });
    setSaved(d); toast('Security settings saved', { star: true });
  };
  const out = async (s: (typeof SESSIONS)[number]) => {
    if (!(await confirm({ title: `Log out ${s.who}?`, body: `${s.dev} in ${s.where} will be signed out.`, confirmLabel: 'Log out', danger: true }))) return;
    setSessions((a) => a.filter((x) => x.id !== s.id)); logAudit({ user: 'Anita Shrestha', module: 'Users', action: 'Ended session', item: s.who });
    toast('Session ended', { undo: () => setSessions(SESSIONS.filter((x) => sessions.some((y) => y.id === x.id) || x.id === s.id)) });
  };
  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => <div className="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0"><div><div>{label}</div>{sub && <div className="text-muted text-[12px]">{sub}</div>}</div>{children}</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-3 flex items-center gap-6 flex-wrap">
        <Ring value={score} size={110} stroke={8} color={score >= 80 ? 'var(--sage)' : 'var(--champagne)'}><span className="text-[26px] font-semibold num">{score}</span></Ring>
        <div><Label>Security score</Label><div className="font-title text-[32px] flex items-center gap-2">{verdict}<Star size={16} twinkle /></div><p className="text-muted text-[13px]">{d.mfa ? 'MFA is required for all admins, which is the biggest win.' : 'Requiring MFA for all admins adds the most to your score.'}</p></div>
      </Card>
      <Card className="lg:col-span-2" style={stagger(1)}>
        <CardHeader title="Password rules" />
        <Row label="Minimum length"><Select value={d.minLen} onChange={(v) => set({ minLen: v })} options={['8', '10', '12', '14']} className="w-28" /></Row>
        <Row label="Needs a capital letter"><Switch checked={d.upper} onChange={(v) => set({ upper: v })} label="Capital letter" /></Row>
        <Row label="Needs a number"><Switch checked={d.number} onChange={(v) => set({ number: v })} label="Number" /></Row>
        <Row label="Needs a symbol"><Switch checked={d.symbol} onChange={(v) => set({ symbol: v })} label="Symbol" /></Row>
        <Row label="Change password every 90 days"><Switch checked={d.expire} onChange={(v) => set({ expire: v })} label="Expiry" /></Row>
      </Card>
      <Card style={stagger(2)}>
        <CardHeader title="Sign in" />
        <Row label="MFA required for all admins" sub="Owner and Manager accounts"><Switch checked={d.mfa} onChange={(v) => set({ mfa: v })} label="MFA required" /></Row>
        <div className="pt-4"><Select label="Session timeout" value={d.timeout} onChange={(v) => set({ timeout: v })} options={['15 minutes', '30 minutes', '1 hour', '4 hours', '8 hours']} /></div>
      </Card>
      <Card className="lg:col-span-2" style={stagger(3)}>
        <CardHeader title="Active sessions" />
        {sessions.map((s) => <div key={s.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0 anim-fade-in"><div className="size-10 rounded-full bg-stone flex items-center justify-center"><s.icon size={18} strokeWidth={1.5} /></div><div className="flex-1"><div className="font-medium">{s.who} {s.now && <Pill tone="success" className="ml-1">This device</Pill>}</div><div className="text-muted text-[12px]">{s.dev}, {s.where}</div></div>{!s.now && <Button size="sm" variant="secondary" icon={LogOut} onClick={() => out(s)}>Log out</Button>}</div>)}
        {sessions.length === 1 && <p className="text-muted text-[13px] pt-3">Only this device is signed in.</p>}
      </Card>
      <Card style={stagger(4)}>
        <CardHeader title="IP allow-list" sub="Optional" />
        <Row label="Only allow listed addresses"><Switch checked={d.allow} onChange={(v) => set({ allow: v })} label="IP allow-list" /></Row>
        {d.allow && <div className="pt-4 anim-fade-up"><Field label="IP addresses, separated by commas" multiline rows={3} value={d.ips} onChange={(v) => set({ ips: v })} error={ipErr} /></div>}
      </Card>
      <SaveBar show={dirty} onSave={save} onDiscard={() => setD(saved)} />
    </div>
  );
}

