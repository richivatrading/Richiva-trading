"use client";
import { useMemo, useState } from 'react';
import { Plus, Store, LayoutGrid, List, Lock, Trash2, MoreHorizontal, Pencil, RotateCw, Unlock } from 'lucide-react';
import { Button, Card, Chip, CountUp, DataTable, DropdownMenu, EmptyState, ErrorState, IconButton, Pill, PageHeader, Photo, SearchInput, Segmented, Skeleton, StatusPill, Tabs, stagger, useFakeLoad, type Col } from '../ui/kit';
import { useApp } from '../store';
import { photo } from '../data/seed';
import { rs } from '../lib/format';
import { SEED, type Outlet, type OutletStatus } from './outlets/data';
import OutletDrawer from './outlets/OutletDrawer';
import OutletForm, { type FormVals } from './outlets/OutletForm';

type Tab = 'All' | 'Outlets' | 'Branches';
const STATUSES: OutletStatus[] = ['Active', 'Closed', 'Draft'];

export default function Outlets() {
  const { confirm, toast } = useApp();
  const [list, setList] = useState<Outlet[]>(SEED);
  const [tab, setTab] = useState<Tab>('All');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<OutletStatus[]>([]);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; edit: Outlet | null }>({ open: false, edit: null });
  const [flash, setFlash] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const loading = useFakeLoad(600, [tick]);

  const refresh = () => { setFailed(false); setTick((t) => t + 1); };
  const patch = (ids: string[], p: Partial<Outlet>) => setList((l) => l.map((o) => ids.includes(o.id) ? { ...o, ...p } : o));
  const open = list.find((o) => o.id === openId) ?? null;

  const rows = useMemo(() => list.filter((o) =>
    (tab === 'All' || o.type === (tab === 'Outlets' ? 'Outlet' : 'Branch')) &&
    (!filters.length || filters.includes(o.status)) &&
    (!q.trim() || `${o.name} ${o.city} ${o.address} ${o.manager}`.toLowerCase().includes(q.trim().toLowerCase()))), [list, tab, filters, q]);

  const live = list.filter((o) => o.status === 'Active');
  const kpis = [
    { label: 'All locations', value: list.length, fmt: (n: number) => String(Math.round(n)), note: `${list.filter((o) => o.type === 'Outlet').length} outlets, ${list.filter((o) => o.type === 'Branch').length} branches` },
    { label: 'Open now', value: live.length, fmt: (n: number) => String(Math.round(n)), note: `${list.filter((o) => o.status === 'Draft').length} not opened yet` },
    { label: "Today's sales", value: live.reduce((s, o) => s + o.sales, 0), fmt: (n: number) => rs(Math.round(n)), note: 'Up Rs 38,000 from yesterday' },
    { label: 'Items running low', value: live.reduce((s, o) => s + o.lowItems, 0), fmt: (n: number) => String(Math.round(n)), note: 'Across open locations' },
  ];

  const save = (v: FormVals) => {
    const e = form.edit;
    if (e) { patch([e.id], v); toast('Changes saved'); setFlash([e.id]); }
    else {
      const id = `o${Date.now()}`;
      setList((l) => [{ ...v, id, days: 'Every day', stock: 0, lowItems: 0, sales: 0, status: 'Draft', photo: l.length * 3 + 1, staff: [{ name: v.manager, role: 'Manager' }] }, ...l]);
      setFlash([id]); toast('Outlet added', { body: `${v.name} is saved as a draft.`, star: true });
    }
    setForm({ open: false, edit: null });
  };

  const closeThem = async (items: Outlet[]) => {
    const todo = items.filter((o) => o.status !== 'Closed'); if (!todo.length) return;
    if (!(await confirm({ title: todo.length === 1 ? `Close ${todo[0].name}?` : `Close ${todo.length} locations?`, body: 'Customers will not be able to pick up or buy in store here until you reopen it.', confirmLabel: 'Close', danger: true }))) return;
    const prev = todo.map((o) => [o.id, o.status] as const);
    patch(todo.map((o) => o.id), { status: 'Closed' });
    toast(todo.length === 1 ? 'Outlet closed' : `${todo.length} locations closed`, { undo: () => setList((l) => l.map((o) => { const p = prev.find((x) => x[0] === o.id); return p ? { ...o, status: p[1] } : o; })) });
  };
  const reopen = (o: Outlet) => { patch([o.id], { status: 'Active' }); toast(`${o.name} is open again`); };
  const remove = async (items: Outlet[]) => {
    if (!(await confirm({ title: items.length === 1 ? `Delete ${items[0].name}?` : `Delete ${items.length} locations?`, body: 'Its staff list and stock summary will be removed from this page.', confirmLabel: 'Delete', danger: true }))) return;
    const before = list; const ids = items.map((o) => o.id);
    setList((l) => l.filter((o) => !ids.includes(o.id))); if (openId && ids.includes(openId)) setOpenId(null);
    toast(items.length === 1 ? 'Outlet deleted' : `${items.length} locations deleted`, { undo: () => { setList(before); setFlash(ids); } });
  };
  const toggle = (o: Outlet) => o.status === 'Closed' ? reopen(o) : closeThem([o]);
  const menu = (o: Outlet) => [
    { label: 'Edit details', icon: Pencil, onClick: () => setForm({ open: true, edit: o }) },
    o.status === 'Closed' ? { label: 'Reopen', icon: Unlock, onClick: () => reopen(o) } : { label: 'Close outlet', icon: Lock, onClick: () => closeThem([o]) },
    { label: 'Delete', icon: Trash2, danger: true, divider: true, onClick: () => remove([o]) },
  ];

  const cols: Col<Outlet>[] = [
    { key: 'name', header: 'Name', sort: (o) => o.name, render: (o) => (
      <div className="flex items-center gap-3 h-16 min-w-[230px]"><Photo src={photo(o.photo, 96, 96)} size={44} className="!rounded-full shrink-0" /><div><div className="font-medium">{o.name}</div><div className="text-[13px] text-muted">{o.type}</div></div></div>) },
    { key: 'where', header: 'City and hours', sort: (o) => o.city, hideBelow: 'lg', render: (o) => <div className="min-w-[180px]"><div>{o.city}</div><div className="text-[13px] text-muted">{o.opens} to {o.closes}</div></div> },
    { key: 'manager', header: 'Manager', sort: (o) => o.manager, hideBelow: 'xl', render: (o) => o.manager },
    { key: 'stock', header: 'Stock', sort: (o) => o.stock, align: 'right', render: (o) => <div className="num">{o.stock.toLocaleString('en-IN')}{o.lowItems > 0 && <div className="text-[13px] text-muted">{o.lowItems} low</div>}</div> },
    { key: 'sales', header: "Today's sales", sort: (o) => o.sales, align: 'right', render: (o) => <span className="num whitespace-nowrap">{rs(o.sales)}</span> },
    { key: 'status', header: 'Status', sort: (o) => o.status, render: (o) => <StatusPill status={o.status} /> },
    { key: 'actions', header: '', width: '56px', render: (o) => <div onClick={(e) => e.stopPropagation()}><DropdownMenu trigger={<IconButton icon={MoreHorizontal} label="More" />} items={menu(o)} /></div> },
  ];

  const empty = <EmptyState icon={Store} title="No locations found" body={q || filters.length ? 'Try a different search or clear the filters.' : 'Add your first outlet to get started.'}
    action={q || filters.length ? <Button variant="secondary" onClick={() => { setQ(''); setFilters([]); }}>Clear filters</Button> : <Button icon={Plus} onClick={() => setForm({ open: true, edit: null })}>Add outlet</Button>} />;

  return (
    <div className="grid gap-6">
      <PageHeader title="Outlets and branches" subtitle="Every place customers can shop, with its team and stock."
        actions={<Button icon={Plus} onClick={() => setForm({ open: true, edit: null })}>Add outlet</Button>} />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Card key={k.label} className={i === 0 ? 'feature' : ''} style={stagger(i)}>
            <div className={`text-[14px] ${i === 0 ? 'text-white/70' : 'text-muted'}`}>{k.label}</div>
            {loading ? <Skeleton className="h-8 w-28 mt-3" /> : <div className="text-[32px] font-semibold mt-2 leading-tight num"><CountUp value={k.value} format={k.fmt} /></div>}
            <div className={`text-[13px] mt-2 ${i === 0 ? 'text-white/70' : 'text-muted'}`}>{k.note}</div>
          </Card>
        ))}
      </div>

      <Card pad={false} hover={false}>
        <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs<Tab> tabs={[{ id: 'All', label: 'All', count: list.length }, { id: 'Outlets', label: 'Outlets', count: list.filter((o) => o.type === 'Outlet').length }, { id: 'Branches', label: 'Branches', count: list.filter((o) => o.type === 'Branch').length }]} value={tab} onChange={setTab} />
          <Segmented options={[{ value: 'table', label: <span className="inline-flex items-center gap-1.5"><List size={14} />List</span> }, { value: 'cards', label: <span className="inline-flex items-center gap-1.5"><LayoutGrid size={14} />Cards</span> }]} value={view} onChange={setView} />
        </div>
        <div className="p-5 flex flex-wrap items-center gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, city or manager" className="w-full sm:w-80" />
          {STATUSES.map((s) => <Chip key={s} active={filters.includes(s)} count={list.filter((o) => o.status === s).length} onClick={() => setFilters((f) => f.includes(s) ? f.filter((x) => x !== s) : [...f, s])}>{s}</Chip>)}
          <IconButton icon={RotateCw} label="Refresh" className="ml-auto" onClick={() => { if (Math.random() < 0.1) { setFailed(true); } else refresh(); }} />
        </div>
        {failed ? <ErrorState title="We could not load your locations" onRetry={refresh} /> : view === 'table' ? (
          <DataTable<Outlet> columns={cols} rows={rows} rowId={(o) => o.id} selectable loading={loading} empty={empty} flashIds={flash} activeId={openId}
            onRowClick={(o) => setOpenId(o.id)} defaultSort={{ key: 'sales', dir: 'desc' }}
            bulk={(ids, clear) => { const items = list.filter((o) => ids.includes(o.id)); return <>
              <span className="font-medium">{ids.length} selected</span>
              <Button size="sm" variant="secondary" icon={Lock} onClick={async () => { await closeThem(items); clear(); }}>Close</Button>
              <Button size="sm" variant="danger" icon={Trash2} onClick={async () => { await remove(items); clear(); }}>Delete</Button></>; }} />
        ) : loading ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
        ) : rows.length === 0 ? empty : (
          <div className="grid gap-4 p-5 pt-0 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((o, i) => (
              <div key={o.id} onClick={() => setOpenId(o.id)} style={stagger(i)} className="anim-fade-up cursor-pointer rounded-2xl bg-soft p-5 hover:-translate-y-0.5 transition-transform duration-300">
                <div className="flex items-center gap-3"><Photo src={photo(o.photo, 96, 96)} size={48} className="!rounded-full shrink-0" /><div className="min-w-0"><div className="font-medium truncate">{o.name}</div><div className="text-[13px] text-muted">{o.city}</div></div><div className="ml-auto"><StatusPill status={o.status} /></div></div>
                <div className="mt-4 flex items-center justify-between text-[13px] text-muted"><Pill>{o.type}</Pill><span>{o.opens} to {o.closes}</span></div>
                <div className="mt-4 flex justify-between"><div><div className="text-[13px] text-muted">Stock</div><div className="font-semibold num">{o.stock.toLocaleString('en-IN')}</div></div><div className="text-right"><div className="text-[13px] text-muted">Today</div><div className="font-semibold num">{rs(o.sales)}</div></div></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <OutletDrawer outlet={open} onClose={() => setOpenId(null)} onEdit={(o) => setForm({ open: true, edit: o })} onToggle={toggle} onDelete={(o) => remove([o])}
        onHours={(id, h) => { patch([id], h); toast('Hours saved'); }} />
      <OutletForm open={form.open} edit={form.edit} onClose={() => setForm({ open: false, edit: null })} onSave={save} />
    </div>
  );
}

