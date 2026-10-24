import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CountUp, Label, PageHeader, Select, Skeleton, Tabs, Button, useFakeLoad, stagger, C } from '../ui/kit';
import { cn, rs } from '../lib/format';
import { useApp, useRoute } from '../store';
import { TXNS, downloadCsv, type Txn } from './payments/data';
import Transactions from './payments/Transactions';
import Reconcile from './payments/Reconcile';
import { CodCash, Refunds, Settlements } from './payments/Other';

const TABS = ['transactions', 'reconciliation', 'settlements', 'refunds', 'cod'] as const;
type Tab = (typeof TABS)[number];
const RANGES = [{ value: '0', label: 'Today' }, { value: '6', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }];
const SLICES = [{ m: 'ConnectIPS', c: C.ink }, { m: 'NPX', c: C.champagne }, { m: 'Cash on Delivery', c: C.sage }] as const;

function Donut({ values }: { values: number[] }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 150); return () => clearTimeout(t); }, []);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={112} height={112} viewBox="0 0 42 42" className="-rotate-90 shrink-0">
        <circle cx={21} cy={21} r={15.9155} fill="none" stroke="var(--stone)" strokeWidth={5} />
        {values.map((v, i) => { const len = (v / total) * 100; const start = acc; acc += len; return (
          <circle key={i} cx={21} cy={21} r={15.9155} fill="none" stroke={SLICES[i].c} strokeWidth={5} pathLength={100}
            strokeDasharray={`${go ? Math.max(len - 1, 0) : 0} 100`} strokeDashoffset={-start} style={{ transition: `stroke-dasharray 900ms var(--ease) ${i * 180}ms` }} />
        ); })}
      </svg>
      <ul className="space-y-1.5 text-[13px] min-w-0">
        {values.map((v, i) => <li key={i} className="flex items-center gap-2"><span className="size-2 rounded-full shrink-0" style={{ background: SLICES[i].c }} /><span className="truncate">{SLICES[i].m}</span><span className="num text-muted ml-auto pl-3">{Math.round((v / total) * 100)}%</span></li>)}
      </ul>
    </div>
  );
}

export default function Payments() {
  const route = useRoute();
  const { toast } = useApp();
  const q = route.query;
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(q.tab) ? (q.tab as Tab) : q.status ? 'transactions' : 'transactions');
  const [status, setStatus] = useState(q.status ?? 'All');
  const [range, setRange] = useState('6');
  const [txns, setTxns] = useState<Txn[]>(TXNS);
  const loading = useFakeLoad(600);
  useEffect(() => { if ((TABS as readonly string[]).includes(q.tab)) setTab(q.tab as Tab); if (q.status) { setStatus(q.status); if (!q.tab) setTab('transactions'); } }, [q.tab, q.status]);

  const stats = useMemo(() => {
    const sum = (f: (t: Txn) => boolean, k: 'amount' | 'fee' = 'amount') => txns.filter(f).reduce((a, t) => a + t[k], 0);
    return {
      today: sum((t) => t.daysAgo === 0 && t.status === 'Paid'), pending: sum((t) => t.status === 'Pending'), failed: sum((t) => t.status === 'Failed'),
      failedN: txns.filter((t) => t.status === 'Failed').length, pendingN: txns.filter((t) => t.status === 'Pending').length,
      fees: sum((t) => t.status === 'Paid', 'fee'),
      mix: SLICES.map((s) => sum((t) => t.method === s.m && t.status !== 'Failed')),
    };
  }, [txns]);

  const exportCsv = () => {
    const rows = txns.filter((t) => t.daysAgo <= +range);
    downloadCsv('richiva-transactions.csv', [['Transaction ID', 'Order', 'Customer', 'Method', 'Amount (NPR)', 'Fee (NPR)', 'Status', 'Time'], ...rows.map((t) => [t.id, t.order, t.customer, t.method, t.amount, t.fee, t.status, t.time])]);
    toast('CSV exported', { body: `${rows.length} transactions` });
  };

  const cards = [
    { l: 'Collected today', v: stats.today, sub: 'Paid online and delivered COD', go: () => { setTab('transactions'); setStatus('Paid'); } },
    { l: 'Pending', v: stats.pending, sub: `${stats.pendingN} transactions waiting`, go: () => { setTab('transactions'); setStatus('Pending'); } },
    { l: 'Failed', v: stats.failed, sub: `${stats.failedN} payments did not go through`, go: () => { setTab('transactions'); setStatus('Failed'); }, bad: true },
    { l: 'Fees paid', v: stats.fees, sub: 'Gateway charges this period' },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Every rupee in, accounted for." actions={<>
        <Select value={range} onChange={setRange} options={RANGES} className="w-40 [&_select]:h-10 [&_select]:rounded-full" />
        <Button variant="secondary" icon={Download} onClick={exportCsv}>Export</Button>
      </>} />
      <div className="grid grid-cols-2 xl:grid-cols-[repeat(4,1fr)_1.5fr] gap-6 mb-8">
        {cards.map((c, i) => (
          <Card key={c.l} style={stagger(i)} onClick={c.go} className={cn('col-span-1', i === 0 && 'feature [&_.label-caps]:!text-white/70 [&_.text-muted]:!text-white/60')}>
            <Label>{c.l}</Label>
            {loading ? <Skeleton className="h-9 w-32 mt-2" /> : <div className={cn('text-[32px] leading-tight font-semibold mt-1.5 text-right xl:text-left', c.bad && stats.failed > 0 && 'text-bad')}><CountUp value={c.v} format={rs} /></div>}
            <div className="text-muted text-[12.5px] mt-1">{c.sub}</div>
          </Card>
        ))}
        <Card style={stagger(4)} className="col-span-2 xl:col-span-1"><Label className="mb-3">Payment methods</Label>{loading ? <Skeleton className="h-28 w-full" /> : <Donut values={stats.mix} />}</Card>
      </div>
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[
        { id: 'transactions', label: 'Transactions' }, { id: 'reconciliation', label: 'Reconciliation' }, { id: 'settlements', label: 'Settlements' },
        { id: 'refunds', label: 'Refunds', count: 3 }, { id: 'cod', label: 'COD cash' },
      ]} />
      <div key={tab} className="anim-fade-up">
        {tab === 'transactions' && <Transactions txns={txns} setTxns={setTxns} status={status} setStatus={setStatus} maxDays={+range} loading={loading} />}
        {tab === 'reconciliation' && <Reconcile />}
        {tab === 'settlements' && <Settlements loading={loading} />}
        {tab === 'refunds' && <Refunds loading={loading} />}
        {tab === 'cod' && <CodCash />}
      </div>
    </div>
  );
}
