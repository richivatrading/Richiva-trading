import { useState } from 'react';
import { PackageCheck, Trash2 } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, EmptyState, Field, KV, Modal, Pill, SearchInput, Select, type Col } from '../../ui/kit';
import { useApp } from '../../store';
import { rs } from '../../lib/format';
import { poStore, poStatus, whStore, whName, fmtDate, TODAY, toInt, useTrigger, type PO } from './wh';

const FILTERS = ['All', 'Pending', 'Partly received', 'Received', 'Overdue'] as const;
type F = (typeof FILTERS)[number];
const late = (p: PO) => p.expected < TODAY && poStatus(p) !== 'Received';
const label = (p: PO): string => (late(p) ? 'Overdue' : poStatus(p));
const tone = (s: string) => (s === 'Received' ? 'success' : s === 'Overdue' ? 'danger' : s === 'Partly received' ? 'info' : 'warning') as 'success' | 'danger' | 'info' | 'warning';
const left = (p: PO) => p.lines.reduce((a, l) => a + l.ordered - l.received, 0);

export default function Receiving({ loading, trigger }: { loading: boolean; trigger: number }) {
  const [pos, setPos] = poStore.use();
  const { confirm, toast } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [recvId, setRecvId] = useState<string | null>(null);
  const open = pos.find((p) => p.id === openId) ?? null;
  useTrigger(trigger, () => { const p = pos.find((x) => poStatus(x) !== 'Received'); setRecvId(p?.id ?? 'none'); });

  const counts = (x: F) => (x === 'All' ? pos.length : pos.filter((p) => label(p) === x).length);
  const shown = pos.filter((p) => (f === 'All' || label(p) === f) && (!q || `${p.id} ${p.supplier} ${whName(p.warehouse)}`.toLowerCase().includes(q.toLowerCase())));

  const cancel = async (ids: string[]) => {
    const gone = pos.filter((p) => ids.includes(p.id) && poStatus(p) === 'Pending');
    if (!gone.length) { toast('Only orders not yet received can be cancelled'); return false; }
    if (!(await confirm({ title: `Cancel ${gone.length} purchase order${gone.length > 1 ? 's' : ''}?`, body: 'The supplier will no longer be expecting a delivery.', confirmLabel: 'Cancel order', danger: true }))) return false;
    setPos((l) => l.filter((p) => !gone.some((g) => g.id === p.id)));
    toast('Purchase order cancelled', { undo: () => setPos((l) => [...l, ...gone].sort((a, b) => a.id.localeCompare(b.id))) });
    setOpenId(null); return true;
  };

  const cols: Col<PO>[] = [
    { key: 'id', header: 'Order', sort: (p) => p.id, render: (p) => <span className="font-medium num">{p.id}</span> },
    { key: 'supplier', header: 'Supplier', sort: (p) => p.supplier, render: (p) => <div><div>{p.supplier}</div><div className="text-muted text-[12px]">To {whName(p.warehouse)}</div></div> },
    { key: 'expected', header: 'Expected', sort: (p) => p.expected, render: (p) => <span className={late(p) ? 'text-bad' : ''}>{fmtDate(p.expected)}</span> },
    { key: 'left', header: 'Units to receive', align: 'right', sort: left, render: (p) => <span className="num">{left(p)}</span> },
    { key: 'cost', header: 'Cost', align: 'right', sort: (p) => p.cost, render: (p) => <span className="num">{rs(p.cost)}</span> },
    { key: 'status', header: 'Status', sort: label, render: (p) => <Pill tone={tone(label(p))} dot>{label(p)}</Pill> },
  ];

  return (
    <>
      <Card pad={false}>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">{FILTERS.map((x) => <Chip key={x} active={f === x} count={counts(x)} onClick={() => setF(x)}>{x}</Chip>)}</div>
          <SearchInput value={q} onChange={setQ} placeholder="Search by order or supplier" className="w-full sm:w-72" />
        </div>
        <DataTable columns={cols} rows={shown} rowId={(p) => p.id} loading={loading} onRowClick={(p) => setOpenId(p.id)} activeId={openId} selectable defaultSort={{ key: 'expected', dir: 'asc' }} pageSize={10}
          bulk={(ids, clear) => <Button size="sm" variant="danger" icon={Trash2} onClick={async () => { if (await cancel(ids)) clear(); }}>Cancel orders</Button>}
          empty={<EmptyState title="No shipments to show" body="Nothing is on its way with these filters." action={<Button variant="secondary" onClick={() => { setQ(''); setF('All'); }}>Clear filters</Button>} />} />
      </Card>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.id} subtitle={open && open.supplier} width={520}
        footer={open && <>{poStatus(open) === 'Pending' && <Button variant="danger" onClick={() => cancel([open.id])}>Cancel order</Button>}<Button icon={PackageCheck} disabled={poStatus(open) === 'Received'} onClick={() => setRecvId(open.id)}>Receive stock</Button></>}>
        {open && (
          <div>
            <Pill tone={tone(label(open))} dot>{label(open)}</Pill>
            <div className="mt-4"><KV k="Deliver to">{whName(open.warehouse)}</KV><KV k="Expected">{fmtDate(open.expected)}</KV><KV k="Cost"><span className="num">{rs(open.cost)}</span></KV></div>
            <div className="label-caps mt-6 mb-2">Items</div>
            {open.lines.map((l) => (
              <div key={l.product} className="flex items-center justify-between py-3 border-b border-line last:border-0 text-[14px]">
                <span className="truncate pr-4">{l.product}</span><span className="num text-muted whitespace-nowrap">{l.received} of {l.ordered} received</span>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <ReceiveModal poId={recvId} onClose={() => setRecvId(null)} />
    </>
  );
}

function ReceiveModal({ poId, onClose }: { poId: string | null; onClose: () => void }) {
  const [pos, setPos] = poStore.use();
  const [whs] = whStore.use();
  const { toast } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const openPos = pos.filter((p) => poStatus(p) !== 'Received');
  const id = sel ?? (poId && poId !== 'none' ? poId : openPos[0]?.id);
  const po = pos.find((p) => p.id === id);
  const reset = () => { setSel(null); setVals({}); setTried(false); onClose(); };
  const err = (product: string, rem: number) => {
    const raw = vals[product] ?? '';
    if (raw === '') return '';
    const n = toInt(raw);
    return Number.isNaN(n) ? 'Enter a whole number' : n > rem ? `Only ${rem} still expected` : '';
  };
  const total = po ? po.lines.reduce((a, l) => a + (toInt(vals[l.product] ?? '') || 0), 0) : 0;
  const bad = po ? po.lines.some((l) => err(l.product, l.ordered - l.received)) : false;
  const save = () => {
    setTried(true); if (!po || bad || total === 0) return;
    setPos((l) => l.map((p) => (p.id === po.id ? { ...p, lines: p.lines.map((x) => ({ ...x, received: x.received + (toInt(vals[x.product] ?? '') || 0) })) } : p)));
    toast('Stock received', { body: `${total} units added to ${whs.find((w) => w.id === po.warehouse)?.name}.`, star: true }); reset();
  };
  return (
    <Modal open={!!poId} onClose={reset} title="Receive shipment" footer={<><Button variant="ghost" onClick={reset}>Cancel</Button><Button icon={PackageCheck} onClick={save} disabled={!po}>Receive {total > 0 ? `${total} units` : 'stock'}</Button></>}>
      {!po ? <EmptyState title="Nothing to receive" body="All purchase orders have arrived." star /> : (
        <div className="space-y-4">
          <Select label="Purchase order" value={po.id} onChange={(v) => { setSel(v); setVals({}); setTried(false); }} options={openPos.map((p) => ({ value: p.id, label: `${p.id} · ${p.supplier}` }))} />
          {po.lines.map((l) => {
            const rem = l.ordered - l.received; const e = err(l.product, rem);
            return <Field key={l.product} label={`${l.product} (${rem} still expected)`} value={vals[l.product] ?? ''} onChange={(x) => setVals((v) => ({ ...v, [l.product]: x }))} error={e} disabled={rem === 0} />;
          })}
          {tried && total === 0 && !bad && <div className="text-bad text-[13px]">Enter how many units arrived for at least one item.</div>}
        </div>
      )}
    </Modal>
  );
}
