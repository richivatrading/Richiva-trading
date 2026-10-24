import { useEffect, useState } from 'react';
import { Bell, Copy, Mail, MessageCircle, Plus, Smartphone, Trash2 } from 'lucide-react';
import { Button, Card, Chip, CountUp, DataTable, Drawer, EmptyState, KV, PageHeader, Pill, SearchInput, Skeleton, StatusPill, Switch, Tabs, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp, useRoute } from '../store';
import { rs } from '../lib/format';
import Wizard from './marketing/Wizard';
import DiscountDrawer from './marketing/DiscountDrawer';
import Banners from './marketing/Banners';
import Loyalty from './marketing/Loyalty';
import Audiences from './marketing/Audiences';
import Carts from './marketing/Carts';
import { campaignsStore, discountsStore, segmentsStore, type Campaign, type Channel, type Discount } from './marketing/data';

const TABS = ['campaigns', 'discounts', 'banners', 'loyalty', 'audiences', 'carts'] as const;
type TabId = (typeof TABS)[number];
const ICON: Record<Channel, typeof Mail> = { Email: Mail, SMS: Smartphone, WhatsApp: MessageCircle, Push: Bell };
const Channels = ({ list }: { list: Channel[] }) => <span className="inline-flex gap-1.5 text-muted">{list.map((c) => { const I = ICON[c]; return <span key={c} title={c}><I size={15} strokeWidth={1.5} /></span>; })}</span>;
const statusPill = (c: Campaign) => c.status === 'Scheduled' ? <Pill tone="info" icon={Star as never}>Scheduled</Pill> : <StatusPill status={c.status} />;
const results = (c: Campaign) => (c.sent ? `${Math.round((c.opened / c.sent) * 100)}% opened · ${c.orders} orders · ${rs(c.revenue)}` : 'No results yet');

export default function Marketing() {
  const { toast, confirm } = useApp();
  const { query } = useRoute();
  const loading = useFakeLoad(600);
  const [tab, setTab] = useState<TabId>('campaigns');
  const [campaigns] = campaignsStore.use();
  const [discounts, setDiscounts] = discountsStore.use();
  const [segments] = segmentsStore.use();
  const [wiz, setWiz] = useState<{ key: number; audience?: string } | null>(null);
  const [dd, setDd] = useState<{ editing: Discount | null; flash?: number } | null>(null);
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [fresh, setFresh] = useState<{ id: string; msg: string } | null>(null);
  const [q, setQ] = useState('');
  const [dFilter, setDFilter] = useState('All');
  const [createTick, setCreateTick] = useState(0);

  useEffect(() => {
    const t = TABS.find((x) => x === query.tab) ?? (query.products ? 'discounts' : query.segment ? 'campaigns' : undefined);
    if (t) setTab(t);
    if (query.create === '1' || query.segment) {
      if (t === 'campaigns' || (!t && !query.tab)) {
        const s = query.segment ? segments.find((x) => x.name.toLowerCase().includes(query.segment.toLowerCase())) : undefined;
        setTab('campaigns'); setWiz({ key: Date.now(), audience: s?.name });
      } else if (t === 'discounts') setDd({ editing: null });
      else if (t === 'banners' || t === 'audiences') setCreateTick((n) => n + 1);
    }
    if (query.products) setDd({ editing: null, flash: query.products.split(',').filter(Boolean).length });
  }, [query.tab, query.create, query.segment, query.products]); // eslint-disable-line

  const done = (c: Campaign, msg: string) => {
    setWiz(null); setTab('campaigns'); setFresh({ id: c.id, msg });
    toast(c.status === 'Scheduled' ? 'Campaign scheduled' : 'Campaign sending', { body: msg, star: true });
    setTimeout(() => setFresh(null), 9000);
  };
  const delDiscounts = async (ids: string[], clear: () => void) => {
    const gone = discounts.filter((d) => ids.includes(d.id));
    if (await confirm({ title: `Delete ${gone.length} code${gone.length > 1 ? 's' : ''}?`, body: 'Customers will no longer be able to use them.', confirmLabel: 'Delete', danger: true })) {
      setDiscounts((a) => a.filter((d) => !ids.includes(d.id))); clear(); toast('Deleted', { undo: () => setDiscounts((a) => [...gone, ...a]) });
    }
  };
  const dRows = discounts.filter((d) => (dFilter === 'All' || (dFilter === 'Active' ? d.active : !d.active)) && d.code.toLowerCase().includes(q.toLowerCase()));
  const act = {
    campaigns: <Button icon={Plus} onClick={() => setWiz({ key: Date.now() })}>New campaign</Button>,
    discounts: <Button icon={Plus} onClick={() => setDd({ editing: null })}>Create code</Button>,
  }[tab as 'campaigns'];

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Quiet, thoughtful ways to bring customers back." actions={act} />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ id: 'campaigns', label: 'Campaigns' }, { id: 'discounts', label: 'Discount codes' }, { id: 'banners', label: 'Banners' }, { id: 'loyalty', label: 'Loyalty and referral' }, { id: 'audiences', label: 'Audiences' }, { id: 'carts', label: 'Abandoned carts', count: 6 }]} />

      {loading ? <div className="grid md:grid-cols-3 gap-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div> : (
        <div key={tab} className="anim-fade-up">
          {tab === 'campaigns' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.slice(0, 6).map((c, i) => (
                  <Card key={c.id} style={stagger(i)} className="bg-soft relative cursor-pointer" onClick={() => setDetail(c)}>
                    {fresh?.id === c.id && <Star size={26} twinkle className="absolute -top-2 -right-2" />}
                    <div className="flex items-center justify-between"><Channels list={c.channels} />{statusPill(c)}</div>
                    <div className="font-title text-[26px] leading-tight mt-4">{c.name}</div>
                    <div className="text-muted text-[13px] mt-0.5">{c.audience} · {c.when}</div>
                    {fresh?.id === c.id ? <div className="mt-4 text-[13px] flex items-center gap-2 anim-fade-up"><Star size={12} />{fresh.msg}</div> : <div className="mt-4 text-[13px]">{results(c)}</div>}
                  </Card>
                ))}
              </div>
              <Card pad={false}>
                <DataTable rows={campaigns} rowId={(r) => r.id} onRowClick={setDetail} flashIds={fresh ? [fresh.id] : []} defaultSort={undefined}
                  columns={[
                    { key: 'name', header: 'Campaign', sort: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
                    { key: 'ch', header: 'Channels', render: (r) => <Channels list={r.channels} /> },
                    { key: 'aud', header: 'Audience', hideBelow: 'lg', render: (r) => r.audience },
                    { key: 'st', header: 'Status', render: statusPill },
                    { key: 'res', header: 'Results', hideBelow: 'lg', render: (r) => <span className="text-muted">{results(r)}</span> },
                  ]} empty={<EmptyState title="No campaigns yet" body="Start your first one." action={<Button onClick={() => setWiz({ key: Date.now() })}>New campaign</Button>} />} />
              </Card>
            </div>
          )}

          {tab === 'discounts' && (
            <Card pad={false}>
              <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
                <SearchInput className="w-64" value={q} onChange={setQ} placeholder="Search codes" />
                {['All', 'Active', 'Inactive'].map((f) => <Chip key={f} active={dFilter === f} onClick={() => setDFilter(f)}>{f}</Chip>)}
              </div>
              <DataTable rows={dRows} rowId={(r) => r.id} selectable onRowClick={(r) => setDd({ editing: r })}
                bulk={(ids, clear) => <><Button size="sm" variant="ghost" icon={Trash2} onClick={() => delDiscounts(ids, clear)}>Delete</Button></>}
                columns={[
                  { key: 'code', header: 'Code', sort: (r) => r.code, render: (r) => <span className="inline-flex items-center gap-2 font-medium tracking-wide">{r.code}<button title="Copy code" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(r.code); toast('Code copied'); }} className="text-muted hover:text-fg"><Copy size={13} /></button></span> },
                  { key: 'type', header: 'Type', hideBelow: 'lg', render: (r) => r.type },
                  { key: 'val', header: 'Value', sort: (r) => r.value, render: (r) => r.type === 'Percent' ? `${r.value}%` : r.type === 'Fixed' ? rs(r.value) : 'Free delivery' },
                  { key: 'min', header: 'Minimum cart', hideBelow: 'lg', sort: (r) => r.minCart, render: (r) => <span className="num">{rs(r.minCart)}</span> },
                  { key: 'lim', header: 'Usage limit', hideBelow: 'xl', render: (r) => (r.limit ? r.limit : 'Unlimited') },
                  { key: 'dates', header: 'Dates', hideBelow: 'xl', render: (r) => <span className="text-muted whitespace-nowrap">{r.start} to {r.end}</span> },
                  { key: 'used', header: 'Used', sort: (r) => r.used, render: (r) => <span className="num">{r.used}{r.limit ? <span className="text-muted"> / {r.limit}</span> : null}</span> },
                  { key: 'on', header: 'Status', render: (r) => <span className="inline-flex items-center gap-2"><Switch label={`${r.code} active`} checked={r.active} onChange={(v) => { setDiscounts((a) => a.map((x) => (x.id === r.id ? { ...x, active: v } : x))); toast(v ? `${r.code} is on` : `${r.code} is off`); }} /><span className="text-[12px] text-muted w-12">{r.active ? 'Active' : 'Off'}</span></span> },
                ]} empty={<EmptyState title="No codes found" body="Try another search or create a new code." />} />
            </Card>
          )}

          {tab === 'banners' && <Banners autoCreate={createTick > 0} key={createTick} />}
          {tab === 'loyalty' && <Loyalty />}
          {tab === 'audiences' && <Audiences autoCreate={createTick > 0} key={createTick} />}
          {tab === 'carts' && <Carts />}
        </div>
      )}

      {wiz && <Wizard key={wiz.key} open onClose={() => setWiz(null)} initialAudience={wiz.audience} onDone={done} />}
      <DiscountDrawer open={!!dd} onClose={() => setDd(null)} editing={dd?.editing ?? null} flashProducts={dd?.flash} onSaved={(d) => toast(`${d.code} saved`, { star: true })} />
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name} subtitle={detail?.when} width={460}>
        {detail && <div><div className="mb-4 flex items-center gap-2">{statusPill(detail)}<Channels list={detail.channels} /></div>
          <KV k="Audience">{detail.audience}</KV><KV k="Messages sent"><CountUp value={detail.sent} /></KV><KV k="Opened"><CountUp value={detail.opened} /></KV><KV k="Orders"><CountUp value={detail.orders} /></KV><KV k="Revenue"><CountUp value={detail.revenue} format={rs} /></KV></div>}
      </Drawer>
    </div>
  );
}
