"use client";
import { useEffect, useMemo, useState } from 'react';
import { Printer, Plus } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, Field, Modal, SearchInput, Select, StatusPill, Pill, cn, type Col } from './ui';
import { navigate, useApp } from '../../store';
import { rs } from '../../lib/format';
import { eventsFor, type Shipment, type ShipStatus } from './data';

const STATUSES: ShipStatus[] = ['Pickup scheduled', 'Shipped', 'Out for delivery', 'Delivered', 'Failed', 'Returned'];

function Track({ events }: { events: { title: string; meta: string }[] }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const t = setInterval(() => setN((x) => { if (x >= events.length) { clearInterval(t); return x; } return x + 1; }), 320); return () => clearInterval(t); }, [events.length]);
  return (
    <ol className="relative pl-6">
      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-line" />
      {events.slice(0, n).map((e, i) => (
        <li key={i} className="relative pb-5 last:pb-0 anim-slide-in">
          <span className={cn('absolute -left-6 top-1.5 size-[15px] rounded-full border-2 border-card transition-colors duration-500', i === n - 1 && n === events.length ? 'bg-champagne' : 'bg-sage')} />
          <div className="text-[14px]">{e.title}</div><div className="text-muted text-[12px] mt-0.5">{e.meta}</div>
        </li>
      ))}
    </ol>
  );
}

export default function Shipments({ ships, setShips, loading }: { ships: Shipment[]; setShips: (f: (s: Shipment[]) => Shipment[]) => void; loading: boolean }) {
  const { toast } = useApp();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[] | null>(null);
  const [mStatus, setMStatus] = useState<string>('Shipped');
  const [mNote, setMNote] = useState('');
  const [mErr, setMErr] = useState('');
  const open = ships.find((s) => s.id === openId) ?? null;
  const rows = useMemo(() => ships.filter((s) => (st === 'All' || s.status === st) && (!q || (s.waybill + s.order + s.customer).toLowerCase().includes(q.toLowerCase()))), [ships, st, q]);

  const addUpdate = () => {
    if (!open) return;
    if (mNote.trim().length < 3) return setMErr('Write a short note for this update.');
    setShips((a) => a.map((s) => s.id === open.id ? { ...s, status: mStatus as ShipStatus, updated: 'Just now', events: [...s.events, { title: mStatus, meta: `${mNote.trim()} · manual update` }] } : s));
    setMNote(''); setMErr(''); toast('Manual update added', { body: `${open.waybill} is now ${mStatus}.` });
  };

  const cols: Col<Shipment>[] = [
    { key: 'w', header: 'Waybill', render: (s) => <span className="font-medium num">{s.waybill}</span>, sort: (s) => s.waybill },
    { key: 'o', header: 'Order', render: (s) => <button className="underline decoration-line underline-offset-4 hover:text-champagne" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${s.order}`); }}>{s.order}</button> },
    { key: 'c', header: 'Courier', render: (s) => <span className="text-muted">{s.courier}</span>, hideBelow: 'lg' },
    { key: 's', header: 'Status', render: (s) => <span key={s.status} className="anim-pop inline-block"><StatusPill status={s.status} /></span>, sort: (s) => s.status },
    { key: 'u', header: 'Last update', render: (s) => <span className="text-muted whitespace-nowrap">{s.updated}</span>, hideBelow: 'lg' },
    { key: 'a', header: 'Age', align: 'right', render: (s) => <span className="num">{s.age} {s.age === 1 ? 'day' : 'days'}</span>, sort: (s) => s.age },
  ];

  return (
    <Card pad={false} hover={false}>
      <div className="px-5 pt-4 text-[14px] text-muted">{`${rows.length} shipments in this view.`}</div>
      <div className="p-5 flex flex-wrap items-center gap-3 border-b border-line">
        <SearchInput value={q} onChange={setQ} placeholder="Search waybill, order or customer" className="w-full sm:w-72" />
        <div className="flex flex-wrap gap-2"><Chip active={st === 'All'} onClick={() => setSt('All')}>All</Chip>{STATUSES.map((s) => <Chip key={s} active={st === s} count={ships.filter((x) => x.status === s).length} onClick={() => setSt(s)}>{s}</Chip>)}</div>
      </div>
      <DataTable columns={cols} rows={rows} rowId={(s) => s.id} loading={loading} selectable onRowClick={(s) => setOpenId(s.id)} activeId={openId} pageSize={10}
        bulk={(ids, clear) => <Button size="sm" variant="ghost" icon={Printer} onClick={() => { setLabels(ids); clear(); }}>Print labels</Button>} />
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.waybill} subtitle={open && `${open.courier} · ${open.customer}`}>
        {open && <div className="space-y-7">
          <div className="flex items-center justify-between"><StatusPill status={open.status} /><span className="text-muted text-[13px]">Updated {open.updated}</span></div>
          <div className="text-[13.5px] space-y-1"><div>{open.address}</div><div className="text-muted num">{open.phone}</div>{open.cod > 0 && <Pill tone="champagne">Collect {rs(open.cod)}</Pill>}</div>
          <div><div className="label-caps mb-3">Tracking</div><Track key={open.id + open.events.length} events={open.events} /></div>
          <div className="border-t border-line pt-5 space-y-3">
            <div className="label-caps">Add manual update</div>
            <Select label="Status" value={mStatus} onChange={setMStatus} options={STATUSES} />
            <Field label="Note" value={mNote} onChange={(v) => { setMNote(v); setMErr(''); }} error={mErr} />
            <Button variant="secondary" icon={Plus} onClick={addUpdate}>Add manual update</Button>
          </div>
        </div>}
      </Drawer>
      <Modal open={!!labels} onClose={() => setLabels(null)} title="Print labels" size="lg" footer={<><Button variant="secondary" onClick={() => setLabels(null)}>Close</Button><Button icon={Printer} onClick={() => { toast(`${labels?.length} labels sent to printer`, { star: true }); setLabels(null); }}>Print</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ships.filter((s) => labels?.includes(s.id)).map((s) => (
            <div key={s.id} className="border border-dashed border-fg/30 rounded-xl p-4 flex gap-3">
              <div className="size-16 shrink-0 stripe-block border border-line rounded" />
              <div className="min-w-0 text-[12.5px]"><div className="font-semibold num text-[14px]">{s.waybill}</div><div>{s.customer}</div><div className="text-muted truncate">{s.address}</div><div className="text-muted">{s.courier}{s.cod ? ` · COD ${rs(s.cod)}` : ' · Prepaid'}</div></div>
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  );
}
export { eventsFor };

