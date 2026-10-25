"use client";
import { useState } from 'react';
import { ChevronDown, Download, FlaskConical, Mail, MessageCircle, RotateCw } from 'lucide-react';
import { Button, Card, CardHeader, CelebrateState, Pill, SaveBar, StatusPill, Switch, Avatar, stagger } from '../../ui/kit';
import { cn } from '../../lib/format';
import { navigate, useApp } from '../../store';
import { BACKUPS0, ERRORS0, HOOKS0, PEOPLE, RELEASES, type Backup, type ErrorRow, type Hook } from './data';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Row = ({ i, children }: { i: number; children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-4 px-6 py-3.5 border-b border-line last:border-0 anim-fade-up hover:bg-soft/70 transition-colors" style={stagger(i)}>{children}</div>;

export function ErrorsTab() {
  const { toast } = useApp();
  const [rows, setRows] = useState<ErrorRow[]>(ERRORS0);
  const [busy, setBusy] = useState<string | null>(null);
  const retry = async (r: ErrorRow) => {
    setBusy(r.id); await wait(1100); setBusy(null);
    setRows((x) => x.filter((e) => e.id !== r.id)); toast('Retry worked', { body: `${r.service} call for ${r.order} went through.` });
  };
  if (!rows.length) return <CelebrateState title="No failed calls" body="Everything went through." />;
  return <div>{rows.map((r, i) => (
    <Row key={r.id} i={i}>
      <div className="w-32 text-muted text-[13px]">{r.time}</div>
      <div className="flex-1 min-w-[220px]"><div className="font-medium">{r.service}</div><div className="text-muted text-[13px]">{r.message}</div></div>
      <button onClick={() => navigate(`/orders/${r.order}`)} className="text-[13px] underline underline-offset-4 decoration-line hover:decoration-champagne num">{r.order}</button>
      <Button size="sm" variant="secondary" icon={RotateCw} loading={busy === r.id} onClick={() => retry(r)}>Retry</Button>
    </Row>
  ))}</div>;
}

export function WebhooksTab() {
  const { toast } = useApp();
  const [rows, setRows] = useState<Hook[]>(HOOKS0);
  const [busy, setBusy] = useState<string | null>(null);
  const replay = async (h: Hook) => {
    setBusy(h.id); await wait(900); setBusy(null);
    setRows((x) => x.map((e) => (e.id === h.id ? { ...e, status: 'Delivered' } : e))); toast('Event replayed', { body: `${h.event} for ${h.ref}` });
  };
  return <div>{rows.map((h, i) => (
    <Row key={h.id} i={i}>
      <div className="w-14 text-muted text-[13px] num">{h.time}</div>
      <div className="flex-1 min-w-[220px]"><div className="font-medium">{h.source}</div><code className="text-[12.5px] text-muted">{h.event}</code></div>
      <button onClick={() => navigate(`/orders/${h.ref}`)} className="text-[13px] underline underline-offset-4 decoration-line hover:decoration-champagne num">{h.ref}</button>
      <StatusPill status={h.status} />
      <Button size="sm" variant="secondary" icon={RotateCw} loading={busy === h.id} onClick={() => replay(h)}>Replay</Button>
    </Row>
  ))}</div>;
}

export function BackupsTab() {
  const { toast } = useApp();
  const [rows, setRows] = useState<Backup[]>(BACKUPS0);
  const [busy, setBusy] = useState<string | null>(null);
  const test = async (b: Backup) => {
    setBusy(b.id); await wait(1600); setBusy(null);
    setRows((x) => x.map((e) => (e.id === b.id ? { ...e, test: 'Passed' } : e))); toast('Restore test passed', { body: `Backup from ${b.date} restores cleanly.`, star: true });
  };
  return <div>{rows.map((b, i) => (
    <Row key={b.id} i={i}>
      <div className="flex-1 min-w-[180px]"><div className="font-medium">{b.date}</div><div className="text-muted text-[13px]">Daily backup</div></div>
      <div className="w-24 num text-[13px]">{b.size}</div>
      <Pill tone={b.test === 'Passed' ? 'success' : b.test === 'Failed' ? 'danger' : 'neutral'} dot>{b.test === 'Not tested' ? 'Restore not tested' : `Restore test ${b.test.toLowerCase()}`}</Pill>
      <Button size="sm" variant="secondary" icon={FlaskConical} loading={busy === b.id} onClick={() => test(b)}>Test restore</Button>
      <Button size="sm" variant="ghost" icon={Download} onClick={() => toast('Download started', { body: b.date })}>Download</Button>
    </Row>
  ))}</div>;
}

export function ReleasesTab() {
  const [open, setOpen] = useState<string | null>('admin');
  return <div>{RELEASES.map((r, i) => (
    <div key={r.id} className="border-b border-line last:border-0 anim-fade-up" style={stagger(i)}>
      <button onClick={() => setOpen(open === r.id ? null : r.id)} className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-soft/70 transition-colors">
        <div className="flex-1"><div className="font-medium">{r.name}</div><div className="text-muted text-[13px]">Released {r.date}</div></div>
        <Pill tone="ink">{r.version}</Pill><Pill tone="success" dot>Live</Pill>
        <ChevronDown size={16} className={cn('text-muted transition-transform duration-300', open === r.id && 'rotate-180')} />
      </button>
      <div className="grid transition-all duration-400 ease-[var(--ease)]" style={{ gridTemplateRows: open === r.id ? '1fr' : '0fr' }}>
        <ul className="overflow-hidden px-6 text-[14px] text-muted space-y-1.5">
          {r.log.map((l, j) => <li key={j} className="flex gap-2"><span className="mt-2 size-1 rounded-full bg-champagne shrink-0" />{l}</li>)}
          <li className="pb-4" />
        </ul>
      </div>
    </div>
  ))}</div>;
}

type Rules = Record<string, { email: boolean; wa: boolean }>;
const init = (): Rules => Object.fromEntries(PEOPLE.map((p) => [p.id, { email: p.role !== 'Warehouse', wa: p.role === 'Owner' || p.role === 'Manager' }]));
export function AlertRules() {
  const { toast } = useApp();
  const [saved, setSaved] = useState<Rules>(init);
  const [rules, setRules] = useState<Rules>(saved);
  const dirty = JSON.stringify(saved) !== JSON.stringify(rules);
  const set = (id: string, k: 'email' | 'wa', v: boolean) => setRules((r) => ({ ...r, [id]: { ...r[id], [k]: v } }));
  const none = !Object.values(rules).some((r) => r.email || r.wa);
  return (
    <Card>
      <CardHeader title="Alert rules" sub="Choose who hears about it when a service is down." />
      <div className="grid grid-cols-[1fr_80px_80px] items-center gap-y-1">
        <div /><div className="label-caps text-center flex items-center justify-center gap-1"><Mail size={12} />Email</div><div className="label-caps text-center flex items-center justify-center gap-1"><MessageCircle size={12} />WhatsApp</div>
        {PEOPLE.map((p) => (
          <div key={p.id} className="contents">
            <div className="flex items-center gap-3 py-2.5 border-t border-line"><Avatar name={p.name} size={32} /><div><div className="text-[14px]">{p.name}</div><div className="text-muted text-[12px]">{p.role}</div></div></div>
            <div className="flex justify-center border-t border-line py-2.5 h-full items-center"><Switch label={`${p.name} email`} checked={rules[p.id].email} onChange={(v) => set(p.id, 'email', v)} /></div>
            <div className="flex justify-center border-t border-line py-2.5 h-full items-center"><Switch label={`${p.name} WhatsApp`} checked={rules[p.id].wa} onChange={(v) => set(p.id, 'wa', v)} /></div>
          </div>
        ))}
      </div>
      {none && <div className="text-warn text-[13px] mt-4 anim-fade-in">Nobody will be told if a service goes down.</div>}
      <SaveBar show={dirty} onSave={() => { setSaved(rules); toast('Alert rules saved', { star: true }); }} onDiscard={() => setRules(saved)} />
    </Card>
  );
}

