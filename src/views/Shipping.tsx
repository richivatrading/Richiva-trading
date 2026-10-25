"use client";
import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button, PageHeader, Tabs, useFakeLoad, Skeleton, Card } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp, useRoute } from '../store';
import { COURIER_SEED, SHIPMENTS } from './shipping/data';
import Couriers, { type Rule } from './shipping/Couriers';
import Zones from './shipping/Zones';
import Shipments from './shipping/Shipments';
import Problems from './shipping/Problems';

const TABS = ['couriers', 'zones', 'shipments', 'problems'] as const;
type Tab = (typeof TABS)[number];

export default function Shipping() {
  const route = useRoute();
  const { toast } = useApp();
  const q = route.query.tab;
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(q) ? (q as Tab) : 'couriers');
  useEffect(() => { if ((TABS as readonly string[]).includes(q)) setTab(q as Tab); }, [q]);
  const [couriers, setCouriers] = useState(COURIER_SEED);
  const [manual, setManual] = useState(false);
  const [rule, setRule] = useState<Rule>('Cheapest');
  const [ships, setShips] = useState(SHIPMENTS);
  const loading = useFakeLoad(600);
  const down = couriers.filter((c) => c.on && c.status === 'Down');
  const problems = ships.filter((s) => s.status === 'Failed').length;

  return (
    <div>
      <PageHeader title="Shipping" subtitle="Couriers, zones and parcels on the move."
        hint={<span className="inline-flex items-center gap-1.5 text-[13px] text-muted"><Star size={12} twinkle />On-time delivery 96 percent this week</span>} />
      {down.length > 0 && !manual && (
        <div className="mb-6 rounded-2xl border border-bad/40 bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-5 py-4 flex flex-wrap items-center justify-between gap-3 anim-fade-up">
          <div className="flex items-center gap-3 text-bad"><TriangleAlert size={18} strokeWidth={1.5} /><span className="text-fg text-[14px]"><b className="font-medium">{down.map((c) => c.name).join(' and ')}</b> {down.length > 1 ? 'are' : 'is'} not responding. New parcels cannot be booked automatically.</span></div>
          <Button size="sm" onClick={() => { setManual(true); toast('Switched to manual shipping', { body: 'Add waybills by hand until the courier is back.' }); }}>Switch to manual</Button>
        </div>
      )}
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ id: 'couriers', label: 'Couriers' }, { id: 'zones', label: 'Zones and rates' }, { id: 'shipments', label: 'Shipments' }, { id: 'problems', label: 'Problems', count: problems }]} />
      <div key={tab} className="anim-fade-up">
        {loading && tab !== 'shipments' ? <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">{[0, 1, 2].map((i) => <Card key={i}><Skeleton className="h-10 w-1/2 mb-4" /><Skeleton className="h-24 w-full" /></Card>)}</div> : <>
          {tab === 'couriers' && <Couriers couriers={couriers} setCouriers={setCouriers} manual={manual} setManual={setManual} rule={rule} setRule={setRule} goZones={() => setTab('zones')} />}
          {tab === 'zones' && <Zones couriers={couriers} />}
          {tab === 'shipments' && <Shipments ships={ships} setShips={setShips} loading={loading} />}
          {tab === 'problems' && <Problems ships={ships} setShips={setShips} />}
        </>}
      </div>
    </div>
  );
}

