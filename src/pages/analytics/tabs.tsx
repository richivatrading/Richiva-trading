import { Area, ComposedChart, Line, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTip, C, Card, stagger, Label } from '../../ui/kit';
import { rs } from '../../lib/format';
import { Insight, Legend, useLegend, Panel, VBars, HBars, Stats, ax, grid, compact, useHoverTip } from './ui';
import { type Data } from './data';

export interface TabProps { d: Data; cat: string; ch: string; compare: boolean; drill: (title: string, value: string, num: number, seed: string) => void }
const pctOf = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
const num = (n: number) => n.toLocaleString('en-IN');
const top = <T extends Record<string, string | number>>(a: T[], k: string) => [...a].sort((x, y) => Number(y[k]) - Number(x[k]))[0];

export function Sales({ d, cat, compare, drill }: TabProps) {
  const lg = useLegend();
  const delta = pctOf(d.total, d.prevTotal);
  const pay = [C.ink, C.champagne, C.sage];
  const leader = top(d.byCat, 'Revenue').name;
  return (
    <div>
      <Insight>Revenue is {rs(d.total)}, {Math.abs(delta).toFixed(1)}% {delta >= 0 ? 'higher' : 'lower'} than the previous period, and {leader} is leading.</Insight>
      <Stats items={[{ label: 'Revenue', value: d.total, format: rs }, { label: 'Orders', value: d.orders }, { label: 'Average order', value: Math.round(d.total / Math.max(1, d.orders)), format: rs }]} />
      <div className="space-y-6">
        <Panel title="Revenue over time" sub="Click a point to see what is behind it" h={380} action={compare && <Legend items={[{ k: 'Revenue', color: C.ink }, { k: 'Previous period', color: C.muted, dash: true }]} hidden={lg.hidden} toggle={lg.toggle} />}>
          <ResponsiveContainer>
            <ComposedChart data={d.revenue} margin={{ top: 8, right: 8 }} onClick={(e) => { const s = e as { activeLabel?: string | number; activeIndex?: string | number } | null; if (s?.activeLabel !== undefined) drill(`Revenue, ${s.activeLabel}`, rs(d.revenue[Number(s.activeIndex)]?.Revenue ?? 0), d.revenue[Number(s.activeIndex)]?.Revenue ?? 0, 'rev' + s.activeLabel); }}>
              {grid}<XAxis dataKey="name" {...ax} interval="preserveStartEnd" /><YAxis {...ax} width={48} tickFormatter={compact} />
              <Tooltip content={<ChartTip fmt={rs} />} />
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ink)" stopOpacity={0.1} /><stop offset="100%" stopColor="var(--ink)" stopOpacity={0} /></linearGradient></defs>
              <Area dataKey="Revenue" stroke={C.ink} strokeWidth={2} fill="url(#rg)" hide={lg.off('Revenue')} animationDuration={800} dot={false} activeDot={{ r: 5, fill: 'var(--champagne)', stroke: 'var(--card)', strokeWidth: 2, cursor: 'pointer' }} />
              {compare && <Line dataKey="Previous period" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 5" dot={false} hide={lg.off('Previous period')} animationDuration={800} />}
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel i={1} title="By category" h={280}><HBars data={d.byCat} k="Revenue" fmt={rs} hl={cat} onPick={(n, v) => drill(`${n} revenue`, rs(v), v, 'cat' + n)} width={90} /></Panel>
          <Panel i={2} title="By city" h={280}><HBars data={d.byCity.slice(0, 6)} k="Revenue" fmt={rs} color={C.champagne} onPick={(n, v) => drill(`${n} revenue`, rs(v), v, 'city' + n)} width={90} /></Panel>
        </div>
        <Panel i={3} title="By payment method" h={260} className="">
          <div className="grid sm:grid-cols-2 h-full items-center">
            <ResponsiveContainer><PieChart><Pie data={d.byPay} dataKey="Revenue" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} stroke="none" animationDuration={800} cursor="pointer" onClick={(e) => { const p = e as unknown as { name: string; Revenue: number }; drill(`${p.name} payments`, rs(p.Revenue), p.Revenue, 'pay' + p.name); }}>{d.byPay.map((_, i) => <Cell key={i} fill={pay[i]} />)}</Pie><Tooltip content={<ChartTip fmt={rs} />} /></PieChart></ResponsiveContainer>
            <div className="space-y-3 px-4">{d.byPay.map((p, i) => <div key={p.name} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: pay[i] }} />{p.name}</span><span className="num text-muted">{rs(p.Revenue)}</span></div>)}</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function Products({ d, cat, drill }: TabProps) {
  const lg = useLegend();
  const b = d.best[0], w = d.worst[0];
  return (
    <div>
      <Insight>{b.name} is selling best with {num(b.Units)} units, while {w.name} has sold only {num(w.Units)}.</Insight>
      <Stats items={[{ label: 'Units sold', value: d.best.concat(d.worst).reduce((a, x) => a + x.Units, 0) }, { label: 'Average margin', value: Math.round(d.catRows.reduce((a, x) => a + x.Margin, 0) / 4), format: (n) => `${n}%` }, { label: 'Average return rate', value: d.catRows.reduce((a, x) => a + x.Returns, 0) / 4, decimals: 1, format: (n) => `${n.toFixed(1)}%` }]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Best sellers" h={300}><HBars data={d.best} k="Units" width={150} onPick={(n, v) => drill(n, `${num(v)} units`, v, 'best' + n)} /></Panel>
        <Panel i={1} title="Worst sellers" h={300}><HBars data={d.worst} k="Units" width={150} color={C.champagne} onPick={(n, v) => drill(n, `${num(v)} units`, v, 'worst' + n)} /></Panel>
        <Panel i={2} title="Sell-through and margin" sub="Percent, by category" className="lg:col-span-2" action={<Legend items={[{ k: 'Sell-through', color: C.ink }, { k: 'Margin', color: C.champagne }]} hidden={lg.hidden} toggle={lg.toggle} />}>
          <VBars data={d.catRows} hidden={lg.hidden} keys={[{ k: 'Sell-through', color: C.ink }, { k: 'Margin', color: C.champagne }]} fmt={(n) => `${n}%`} onPick={(n, v) => drill(`${n}, sell-through and margin`, `${v}%`, v * 10, 'stm' + n)} />
        </Panel>
        <Panel i={3} title="Return rate" sub="Percent of orders, by category" className="lg:col-span-2" h={260}>
          <VBars data={d.catRows.map((r) => ({ ...r, Returns: +r.Returns.toFixed(1) }))} keys={[{ k: 'Returns', color: C.sage }]} hl={cat} fmt={(n) => `${n}%`} onPick={(n, v) => drill(`${n} returns`, `${v}%`, Math.round(v * 12), 'ret' + n)} />
        </Panel>
      </div>
    </div>
  );
}

export function Customers({ d, drill }: TabProps) {
  const lg = useLegend();
  const nw = d.newC.reduce((a, b) => a + b, 0), rt = d.retC.reduce((a, b) => a + b, 0);
  const prov = top(d.prov, 'Customers');
  return (
    <div>
      <Insight>{Math.round((rt / (nw + rt)) * 100)}% of buyers came back to order again, and {prov.name} province has the most customers.</Insight>
      <Stats items={[{ label: 'New customers', value: nw }, { label: 'Returning customers', value: rt }, { label: 'Gold lifetime value', value: d.ltvs[2]['Lifetime value'], format: rs }]} />
      <div className="space-y-6">
        <Panel title="New and returning customers" h={360} action={<Legend items={[{ k: 'New', color: C.ink }, { k: 'Returning', color: C.champagne }]} hidden={lg.hidden} toggle={lg.toggle} />}>
          <VBars data={d.newRet} stack hidden={lg.hidden} keys={[{ k: 'New', color: C.ink }, { k: 'Returning', color: C.champagne }]} onPick={(n, v) => drill(`Customers, ${n}`, num(v), v, 'nr' + n)} />
        </Panel>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel i={1} title="Lifetime value" sub="Average, by loyalty tier" h={280}><VBars data={d.ltvs} keys={[{ k: 'Lifetime value', color: C.ink }]} fmt={rs} onPick={(n, v) => drill(`${n} lifetime value`, rs(v), v, 'ltv' + n)} /></Panel>
          <Panel i={2} title="Province split" h={280}><HBars data={d.prov} k="Customers" color={C.sage} width={110} onPick={(n, v) => drill(`${n} customers`, num(v), v, 'prov' + n)} /></Panel>
        </div>
      </div>
    </div>
  );
}

export function Traffic({ d, ch, drill }: TabProps) {
  const best = [...d.traffic].sort((a, b) => b.Conversion - a.Conversion)[0], most = top(d.traffic, 'Visits');
  const tot = d.traffic.reduce((a, t) => a + t.Visits, 0), ord = d.traffic.reduce((a, t) => a + t.Orders, 0);
  return (
    <div>
      <Insight>{most.name} brings the most visits, but {best.name} converts best at {best.Conversion}%.</Insight>
      <Stats items={[{ label: 'Visits', value: tot }, { label: 'Orders', value: ord }, { label: 'Conversion', value: (ord / tot) * 100, decimals: 1, format: (n) => `${n.toFixed(1)}%` }]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Visits" h={300}><VBars data={d.traffic} keys={[{ k: 'Visits', color: C.ink }]} hl={ch} onPick={(n, v) => drill(`${n} visits`, num(v), v, 'v' + n)} /></Panel>
        <Panel i={1} title="Orders" h={300}><VBars data={d.traffic} keys={[{ k: 'Orders', color: C.champagne }]} hl={ch} onPick={(n, v) => drill(`${n} orders`, num(v), v, 'o' + n)} /></Panel>
        <Panel i={2} title="Conversion" sub="Percent of visits that paid" className="lg:col-span-2" h={260}><VBars data={d.traffic} keys={[{ k: 'Conversion', color: C.sage }]} hl={ch} fmt={(n) => `${n}%`} onPick={(n, v) => drill(`${n} conversion`, `${v}%`, Math.round(v * 40), 'c' + n)} /></Panel>
      </div>
      <Card className="mt-6 !p-0 overflow-x-auto" style={stagger(3)}>
        <table className="w-full text-[14px]"><thead><tr className="text-left">{['Channel', 'Visits', 'Orders', 'Conversion'].map((h, i) => <th key={h} className={`label-caps px-6 py-3 border-b border-line ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody>{d.traffic.map((t) => <tr key={t.name} onClick={() => drill(`${t.name} traffic`, num(t.Visits), t.Visits, 'tt' + t.name)} className="cursor-pointer hover:bg-soft transition-colors"><td className="px-6 py-3 border-b border-line font-medium">{t.name}</td><td className="px-6 py-3 border-b border-line text-right num">{num(t.Visits)}</td><td className="px-6 py-3 border-b border-line text-right num">{num(t.Orders)}</td><td className="px-6 py-3 border-b border-line text-right num">{t.Conversion}%</td></tr>)}</tbody></table>
      </Card>
    </div>
  );
}

export function Funnel({ d, drill }: TabProps) {
  const tip = useHoverTip();
  const worst = [...d.funnel.slice(1)].sort((a, b) => b.drop - a.drop)[0];
  const grey = [C.ink, C.ink, C.ink, C.champagne, C.sage];
  return (
    <div>
      <Insight>The biggest drop is at {worst.name.toLowerCase()}, where {worst.drop}% of shoppers leave.</Insight>
      <Stats items={[{ label: 'Visits', value: d.funnel[0].value }, { label: 'Paid orders', value: d.funnel[4].value }, { label: 'Visit to paid', value: d.funnel[4].pct, decimals: 2, format: (n) => `${n.toFixed(2)}%` }]} />
      <Card className="!p-8" style={stagger(1)}>
        <div className="space-y-5">
          {d.funnel.map((s, i) => (
            <div key={s.name} className="flex items-center gap-4 cursor-pointer group" onClick={() => drill(s.name, num(s.value), s.value, 'f' + s.name)}
              onMouseMove={(e) => tip.move(e, s.name, [{ name: 'Shoppers', value: s.value, color: grey[i] }, { name: 'Of all visits %', value: s.pct, color: C.champagne }])} onMouseLeave={tip.leave}>
              <div className="w-36 text-[13px] shrink-0">{s.name}</div>
              <div className="flex-1 h-12 bg-soft rounded-xl overflow-hidden"><div className="h-full rounded-xl anim-grow-x group-hover:opacity-80 transition-opacity" style={{ width: `${Math.max(s.pct, 3)}%`, background: grey[i], animationDelay: `${i * 120}ms` }} /></div>
              <div className="w-32 text-right shrink-0"><div className="num font-medium">{num(s.value)}</div><div className="text-[12px] text-muted">{i === 0 ? 'Starting point' : `${s.drop}% drop-off`}</div></div>
            </div>
          ))}
        </div>
      </Card>
      {tip.node}
    </div>
  );
}

export function Cohorts({ d, drill }: TabProps) {
  const tip = useHoverTip();
  const m1 = Math.round(d.cohorts.filter((c) => c.vals.length > 1).reduce((a, c) => a + c.vals[1], 0) / 7);
  return (
    <div>
      <Insight>About {m1}% of customers order again within a month, and the rate fades slowly after that.</Insight>
      <Card className="!p-8 overflow-x-auto" style={stagger(1)}>
        <Label className="mb-4">Share of each first-order cohort that ordered again</Label>
        <table className="border-separate border-spacing-1 text-[12px] w-full min-w-[640px]">
          <thead><tr><th className="text-left font-normal text-muted pr-3">Cohort</th>{d.cohorts[0].vals.map((_, j) => <th key={j} className="font-normal text-muted">{j === 0 ? 'Month 0' : `+${j}`}</th>)}</tr></thead>
          <tbody>
            {d.cohorts.map((c, r) => (
              <tr key={c.name}>
                <td className="pr-3 whitespace-nowrap text-[13px]">{c.name}<span className="text-muted ml-1.5">{c.size}</span></td>
                {d.cohorts[0].vals.map((_, j) => { const v = c.vals[j]; return (
                  <td key={j} className="p-0">{v === undefined ? null : <div className="h-11 rounded-md flex items-center justify-center num font-medium cursor-pointer anim-fade-up hover:ring-2 hover:ring-champagne transition-shadow"
                    style={{ animationDelay: `${r * 120 + j * 15}ms`, background: `color-mix(in srgb, var(--ink) ${v}%, var(--stone))`, color: v > 48 ? 'var(--inkfg)' : 'var(--fg)' }}
                    onClick={() => drill(`${c.name} cohort, month ${j}`, `${v}%`, Math.round((c.size * v) / 100), `co${c.name}${j}`)}
                    onMouseMove={(e) => tip.move(e, `${c.name} cohort, month ${j}`, [{ name: 'Still ordering', value: v, color: C.champagne }, { name: 'Customers', value: Math.round((c.size * v) / 100), color: C.ink }], undefined)} onMouseLeave={tip.leave}>{v}%</div>}</td>
                ); })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 text-[12px] text-muted mt-5">Low<div className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(90deg, var(--stone), var(--ink))' }} />High</div>
      </Card>
      {tip.node}
    </div>
  );
}

export function Search({ d, drill }: TabProps) {
  const t = d.searches[0], n = d.nores[0];
  const tot = d.searches.reduce((a, s) => a + s.Searches, 0);
  return (
    <div>
      <Insight>&quot;{t.name}&quot; is searched most, and shoppers keep looking for &quot;{n.name}&quot; without finding it.</Insight>
      <Stats items={[{ label: 'Searches', value: tot }, { label: 'Searches with no results', value: d.nores.reduce((a, s) => a + s.Searches, 0) }, { label: 'Average click-through', value: Math.round(d.searches.reduce((a, s) => a + s['Click-through'], 0) / d.searches.length), format: (v) => `${v}%` }]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top searches" h={380}><HBars data={d.searches} k="Searches" width={110} onPick={(nm, v) => drill(`"${nm}"`, `${num(v)} searches`, v, 's' + nm)} /></Panel>
        <Panel i={1} title="Searches with no results" sub="Products customers want" h={380}><HBars data={d.nores} k="Searches" color={C.champagne} width={150} onPick={(nm, v) => drill(`"${nm}"`, `${num(v)} searches`, v, 'n' + nm)} /></Panel>
        <Panel i={2} title="Click-through" sub="Percent who clicked a result" className="lg:col-span-2" h={280}><VBars data={d.searches} keys={[{ k: 'Click-through', color: C.sage }]} fmt={(v) => `${v}%`} onPick={(nm, v) => drill(`"${nm}" click-through`, `${v}%`, v * 8, 'ct' + nm)} /></Panel>
      </div>
    </div>
  );
}
