"use client";
import { useMemo, useState } from 'react';
import { Box, PackageCheck } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, EmptyState, KV, Pill, SearchInput, type Col } from '../../ui/kit';
import { ordersStore, productsStore, type Order } from '../../data/seed';
import { useApp } from '../../store';
import { pickStore, binFor, useTrigger, type PickState } from './wh';

const FILTERS = ['All', 'To pick', 'Picked', 'Packed'] as const;
type F = (typeof FILTERS)[number];
const tone = (s: PickState) => ({ 'To pick': 'warning', Picked: 'info', Packed: 'success' } as const)[s];

export default function Pick({ loading, trigger }: { loading: boolean; trigger: number }) {
  const [orders] = ordersStore.use();
  const [products] = productsStore.use();
  const [state, setState] = pickStore.use();
  const { toast } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  const queue = useMemo(() => orders.filter((o) => o.status === 'To confirm' || o.status === 'Processing').slice(0, 14), [orders]);
  const st = (o: Order): PickState => state[o.id] ?? 'To pick';
  const lines = (o: Order) => o.items.map((it) => { const p = products.find((x) => x.id === it.productId); return { name: p?.name ?? it.productId, size: it.size, color: it.color, qty: it.qty, bin: binFor(`${it.productId}${it.size}`) }; });
  const open = queue.find((o) => o.id === openId) ?? null;
  useTrigger(trigger, () => { const n = queue.find((o) => st(o) === 'To pick'); if (n) setOpenId(n.id); else toast('Everything is picked', { star: true }); });

  const shown = queue.filter((o) => (f === 'All' || st(o) === f) && (!q || `${o.id} ${o.customer} ${o.city}`.toLowerCase().includes(q.toLowerCase())));
  const mark = (ids: string[], to: PickState) => {
    const prev = ids.map((id) => [id, state[id] ?? 'To pick'] as const);
    setState((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [id, to])) }));
    toast(to === 'Picked' ? 'Marked as picked' : 'Marked as packed', { body: `${ids.length} order${ids.length > 1 ? 's' : ''} updated.`, undo: () => setState((s) => ({ ...s, ...Object.fromEntries(prev) })) });
  };

  const cols: Col<Order>[] = [
    { key: 'id', header: 'Order', sort: (o) => o.id, render: (o) => <span className="font-medium num">{o.id}</span> },
    { key: 'customer', header: 'Customer', sort: (o) => o.customer, render: (o) => <div><div>{o.customer}</div><div className="text-muted text-[12px]">{o.city}</div></div> },
    { key: 'items', header: 'Units', align: 'right', sort: (o) => o.items.reduce((a, i) => a + i.qty, 0), render: (o) => <span className="num">{o.items.reduce((a, i) => a + i.qty, 0)}</span> },
    { key: 'bins', header: 'Bins', render: (o) => <span className="num text-muted">{Array.from(new Set(lines(o).map((l) => l.bin))).join(', ')}</span> },
    { key: 'date', header: 'Placed', sort: (o) => o.date, render: (o) => <span className="text-muted">{o.date}</span> },
    { key: 'status', header: 'Status', sort: st, render: (o) => <Pill tone={tone(st(o))} dot>{st(o)}</Pill> },
  ];

  return (
    <>
      <Card pad={false}>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">{FILTERS.map((x) => <Chip key={x} active={f === x} count={x === 'All' ? queue.length : queue.filter((o) => st(o) === x).length} onClick={() => setF(x)}>{x}</Chip>)}</div>
          <SearchInput value={q} onChange={setQ} placeholder="Search by order or customer" className="w-full sm:w-72" />
        </div>
        <DataTable columns={cols} rows={shown} rowId={(o) => o.id} loading={loading} onRowClick={(o) => setOpenId(o.id)} activeId={openId} selectable pageSize={10}
          bulk={(ids, clear) => <><Button size="sm" variant="secondary" icon={Box} onClick={() => { mark(ids, 'Picked'); clear(); }}>Mark picked</Button><Button size="sm" icon={PackageCheck} onClick={() => { mark(ids, 'Packed'); clear(); }}>Mark packed</Button></>}
          empty={<EmptyState title="Nothing to pick" body="New orders will appear here once they are confirmed." star />} />
      </Card>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.id} subtitle={open && `${open.customer} · ${open.city}`} width={500}
        footer={open && <>
          <Button variant="secondary" icon={Box} disabled={st(open) !== 'To pick'} onClick={() => mark([open.id], 'Picked')}>Mark picked</Button>
          <Button icon={PackageCheck} disabled={st(open) === 'Packed'} onClick={() => mark([open.id], 'Packed')}>Mark packed</Button>
        </>}>
        {open && (
          <div>
            <Pill tone={tone(st(open))} dot>{st(open)}</Pill>
            <div className="mt-4"><KV k="Courier">{open.courier}</KV><KV k="Deliver to">{open.address}</KV></div>
            <div className="label-caps mt-6 mb-2">Items to pick</div>
            {lines(open).map((l, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-line last:border-0">
                <span className="num text-[13px] bg-stone rounded-lg px-2.5 py-1 font-medium">{l.bin}</span>
                <div className="flex-1 min-w-0"><div className="truncate">{l.name}</div><div className="text-muted text-[12px]">{l.size} · {l.color}</div></div>
                <span className="num">× {l.qty}</span>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </>
  );
}

