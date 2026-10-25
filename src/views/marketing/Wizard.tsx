"use client";
import { useState } from 'react';
import { Bell, Check, Mail, MessageCircle, Send, Smartphone } from 'lucide-react';
import { Button, CountUp, Field, KV, Modal, Segmented, stagger } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { cn, rs } from '../../lib/format';
import { Preview, DrawnCheck } from '../notifications/Previews';
import type { Ch } from '../notifications/data';
import { campaignsStore, CHANNEL_LIST, reach, segmentsStore, type Campaign, type Channel } from './data';

const STEPS = ['Goal', 'Audience', 'Channel', 'Content', 'Schedule and review'];
const GOALS = [
  { id: 'sales', title: 'Drive sales', body: 'Bring shoppers back to buy.', text: 'Hi {{customer_name}}, our new arrivals are here. Enjoy 10% off with code {{discount_code}} this week.' },
  { id: 'winback', title: 'Win back customers', body: 'Reach people who have gone quiet.', text: 'We miss you, {{customer_name}}. Come back and enjoy a little gift with code {{discount_code}}.' },
  { id: 'launch', title: 'Announce a launch', body: 'Introduce a new collection.', text: 'Meet our newest collection, {{customer_name}}. Be the first to see it.' },
  { id: 'loyal', title: 'Reward loyal customers', body: 'Say thank you to your best people.', text: 'Thank you for being with us, {{customer_name}}. Your early access is now open.' },
];
const ICON = { Email: Mail, SMS: Smartphone, WhatsApp: MessageCircle, Push: Bell };
const COST = { Email: 0.1, SMS: 1.1, WhatsApp: 2.4, Push: 0 };
const nextFriday = () => { const d = new Date(2026, 9, 18); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); return d.toISOString().slice(0, 10); };
const weekday = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long' });

export default function Wizard({ open, onClose, initialAudience, onDone }: { open: boolean; onClose: () => void; initialAudience?: string; onDone: (c: Campaign, msg: string) => void }) {
  const [segments] = segmentsStore.use();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [goal, setGoal] = useState('');
  const [aud, setAud] = useState(initialAudience ?? '');
  const [chs, setChs] = useState<Channel[]>(['Email']);
  const [view, setView] = useState<Channel>('Email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'now' | 'later'>('later');
  const [date, setDate] = useState(nextFriday());
  const [time, setTime] = useState('10:00');
  const [name, setName] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [test, setTest] = useState<'idle' | 'sending' | 'sent'>('idle');
  const seg = segments.find((s) => s.name === aud);
  const n = seg ? reach(seg) : 0;

  const pickGoal = (id: string) => { const g = GOALS.find((x) => x.id === id)!; setGoal(id); setBody(g.text); setSubject(g.title === 'Drive sales' ? 'New arrivals, just for you' : g.title); if (!name) setName(g.title + ' · October'); };
  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !goal) e.goal = 'Choose a goal to continue.';
    if (step === 1 && !aud) e.aud = 'Choose who should receive this.';
    if (step === 2 && !chs.length) e.ch = 'Choose at least one channel.';
    if (step === 3) { if (chs.includes('Email') && !subject.trim()) e.subject = 'Add a subject line.'; if (!body.trim()) e.body = 'Write your message.'; }
    if (step === 4) { if (!name.trim()) e.name = 'Give the campaign a name.'; if (mode === 'later' && new Date(`${date}T${time}`) <= new Date(2026, 9, 18, 12)) e.date = 'Choose a future date.'; }
    setErr(e); return !Object.keys(e).length;
  };
  const go = (d: number) => { if (d > 0 && !validate()) return; setDir(d); setStep(step + d); setErr({}); };
  const toggle = (c: Channel) => { const next = chs.includes(c) ? chs.filter((x) => x !== c) : [...chs, c]; setChs(next); if (!next.includes(view) && next[0]) setView(next[0]); setErr({}); };
  const sendTest = () => { setTest('sending'); setTimeout(() => setTest('sent'), 900); setTimeout(() => setTest('idle'), 3600); };
  const finish = () => {
    if (!validate()) return;
    const day = mode === 'now' ? 'today' : weekday(date);
    const c: Campaign = { id: `c${Date.now()}`, name: name.trim(), channels: chs, audience: aud, status: mode === 'now' ? 'Live' : 'Scheduled', sent: 0, opened: 0, orders: 0, revenue: 0, when: mode === 'now' ? 'Sending now' : `${new Date(date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}` };
    campaignsStore.set((a) => [c, ...a]);
    onDone(c, `Your campaign will reach ${n.toLocaleString('en-IN')} customers on ${day === 'today' ? 'today' : day}`);
    setStep(0); setGoal(''); setName(''); setTest('idle');
  };
  const est = chs.reduce((a, c) => a + COST[c] * n, 0);

  return (
    <Modal open={open} onClose={onClose} size="xl" title="New campaign"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><div className="flex-1" />{step > 0 && <Button variant="secondary" onClick={() => go(-1)}>Back</Button>}{step < 4 ? <Button onClick={() => go(1)}>Continue</Button> : <Button variant="champagne" icon={Send} onClick={finish}>{mode === 'now' ? 'Send now' : 'Schedule campaign'}</Button>}</>}>
      <div className="flex items-center mb-7">
        {STEPS.map((s, i) => (
          <div key={s} className={cn('flex items-center', i < 4 && 'flex-1')}>
            <div className="flex items-center gap-2.5">
              <span className={cn('size-8 rounded-full flex items-center justify-center text-[13px] border transition-all duration-300', i < step ? 'bg-ink text-inkfg border-ink' : i === step ? 'border-champagne bg-champagne/20 font-semibold' : 'border-line text-muted')}>{i < step ? <Check size={14} /> : i + 1}</span>
              <span className={cn('text-[13px] hidden md:block whitespace-nowrap', i === step ? 'font-medium' : 'text-muted')}>{s}</span>
            </div>
            {i < 4 && <div className="flex-1 h-px mx-3 bg-line relative overflow-hidden"><span className="absolute inset-y-0 left-0 bg-ink transition-all duration-500" style={{ width: i < step ? '100%' : '0%' }} /></div>}
          </div>
        ))}
      </div>

      <div key={step} style={{ animation: `${dir > 0 ? 'slide-in-r' : 'slide-left'} 400ms var(--ease) both` }} className="min-h-[340px]">
        {step === 0 && (
          <div><div className="font-title text-[26px] mb-4">What would you like to achieve?</div>
            <div className="grid sm:grid-cols-2 gap-4">{GOALS.map((g, i) => (
              <button key={g.id} onClick={() => { pickGoal(g.id); setErr({}); }} style={stagger(i)} className={cn('text-left rounded-2xl border p-5 transition-all duration-300 anim-fade-up bg-soft hover:-translate-y-0.5', goal === g.id ? 'border-champagne shadow-[0_0_0_3px_color-mix(in_srgb,var(--champagne)_25%,transparent)]' : 'border-line')}>
                <div className="font-title text-[22px]">{g.title}</div><div className="text-muted text-[13px] mt-0.5">{g.body}</div></button>))}</div>
            {err.goal && <div className="text-bad text-[12px] mt-3">{err.goal}</div>}</div>
        )}
        {step === 1 && (
          <div className="grid md:grid-cols-[1fr_260px] gap-6">
            <div><div className="font-title text-[26px] mb-4">Who should receive it?</div>
              <div className="grid sm:grid-cols-2 gap-3">{segments.map((s, i) => (
                <button key={s.id} onClick={() => { setAud(s.name); setErr({}); }} style={stagger(i, 30)} className={cn('text-left rounded-xl border p-4 anim-fade-up transition-all duration-200', aud === s.name ? 'border-champagne bg-champagne/10' : 'border-line hover:border-champagne')}>
                  <div className="font-medium">{s.name}</div><div className="text-muted text-[12px] num">{reach(s).toLocaleString('en-IN')} customers</div></button>))}</div>
              {err.aud && <div className="text-bad text-[12px] mt-3">{err.aud}</div>}</div>
            <div className="rounded-2xl bg-soft border border-line p-6 flex flex-col items-center justify-center text-center"><div className="label-caps">Will receive this</div><div className="font-title text-[56px] leading-none mt-2"><CountUp value={n} /></div><div className="text-muted text-[13px] mt-1">customers{aud && ` in ${aud}`}</div></div>
          </div>
        )}
        {step === 2 && (
          <div><div className="font-title text-[26px] mb-4">Where should it appear?</div>
            <div className="grid sm:grid-cols-2 gap-4">{CHANNEL_LIST.map((c, i) => { const I = ICON[c]; const on = chs.includes(c); return (
              <button key={c} onClick={() => toggle(c)} style={stagger(i)} className={cn('flex items-center gap-4 text-left rounded-2xl border p-5 anim-fade-up transition-all duration-300', on ? 'border-champagne bg-champagne/10' : 'border-line bg-soft hover:border-champagne')}>
                <span className="size-11 rounded-full bg-card flex items-center justify-center"><I size={20} strokeWidth={1.5} /></span>
                <span className="flex-1"><span className="block font-medium">{c}</span><span className="text-muted text-[12px]">{COST[c] ? `About ${rs(COST[c])} per message` : 'No cost per message'}</span></span>
                {on && <Check size={18} className="text-champagne anim-pop" />}</button>); })}</div>
            {err.ch && <div className="text-bad text-[12px] mt-3">{err.ch}</div>}
            <div className="text-muted text-[13px] mt-4">Estimated cost for {n.toLocaleString('en-IN')} customers: <b className="text-fg font-medium"><CountUp value={Math.round(est)} format={rs} /></b></div></div>
        )}
        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="font-title text-[26px]">Write your message</div>
              {chs.includes('Email') && <Field label="Subject" value={subject} onChange={setSubject} error={err.subject} />}
              <Field multiline rows={6} label="Message" value={body} onChange={setBody} error={err.body} hint={`Use {{customer_name}} and {{discount_code}} to personalise.`} />
              <Button variant="secondary" icon={Send} loading={test === 'sending'} onClick={sendTest}>{test === 'sent' ? 'Test sent to you' : 'Send test'}</Button>
              {test === 'sent' && <span className="ml-3 inline-flex align-middle scale-50 -my-4"><DrawnCheck /></span>}
            </div>
            <div>
              <Segmented className="mb-4" value={view} onChange={setView} options={chs.map((c) => ({ value: c, label: c }))} />
              <div key={view} className="anim-fade-in"><Preview ch={view.toLowerCase() as Ch} subject={subject} body={body} /></div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="font-title text-[26px]">When should it go out?</div>
              <Field label="Campaign name" value={name} onChange={setName} error={err.name} />
              <Segmented value={mode} onChange={setMode} options={[{ value: 'later', label: 'Schedule' }, { value: 'now', label: 'Send now' }]} />
              {mode === 'later' && <div className="grid grid-cols-2 gap-3 anim-fade-up"><Field label="Date" type="date" value={date} onChange={setDate} error={err.date} /><Field label="Time" type="time" value={time} onChange={setTime} /></div>}
            </div>
            <div className="rounded-2xl bg-soft border border-line p-6">
              <div className="label-caps mb-2">Review</div>
              <KV k="Goal">{GOALS.find((g) => g.id === goal)?.title}</KV><KV k="Audience">{aud}</KV><KV k="Channels">{chs.join(', ')}</KV><KV k="Reach"><CountUp value={n} /> customers</KV><KV k="Estimated cost">{rs(Math.round(est))}</KV>
              <div className="flex items-center gap-2 mt-4 text-[13px]"><Star size={14} twinkle />Your campaign will reach {n.toLocaleString('en-IN')} customers {mode === 'now' ? 'today' : `on ${weekday(date)}`}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

