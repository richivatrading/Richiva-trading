"use client";
import { useMemo, useState } from 'react';
import { ClipboardCheck, PackageCheck, Plus, ScanLine, Truck } from 'lucide-react';
import { Button, Card, CountUp, PageHeader, Skeleton, Tabs, stagger, useFakeLoad } from '../ui/kit';
import { productsStore } from '../data/seed';
import { useRoute } from '../store';
import { rs } from '../lib/format';
import { buildRows } from './inventory/data';
import { countStore, poStatus, poStore, trStore, whCap, whStore, whUnits, pickStore } from './inventory/wh';
import Stock from './inventory/Stock';
import Warehouses from './inventory/Warehouses';
import Receiving from './inventory/Receiving';
import Transfers from './inventory/Transfers';
import Counts from './inventory/Counts';
import Pick from './inventory/Pick';

type Tab = 'stock' | 'warehouses' | 'receiving' | 'transfers' | 'counts' | 'pick';
const TABS: Tab[] = ['stock', 'warehouses', 'receiving', 'transfers', 'counts', 'pick'];
const ACTIONS: Record<Tab, { label: string; icon: typeof Plus }> = {
  stock: { label: 'Receive stock', icon: PackageCheck }, warehouses: { label: 'Add warehouse', icon: Plus }, receiving: { label: 'Receive shipment', icon: PackageCheck },
  transfers: { label: 'New transfer', icon: Truck }, counts: { label: 'Start count', icon: ClipboardCheck }, pick: { label: 'Pick next order', icon: ScanLine },
};

export default function Inventory() {
  const { query } = useRoute();
  const [tab, setTab] = useState<Tab>(TABS.includes(query.tab as Tab) ? (query.tab as Tab) : 'stock');
  const [trig, setTrig] = useState<Record<Tab, number>>({ stock: 0, warehouses: 0, receiving: 0, transfers: 0, counts: 0, pick: 0 });
  const loading = useFakeLoad(600, [tab]);
  const [products] = productsStore.use();
  const [whs] = whStore.use();
  const [pos] = poStore.use();
  const [trs] = trStore.use();
  const [counts] = countStore.use();
  const [pick] = pickStore.use();

  const rows = useMemo(() => buildRows(products), [products]);
  const units = rows.reduce((a, r) => a + r.onHand, 0);
  const value = rows.reduce((a, r) => a + r.onHand * (r.product.salePrice ?? r.product.price), 0);
  const low = rows.filter((r) => r.status === 'Low' || r.status === 'Out').length;
  const inbound = pos.filter((p) => poStatus(p) !== 'Received');
  const active = whs.filter((w) => w.status === 'Active');
  const used = active.reduce((a, w) => a + whUnits(w), 0), cap = active.reduce((a, w) => a + whCap(w), 0);
  const moving = trs.filter((t) => t.status === 'Shipped').length;
  const awaiting = counts.filter((c) => c.status === 'Pending').length;
  void pick;

  const kpis = [
    { label: 'Total units', node: <CountUp value={units} />, sub: `${rows.length} variants across ${active.length} locations`, feature: true },
    { label: 'Stock value', node: <CountUp value={value} format={rs} />, sub: `${Math.round((used / Math.max(1, cap)) * 100)}% of space used` },
    { label: 'Needs attention', node: <CountUp value={low} />, sub: `${rows.filter((r) => r.status === 'Out').length} are out of stock` },
    { label: 'On the way in', node: <CountUp value={inbound.length} />, sub: `${moving} transfers moving, ${awaiting} counts to approve` },
  ];
  const A = ACTIONS[tab];
  const act = () => (tab === 'stock' ? setTab('receiving') : setTrig((t) => ({ ...t, [tab]: t[tab] + 1 })));

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock, warehouses and everything moving between them."
        actions={<Button icon={A.icon} onClick={act}>{A.label}</Button>} />
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[128px] rounded-[28px]" />) : kpis.map((k, i) => (
            <Card key={k.label} style={stagger(i)} className={k.feature ? 'feature !p-5' : '!p-5'}>
              <div className={k.feature ? 'text-[12px] text-white/60' : 'text-[12px] text-muted'}>{k.label}</div>
              <div className="text-[32px] font-semibold leading-none mt-3 num">{k.node}</div>
              <div className={k.feature ? 'text-[12px] mt-2 text-white/60' : 'text-[12px] mt-2 text-muted'}>{k.sub}</div>
            </Card>
          ))}
        </div>
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[
          { id: 'stock', label: 'Stock' }, { id: 'warehouses', label: 'Warehouses', count: whs.length }, { id: 'receiving', label: 'Receiving', count: inbound.length },
          { id: 'transfers', label: 'Transfers', count: trs.filter((t) => t.status !== 'Delivered' && t.status !== 'Cancelled').length }, { id: 'counts', label: 'Counts and adjustments', count: awaiting }, { id: 'pick', label: 'Pick and pack' },
        ]} />
        <div key={tab} className="anim-fade-up space-y-6">
          {tab === 'stock' && <Stock loading={loading} />}
          {tab === 'warehouses' && <Warehouses loading={loading} trigger={trig.warehouses} />}
          {tab === 'receiving' && <Receiving loading={loading} trigger={trig.receiving} />}
          {tab === 'transfers' && <Transfers loading={loading} trigger={trig.transfers} />}
          {tab === 'counts' && <Counts loading={loading} trigger={trig.counts} />}
          {tab === 'pick' && <Pick loading={loading} trigger={trig.pick} />}
        </div>
      </div>
    </div>
  );
}

