"use client";
import { useState } from 'react';
import { Download, Check, X, Lock } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, Card, CardHeader, ChartTip, CountUp, DataTable, EmptyState, Pill, StatusPill, C, stagger, type Col } from '../../ui/kit';
import { CelebrateState } from '../../ui/kit';
import { navigate, useApp } from '../../store';
import { logAudit } from '../../data/seed';
import { rs } from '../../lib/format';
import { COD_BATCHES, REFUNDS, SETTLEMENTS, downloadCsv, type CodBatch, type Refund, type Settlement } from './data';

export function Settlements({ loading }: { loading: boolean }) {
  const { toast } = useApp();
  const net = (s: Settlement) => s.gross - s.fees - s.refunds;
  const cols: Col<Settlement>[] = [
    { key: 'p', header: 'Period', render: (s) => <span className="font-medium">{s.period}</span> },
    { key: 'g', header: 'Gross', align: 'right', render: (s) => <span className="num">{rs(s.gross)}</span>, sort: (s) => s.gross },
    { key: 'f', header: 'Fees', align: 'right', render: (s) => <span className="num text-muted">{rs(s.fees)}</span>, hideBelow: 'lg' },
    { key: 'r', header: 'Refunds', align: 'right', render: (s) => <span className="num text-muted">{s.refunds ? rs(s.refunds) : '—'}</span>, hideBelow: 'lg' },
    { key: 'n', header: 'Net', align: 'right', render: (s) => <span className="num font-semibold">{rs(net(s))}</span>, sort: net },
    { key: 's', header: 'Status', render: (s) => <StatusPill status={s.status} /> },
    { key: 'b', header: 'Bank reference', render: (s) => <span className="num text-muted text-[13px]">{s.bank}</span>, hideBelow: 'xl' },
    { key: 'd', header: '', align: 'right', render: (s) => <Button size="sm" variant="ghost" icon={Download} onClick={() => { downloadCsv(`${s.bank}.csv`, [['Period', 'Gross', 'Fees', 'Refunds', 'Net', 'Status', 'Bank reference'], [s.period, s.gross, s.fees, s.refunds, net(s), s.status, s.bank]]); toast('Statement downloaded', { body: s.bank }); }}>Download</Button> },
  ];
  return <Card pad={false} hover={false}><div className="p-6 pb-2"><CardHeader title="Settlements" sub="Weekly payouts from ConnectIPS and NPX to your bank." className="mb-0" /></div><DataTable columns={cols} rows={SETTLEMENTS} rowId={(s) => s.id} loading={loading} /></Card>;
}

export function Refunds({ loading }: { loading: boolean }) {
  const { role, toast, confirm } = useApp();
  const can = role === 'Finance' || role === 'Owner';
  const [rows, setRows] = useState<Refund[]>(REFUNDS);
  const set = (id: string, status: Refund['status']) => setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x));
  const approve = (r: Refund) => { set(r.id, 'Approved'); logAudit({ user: 'You', module: 'Payments', action: 'Approved refund', item: r.order, before: 'refund: Pending', after: `refund: Approved (${rs(r.amount)})` }); toast('Refund approved', { body: `${rs(r.amount)} to ${r.customer}`, undo: () => set(r.id, 'Pending'), star: true }); };
  const reject = async (r: Refund) => { if (await confirm({ title: 'Reject this refund?', body: `${r.customer} will be told the request was declined.`, confirmLabel: 'Reject refund', danger: true })) { set(r.id, 'Rejected'); toast('Refund rejected', { undo: () => set(r.id, 'Pending') }); } };
  const cols: Col<Refund>[] = [
    { key: 'o', header: 'Order', render: (r) => <button className="underline decoration-line underline-offset-4 hover:text-champagne" onClick={() => navigate(`/orders/${r.order}`)}>{r.order}</button> },
    { key: 'c', header: 'Customer', render: (r) => r.customer, hideBelow: 'lg' },
    { key: 'r', header: 'Reason', render: (r) => <span className="text-muted">{r.reason}</span>, hideBelow: 'xl' },
    { key: 'a', header: 'Amount', align: 'right', render: (r) => <span className="num font-medium">{rs(r.amount)}</span>, sort: (r) => r.amount },
    { key: 't', header: 'Requested', render: (r) => <span className="text-muted whitespace-nowrap">{r.requested}</span> },
    { key: 's', header: 'Status', render: (r) => <span key={r.status} className="anim-pop inline-block"><StatusPill status={r.status} /></span> },
    { key: 'x', header: '', align: 'right', render: (r) => r.status !== 'Pending' ? null : can ? (
      <div className="inline-flex gap-2"><Button size="sm" icon={Check} onClick={() => approve(r)}>Approve</Button><Button size="sm" variant="secondary" icon={X} onClick={() => reject(r)}>Reject</Button></div>
    ) : <Pill tone="neutral" icon={Lock}>Needs Finance</Pill> },
  ];
  const pending = rows.filter((r) => r.status === 'Pending');
  return (
    <Card pad={false} hover={false}>
      <div className="p-6 pb-2"><CardHeader title="Refund queue" sub={`${pending.length} waiting · ${rs(pending.reduce((a, r) => a + r.amount, 0))}${can ? '' : ' · Only Finance and Owner can approve'}`} className="mb-0" /></div>
      <DataTable columns={cols} rows={rows} rowId={(r) => r.id} loading={loading} empty={<EmptyState title="No refunds waiting" />} />
    </Card>
  );
}

const BUCKETS = [{ k: '0 – 2 days', a: 0, b: 2 }, { k: '3 – 5 days', a: 3, b: 5 }, { k: '6 – 9 days', a: 6, b: 9 }, { k: '10+ days', a: 10, b: 99 }];
export function CodCash() {
  const { toast, confirm } = useApp();
  const [rows, setRows] = useState<CodBatch[]>(COD_BATCHES);
  const sum = (f: (b: CodBatch) => boolean) => rows.filter(f).reduce((a, b) => a + b.amount, 0);
  const pending = sum((b) => !b.remitted), remitted = sum((b) => b.remitted);
  const data = BUCKETS.map((u) => ({ name: u.k, value: sum((b) => !b.remitted && b.age >= u.a && b.age <= u.b), old: u.a >= 6 }));
  const mark = async (b: CodBatch) => {
    if (!(await confirm({ title: 'Mark as remitted?', body: `${b.courier} paid ${rs(b.amount)} for ${b.waybills} parcels.`, confirmLabel: 'Mark remitted' }))) return;
    setRows((r) => r.map((x) => x.id === b.id ? { ...x, remitted: true } : x));
    toast('Marked remitted', { body: `${rs(b.amount)} from ${b.courier}`, undo: () => setRows((r) => r.map((x) => x.id === b.id ? { ...x, remitted: false } : x)) });
  };
  const cols: Col<CodBatch>[] = [
    { key: 'c', header: 'Courier', render: (b) => <span className="font-medium">{b.courier}</span> },
    { key: 'w', header: 'Parcels', align: 'right', render: (b) => <span className="num">{b.waybills}</span> },
    { key: 'a', header: 'Cash collected', align: 'right', render: (b) => <span className="num font-medium">{rs(b.amount)}</span>, sort: (b) => b.amount },
    { key: 'g', header: 'Age', align: 'right', render: (b) => <span className={'num ' + (!b.remitted && b.age >= 10 ? 'text-bad' : 'text-muted')}>{b.age} days</span>, sort: (b) => b.age },
    { key: 's', header: 'Status', render: (b) => <StatusPill status={b.remitted ? 'Remitted' : 'Pending'} /> },
    { key: 'x', header: '', align: 'right', render: (b) => !b.remitted && <Button size="sm" variant="secondary" icon={Check} onClick={() => mark(b)}>Mark remitted</Button> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[['Collected', pending + remitted], ['Pending remittance', pending], ['Remitted', remitted]].map(([l, v], i) => (
          <Card key={l as string} style={stagger(i)}><div className="label-caps">{l}</div><div className="text-[32px] font-semibold mt-1"><CountUp value={v as number} format={rs} /></div></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6">
        <Card><CardHeader title="Aging" sub="Cash still with couriers, by days held" />
          <div className="h-56"><ResponsiveContainer><BarChart data={data} margin={{ left: -10, right: 4 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(n) => `${n / 1000}k`} />
            <Tooltip cursor={{ fill: 'var(--stone)', opacity: 0.4 }} content={<ChartTip fmt={rs} />} />
            <Bar dataKey="value" name="Pending" radius={[20, 20, 20, 20]} animationDuration={800}>{data.map((d, i) => <Cell key={i} fill={d.old ? C.champagne : C.ink} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        </Card>
        <Card pad={false}><div className="p-6 pb-2"><CardHeader title="Courier cash batches" className="mb-0" /></div>
          {rows.every((b) => b.remitted) && <CelebrateState title="All cash remitted" />}
          <DataTable columns={cols} rows={rows} rowId={(b) => b.id} defaultSort={{ key: 'g', dir: 'desc' }} /></Card>
      </div>
    </div>
  );
}

