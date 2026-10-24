import { useState } from 'react';
import { ArrowRight, Truck, Ban } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, EmptyState, Field, KV, Modal, Pill, SearchInput, Select, type Col } from '../../ui/kit';
import { useApp } from '../../store';
import { trStore, whStore, whName, fmtDate, toInt, useTrigger, PRODUCT_NAMES, TODAY, type Transfer } from './wh';

const FILTERS = ['All', 'Draft', 'Shipped', 'Delivered', 'Cancelled'] as const;
type F = (typeof FILTERS)[number];
const tone = (s: Transfer['status']) => ({ Draft: 'neutral', Shipped: 'success', Delivered: 'success', Cancelled: 'danger' } as const)[s];

export default function Transfers({ loading, trigger }: { loading: boolean; trigger: number }) {
  const [list, setList] = trStore.use();
  const { confirm, toast } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const open = list.find((t) => t.id === openId) ?? null;
  useTrigger(trigger, () => setAdding(true));

  const shown = list.filter((t) => (f === 'All' || t.status === f) && (!q || `${t.id} ${t.product} ${whName(t.from)} ${whName(t.to)}`.toLowerCase().includes(q.toLowerCase())));
  const move = (ids: string[], from: Transfer['status'], to: Transfer['status']) => {
    const hit = list.filter((t) => ids.includes(t.id) && t.status === from).map((t) => t.id);
    if (!hit.length) { toast(`Only ${from.toLowerCase()} transfers can be moved on`); return; }
    setList((l) => l.map((t) => (hit.includes(t.id) ? { ...t, status: to } : t)));
    toast(to === 'Shipped' ? 'Transfer shipped' : 'Transfer delivered', { body: `${hit.length} transfer${hit.length > 1 ? 's' : ''} updated.`, undo: () => setList((l) => l.map((t) => (hit.includes(t.id) ? { ...t, status: from } : t))) });
  };
  const cancel = async (ids: string[]) => {
    const hit = list.filter((t) => ids.includes(t.id) && (t.status === 'Draft' || t.status === 'Shipped'));
    if (!hit.length) { toast('Delivered or cancelled transfers cannot be cancelled'); return false; }
    if (!(await confirm({ title: `Cancel ${hit.length} transfer${hit.length > 1 ? 's' : ''}?`, body: 'Stock stays where it is. This cannot be shipped again.', confirmLabel: 'Cancel transfer', danger: true }))) return false;
    setList((l) => l.map((t) => (hit.some((h) => h.id === t.id) ? { ...t, status: 'Cancelled' } : t)));
    toast('Transfer cancelled', { undo: () => setList((l) => l.map((t) => hit.find((h) => h.id === t.id) ?? t)) });
    return true;
  };

  const cols: Col<Transfer>[] = [
    { key: 'id', header: 'Transfer', sort: (t) => t.id, render: (t) => <span className="font-medium num">{t.id}</span> },
    { key: 'product', header: 'Product', sort: (t) => t.product, render: (t) => t.product },
    { key: 'route', header: 'From and to', render: (t) => <span className="inline-flex items-center gap-2 text-[13px]">{whName(t.from).replace(' Warehouse', '')}<ArrowRight size={13} strokeWidth={1.5} className="text-muted" />{whName(t.to).replace(' Warehouse', '')}</span> },
    { key: 'qty', header: 'Units', align: 'right', sort: (t) => t.qty, render: (t) => <span className="num">{t.qty}</span> },
    { key: 'date', header: 'Created', sort: (t) => t.date, render: (t) => fmtDate(t.date) },
    { key: 'status', header: 'Status', sort: (t) => t.status, render: (t) => <Pill tone={tone(t.status)} dot>{t.status}</Pill> },
  ];

  return (
    <>
      <Card pad={false}>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">{FILTERS.map((x) => <Chip key={x} active={f === x} count={x === 'All' ? list.length : list.filter((t) => t.status === x).length} onClick={() => setF(x)}>{x}</Chip>)}</div>
          <SearchInput value={q} onChange={setQ} placeholder="Search transfers" className="w-full sm:w-72" />
        </div>
        <DataTable columns={cols} rows={shown} rowId={(t) => t.id} loading={loading} onRowClick={(t) => setOpenId(t.id)} activeId={openId} selectable defaultSort={{ key: 'date', dir: 'desc' }} pageSize={10}
          bulk={(ids, clear) => <><Button size="sm" variant="secondary" icon={Truck} onClick={() => { move(ids, 'Draft', 'Shipped'); clear(); }}>Mark shipped</Button><Button size="sm" variant="danger" icon={Ban} onClick={async () => { if (await cancel(ids)) clear(); }}>Cancel</Button></>}
          empty={<EmptyState title="No transfers yet" body="Move stock between warehouses and outlets here." action={<Button variant="secondary" onClick={() => setAdding(true)}>New transfer</Button>} />} />
      </Card>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.id} subtitle={open?.product} width={480}
        footer={open && <>
          {(open.status === 'Draft' || open.status === 'Shipped') && <Button variant="danger" onClick={() => cancel([open.id])}>Cancel transfer</Button>}
          {open.status === 'Draft' && <Button icon={Truck} onClick={() => move([open.id], 'Draft', 'Shipped')}>Mark shipped</Button>}
          {open.status === 'Shipped' && <Button onClick={() => move([open.id], 'Shipped', 'Delivered')}>Mark delivered</Button>}
        </>}>
        {open && <div><Pill tone={tone(open.status)} dot>{open.status}</Pill>
          <div className="mt-4"><KV k="From">{whName(open.from)}</KV><KV k="To">{whName(open.to)}</KV><KV k="Product">{open.product}</KV><KV k="Units"><span className="num">{open.qty}</span></KV><KV k="Created">{fmtDate(open.date)}</KV>{open.note && <KV k="Note">{open.note}</KV>}</div></div>}
      </Drawer>

      <NewTransfer open={adding} onClose={() => setAdding(false)} onSave={(t) => { setList((l) => [t, ...l]); toast('Transfer created', { body: `${t.id} saved as a draft.`, star: true }); }} next={`TR-${3012 + list.length - 7}`} />
    </>
  );
}

function NewTransfer({ open, onClose, onSave, next }: { open: boolean; onClose: () => void; onSave: (t: Transfer) => void; next: string }) {
  const [whs] = whStore.use();
  const act = whs.filter((w) => w.status === 'Active');
  const blank = { from: '', to: '', product: '', qty: '', note: '' };
  const [v, setV] = useState(blank);
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV((p) => ({ ...p, [k]: x }));
  const n = toInt(v.qty);
  const err = {
    from: v.from ? '' : 'Choose where the stock is leaving', to: !v.to ? 'Choose where it is going' : v.to === v.from ? 'Pick a different location' : '',
    product: v.product ? '' : 'Choose a product', qty: Number.isNaN(n) || n < 1 ? 'Enter a whole number above 0' : n > 500 ? 'Move up to 500 units at a time' : '',
  };
  const close = () => { setV(blank); setTried(false); onClose(); };
  const save = () => {
    setTried(true); if (Object.values(err).some(Boolean)) return;
    onSave({ id: next, from: v.from, to: v.to, product: v.product, qty: n, date: TODAY, status: 'Draft', note: v.note.trim() || undefined }); close();
  };
  const opts = (blankLabel: string) => [{ value: '', label: blankLabel }, ...act.map((w) => ({ value: w.id, label: w.name }))];
  return (
    <Modal open={open} onClose={close} title="New transfer" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={save}>Create transfer</Button></>}>
      <div className="space-y-4">
        <div><Select label="From" value={v.from} onChange={set('from')} options={opts('Choose a location')} />{tried && err.from && <div className="text-bad text-[12.5px] mt-1">{err.from}</div>}</div>
        <div><Select label="To" value={v.to} onChange={set('to')} options={opts('Choose a location')} />{tried && err.to && <div className="text-bad text-[12.5px] mt-1">{err.to}</div>}</div>
        <div><Select label="Product" value={v.product} onChange={set('product')} options={[{ value: '', label: 'Choose a product' }, ...PRODUCT_NAMES.map((p) => ({ value: p, label: p }))]} />{tried && err.product && <div className="text-bad text-[12.5px] mt-1">{err.product}</div>}</div>
        <Field label="Units to move" value={v.qty} onChange={set('qty')} error={tried ? err.qty : ''} />
        <Field label="Note (optional)" value={v.note} onChange={set('note')} multiline />
      </div>
    </Modal>
  );
}
