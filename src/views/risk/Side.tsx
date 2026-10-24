import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, Chip, EmptyState, Field, IconButton, Segmented, Select, Switch, Tabs } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { rs } from '../../lib/format';
import { useApp } from '../../store';
import { blockStore, rulesStore, type Block, type Rule } from './data';

function Blocklist() {
  const { toast, confirm } = useApp();
  const [list, setList] = blockStore.use();
  const [type, setType] = useState<Block['type']>('Phones');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [errs, setErrs] = useState<{ v?: string; r?: string }>({});
  const rows = list.filter((b) => b.type === type);
  const add = () => {
    const e: typeof errs = {}; const v = value.trim();
    if (type === 'Phones' && v.replace(/\D/g, '').length < 10) e.v = 'Enter a full phone number, for example +977 98xx-xxxxxx.';
    if (type === 'Emails' && !/^\S+@\S+\.\S+$/.test(v)) e.v = 'Enter a valid email address.';
    if (type === 'Addresses' && v.length < 8) e.v = 'Enter the full address.';
    if (!e.v && list.some((b) => b.type === type && b.value.toLowerCase() === v.toLowerCase())) e.v = 'Already on the blocklist.';
    if (reason.trim().length < 3) e.r = 'Add a short reason.';
    setErrs(e); if (e.v || e.r) return;
    setList((l) => [{ id: `b${Date.now()}`, type, value: v, reason: reason.trim(), added: 'Today' }, ...l]); setValue(''); setReason(''); toast('Added to blocklist', { body: v });
  };
  const remove = async (b: Block) => { if (await confirm({ title: 'Remove from blocklist?', body: b.value, confirmLabel: 'Remove', danger: true })) { setList((l) => l.filter((x) => x.id !== b.id)); toast('Removed', { undo: () => setList((l) => [b, ...l]) }); } };
  return (
    <div className="space-y-5">
      <Segmented<Block['type']> value={type} onChange={(t) => { setType(t); setErrs({}); setValue(''); }} options={(['Phones', 'Addresses', 'Emails'] as const).map((t) => ({ value: t, label: `${t} ${list.filter((b) => b.type === t).length}` }))} />
      <div className="space-y-2.5">
        <Field label={type === 'Phones' ? 'Phone number' : type === 'Emails' ? 'Email address' : 'Address'} value={value} onChange={(v) => { setValue(v); setErrs({ ...errs, v: undefined }); }} error={errs.v} />
        <Field label="Reason" value={reason} onChange={(v) => { setReason(v); setErrs({ ...errs, r: undefined }); }} error={errs.r} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button size="sm" icon={Plus} onClick={add}>Add</Button>
      </div>
      {rows.length === 0 ? <EmptyState title="Nothing blocked" body={`No ${type.toLowerCase()} on the list.`} /> : (
        <ul className="divide-y divide-line">{rows.map((b) => (
          <li key={b.id} className="py-3 flex items-center justify-between gap-3 anim-fade-up"><div className="min-w-0"><div className="text-[14px] truncate num">{b.value}</div><div className="text-muted text-[12px]">{b.reason} · {b.added}</div></div><IconButton icon={Trash2} label="Remove" onClick={() => remove(b)} /></li>
        ))}</ul>
      )}
    </div>
  );
}

const CUST: Record<string, string> = { any: 'Any customer', first: 'First-time customer', repeat: 'Repeat customer' };
const WHERE: Record<string, string> = { any: 'Anywhere in Nepal', outside: 'Outside the Valley' };
const ACTIONS = ['needs a confirmation call', 'is held for review', 'is blocked'];

function Rules() {
  const { toast, confirm } = useApp();
  const [rules, setRules] = rulesStore.use();
  const [cust, setCust] = useState('first');
  const [cod, setCod] = useState('COD');
  const [amt, setAmt] = useState('5000');
  const [where, setWhere] = useState('any');
  const [action, setAction] = useState(ACTIONS[0]);
  const [err, setErr] = useState('');
  const n = amt === 'any' ? 0 : +amt;
  const parts = [cust !== 'any' && CUST[cust], cod === 'COD' ? (n ? `COD over ${rs(n)}` : 'COD') : n ? `order over ${rs(n)}` : '', where !== 'any' && `delivery ${WHERE[where].toLowerCase()}`].filter(Boolean) as string[];
  const sentence = `${parts.length ? parts.join(' and ') : 'Every order'} ${action}`.replace(/^./, (c) => c.toUpperCase());
  const add = () => {
    if (!parts.length) return setErr('Pick at least one condition, otherwise the rule applies to every order.');
    if (rules.some((r) => r.text === sentence)) return setErr('You already have this rule.');
    setRules((r) => [{ id: `r${Date.now()}`, text: sentence, on: true, cust, amt: n, where, cod: cod === 'COD', action }, ...r]); setErr(''); toast('Rule added', { body: sentence, star: true });
  };
  const del = async (r: Rule) => { if (await confirm({ title: 'Delete this rule?', body: r.text, confirmLabel: 'Delete rule', danger: true })) { setRules((a) => a.filter((x) => x.id !== r.id)); toast('Rule deleted', { undo: () => setRules((a) => [r, ...a]) }); } };
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line p-4 space-y-3 bg-soft/50">
        <div className="label-caps">Build a rule</div>
        <div className="grid grid-cols-2 gap-2.5">
          <Select label="Customer" value={cust} onChange={setCust} options={Object.entries(CUST).map(([value, label]) => ({ value, label }))} />
          <Select label="Payment" value={cod} onChange={setCod} options={[{ value: 'COD', label: 'COD' }, { value: 'any', label: 'Any payment' }]} />
          <Select label="Order amount" value={amt} onChange={setAmt} options={[{ value: 'any', label: 'Any amount' }, ...[3000, 5000, 8000, 10000, 15000].map((v) => ({ value: String(v), label: `Over ${rs(v)}` }))]} />
          <Select label="Delivery" value={where} onChange={setWhere} options={Object.entries(WHERE).map(([value, label]) => ({ value, label }))} />
        </div>
        <Select label="Then the order" value={action} onChange={setAction} options={ACTIONS} />
        <div className="flex items-start gap-2 text-[13.5px] rounded-lg bg-card border border-line px-3.5 py-3"><Star size={14} twinkle className="mt-0.5 shrink-0" /><span key={sentence} className="anim-fade-in">{sentence}</span></div>
        {err && <div className="text-bad text-[12px] anim-fade-in">{err}</div>}
        <Button size="sm" icon={Plus} onClick={add}>Add rule</Button>
      </div>
      <ul className="divide-y divide-line">{rules.map((r) => (
        <li key={r.id} className="py-3 flex items-center gap-3 anim-fade-up"><Switch checked={r.on} onChange={(v) => setRules((a) => a.map((x) => x.id === r.id ? { ...x, on: v } : x))} label="Enable rule" /><span className={'flex-1 text-[13.5px] transition-opacity ' + (r.on ? '' : 'opacity-50')}>{r.text}</span><IconButton icon={Trash2} label="Delete rule" onClick={() => del(r)} /></li>
      ))}</ul>
      {!rules.length && <EmptyState title="No rules yet" body="Write one above to flag risky orders." />}
    </div>
  );
}

export default function Side() {
  const [tab, setTab] = useState<'block' | 'rules'>('block');
  return (
    <Card hover={false} pad={false}>
      <div className="px-4 pt-2"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'block', label: 'Blocklist' }, { id: 'rules', label: 'Rules' }]} /></div>
      <div key={tab} className="p-6 anim-fade-up">{tab === 'block' ? <Blocklist /> : <Rules />}</div>
    </Card>
  );
}
export { Chip };
