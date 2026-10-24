import { useMemo, useState } from 'react';
import { Download, Layers, MessageSquare, Tag, ChevronDown } from 'lucide-react';
import { Avatar, Button, Card, Chip, DataTable, DropdownMenu, EmptyState, ErrorState, Field, Modal, PageHeader, SearchInput, Select, StatusPill, Tabs, useFakeLoad, Pill } from '../../ui/kit';
import { CITIES, customersStore, type Customer } from '../../data/seed';
import { navigate, useApp } from '../../store';
import { rs } from '../../lib/format';
import { MessageModal } from './Modals';
import { SEGMENTS, TierBadge, csvDownload, redact, useEffStatus } from './shared';

type Tab = 'All' | 'VIP' | 'New' | 'At risk' | 'Blocked';
const ORDER_F: Record<string, (c: Customer) => boolean> = { '1 order': (c) => c.orders === 1, '2 to 4': (c) => c.orders >= 2 && c.orders <= 4, '5 or more': (c) => c.orders >= 5 };
const SPEND_F: Record<string, (c: Customer) => boolean> = { 'Under Rs 35,000': (c) => c.spent < 35000, 'Rs 35,000 to 90,000': (c) => c.spent >= 35000 && c.spent <= 90000, 'Over Rs 90,000': (c) => c.spent > 90000 };

export default function List() {
  const { toast } = useApp();
  const [all, setAll] = customersStore.use(); const eff = useEffStatus();
  const loading = useFakeLoad(600); const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>('All'); const [q, setQ] = useState('');
  const [f, setF] = useState<{ city?: string; tier?: string; orders?: string; spend?: string; tag?: string }>({});
  const [msg, setMsg] = useState<Customer[] | null>(null);
  const [tagFor, setTagFor] = useState<string[] | null>(null); const [tag, setTag] = useState(''); const [tagErr, setTagErr] = useState('');
  const [segFor, setSegFor] = useState<string[] | null>(null); const [seg, setSeg] = useState(SEGMENTS[0]);
  const tabOf = (c: Customer, t: Tab) => { const s = eff(c); return t === 'All' ? true : t === 'VIP' ? c.tags.includes('VIP') || c.tier === 'Gold' : t === 'Blocked' ? s === 'Blocked' : s === t; };
  const tags = useMemo(() => [...new Set(all.flatMap((c) => c.tags))], [all]);
  const rows = all.filter((c) => tabOf(c, tab) && (!q || (c.name + c.phone + c.email).toLowerCase().includes(q.toLowerCase())) && (!f.city || c.city === f.city) && (!f.tier || c.tier === f.tier) && (!f.orders || ORDER_F[f.orders](c)) && (!f.spend || SPEND_F[f.spend](c)) && (!f.tag || c.tags.includes(f.tag)));
  const filt = (key: keyof typeof f, label: string, opts: string[]) => f[key]
    ? <Chip active onClick={() => setF({ ...f, [key]: undefined })} onRemove={() => setF({ ...f, [key]: undefined })}>{label}: {f[key]}</Chip>
    : <DropdownMenu align="left" width={210} trigger={<Chip>{label}<ChevronDown size={12} /></Chip>} items={opts.map((o) => ({ label: o, onClick: () => setF({ ...f, [key]: o }) }))} />;
  const pick = (ids: string[]) => all.filter((c) => ids.includes(c.id));
  const applyTag = () => { if (!tag.trim()) return setTagErr('Type a tag name.'); const ids = tagFor!; setAll((cs) => cs.map((c) => ids.includes(c.id) && !c.tags.includes(tag.trim()) ? { ...c, tags: [...c.tags, tag.trim()] } : c)); toast('Tag added', { body: `"${tag.trim()}" added to ${ids.length} customers.` }); setTagFor(null); setTag(''); setTagErr(''); };

  return (
    <div>
      <PageHeader title="Customers" subtitle="The people behind every order." chip={`${all.length} customers`} actions={<Button variant="secondary" icon={Download} onClick={() => { csvDownload(rows); toast('Export ready', { body: `${rows.length} customers saved as CSV.` }); }}>Export</Button>} />
      <Card pad={false} hover={false}>
        <div className="px-5 pt-4 text-[14px] text-muted">{`${rows.length} ${rows.length === 1 ? 'customer matches' : 'customers match'} your view.`}</div>
        <div className="px-5 pt-2"><Tabs<Tab> value={tab} onChange={setTab} tabs={(['All', 'VIP', 'New', 'At risk', 'Blocked'] as Tab[]).map((t) => ({ id: t, label: t, count: all.filter((c) => tabOf(c, t)).length }))} /></div>
        <div className="p-5 flex flex-wrap items-center gap-2.5">
          <SearchInput className="w-full sm:w-72" value={q} onChange={setQ} placeholder="Search name, phone or email" />
          {filt('city', 'City', CITIES)}{filt('tier', 'Tier', ['Bronze', 'Silver', 'Gold'])}{filt('orders', 'Orders', Object.keys(ORDER_F))}{filt('spend', 'Spend', Object.keys(SPEND_F))}{filt('tag', 'Tag', tags)}
          {Object.values(f).some(Boolean) && <button className="text-[13px] text-muted hover:text-fg underline underline-offset-4" onClick={() => setF({})}>Clear filters</button>}
        </div>
        {failed ? <ErrorState onRetry={() => setFailed(false)} /> : (
          <DataTable<Customer> rows={rows} rowId={(c) => c.id} loading={loading} selectable pageSize={12} defaultSort={{ key: 'spent', dir: 'desc' }} onRowClick={(c) => navigate(`/customers/${c.id}`)}
            empty={<EmptyState title="No customers found" body="Try a different search or clear the filters." action={<Button variant="secondary" onClick={() => { setQ(''); setF({}); setTab('All'); }}>Reset</Button>} />}
            bulk={(ids, clear) => (<>
              <Button size="sm" variant="ghost" icon={Tag} onClick={() => setTagFor(ids)}>Add tag</Button>
              <Button size="sm" variant="ghost" icon={Layers} onClick={() => setSegFor(ids)}>Add to segment</Button>
              <Button size="sm" variant="ghost" icon={MessageSquare} onClick={() => setMsg(pick(ids))}>Send message</Button>
              <Button size="sm" variant="ghost" icon={Download} onClick={() => { csvDownload(pick(ids)); toast('Export ready', { body: `${ids.length} customers saved as CSV.` }); clear(); }}>Export</Button>
            </>)}
            columns={[
              { key: 'name', header: 'Customer', sort: (c) => c.name, render: (c) => { const d = eff(c) === 'Deleted'; return <span className="flex items-center gap-3"><Avatar name={d ? 'X X' : c.name} size={34} /><span><span className="font-medium block leading-tight">{d ? 'Deleted customer' : c.name}</span>{c.tags.slice(0, 2).map((t) => <span key={t} className="text-[11px] text-muted mr-1.5">{t}</span>)}</span></span>; } },
              { key: 'phone', header: 'Phone', hideBelow: 'lg', render: (c) => <span className="num text-muted">{eff(c) === 'Deleted' ? redact(c.phone) : c.phone}</span> },
              { key: 'city', header: 'City', sort: (c) => c.city, hideBelow: 'lg', render: (c) => c.city },
              { key: 'orders', header: 'Orders', sort: (c) => c.orders, align: 'right', render: (c) => <span className="num">{c.orders}</span> },
              { key: 'spent', header: 'Total spent', sort: (c) => c.spent, align: 'right', render: (c) => <span className="num font-medium">{rs(c.spent)}</span> },
              { key: 'tier', header: 'Tier', sort: (c) => ['Bronze', 'Silver', 'Gold'].indexOf(c.tier), render: (c) => <TierBadge tier={c.tier} /> },
              { key: 'last', header: 'Last order', hideBelow: 'xl', render: (c) => <span className="text-muted">{c.last}</span> },
              { key: 'status', header: 'Status', render: (c) => { const s = eff(c); return s === 'Deleted' ? <Pill>Data deleted</Pill> : <StatusPill status={s === 'Active' ? 'Active' : s} />; } },
            ]} />
        )}
      </Card>
      <MessageModal open={!!msg} onClose={() => setMsg(null)} people={msg ?? []} />
      <Modal open={!!tagFor} onClose={() => setTagFor(null)} size="sm" title="Add tag" footer={<><Button variant="ghost" onClick={() => setTagFor(null)}>Cancel</Button><Button onClick={applyTag}>Add tag</Button></>}>
        <Field label="Tag name" value={tag} onChange={(v) => { setTag(v); setTagErr(''); }} error={tagErr} hint={`Applies to ${tagFor?.length ?? 0} customers`} />
      </Modal>
      <Modal open={!!segFor} onClose={() => setSegFor(null)} size="sm" title="Add to segment" footer={<><Button variant="ghost" onClick={() => setSegFor(null)}>Cancel</Button><Button onClick={() => { toast('Added to segment', { body: `${segFor!.length} customers added to "${seg}".` }); setSegFor(null); }}>Add</Button></>}>
        <Select label="Segment" value={seg} onChange={setSeg} options={SEGMENTS} />
      </Modal>
    </div>
  );
}
