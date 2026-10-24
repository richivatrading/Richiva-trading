import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RotateCw, Tag, ClipboardList } from 'lucide-react';
import { Button, Card, CardHeader, Checkbox, Chip, ChartTip, DataTable, Drawer, EmptyState, ErrorState, KV, Pill, SearchInput, Timeline, C, stagger, type Col } from '../../ui/kit';
import { productsStore, reorderNotesStore } from '../../data/seed';
import { navigate, useApp, useRoute } from '../../store';
import { cn, uid } from '../../lib/format';
import { rs } from '../../lib/format';
import { buildRows, deadStock, history, movements, suggestQty, type Row } from './data';
import { whStore, whUnits } from './wh';

const FILTERS = ['All', 'Available', 'Low', 'Out', 'Overstock'] as const;
type F = (typeof FILTERS)[number];
const label = (s: Row['status']): F => (s === 'Healthy' ? 'Available' : s);
const tone = { Available: 'success', Low: 'warning', Out: 'danger', Overstock: 'neutral', All: 'neutral' } as const;

export default function Stock({ loading }: { loading: boolean }) {
  const { query } = useRoute();
  const [filter, setFilter] = useState<F>(FILTERS.find((f) => f.toLowerCase() === (query.filter ?? '').toLowerCase()) ?? 'All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Row | null>(null);
  const [updated, setUpdated] = useState('Updated 2 minutes ago');
  const [spin, setSpin] = useState(false);
  const [tries, setTries] = useState(0);
  const [err, setErr] = useState(false);
  const [sel, setSel] = useState<string[] | null>(null);
  const { toast, user } = useApp();
  const [products] = productsStore.use();
  const [whs] = whStore.use();

  const rows = useMemo(() => buildRows(products), [products]);
  const counts = useMemo(() => {
    const c: Record<F, number> = { All: rows.length, Available: 0, Low: 0, Out: 0, Overstock: 0 };
    rows.forEach((r) => { c[label(r.status)]++; });
    return c;
  }, [rows]);
  const shown = rows.filter((r) => (filter === 'All' || label(r.status) === filter) && (!q || `${r.product.name} ${r.v.sku} ${r.v.size}`.toLowerCase().includes(q.toLowerCase())));
  const dead = useMemo(() => deadStock(products), [products]);
  const picked = sel ?? dead.map((d) => d.p.id);

  const refresh = () => {
    if (spin) return; setSpin(true);
    setTimeout(() => {
      setSpin(false); const n = tries + 1; setTries(n);
      if (n % 4 === 0) { setErr(true); return; }
      setUpdated('Updated just now'); toast('Stock refreshed', { star: true });
    }, 900);
  };
  const reorder = (r: Row) => {
    const qty = suggestQty(r);
    reorderNotesStore.set((n) => [{ id: uid('rn'), product: `${r.product.name} (${r.v.size}, ${r.v.color})`, qty, by: user.name, time: 'Just now' }, ...n]);
    toast('Reorder note sent', { body: `${qty} units of ${r.product.name} (${r.v.size}) suggested to the warehouse team.` });
  };

  const cols: Col<Row>[] = [
    { key: 'product', header: 'Product', sort: (r) => r.product.name, render: (r) => <span className="font-medium">{r.product.name}</span> },
    { key: 'variant', header: 'Variant', render: (r) => <div><div>{r.v.size} · {r.v.color}</div><div className="text-muted text-[12px] num">{r.v.sku}</div></div> },
    { key: 'onHand', header: 'On hand', align: 'right', sort: (r) => r.onHand, render: (r) => <span className="num">{r.onHand}</span> },
    { key: 'reserved', header: 'Reserved', align: 'right', sort: (r) => r.reserved, render: (r) => <span className="num text-muted">{r.reserved}</span> },
    { key: 'available', header: 'Available', align: 'right', sort: (r) => r.available, render: (r) => <span className="num font-medium">{r.available}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => { const l = label(r.status); return <Pill tone={tone[l]} dot>{l}</Pill>; } },
  ];

  if (err) return <Card><ErrorState title="Stock could not be refreshed" onRetry={() => { setErr(false); refresh(); }} /></Card>;
  const low = counts.Low, out = counts.Out;
  return (
    <div className="space-y-6">
      <Card pad={false}>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-medium">{low} items are running low{out > 0 && <span className="text-muted font-normal"> and {out} are out</span>}</div>
            <button onClick={refresh} className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-fg transition-colors" aria-label="Refresh stock"><RotateCw size={13} strokeWidth={1.5} className={cn(spin && 'anim-spin')} />{spin ? 'Refreshing…' : updated}</button>
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search by product or SKU" className="w-full sm:w-72" />
        </div>
        <div className="px-4 py-3 border-b border-line flex gap-2 flex-wrap">
          {FILTERS.map((f, i) => <span key={f} className="anim-fade-up" style={stagger(i)}><Chip active={filter === f} count={counts[f]} onClick={() => setFilter(f)}>{f}</Chip></span>)}
        </div>
        <DataTable columns={cols} rows={shown} rowId={(r) => r.id} onRowClick={setOpen} activeId={open?.id} loading={loading} pageSize={12} selectable defaultSort={{ key: 'available', dir: 'asc' }}
          bulk={(ids, clear) => <Button size="sm" icon={ClipboardList} onClick={() => { rows.filter((r) => ids.includes(r.id)).forEach(reorder); clear(); }}>Create reorder notes</Button>}
          empty={<EmptyState title="No items match" body="Try a different filter or search." action={<Button variant="secondary" onClick={() => { setFilter('All'); setQ(''); }}>Clear filters</Button>} />} />
      </Card>

      <Card>
        <CardHeader title="Dead stock" sub="Not sold in the last 90 days" action={<Button size="sm" variant="secondary" icon={Tag} disabled={!picked.length} onClick={() => navigate(`/marketing?tab=discounts&create=1&products=${picked.join(',')}`)}>Create sale</Button>} />
        {dead.length === 0 ? <EmptyState title="No dead stock" body="Everything has sold recently." star /> : (
          <ul className="divide-y divide-line">
            {dead.map((d, i) => (
              <li key={d.p.id} className="flex items-center gap-4 py-3 anim-fade-up" style={stagger(i)}>
                <Checkbox checked={picked.includes(d.p.id)} onChange={(v) => setSel(v ? [...picked, d.p.id] : picked.filter((x) => x !== d.p.id))} />
                <div className="flex-1 min-w-0"><div className="truncate">{d.p.name}</div><div className="text-muted text-[12px]">{d.p.sku} · {d.p.stock} units</div></div>
                <div className="text-muted text-[13px] hidden sm:block">{d.days} days since last sale</div>
                <div className="num font-medium w-28 text-right">{rs(d.value)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.product.name} subtitle={open && `${open.v.size} · ${open.v.color} · ${open.v.sku}`}
        footer={open && <Button icon={ClipboardList} onClick={() => reorder(open)}>Create reorder note · {suggestQty(open)} units</Button>}>
        {open && (
          <div>
            <div className="flex items-center gap-2 mb-5"><Pill tone={tone[label(open.status)]} dot>{label(open.status)}</Pill><span className="text-muted text-[13px]">{open.cover} days of cover</span></div>
            <div className="label-caps mb-2">Stock, last 30 days</div>
            <div className="h-[200px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={open.id} data={history(open)} margin={{ right: 8, top: 6 }}>
                  <defs><linearGradient id="invfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--ink)', stopOpacity: 0.14 }} /><stop offset="100%" style={{ stopColor: 'var(--ink)', stopOpacity: 0 }} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={30} tick={{ fontSize: 11, fill: 'var(--muted)' }} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="stepAfter" dataKey="stock" name="Units" stroke={C.ink} strokeWidth={2} fill="url(#invfill)" animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6"><KV k="On hand">{open.onHand}</KV><KV k="Reserved">{open.reserved}</KV><KV k="Available">{open.available}</KV><KV k="Reorder level">{open.reorder}</KV><KV k="Suggested reorder">{suggestQty(open)} units</KV></div>
            <div className="label-caps mt-6 mb-1">By location</div>
            {whs.filter((w) => w.status === 'Active').slice(0, 3).map((w, i) => {
              const share = [0.55, 0.3, 0.15][i]; return <KV key={w.id} k={w.name}>{Math.round(open.onHand * share)} <span className="text-muted text-[12px]">of {whUnits(w)} stored</span></KV>;
            })}
            <div className="label-caps mt-6 mb-3">Recent movements</div>
            <Timeline items={movements(open)} />
          </div>
        )}
      </Drawer>
    </div>
  );
}
