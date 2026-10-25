"use client";
import { useMemo, useState } from 'react';
import { Link2, RefreshCw, Send } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, KV, SearchInput, StatusPill, ErrorState, type Col } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { rs, sleep } from '../../lib/format';
import { navigate, useApp } from '../../store';
import { gatewayJson, type Method, type Txn, type TxStatus } from './data';

const METHODS: ('All' | Method)[] = ['All', 'ConnectIPS', 'NPX', 'Cash on Delivery'];
const STATUSES: ('All' | TxStatus)[] = ['All', 'Paid', 'Pending', 'Failed', 'Refunded'];

export default function Transactions({ txns, setTxns, status, setStatus, maxDays, loading }: { txns: Txn[]; setTxns: (f: (t: Txn[]) => Txn[]) => void; status: string; setStatus: (s: string) => void; maxDays: number; loading: boolean }) {
  const { toast } = useApp();
  const [method, setMethod] = useState<string>('All');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [flash, setFlash] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const rows = useMemo(() => txns.filter((t) => t.daysAgo <= maxDays && (method === 'All' || t.method === method) && (status === 'All' || t.status === status) && (!q || (t.id + t.order + t.customer).toLowerCase().includes(q.toLowerCase()))), [txns, maxDays, method, status, q]);
  const open = txns.find((t) => t.id === openId) ?? null;

  const check = async (t: Txn) => {
    setChecking(true); await sleep(1300);
    const next: TxStatus = t.status === 'Pending' ? (t.amount % 5 === 0 ? 'Failed' : 'Paid') : t.status;
    setTxns((a) => a.map((x) => x.id === t.id ? { ...x, status: next, checked: Date.now() } : x));
    setFlash([t.id]); setChecking(false);
    toast(next === t.status ? `Gateway confirms: ${t.status}` : `Gateway says ${next}`, { body: next === t.status ? 'No change since the last check.' : `${t.id} has been updated.`, star: next === 'Paid' && next !== t.status });
  };

  const cols: Col<Txn>[] = [
    { key: 'id', header: 'Transaction ID', render: (t) => <span className="font-medium num">{t.id}</span>, sort: (t) => t.id },
    { key: 'order', header: 'Order', render: (t) => <button className="underline decoration-line underline-offset-4 hover:decoration-champagne hover:text-champagne" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${t.order}`); }}>{t.order}</button> },
    { key: 'method', header: 'Method', render: (t) => <span className="text-muted">{t.method}</span>, hideBelow: 'lg' },
    { key: 'amount', header: 'Amount', align: 'right', render: (t) => <span className="num font-medium">{rs(t.amount)}</span>, sort: (t) => t.amount },
    { key: 'fee', header: 'Fee', align: 'right', render: (t) => <span className="num text-muted">{t.fee ? rs(t.fee) : '—'}</span>, hideBelow: 'lg' },
    { key: 'status', header: 'Status', render: (t) => <StatusPill status={t.status} /> },
    { key: 'time', header: 'Time', align: 'right', render: (t) => <span className="text-muted num whitespace-nowrap">{t.time}</span> },
  ];

  return (
    <Card pad={false} hover={false}>
      <div className="px-5 pt-4 text-[14px] text-muted">{`${rows.filter((t) => t.status === 'Pending').length} payments are pending and ${rows.filter((t) => t.status === 'Failed').length} failed.`}</div>
      <div className="p-5 flex flex-col gap-3 border-b border-line">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search transaction, order or customer" className="w-full sm:w-80" />
          <div className="flex flex-wrap gap-2">{METHODS.map((m) => <Chip key={m} active={method === m} onClick={() => setMethod(m)}>{m}</Chip>)}</div>
        </div>
        <div className="flex flex-wrap gap-2 items-center"><span className="label-caps mr-1">Status</span>{STATUSES.map((s) => <Chip key={s} active={status === s} count={s === 'All' ? undefined : txns.filter((t) => t.daysAgo <= maxDays && t.status === s).length} onClick={() => setStatus(s)}>{s}</Chip>)}</div>
      </div>
      {error ? <ErrorState onRetry={() => setError(false)} title="Could not load transactions" /> :
        <DataTable columns={cols} rows={rows} rowId={(t) => t.id} loading={loading} onRowClick={(t) => setOpenId(t.id)} activeId={openId} flashIds={flash} pageSize={12} defaultSort={{ key: 'id', dir: 'desc' }} />}
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.id} subtitle={open && `${open.method} · ${open.time}`}
        footer={open && <>
          <Button variant="secondary" icon={Send} disabled={open.status === 'Paid' || open.status === 'Refunded'} onClick={() => toast('Payment link sent', { body: `SMS and email sent to ${open.customer}.` })}>Send payment link</Button>
          <Button icon={RefreshCw} loading={checking} onClick={() => check(open)}>Check status with gateway</Button>
        </>}>
        {open && <div className="space-y-6">
          <div className="flex items-end justify-between"><div><div className="label-caps">Amount</div><div className="text-[32px] font-semibold num">{rs(open.amount)}</div></div><div className="text-right">{checking ? <span className="inline-flex items-center gap-2 text-muted text-[13px]"><span className="size-4 rounded-full border-2 border-current border-t-transparent anim-spin" />Asking the gateway</span> : <span key={open.status} className="anim-pop inline-block"><StatusPill status={open.status} /></span>}</div></div>
          <div>
            <KV k="Customer">{open.customer}</KV>
            <KV k="Order"><button className="inline-flex items-center gap-1 hover:text-champagne" onClick={() => navigate(`/orders/${open.order}`)}><Link2 size={13} />{open.order}</button></KV>
            <KV k="Fee"><span className="num">{open.fee ? rs(open.fee) : 'No fee'}</span></KV>
            <KV k="Net received"><span className="num">{rs(open.status === 'Paid' ? open.amount - open.fee : 0)}</span></KV>
            {open.checked && <KV k="Last checked"><span className="inline-flex items-center gap-1"><Star size={11} twinkle />Just now</span></KV>}
          </div>
          <div>
            <div className="label-caps mb-2">Gateway response</div>
            <pre className="bg-soft border border-line rounded-xl p-4 text-[12.5px] leading-relaxed overflow-x-auto num font-mono" key={open.status + checking}>{gatewayJson(open)}</pre>
          </div>
        </div>}
      </Drawer>
    </Card>
  );
}

