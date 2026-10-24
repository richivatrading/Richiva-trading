import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Card, CardHeader, SearchInput, Avatar, Pill, Progress, Select, Field, Button, EmptyState, Label, Timeline } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { CUSTOMERS, logAudit, type Customer } from '../../data/seed';
import { useApp } from '../../store';
import { tryonStore, hash } from './state';

const REASONS = ['Technical problem during try-on', 'Customer service gesture', 'Testing by the team', 'Other'];

export default function Lookup() {
  const { toast, confirm } = useApp();
  const [saved] = tryonStore.use();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Customer | null>(null);
  const [reset, setReset] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<Record<string, { t: string; r: string }[]>>({});
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const list = useMemo(() => CUSTOMERS.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)).slice(0, 8), [q]);
  const limit = saved.minutes + saved.tiers[sel?.tier ?? 'Bronze'];
  const used = sel ? (reset[sel.id] ? 0 : Math.min(limit, +(((hash(sel.id) % 40) / 10) + 0.5).toFixed(1))) : 0;

  const doReset = async () => {
    if (!sel) return;
    if (note.trim().length < 3 && reason === 'Other') return setErr('Please add a short note for this reason.');
    setErr('');
    if (!(await confirm({ title: `Reset today's time for ${sel.name}?`, body: 'She will get her full daily minutes back straight away.', confirmLabel: 'Reset time' }))) return;
    setReset((r) => ({ ...r, [sel.id]: true }));
    setLog((l) => ({ ...l, [sel.id]: [{ t: 'Just now', r: reason + (note ? `: ${note}` : '') }, ...(l[sel.id] ?? [])] }));
    logAudit({ user: 'Anita Shrestha', module: 'Try-on', action: "Reset today's time", item: sel.name, before: `used: ${used} min`, after: 'used: 0 min' });
    toast("Today's time reset", { star: true, body: `${sel.name} has ${limit} minutes again.` }); setNote('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2" hover={false}>
        <CardHeader title="Find a customer" />
        <SearchInput value={q} onChange={setQ} placeholder="Name or phone" />
        <div className="mt-4 space-y-1">
          {list.map((c) => (
            <button key={c.id} onClick={() => { setSel(c); setErr(''); }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${sel?.id === c.id ? 'bg-soft ring-1 ring-champagne' : 'hover:bg-soft'}`}>
              <Avatar name={c.name} size={36} /><div className="flex-1"><div className="font-medium">{c.name}</div><div className="text-muted text-[12px]">{c.phone}</div></div><Pill tone="neutral">{c.tier}</Pill>
            </button>
          ))}
          {list.length === 0 && <EmptyState icon={Search} title="No customer found" body="Check the spelling or try a phone number." />}
        </div>
      </Card>
      <Card className="lg:col-span-3" hover={false}>
        {!sel ? <EmptyState star title="Pick a customer" body="See how many try-on minutes she has used today." /> : (
          <div key={sel.id} className="anim-fade-up">
            <div className="flex items-center gap-4 mb-6"><Avatar name={sel.name} size={56} /><div><div className="font-title text-[30px] leading-tight">{sel.name}</div><div className="text-muted text-[13px]">{sel.tier} tier, {sel.city}</div></div></div>
            <Label>Minutes used today</Label>
            <div className="flex items-end gap-2 mt-1"><span className="font-title text-[56px] leading-none num">{used}</span><span className="text-muted mb-1.5">of {limit} min</span></div>
            <Progress value={limit ? (used / limit) * 100 : 0} className="mt-3 !h-2.5" color="var(--champagne)" />
            <p className="text-muted text-[13px] mt-2 flex items-center gap-1.5"><Star size={12} />Time refills at midnight Nepal time.</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-4"><Select label="Reason" value={reason} onChange={setReason} options={REASONS} /><Field label="Note (optional)" value={note} onChange={setNote} error={err} /></div>
            <Button className="mt-4" icon={RotateCcw} variant="secondary" disabled={used === 0} onClick={doReset}>Reset today&apos;s time</Button>
            {(log[sel.id]?.length ?? 0) > 0 && <div className="mt-6"><Label className="mb-3">Resets</Label><Timeline items={log[sel.id].map((x) => ({ title: x.r, meta: x.t }))} /></div>}
          </div>
        )}
      </Card>
    </div>
  );
}
