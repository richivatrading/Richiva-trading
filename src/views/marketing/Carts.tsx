import { useState } from 'react';
import { Clock, Send } from 'lucide-react';
import { Avatar, Button, Card, CardHeader, CountUp, Field, Pill, SaveBar, Select, StatusPill, Switch, stagger } from '../../ui/kit';
import { useApp } from '../../store';
import { fill } from '../notifications/data';
import { rs } from '../../lib/format';
import { CARTS, discountsStore, flowStore } from './data';

export default function Carts() {
  const { toast } = useApp();
  const [saved, setSaved] = flowStore.use();
  const [flow, setFlow] = useState(saved);
  const [discounts] = discountsStore.use();
  const [rows, setRows] = useState(CARTS);
  const dirty = JSON.stringify(flow) !== JSON.stringify(saved);
  const waiting = rows.filter((r) => r.stage !== 'Recovered').reduce((a, r) => a + r.value, 0);
  const codes = ['None', ...discounts.map((d) => d.code)];
  const remind = (id: string) => { setRows((a) => a.map((r) => (r.id === id ? { ...r, stage: '1 hour message sent' } : r))); toast('Reminder sent'); };
  const step = (k: 'h1' | 'h24', title: string) => { const s = flow[k]; const up = (p: Partial<typeof s>) => setFlow({ ...flow, [k]: { ...s, ...p } }); const bad = s.on && !s.msg.trim(); return (
    <div className="relative pl-8 pb-8 last:pb-0">
      <span className="absolute left-0 top-1 size-6 rounded-full bg-ink text-inkfg flex items-center justify-center"><Clock size={13} /></span><span className="absolute left-3 top-8 bottom-0 w-px bg-line" />
      <div className="flex items-center justify-between mb-3"><div className="font-medium">{title}</div><Switch label={title} checked={s.on} onChange={(v) => up({ on: v })} /></div>
      <div className={s.on ? 'space-y-3' : 'space-y-3 opacity-40 pointer-events-none'}>
        <div className="grid grid-cols-2 gap-3"><Select label="Channel" value={s.channel} onChange={(v) => up({ channel: v })} options={['Email', 'SMS', 'WhatsApp', 'Push']} /><Select label="Optional code" value={s.code} onChange={(v) => up({ code: v })} options={codes} /></div>
        <Field multiline rows={3} label="Message" value={s.msg} onChange={(v) => up({ msg: v })} error={bad ? 'Write a message or switch this step off.' : undefined} />
        <div className="rounded-xl bg-soft border border-line p-3 text-[13px]"><span className="label-caps block mb-1">Preview</span>{fill(s.msg)}{s.code !== 'None' && <span className="block mt-1.5 text-muted">Use code <b className="text-fg">{s.code}</b> at checkout.</span>}</div>
      </div>
    </div>); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
      <Card pad={false}>
        <div className="p-6 pb-3"><CardHeader title="Abandoned carts" sub={<>Waiting to be recovered: <b className="text-fg font-medium"><CountUp value={waiting} format={rs} /></b></>} className="!mb-0" /></div>
        {rows.map((r, i) => (
          <div key={r.id} style={stagger(i, 40)} className="flex items-center gap-4 px-6 py-4 border-t border-line anim-fade-up hover:bg-soft/60 transition-colors">
            <Avatar name={r.name} /><div className="flex-1 min-w-0"><div className="font-medium">{r.name}</div><div className="text-muted text-[13px] truncate">{r.items}</div></div>
            <div className="text-right"><div className="num font-medium">{rs(r.value)}</div><div className="text-muted text-[12px]">{r.ago} ago</div></div>
            {r.stage === 'Recovered' ? <StatusPill status="Completed" /> : r.stage === 'Waiting' ? <Button size="sm" variant="secondary" icon={Send} onClick={() => remind(r.id)}>Remind</Button> : <Pill tone="info">{r.stage}</Pill>}
          </div>
        ))}
      </Card>
      <Card hover={false}>
        <CardHeader title="Recovery flow" sub="Messages sent automatically after a cart is left" />
        {step('h1', 'After 1 hour')}{step('h24', 'After 24 hours')}
      </Card>
      <SaveBar show={dirty} onDiscard={() => setFlow(saved)} onSave={() => { if ((flow.h1.on && !flow.h1.msg.trim()) || (flow.h24.on && !flow.h24.msg.trim())) return toast('Add a message to each active step'); setSaved(flow); toast('Recovery flow saved', { star: true }); }} />
    </div>
  );
}
