import { useState } from 'react';
import { Power } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, EmptyState, Field, KV, Modal, Pill, Progress, SearchInput, Select, type Col } from '../../ui/kit';
import { useApp } from '../../store';
import { uid } from '../../lib/format';
import { whStore, whCap, whPct, whUnits, useTrigger, type Warehouse } from './wh';
import { mkBlankZones } from './zones';

const FILTERS = ['All', 'Active', 'Inactive'] as const;

export default function Warehouses({ loading, trigger }: { loading: boolean; trigger: number }) {
  const [whs, setWhs] = whStore.use();
  const { confirm, toast } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState<(typeof FILTERS)[number]>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const open = whs.find((w) => w.id === openId) ?? null;
  useTrigger(trigger, () => setAdding(true));

  const shown = whs.filter((w) => (f === 'All' || w.status === f) && (!q || `${w.name} ${w.address} ${w.manager}`.toLowerCase().includes(q.toLowerCase())));
  const setStatus = async (ids: string[], status: Warehouse['status']) => {
    const prev = whs.filter((w) => ids.includes(w.id)).map((w) => [w.id, w.status] as const);
    if (status === 'Inactive' && !(await confirm({ title: ids.length > 1 ? `Deactivate ${ids.length} locations?` : 'Deactivate this location?', body: 'It will stop receiving stock and transfers. You can switch it back on any time.', confirmLabel: 'Deactivate', danger: true }))) return;
    setWhs((l) => l.map((w) => (ids.includes(w.id) ? { ...w, status } : w)));
    toast(status === 'Inactive' ? 'Location deactivated' : 'Location activated', { undo: () => setWhs((l) => l.map((w) => { const p = prev.find((x) => x[0] === w.id); return p ? { ...w, status: p[1] } : w; })) });
  };

  const cols: Col<Warehouse>[] = [
    { key: 'name', header: 'Location', sort: (w) => w.name, render: (w) => <div><div className="font-medium">{w.name}</div><div className="text-muted text-[12px]">{w.address}</div></div> },
    { key: 'manager', header: 'Manager', sort: (w) => w.manager, render: (w) => <div><div>{w.manager}</div><div className="text-muted text-[12px] num">{w.phone}</div></div> },
    { key: 'capacity', header: 'Capacity used', align: 'right', sort: whPct, render: (w) => <div className="flex items-center gap-3 justify-end"><Progress value={whPct(w)} className="w-24" /><span className="num w-10 text-right">{whPct(w)}%</span></div> },
    { key: 'units', header: 'Units stored', align: 'right', sort: whUnits, render: (w) => <span className="num">{whUnits(w).toLocaleString('en-IN')}</span> },
    { key: 'zones', header: 'Zones and bins', render: (w) => <span className="text-muted">{w.zones.length} zones · {w.zones.reduce((a, z) => a + z.bins.length, 0)} bins</span> },
    { key: 'status', header: 'Status', sort: (w) => w.status, render: (w) => <Pill tone={w.status === 'Active' ? 'success' : 'neutral'} dot>{w.status}</Pill> },
  ];

  return (
    <>
      <Card pad={false}>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">{FILTERS.map((x) => <Chip key={x} active={f === x} count={x === 'All' ? whs.length : whs.filter((w) => w.status === x).length} onClick={() => setF(x)}>{x}</Chip>)}</div>
          <SearchInput value={q} onChange={setQ} placeholder="Search locations" className="w-full sm:w-72" />
        </div>
        <DataTable columns={cols} rows={shown} rowId={(w) => w.id} loading={loading} onRowClick={(w) => setOpenId(w.id)} activeId={openId} selectable defaultSort={{ key: 'name', dir: 'asc' }}
          bulk={(ids, clear) => <Button size="sm" variant="danger" icon={Power} onClick={async () => { await setStatus(ids, 'Inactive'); clear(); }}>Deactivate</Button>}
          empty={<EmptyState title="No locations found" body="Try a different search or add a new location." action={<Button variant="secondary" onClick={() => { setQ(''); setF('All'); }}>Clear filters</Button>} />} />
      </Card>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.name} subtitle={open && `${open.kind} · ${open.address}`} width={560}
        footer={open && (open.status === 'Active'
          ? <Button variant="danger" icon={Power} onClick={() => setStatus([open.id], 'Inactive')}>Deactivate</Button>
          : <Button icon={Power} onClick={() => setStatus([open.id], 'Active')}>Activate</Button>)}>
        {open && (
          <div>
            <div className="mb-5"><div className="flex justify-between text-[13px] mb-2"><span className="text-muted">Capacity used</span><span className="num font-medium">{whUnits(open)} of {whCap(open)} units · {whPct(open)}%</span></div><Progress value={whPct(open)} /></div>
            <KV k="Manager">{open.manager}</KV><KV k="Phone"><span className="num">{open.phone}</span></KV><KV k="Status"><Pill tone={open.status === 'Active' ? 'success' : 'neutral'} dot>{open.status}</Pill></KV>
            <div className="label-caps mt-6 mb-3">Zones and bins</div>
            <div className="space-y-5">
              {open.zones.map((z) => (
                <div key={z.name}>
                  <div className="flex justify-between text-[14px] font-medium mb-1"><span>{z.name}</span><span className="text-muted text-[12.5px] num">{z.bins.reduce((a, b) => a + b.units, 0)} units</span></div>
                  {z.bins.map((b) => (
                    <div key={b.code} className="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[13px]">
                      <span className="num text-muted w-12">{b.code}</span><span className="flex-1 truncate">{b.product}</span><Progress value={Math.round((b.units / b.cap) * 100)} className="w-16" /><span className="num w-14 text-right">{b.units}/{b.cap}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <AddModal open={adding} onClose={() => setAdding(false)} onAdd={(w) => { setWhs((l) => [...l, w]); toast('Location added', { star: true }); }} />
    </>
  );
}

function AddModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (w: Warehouse) => void }) {
  const [v, setV] = useState({ name: '', kind: 'Warehouse', address: '', manager: '', phone: '', zones: '3' });
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV((p) => ({ ...p, [k]: x }));
  const z = parseInt(v.zones, 10);
  const err = {
    name: !v.name.trim() ? 'Enter a name' : '', address: !v.address.trim() ? 'Enter an address' : '', manager: !v.manager.trim() ? 'Enter the manager' : '',
    phone: !/^\+977 ?9\d{2}-?\d{6}$/.test(v.phone.trim()) ? 'Use the format +977 98xx-xxxxxx' : '', zones: !(z >= 1 && z <= 8) ? 'Enter 1 to 8 zones' : '',
  };
  const bad = Object.values(err).some(Boolean);
  const save = () => {
    setTried(true); if (bad) return;
    onAdd({ id: uid('wh'), name: v.name.trim(), kind: v.kind as Warehouse['kind'], address: v.address.trim(), manager: v.manager.trim(), phone: v.phone.trim(), status: 'Active', zones: mkBlankZones(z) });
    setV({ name: '', kind: 'Warehouse', address: '', manager: '', phone: '', zones: '3' }); setTried(false); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Add warehouse" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Add warehouse</Button></>}>
      <div className="space-y-4">
        <Field label="Name" value={v.name} onChange={set('name')} error={tried ? err.name : ''} />
        <Select label="Type" value={v.kind} onChange={set('kind')} options={['Warehouse', 'Outlet']} />
        <Field label="Address" value={v.address} onChange={set('address')} error={tried ? err.address : ''} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Manager" value={v.manager} onChange={set('manager')} error={tried ? err.manager : ''} />
          <Field label="Phone" value={v.phone} onChange={set('phone')} error={tried ? err.phone : ''} />
        </div>
        <Field label="Number of zones" value={v.zones} onChange={set('zones')} error={tried ? err.zones : ''} />
      </div>
    </Modal>
  );
}
