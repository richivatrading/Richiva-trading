"use client";
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, Download, FileText, Bookmark, Table2 } from 'lucide-react';
import { PageHeader, Tabs, Select, Chip, Button, DropdownMenu, Modal, Field, Skeleton, ErrorState, useFakeLoad, Switch } from '../ui/kit';
import { useApp, useRoute, navigate } from '../store';
import { build, csvOf, makeDrill, RANGES, CATS, CHANNELS, type Range, type Drill } from './analytics/data';
import { DrillDrawer } from './analytics/ui';
import { Sales, Products, Customers, Traffic, Funnel, Cohorts, Search } from './analytics/tabs';

const TABS = [{ id: 'sales', label: 'Sales' }, { id: 'products', label: 'Products' }, { id: 'customers', label: 'Customers' }, { id: 'traffic', label: 'Traffic' }, { id: 'funnel', label: 'Funnel' }, { id: 'cohorts', label: 'Cohorts' }, { id: 'search', label: 'Search' }] as const;
type Tab = (typeof TABS)[number]['id'];
const BY_CHANNEL: Tab[] = ['traffic', 'funnel', 'search'];
const VIEWS = { sales: Sales, products: Products, customers: Customers, traffic: Traffic, funnel: Funnel, cohorts: Cohorts, search: Search };
interface View { name: string; tab: Tab; range: Range; cat: string; ch: string; compare: boolean }

export default function Analytics() {
  const { toast } = useApp();
  const q = useRoute().query.tab as Tab;
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === q) ? q : 'sales');
  useEffect(() => { if (TABS.some((t) => t.id === q)) setTab(q); }, [q]);
  const [range, setRange] = useState<Range>('30d');
  const [cat, setCat] = useState('All'); const [ch, setCh] = useState('All');
  const [compare, setCompare] = useState(false);
  const [views, setViews] = useState<View[]>([]);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [sched, setSched] = useState(false);
  const [nonce, setNonce] = useState(0);
  const byCh = BY_CHANNEL.includes(tab);
  const loading = useFakeLoad(520, [tab, range, cat, ch, nonce]);
  const d = useMemo(() => { try { return build(range, cat, ch); } catch { return null; } }, [range, cat, ch, nonce]);
  const go = (t: Tab) => { setTab(t); navigate(`/analytics?tab=${t}`); };
  const View = VIEWS[tab];

  const exportCsv = () => {
    if (!d) return toast('Nothing to export yet');
    const csv = csvOf(tab, d).map((r) => r.map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `richiva-${tab}-${range}.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast('CSV exported', { body: `richiva-${tab}-${range}.csv` });
  };
  const exportPdf = () => { toast('Preparing PDF', { body: 'Choose Save as PDF in the print window.' }); setTimeout(() => window.print(), 400); };
  const saveView = () => { const name = `${TABS.find((t) => t.id === tab)!.label}, ${RANGES.find((r) => r.value === range)!.label}`; setViews((v) => [...v.filter((x) => x.name !== name), { name, tab, range, cat, ch, compare }]); toast('View saved', { body: name, star: true }); };
  const apply = (v: View) => { setRange(v.range); setCat(v.cat); setCh(v.ch); setCompare(v.compare); go(v.tab); };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="A calm look at how the shop is doing."
        actions={<>
          <Button variant="secondary" icon={Bookmark} onClick={saveView}>Save view</Button>
          <DropdownMenu trigger={<Button variant="secondary" icon={Download}>Export<ChevronDown size={14} /></Button>} items={[{ label: 'Export CSV', icon: Table2, onClick: exportCsv }, { label: 'Export PDF', icon: FileText, onClick: exportPdf }]} />
          <Button icon={CalendarClock} onClick={() => setSched(true)}>Schedule report by email</Button>
        </>} />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select value={range} onChange={(v) => setRange(v as Range)} options={RANGES} className="w-48 [&_select]:h-10 [&_select]:rounded-full" />
        <Select value={byCh ? ch : cat} onChange={byCh ? setCh : setCat} options={[{ value: 'All', label: byCh ? 'All channels' : 'All categories' }, ...(byCh ? CHANNELS : CATS).map((c) => ({ value: c, label: c }))]} className="w-48 [&_select]:h-10 [&_select]:rounded-full" />
        <Chip active={compare} onClick={() => setCompare(!compare)}>Compare to previous period</Chip>
        {views.map((v) => <Chip key={v.name} icon={Bookmark} onClick={() => apply(v)} onRemove={() => setViews((x) => x.filter((y) => y !== v))}>{v.name}</Chip>)}
      </div>
      <Tabs tabs={[...TABS]} value={tab} onChange={go} className="mb-10" />
      {!d ? <ErrorState onRetry={() => setNonce(nonce + 1)} /> : loading ? <div className="space-y-6"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24" /><Skeleton className="h-96 rounded-2xl" /></div> : (
        <div key={`${tab}${range}${cat}${ch}${nonce}`}><View d={d} cat={cat} ch={ch} compare={compare} drill={(t, v, n, s) => setDrill(makeDrill(t, v, n, s))} /></div>
      )}
      <DrillDrawer drill={drill} onClose={() => setDrill(null)} />
      <Schedule open={sched} onClose={() => setSched(false)} tab={tab} />
    </div>
  );
}

function Schedule({ open, onClose, tab }: { open: boolean; onClose: () => void; tab: Tab }) {
  const { toast } = useApp();
  const [freq, setFreq] = useState('Weekly'); const [day, setDay] = useState('Monday'); const [time, setTime] = useState('08:00');
  const [rep, setRep] = useState<string>(tab); const [to, setTo] = useState(''); const [csv, setCsv] = useState(true); const [err, setErr] = useState('');
  useEffect(() => { if (open) setRep(tab); }, [open, tab]);
  const submit = () => {
    const list = to.split(',').map((s) => s.trim()).filter(Boolean);
    if (!list.length) return setErr('Add at least one email address.');
    const bad = list.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));
    if (bad) return setErr(`"${bad}" does not look like an email address.`);
    toast('Report scheduled', { body: `${freq}${freq === 'Weekly' ? ` on ${day}` : ''} at ${time} to ${list.length} ${list.length === 1 ? 'person' : 'people'}.`, star: true });
    setErr(''); setTo(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Schedule report by email" size="md" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon={CalendarClock} onClick={submit}>Schedule</Button></>}>
      <div className="space-y-4">
        <Select label="Report" value={rep} onChange={setRep} options={TABS.map((t) => ({ value: t.id, label: t.label }))} />
        <div className="grid grid-cols-3 gap-3">
          <Select label="How often" value={freq} onChange={setFreq} options={['Daily', 'Weekly', 'Monthly']} />
          <Select label="Day" value={day} onChange={setDay} options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Sunday']} />
          <Select label="Time (Nepal)" value={time} onChange={setTime} options={['07:00', '08:00', '09:00', '18:00']} />
        </div>
        <Field label="Send to (separate emails with commas)" value={to} onChange={(v) => { setTo(v); setErr(''); }} error={err} />
        <div className="flex items-center justify-between"><span>Attach a CSV file</span><Switch checked={csv} onChange={setCsv} label="Attach CSV" /></div>
      </div>
    </Modal>
  );
}

