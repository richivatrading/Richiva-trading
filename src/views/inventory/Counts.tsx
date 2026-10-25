"use client";
import { useState } from 'react';
import { Check, Plus, Send, Trash2 } from 'lucide-react';
import { Button, Card, DataTable, Drawer, EmptyState, Field, KV, Modal, Pill, Segmented, Select, type Col } from '../../ui/kit';
import { useApp } from '../../store';
import { rs } from '../../lib/format';
import { countStore, adjStore, whStore, whName, fmtDate, linesFor, variance, varianceValue, toInt, useTrigger, REASONS, PRODUCT_NAMES, TODAY, type Count, type Adjustment } from './wh';

const cTone = (s: Count['status']) => ({ Draft: 'neutral', Pending: 'warning', Approved: 'success' } as const)[s];
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export default function Counts({ loading, trigger }: { loading: boolean; trigger: number }) {
  const [counts, setCounts] = countStore.use();
  const [adjs] = adjStore.use();
  const { confirm, toast, user } = useApp();
  const [view, setView] = useState<'sessions' | 'log'>('sessions');
  const [openId, setOpenId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const open = counts.find((c) => c.id === openId) ?? null;
  useTrigger(trigger, () => { setView('sessions'); setStarting(true); });

  const remove = async (ids: string[]) => {
    const hit = counts.filter((c) => ids.includes(c.id) && c.status === 'Draft');
    if (!hit.length) { toast('Only draft counts can be deleted'); return false; }
    if (!(await confirm({ title: `Delete ${hit.length} draft count${hit.length > 1 ? 's' : ''}?`, body: 'Counted numbers will be lost.', confirmLabel: 'Delete', danger: true }))) return false;
    setCounts((l) => l.filter((c) => !hit.some((h) => h.id === c.id))); setOpenId(null);
    toast('Count deleted', { undo: () => setCounts((l) => [...l, ...hit].sort((a, b) => b.id.localeCompare(a.id))) });
    return true;
  };
  const approve = (c: Count) => {
    const made: Adjustment[] = c.lines.filter((l) => l.counted !== null && l.counted !== l.expected).map((l, i) => ({ id: `ADJ-${810 + adjStore.get().length + i}`, date: TODAY, warehouse: c.warehouse, product: l.product, change: (l.counted as number) - l.expected, reason: c.reason || 'Miscount', by: user.name, ref: c.id }));
    setCounts((l) => l.map((x) => (x.id === c.id ? { ...x, status: 'Approved' } : x)));
    adjStore.set((l) => [...made, ...l]);
    toast('Count approved', { body: made.length ? `${made.length} stock adjustments were recorded.` : 'No differences found.', star: true, undo: () => { setCounts((l) => l.map((x) => (x.id === c.id ? { ...x, status: 'Pending' } : x))); adjStore.set((l) => l.filter((a) => !made.some((m) => m.id === a.id))); } });
    setOpenId(null);
  };

  const cols: Col<Count>[] = [
    { key: 'id', header: 'Count', sort: (c) => c.id, render: (c) => <span className="font-medium num">{c.id}</span> },
    { key: 'where', header: 'Location', sort: (c) => whName(c.warehouse), render: (c) => <div><div>{whName(c.warehouse)}</div><div className="text-muted text-[12px]">{c.zone}</div></div> },
    { key: 'date', header: 'Date', sort: (c) => c.date, render: (c) => fmtDate(c.date) },
    { key: 'var', header: 'Difference', align: 'right', sort: variance, render: (c) => <span className={`num ${variance(c) < 0 ? 'text-bad' : ''}`}>{c.lines.some((l) => l.counted !== null) ? `${signed(variance(c))} units` : '—'}</span> },
    { key: 'val', header: 'Value', align: 'right', sort: varianceValue, render: (c) => <span className="num">{c.lines.some((l) => l.counted !== null) ? rs(Math.abs(varianceValue(c))) : '—'}</span> },
    { key: 'status', header: 'Status', sort: (c) => c.status, render: (c) => <Pill tone={cTone(c.status)} dot>{c.status === 'Pending' ? 'Pending approval' : c.status}</Pill> },
  ];
  const aCols: Col<Adjustment>[] = [
    { key: 'id', header: 'Adjustment', sort: (a) => a.id, render: (a) => <span className="font-medium num">{a.id}</span> },
    { key: 'date', header: 'Date', sort: (a) => a.date, render: (a) => fmtDate(a.date) },
    { key: 'where', header: 'Location', render: (a) => whName(a.warehouse) },
    { key: 'product', header: 'Product', sort: (a) => a.product, render: (a) => <div><div>{a.product}</div><div className="text-muted text-[12px]">by {a.by}{a.ref ? ` · ${a.ref}` : ''}</div></div> },
    { key: 'change', header: 'Change', align: 'right', sort: (a) => a.change, render: (a) => <span className={`num font-medium ${a.change < 0 ? 'text-bad' : ''}`}>{signed(a.change)}</span> },
    { key: 'reason', header: 'Reason', sort: (a) => a.reason, render: (a) => <Pill>{a.reason}</Pill> },
  ];

  return (
    <>
      <Card pad={false}>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <Segmented value={view} onChange={setView} options={[{ value: 'sessions', label: 'Stock counts' }, { value: 'log', label: 'Adjustments log' }]} />
          {view === 'log' && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdjusting(true)}>Add adjustment</Button>}
        </div>
        {view === 'sessions'
          ? <DataTable columns={cols} rows={counts} rowId={(c) => c.id} loading={loading} onRowClick={(c) => setOpenId(c.id)} activeId={openId} selectable defaultSort={{ key: 'date', dir: 'desc' }}
              bulk={(ids, clear) => <Button size="sm" variant="danger" icon={Trash2} onClick={async () => { if (await remove(ids)) clear(); }}>Delete drafts</Button>}
              empty={<EmptyState title="No stock counts yet" body="Start a count to check what is really on the shelves." action={<Button variant="secondary" onClick={() => setStarting(true)}>Start count</Button>} />} />
          : <DataTable columns={aCols} rows={adjs} rowId={(a) => a.id} loading={loading} defaultSort={{ key: 'date', dir: 'desc' }} pageSize={10}
              empty={<EmptyState title="No adjustments" body="Changes to stock will be listed here." />} />}
      </Card>

      {open && <CountDrawer key={open.id} count={open} onClose={() => setOpenId(null)} onRemove={() => remove([open.id])} onApprove={() => approve(open)} />}
      <StartModal open={starting} onClose={() => setStarting(false)} />
      <AdjustModal open={adjusting} onClose={() => setAdjusting(false)} />
    </>
  );
}

function CountDrawer({ count: c, onClose, onRemove, onApprove }: { count: Count; onClose: () => void; onRemove: () => void; onApprove: () => void }) {
  const [, setCounts] = countStore.use();
  const { toast } = useApp();
  const editable = c.status === 'Draft';
  const [vals, setVals] = useState<string[]>(c.lines.map((l) => (l.counted === null ? '' : String(l.counted))));
  const [reason, setReason] = useState(c.reason);
  const [tried, setTried] = useState(false);
  const nums = vals.map(toInt);
  const diff = nums.reduce((a: number, n, i) => a + (Number.isNaN(n) ? 0 : n - c.lines[i].expected), 0);
  const errs = vals.map((v) => (v === '' ? 'Enter a count' : Number.isNaN(toInt(v)) ? 'Whole number' : ''));
  const reasonErr = diff !== 0 && !reason ? 'Choose a reason for the difference' : '';
  const submit = () => {
    setTried(true); if (errs.some(Boolean) || reasonErr) return;
    setCounts((l) => l.map((x) => (x.id === c.id ? { ...x, status: 'Pending', reason, lines: x.lines.map((ln, i) => ({ ...ln, counted: nums[i] })) } : x)));
    toast('Sent for approval', { body: `${c.id} is waiting for a manager.` }); onClose();
  };
  return (
    <Drawer open onClose={onClose} title={c.id} subtitle={`${whName(c.warehouse)} · ${c.zone}`} width={560}
      footer={<>
        {editable && <Button variant="danger" onClick={onRemove}>Delete</Button>}
        {editable && <Button icon={Send} onClick={submit}>Send for approval</Button>}
        {c.status === 'Pending' && <Button icon={Check} onClick={onApprove}>Approve count</Button>}
      </>}>
      <Pill tone={cTone(c.status)} dot>{c.status === 'Pending' ? 'Pending approval' : c.status}</Pill>
      <div className="mt-4"><KV k="Date">{fmtDate(c.date)}</KV><KV k="Counted by">{c.by}</KV><KV k="Difference"><span className="num">{signed(diff)} units</span></KV></div>
      <div className="label-caps mt-6 mb-2">Items in this zone</div>
      <div className="grid grid-cols-[1fr_64px_96px] gap-3 text-[12px] text-muted pb-2 border-b border-line"><span>Product and bin</span><span className="text-right">Expected</span><span className="text-right">Counted</span></div>
      {c.lines.map((l, i) => (
        <div key={l.bin} className="grid grid-cols-[1fr_64px_96px] gap-3 items-center py-2.5 border-b border-line last:border-0 text-[13.5px]">
          <div className="min-w-0"><div className="truncate">{l.product}</div><div className="text-muted text-[12px] num">Bin {l.bin}</div></div>
          <span className="num text-right">{l.expected}</span>
          {editable
            ? <div><input value={vals[i]} onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Counted ${l.product}`} className={`w-full h-9 rounded-xl bg-field px-3 text-right num outline-none focus:bg-card border ${tried && errs[i] ? 'border-bad' : 'border-transparent focus:border-mid'}`} />{tried && errs[i] && <div className="text-bad text-[11px] text-right mt-0.5">{errs[i]}</div>}</div>
            : <span className={`num text-right font-medium ${l.counted !== null && l.counted !== l.expected ? 'text-bad' : ''}`}>{l.counted ?? '—'}</span>}
        </div>
      ))}
      <div className="mt-5">
        {editable ? <Select label="Reason for any difference" value={reason} onChange={setReason} options={[{ value: '', label: 'No difference' }, ...REASONS.map((r) => ({ value: r, label: r }))]} /> : <KV k="Reason">{c.reason || 'None'}</KV>}
        {tried && reasonErr && <div className="text-bad text-[12.5px] mt-1">{reasonErr}</div>}
      </div>
    </Drawer>
  );
}

function StartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [whs] = whStore.use();
  const { toast, user } = useApp();
  const [wh, setWh] = useState(''); const [zone, setZone] = useState(''); const [tried, setTried] = useState(false);
  const w = whs.find((x) => x.id === wh);
  const close = () => { setWh(''); setZone(''); setTried(false); onClose(); };
  const save = () => {
    setTried(true); if (!w || !zone) return;
    const id = `CNT-${1205 + countStore.get().length - 4}`;
    countStore.set((l) => [{ id, warehouse: w.id, zone, date: TODAY, by: user.name, status: 'Draft', reason: '', lines: linesFor(w, zone) }, ...l]);
    toast('Count started', { body: `${id} is ready for counting.`, star: true }); close();
  };
  return (
    <Modal open={open} onClose={close} title="Start stock count" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={save}>Start count</Button></>}>
      <div className="space-y-4">
        <div><Select label="Location" value={wh} onChange={(v) => { setWh(v); setZone(''); }} options={[{ value: '', label: 'Choose a location' }, ...whs.filter((x) => x.status === 'Active').map((x) => ({ value: x.id, label: x.name }))]} />{tried && !w && <div className="text-bad text-[12.5px] mt-1">Choose a location</div>}</div>
        <div><Select label="Zone" value={zone} onChange={setZone} options={[{ value: '', label: w ? 'Choose a zone' : 'Choose a location first' }, ...(w?.zones.map((z) => ({ value: z.name, label: z.name })) ?? [])]} />{tried && w && !zone && <div className="text-bad text-[12.5px] mt-1">Choose a zone</div>}</div>
      </div>
    </Modal>
  );
}

function AdjustModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [whs] = whStore.use();
  const { toast, user } = useApp();
  const blank = { wh: '', product: '', change: '', reason: '' };
  const [v, setV] = useState(blank); const [tried, setTried] = useState(false);
  const set = (k: keyof typeof blank) => (x: string) => setV((p) => ({ ...p, [k]: x }));
  const n = parseInt(v.change, 10);
  const err = { wh: v.wh ? '' : 'Choose a location', product: v.product ? '' : 'Choose a product', change: /^[+-]?\d+$/.test(v.change.trim()) && n !== 0 ? '' : 'Enter a number such as -3 or 5', reason: v.reason ? '' : 'Choose a reason' };
  const close = () => { setV(blank); setTried(false); onClose(); };
  const save = () => {
    setTried(true); if (Object.values(err).some(Boolean)) return;
    adjStore.set((l) => [{ id: `ADJ-${802 + l.length - 5}`, date: TODAY, warehouse: v.wh, product: v.product, change: n, reason: v.reason, by: user.name }, ...l]);
    toast('Adjustment saved'); close();
  };
  const E = ({ m }: { m: string }) => (tried && m ? <div className="text-bad text-[12.5px] mt-1">{m}</div> : null);
  return (
    <Modal open={open} onClose={close} title="Add adjustment" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={save}>Save adjustment</Button></>}>
      <div className="space-y-4">
        <div><Select label="Location" value={v.wh} onChange={set('wh')} options={[{ value: '', label: 'Choose a location' }, ...whs.map((x) => ({ value: x.id, label: x.name }))]} /><E m={err.wh} /></div>
        <div><Select label="Product" value={v.product} onChange={set('product')} options={[{ value: '', label: 'Choose a product' }, ...PRODUCT_NAMES.map((p) => ({ value: p, label: p }))]} /><E m={err.product} /></div>
        <Field label="Change in units" value={v.change} onChange={set('change')} error={tried ? err.change : ''} hint="Use a minus sign to remove stock" />
        <div><Select label="Reason" value={v.reason} onChange={set('reason')} options={[{ value: '', label: 'Choose a reason' }, ...REASONS.map((r) => ({ value: r, label: r }))]} /><E m={err.reason} /></div>
      </div>
    </Modal>
  );
}

