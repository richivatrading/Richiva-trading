"use client";
import { useRef, useState } from 'react';
import { Bell, Mail, MessageCircle, RotateCw, Send, Smartphone } from 'lucide-react';
import { Button, Card, CardHeader, Chip, CountUp, DataTable, Drawer, EmptyState, Field, KV, Modal, PageHeader, Pill, Progress, SaveBar, SearchInput, Select, Skeleton, StatusPill, Switch, Tabs, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp, useRoute } from '../store';
import { cn, rs } from '../lib/format';
import { CHANNELS, EVENTS, SEED_LOG, VARS, fill, initialTemplates, initialTriggers, type Ch } from './notifications/data';
import { DrawnCheck, Preview } from './notifications/Previews';

const ICON = { email: Mail, sms: Smartphone, whatsapp: MessageCircle, push: Bell };
const TAB_IDS = ['templates', 'triggers', 'log', 'settings'] as const;
type TabId = (typeof TAB_IDS)[number];
const evLabel = (id: string) => EVENTS.find((e) => e.id === id)?.label ?? id;
const initialSettings = () => ({ quiet: true, from: '21:00', to: '08:00', sender: 'Richiva' });

export default function Notifications() {
  const { toast } = useApp();
  const { query } = useRoute();
  const loading = useFakeLoad(600);
  const [tab, setTab] = useState<TabId>(TAB_IDS.includes(query.tab as TabId) ? (query.tab as TabId) : 'templates');
  const [saved, setSaved] = useState(() => ({ tpl: initialTemplates(), trig: initialTriggers(), set: initialSettings() }));
  const [cfg, setCfg] = useState(saved);
  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);

  const [ev, setEv] = useState('placed');
  const [ch, setCh] = useState<Ch>('email');
  const [ver, setVer] = useState(0);
  const [lastVar, setLastVar] = useState<{ k: string; n: number } | null>(null);
  const [wa, setWa] = useState<Record<string, string>>(() => Object.fromEntries(EVENTS.map((e, i) => [e.id, i === 5 ? 'Pending' : i === 7 ? 'Rejected' : 'Approved'])));
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testErr, setTestErr] = useState('');
  const [testState, setTestState] = useState<'idle' | 'sending' | 'done'>('idle');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [log, setLog] = useState(SEED_LOG);
  const [logQ, setLogQ] = useState('');
  const [logSt, setLogSt] = useState('All');
  const [logOpen, setLogOpen] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const tpl = cfg.tpl[ev][ch];
  const setTpl = (patch: Partial<typeof tpl>) => {
    setCfg({ ...cfg, tpl: { ...cfg.tpl, [ev]: { ...cfg.tpl[ev], [ch]: { ...tpl, ...patch } } } });
    clearTimeout(timer.current); timer.current = setTimeout(() => setVer((v) => v + 1), 220);
    if (ch === 'whatsapp' && wa[ev] === 'Approved') setWa({ ...wa, [ev]: 'Draft' });
  };
  const insert = (k: string) => {
    const ta = taRef.current; const v = `{{${k}}}`;
    const a = ta?.selectionStart ?? tpl.body.length, b = ta?.selectionEnd ?? a;
    setTpl({ body: tpl.body.slice(0, a) + v + tpl.body.slice(b) });
    setLastVar({ k, n: (lastVar?.n ?? 0) + 1 });
    requestAnimationFrame(() => { ta?.focus(); ta?.setSelectionRange(a + v.length, a + v.length); });
  };
  const rendered = fill(tpl.body);
  const segs = Math.max(1, Math.ceil(rendered.length / 160));

  const openTest = () => { setTestOpen(true); setTestState('idle'); setTestErr(''); setTestTo(ch === 'email' ? 'owner@richiva.com' : ch === 'push' ? 'Anita (iPhone)' : '+977 9841-000000'); };
  const sendTest = () => {
    const ok = ch === 'email' ? /^\S+@\S+\.\S+$/.test(testTo) : ch === 'push' ? !!testTo.trim() : /^\+?[\d\s-]{9,}$/.test(testTo);
    if (!ok) return setTestErr(ch === 'email' ? 'Enter a valid email address.' : 'Enter a valid phone number.');
    setTestErr(''); setTestState('sending'); setTimeout(() => setTestState('done'), 900);
  };
  const submitWa = () => { setWa({ ...wa, [ev]: 'Pending' }); toast('Sent to WhatsApp for approval'); setTimeout(() => setWa((w) => ({ ...w, [ev]: 'Approved' })), 3000); };

  const resend = (id: string) => {
    setLog((l) => l.map((x) => (x.id === id ? { ...x, status: 'Queued', time: 'Just now' } : x)));
    toast('Message queued again');
    setTimeout(() => setLog((l) => l.map((x) => (x.id === id ? { ...x, status: 'Sent' } : x))), 1200);
    setTimeout(() => setLog((l) => l.map((x) => (x.id === id ? { ...x, status: 'Delivered' } : x))), 2800);
  };
  const logRows = log.filter((l) => (logSt === 'All' || l.status === logSt) && (!logQ || `${evLabel(l.event)} ${l.to}`.toLowerCase().includes(logQ.toLowerCase())));
  const openRow = log.find((l) => l.id === logOpen);

  const setT = (id: string, patch: object) => setCfg({ ...cfg, trig: { ...cfg.trig, [id]: { ...cfg.trig[id], ...patch } } });
  const S = cfg.set;
  const setS = (p: Partial<typeof S>) => setCfg({ ...cfg, set: { ...S, ...p } });
  const senderErr = S.sender.trim().length < 3 ? 'Sender name needs at least 3 characters.' : S.sender.length > 11 ? 'SMS sender names can be 11 characters at most.' : '';
  const save = () => {
    if (senderErr) { setTab('settings'); return toast('Fix the sender name first'); }
    setSaved(cfg); toast('Notification settings saved', { star: true });
  };

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Write the letters your customers receive, and decide when they are sent." />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ id: 'templates', label: 'Templates' }, { id: 'triggers', label: 'Triggers' }, { id: 'log', label: 'Send log', count: log.filter((l) => l.status === 'Failed').length }, { id: 'settings', label: 'Settings' }]} />

      {loading ? <div className="grid lg:grid-cols-[280px_1fr] gap-6"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div> : failed ? <Card><EmptyState icon={RotateCw} title="Could not load" body="Please try again." action={<Button variant="secondary" onClick={() => setFailed(false)}>Try again</Button>} /></Card> : (
        <>
          {tab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
              <Card pad={false} className="overflow-hidden">
                {EVENTS.map((e, i) => (
                  <button key={e.id} onClick={() => setEv(e.id)} style={stagger(i, 30)} className={cn('w-full flex items-center justify-between gap-2 px-5 py-3.5 text-left border-b border-line last:border-0 text-[14px] transition-colors anim-fade-up', ev === e.id ? 'bg-soft font-medium shadow-[inset_3px_0_0_var(--champagne)]' : 'hover:bg-soft/60')}>
                    {e.label}
                    <span className="flex gap-1 text-muted">{CHANNELS.map((c) => { const I = ICON[c.id]; return <I key={c.id} size={13} strokeWidth={1.5} className={cn(!cfg.trig[e.id][c.id] && 'opacity-25')} />; })}</span>
                  </button>
                ))}
              </Card>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card hover={false}>
                  <CardHeader title={evLabel(ev)} sub="Edit the message for each channel" action={<Button size="sm" variant="secondary" icon={Send} onClick={openTest}>Send test</Button>} />
                  <div className="flex gap-2 flex-wrap mb-5">{CHANNELS.map((c) => { const I = ICON[c.id]; return <Chip key={c.id} icon={I} active={ch === c.id} onClick={() => setCh(c.id)}>{c.label}</Chip>; })}</div>
                  {(ch === 'email' || ch === 'push') && <Field className="mb-4" label={ch === 'email' ? 'Subject' : 'Title'} value={tpl.subject} onChange={(v) => setTpl({ subject: v })} error={!tpl.subject.trim() ? 'A subject is needed.' : undefined} />}
                  <textarea ref={taRef} rows={ch === 'email' ? 9 : 6} value={tpl.body} onChange={(e) => setTpl({ body: e.target.value })} placeholder="Write your message" className="w-full rounded-[10px] bg-card border border-line px-3.5 py-3 text-[14px] outline-none resize-none leading-relaxed focus:border-champagne focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--champagne)_22%,transparent)] transition-all" />
                  <div className="flex items-center justify-between mt-2 text-[12px] text-muted min-h-5">
                    {ch === 'sms' ? <span className={cn('num', rendered.length > 160 && 'text-warn')}>{rendered.length} / 160 characters · {segs} segment{segs > 1 ? 's' : ''}</span> : <span />}
                    {ch === 'whatsapp' && <span className="flex items-center gap-2">WhatsApp approval <StatusPill status={wa[ev]} />{(wa[ev] === 'Draft' || wa[ev] === 'Rejected') && <Button size="sm" variant="secondary" onClick={submitWa}>Submit for approval</Button>}</span>}
                  </div>
                  <div className="label-caps mt-5 mb-2">Insert a variable</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(VARS).map((k) => (
                      <button key={k + (lastVar?.k === k ? lastVar.n : '')} onClick={() => insert(k)} className={cn('h-7 px-2.5 rounded-full border border-line bg-soft text-[12px] hover:border-champagne transition-colors', lastVar?.k === k && 'anim-pop border-champagne')}>{`{{${k}}}`}</button>
                    ))}
                  </div>
                </Card>
                <Card hover={false}>
                  <CardHeader title="Preview" sub="Sample values are filled in" />
                  <div key={`${ev}-${ch}-${ver}`} className="anim-fade-in"><Preview ch={ch} subject={tpl.subject} body={tpl.body} /></div>
                  <div className="flex items-center gap-2 mt-5 text-[13px] text-muted"><Star size={14} twinkle />This message gets opened by 72 percent of customers</div>
                </Card>
              </div>
            </div>
          )}

          {tab === 'triggers' && (
            <Card pad={false} className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[1.4fr_repeat(4,80px)_130px] gap-4 px-6 py-3 border-b border-line label-caps items-center"><span>Event</span>{CHANNELS.map((c) => <span key={c.id} className="text-center">{c.label}</span>)}<span>Delay (minutes)</span></div>
                {EVENTS.map((e, i) => (
                  <div key={e.id} style={stagger(i, 30)} className="grid grid-cols-[1.4fr_repeat(4,80px)_130px] gap-4 px-6 py-3.5 border-b border-line last:border-0 items-center anim-fade-up hover:bg-soft/60 transition-colors">
                    <span>{e.label}</span>
                    {CHANNELS.map((c) => <span key={c.id} className="flex justify-center"><Switch label={`${e.label} ${c.label}`} checked={cfg.trig[e.id][c.id]} onChange={(v) => setT(e.id, { [c.id]: v })} /></span>)}
                    <input type="number" min={0} value={cfg.trig[e.id].delay} onChange={(x) => setT(e.id, { delay: Math.max(0, +x.target.value || 0) })} className="h-9 w-24 rounded-[10px] border border-line bg-card px-3 text-[14px] outline-none focus:border-champagne num" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'log' && (
            <Card pad={false}>
              <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
                <SearchInput className="w-64" value={logQ} onChange={setLogQ} placeholder="Search event or recipient" />
                {['All', 'Queued', 'Sent', 'Delivered', 'Failed'].map((s) => <Chip key={s} active={logSt === s} onClick={() => setLogSt(s)}>{s}</Chip>)}
              </div>
              <DataTable rows={logRows} rowId={(r) => r.id} onRowClick={(r) => setLogOpen(r.id)} activeId={logOpen} flashIds={log.filter((l) => l.time === 'Just now').map((l) => l.id)}
                columns={[
                  { key: 'time', header: 'Time', render: (r) => <span className="text-muted whitespace-nowrap">{r.time}</span> },
                  { key: 'event', header: 'Event', sort: (r) => evLabel(r.event), render: (r) => evLabel(r.event) },
                  { key: 'ch', header: 'Channel', render: (r) => { const I = ICON[r.ch]; return <span className="inline-flex items-center gap-2"><I size={15} strokeWidth={1.5} />{CHANNELS.find((c) => c.id === r.ch)!.label}</span>; } },
                  { key: 'to', header: 'Recipient', hideBelow: 'lg', render: (r) => r.to },
                  { key: 'st', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
                  { key: 'act', header: '', align: 'right', render: (r) => <Button size="sm" variant="secondary" icon={RotateCw} onClick={(e) => { e.stopPropagation(); resend(r.id); }}>Resend</Button> },
                ]} />
            </Card>
          )}

          {tab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card hover={false}>
                <CardHeader title="Quiet hours" sub="Messages wait until morning" action={<Switch label="Quiet hours" checked={S.quiet} onChange={(v) => setS({ quiet: v })} />} />
                <div className={cn('grid grid-cols-2 gap-4 transition-opacity', !S.quiet && 'opacity-40 pointer-events-none')}>
                  <Field label="From" type="time" value={S.from} onChange={(v) => setS({ from: v })} />
                  <Field label="Until" type="time" value={S.to} onChange={(v) => setS({ to: v })} />
                </div>
                <div className="text-muted text-[13px] mt-4">{S.quiet ? `No SMS, WhatsApp or push between ${S.from} and ${S.to}. Email is not affected.` : 'Messages are sent at any hour.'}</div>
                <div className="mt-6"><Field label="Sender name" value={S.sender} onChange={(v) => setS({ sender: v })} error={senderErr} hint="Shown on SMS and email" /></div>
              </Card>
              <Card hover={false}>
                <CardHeader title="Providers" />
                {[['Email', 'Postmark', 'Connected'], ['SMS', 'Sparrow SMS', 'Connected'], ['WhatsApp', 'WhatsApp Business', 'Pending'], ['Push', 'Firebase', 'Connected']].map(([a, b, c]) => <KV key={a} k={`${a} · ${b}`}><StatusPill status={c} /></KV>)}
              </Card>
              <Card hover={false} className="lg:col-span-2">
                <CardHeader title="This month's usage" sub="Resets on 1 Kartik" />
                <div className="grid md:grid-cols-2 gap-8">
                  {[['SMS', 3420, 5000, 1.1], ['WhatsApp', 1180, 2000, 2.4]].map(([n, used, cap, unit]) => (
                    <div key={n as string}>
                      <div className="flex justify-between text-[14px] mb-2"><span>{n}</span><span className="text-muted"><CountUp value={used as number} /> of {(cap as number).toLocaleString('en-IN')} messages</span></div>
                      <Progress value={((used as number) / (cap as number)) * 100} color="var(--champagne)" />
                      <div className="text-[13px] text-muted mt-2">Cost so far <b className="text-fg font-medium"><CountUp value={Math.round((used as number) * (unit as number))} format={rs} /></b> at {rs(unit as number)} per message</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Send a test" size="sm" footer={testState === 'done' ? <Button onClick={() => setTestOpen(false)}>Close</Button> : <><Button variant="secondary" onClick={() => setTestOpen(false)}>Cancel</Button><Button icon={Send} loading={testState === 'sending'} onClick={sendTest}>Send test</Button></>}>
        {testState === 'done' ? (
          <div className="flex flex-col items-center text-center py-6"><DrawnCheck /><div className="font-title text-[26px] mt-3">Test sent</div><div className="text-muted text-[14px]">{evLabel(ev)} by {CHANNELS.find((c) => c.id === ch)!.label} to {testTo}</div></div>
        ) : (
          <div><p className="text-muted text-[14px] mb-4">We will send the {evLabel(ev)} {ch === 'push' ? 'push' : ch === 'email' ? 'email' : 'message'} with sample values.</p><Field label={ch === 'email' ? 'Recipient email' : ch === 'push' ? 'Device' : 'Recipient phone'} value={testTo} onChange={setTestTo} error={testErr} /></div>
        )}
      </Modal>

      <Drawer open={!!openRow} onClose={() => setLogOpen(null)} title={openRow ? evLabel(openRow.event) : ''} subtitle={openRow && `${openRow.time} · ${openRow.to}`} width={500}
        footer={openRow && <Button icon={RotateCw} variant="secondary" onClick={() => resend(openRow.id)}>Resend</Button>}>
        {openRow && <div className="space-y-5"><div className="flex items-center gap-2"><StatusPill status={openRow.status} /><Pill>{CHANNELS.find((c) => c.id === openRow.ch)!.label}</Pill></div><Preview ch={openRow.ch} subject={cfg.tpl[openRow.event][openRow.ch].subject} body={cfg.tpl[openRow.event][openRow.ch].body} />{openRow.status === 'Failed' && <div className="text-bad text-[13px]">The provider could not deliver this message. Check the number and try again.</div>}</div>}
      </Drawer>
      <SaveBar show={dirty} onSave={save} onDiscard={() => setCfg(saved)} />
    </div>
  );
}

