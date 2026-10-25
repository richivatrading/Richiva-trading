"use client";
import { useMemo, useState } from 'react';
import { Columns3, Download, Plus, ShieldAlert, ShieldCheck, Tag, Truck, Check, Printer, FileText } from 'lucide-react';
import { navigate, useApp, useRoute } from '../store';
import { ordersStore, type Order, type OrderStatus } from '../data/seed';
import { Button, CelebrateState, Chip, DataTable, DropdownMenu, EmptyState, Modal, PageHeader, Pill, SearchInput, StatusPill, Tabs, toneOf, useFakeLoad, type Col } from '../ui/kit';
import { cn, rs } from '../lib/format';
import OrderDrawer from './orders/OrderDrawer';
import OrderDetail from './orders/OrderDetail';
import CreateOrderPanel from './orders/CreateOrderPanel';
import { CHANNELS, COURIER_INFO, PAY_METHODS, STATUSES, addEvent, dayOf, dateNum, flash, flashStore, itemsCount, setStatus, patchOrder } from './orders/shared';

type TabId = 'All' | OrderStatus;
const DATES: Record<string, number> = { 'Any time': 0, Today: 18, 'Last 3 days': 16, 'Last 7 days': 12 };
const COLS = [['date', 'Date'], ['customer', 'Customer'], ['items', 'Items'], ['total', 'Total'], ['pay', 'Payment'], ['status', 'Status'], ['courier', 'Courier'], ['risk', 'Risk']] as const;

function exportCsv(rows: Order[], name = 'richiva-orders.csv') {
  const head = ['Order', 'Date', 'Customer', 'Phone', 'City', 'Items', 'Total', 'Payment', 'Status', 'Courier', 'Risk'];
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [head, ...rows.map((o) => [o.id, o.date, o.customer, o.phone, o.city, itemsCount(o), o.total, o.pay, o.status, o.courier, o.risk])].map((r) => r.map(q).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const on = !!value && value !== 'Any time';
  return (
    <DropdownMenu align="left" width={190} trigger={<Chip active={on} onRemove={on ? () => onChange('') : undefined}>{on ? `${label}: ${value}` : label}</Chip>}
      items={options.map((o) => ({ label: o, active: o === value, onClick: () => onChange(o === value ? '' : o) }))} />
  );
}

export default function Orders() {
  const route = useRoute();
  const id = route.path[1];
  if (id) return <OrderDetail id={decodeURIComponent(id)} />;
  return <List />;
}

function List() {
  const { toast } = useApp();
  const route = useRoute();
  const loading = useFakeLoad(600);
  const [orders] = ordersStore.use(); const [flashIds] = flashStore.use();
  const tab: TabId = (['All', ...STATUSES] as string[]).includes(route.query.tab) ? (route.query.tab as TabId) : 'All';
  const creating = route.query.create === '1';
  const [q, setQ] = useState('');
  const [fl, setFl] = useState({ date: '', pay: '', courier: '', channel: '', cod: '' });
  const [hidden, setHidden] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [assign, setAssign] = useState<string[] | null>(null);

  const counts = useMemo(() => { const c: Record<string, number> = { All: orders.length }; STATUSES.forEach((s) => (c[s] = orders.filter((o) => o.status === s).length)); return c; }, [orders]);
  const rows = useMemo(() => orders.filter((o) => {
    if (tab !== 'All' && o.status !== tab) return false;
    const s = q.trim().toLowerCase();
    if (s && !(o.id.toLowerCase().includes(s) || o.customer.toLowerCase().includes(s) || o.phone.replace(/\D/g, '').includes(s.replace(/\D/g, '') || '\u0000') || o.phone.includes(s))) return false;
    if (fl.date && DATES[fl.date] && dayOf(o) < DATES[fl.date]) return false;
    if (fl.pay && o.pay !== fl.pay) return false;
    if (fl.courier && o.courier !== fl.courier) return false;
    if (fl.channel && o.channel !== fl.channel) return false;
    if (fl.cod && (o.pay !== 'COD' || o.codVerified !== (fl.cod === 'Verified'))) return false;
    return true;
  }), [orders, tab, q, fl]);

  const setTab = (t: TabId) => navigate(`/orders?tab=${encodeURIComponent(t)}`);
  const anyFilter = !!q || Object.values(fl).some(Boolean);
  const clearAll = () => { setQ(''); setFl({ date: '', pay: '', courier: '', channel: '', cod: '' }); };

  const columns = useMemo(() => {
    const all: Col<Order>[] = [
      { key: 'id', header: 'Order', sort: (o) => o.id, render: (o) => <a href={`#/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-medium num underline-offset-4 hover:underline hover:text-champagne transition-colors">{o.id}</a> },
      { key: 'date', header: 'Date', sort: dateNum, hideBelow: 'lg', render: (o) => <span className="text-muted whitespace-nowrap">{o.date}</span> },
      { key: 'customer', header: 'Customer', sort: (o) => o.customer, render: (o) => <div><div>{o.customer}</div><div className="text-muted text-[12px]">{o.city}</div></div> },
      { key: 'items', header: 'Items', sort: itemsCount, hideBelow: 'lg', render: (o) => <span className="num">{itemsCount(o)}</span> },
      { key: 'total', header: 'Total', align: 'right', sort: (o) => o.total, render: (o) => <span className="num font-medium">{rs(o.total)}</span> },
      { key: 'pay', header: 'Payment', sort: (o) => o.pay, render: (o) => <Pill tone="neutral">{o.pay}</Pill> },
      { key: 'status', header: 'Status', sort: (o) => o.status, render: (o) => <StatusPill status={o.status} /> },
      { key: 'courier', header: 'Courier', hideBelow: 'xl', render: (o) => <span className={o.courier === '—' ? 'text-muted' : ''}>{o.courier}</span> },
      { key: 'risk', header: 'Risk', align: 'center', sort: (o) => ['Low', 'Medium', 'High'].indexOf(o.risk), render: (o) => o.risk === 'Low' ? <ShieldCheck size={17} strokeWidth={1.5} className="text-muted inline" aria-label="Low risk" /> : <ShieldAlert size={17} strokeWidth={1.5} aria-label={`${o.risk} risk`} className={cn('inline', toneOf(o.risk) === 'danger' ? 'text-bad' : 'text-warn')} /> },
    ];
    return all.filter((c) => !hidden.includes(c.key));
  }, [hidden]);

  const bulkConfirm = (ids: string[], clear: () => void) => {
    const t = orders.filter((o) => ids.includes(o.id) && o.status === 'To confirm');
    if (!t.length) return toast('Nothing to confirm', { body: 'Pick orders in To confirm' });
    t.forEach((o) => setStatus(o, 'Processing', 'Order confirmed in bulk', 'Anita Shrestha', { codVerified: true }));
    toast(`${t.length} ${t.length === 1 ? 'order' : 'orders'} confirmed`, { star: true }); clear();
  };
  const applyCourier = (c: (typeof COURIER_INFO)[number]) => {
    assign?.forEach((id) => { patchOrder(id, { courier: c.name }); addEvent(id, `Courier set to ${c.name}`, 'Anita Shrestha'); });
    flash(assign ?? []); toast('Courier assigned', { body: `${assign?.length} orders · ${c.name}` }); setAssign(null);
  };
  const empty = tab === 'To confirm' && counts['To confirm'] === 0 && !anyFilter
    ? <CelebrateState title="All orders confirmed. Nice work." body="New orders will appear here as they arrive." />
    : <EmptyState title="No orders found" body={anyFilter ? 'Try clearing a filter or searching for something else.' : `There are no ${tab === 'All' ? '' : tab.toLowerCase() + ' '}orders yet.`} action={anyFilter ? <Button variant="secondary" onClick={clearAll}>Clear filters</Button> : undefined} />;

  return (
    <div>
      <PageHeader title="Orders" subtitle="Confirm, pack and ship. Status colours show what needs you."
        actions={<><Button variant="secondary" icon={Download} onClick={() => { exportCsv(rows); toast('Export ready', { body: `${rows.length} orders` }); }}>Export</Button><Button icon={Plus} onClick={() => navigate('/orders?create=1')}>Create order</Button></>} />
      <div className="bg-card rounded-2xl border border-line shadow-[var(--shadow)] anim-fade-up">
        <div className="px-5 pt-4 text-[14px] text-muted">{`${counts['To confirm'] ?? 0} orders need confirming, ${counts['Processing'] ?? 0} need packing.`}</div>
        <Tabs className="px-3" value={tab} onChange={setTab} tabs={(['All', ...STATUSES] as TabId[]).map((t) => ({ id: t, label: t, count: counts[t] }))} />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search order number, name or phone" className="w-full sm:w-72" />
          <FilterChip label="Date" value={fl.date} options={Object.keys(DATES)} onChange={(v) => setFl({ ...fl, date: v })} />
          <FilterChip label="Payment" value={fl.pay} options={PAY_METHODS} onChange={(v) => setFl({ ...fl, pay: v })} />
          <FilterChip label="Courier" value={fl.courier} options={COURIER_INFO.map((c) => c.name)} onChange={(v) => setFl({ ...fl, courier: v })} />
          <FilterChip label="Channel" value={fl.channel} options={CHANNELS} onChange={(v) => setFl({ ...fl, channel: v })} />
          <FilterChip label="COD verification" value={fl.cod} options={['Verified', 'Not verified']} onChange={(v) => setFl({ ...fl, cod: v })} />
          <div className="ml-auto"><DropdownMenu width={200} trigger={<Button variant="ghost" size="sm" icon={Columns3}>Columns</Button>} items={COLS.map(([k, l]) => ({ label: l, active: !hidden.includes(k), onClick: () => setHidden(hidden.includes(k) ? hidden.filter((x) => x !== k) : [...hidden, k]) }))} /></div>
        </div>
        <DataTable<Order> columns={columns} rows={rows} rowId={(o) => o.id} loading={loading} selectable onRowClick={(o) => setOpen(o.id)} activeId={open} flashIds={flashIds} pageSize={15} empty={empty}
          bulk={(ids, clear) => {
            const sel = orders.filter((o) => ids.includes(o.id));
            return <>
              <Button size="sm" variant="ghost" icon={Check} onClick={() => bulkConfirm(ids, clear)}>Confirm</Button>
              <Button size="sm" variant="ghost" icon={FileText} onClick={() => { toast(`Printing ${ids.length} invoices`); clear(); }}>Print invoices</Button>
              <Button size="sm" variant="ghost" icon={Printer} onClick={() => { toast(`Printing ${ids.length} labels`); clear(); }}>Print labels</Button>
              <Button size="sm" variant="ghost" icon={Truck} onClick={() => setAssign(ids)}>Assign courier</Button>
              <Button size="sm" variant="ghost" icon={Download} onClick={() => { exportCsv(sel, 'richiva-selected-orders.csv'); toast('Export ready', { body: `${sel.length} orders` }); }}>Export</Button>
            </>;
          }} />
      </div>
      <OrderDrawer orderId={open} onClose={() => setOpen(null)} />
      <CreateOrderPanel open={creating} onClose={() => navigate(tab === 'All' ? '/orders' : `/orders?tab=${tab}`)} onCreated={(id) => { toast('Order created', { body: id, star: true }); navigate('/orders?tab=To confirm'); }} />
      {assign && (
        <Modal open onClose={() => setAssign(null)} size="sm" title="Assign courier">
          <div className="text-muted text-[13px] mb-3">{assign.length} {assign.length === 1 ? 'order' : 'orders'} selected</div>
          <div className="grid gap-2">{COURIER_INFO.map((c) => (
            <button key={c.name} onClick={() => applyCourier(c)} className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:border-champagne hover:bg-soft transition-all"><Tag size={16} strokeWidth={1.5} /><span className="flex-1"><span className="block font-medium">{c.name}</span><span className="text-muted text-[13px]">{c.days} days</span></span><span className="num font-medium">{rs(c.price)}</span></button>
          ))}</div>
        </Modal>
      )}
    </div>
  );
}

