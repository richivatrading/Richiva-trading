"use client";
import { useMemo, useRef, useState } from 'react';
import { CloudDownload, Check } from 'lucide-react';
import { Button, Card, CardHeader, ErrorState, Field, Modal, Pill, Select, Skeleton } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { ORDERS } from '../../data/seed';
import { cn, rs, sleep } from '../../lib/format';
import { useApp } from '../../store';

type Kind = 'match' | 'amount' | 'ours' | 'gw';
interface Pair { id: string; kind: Kind; ours?: { ref: string; amt: number; date: string }; gw?: { ref: string; amt: number; date: string }; note?: string }
const PERIODS = ['Mon 12 – Sun 18 Oct', 'Mon 5 – Sun 11 Oct', 'Mon 28 Sep – Sun 4 Oct'];
const AMTS = [5900, 12400, 3450, 8700, 15200, 2600, 7800, 9300];
const H = 72;

const build = (p: number): Pair[] => {
  const matches = [6, 7, 8][p];
  const out: Pair[] = Array.from({ length: matches }, (_, i) => {
    const amt = AMTS[(i + p) % AMTS.length], day = 18 - p * 7 - (i % 6);
    return { id: `${p}-m${i}`, kind: 'match', ours: { ref: ORDERS[(i + p * 5) % 40].id, amt, date: `${day} Oct` }, gw: { ref: `CIPS-${81200 + ((i * 7) % 11) * 13 + p}`, amt, date: `${day} Oct` } };
  });
  if (p === 0) out.splice(2, 0,
    { id: '0-a', kind: 'amount', ours: { ref: ORDERS[8].id, amt: 4500, date: '15 Oct' }, gw: { ref: 'NPX-77310', amt: 4380, date: '15 Oct' } },
    { id: '0-o', kind: 'ours', ours: { ref: ORDERS[3].id, amt: 6200, date: '17 Oct' } });
  if (p === 0) out.splice(6, 0, { id: '0-g', kind: 'gw', gw: { ref: 'CIPS-81990', amt: 1850, date: '16 Oct' } });
  if (p === 1) out.splice(4, 0, { id: '1-a', kind: 'amount', ours: { ref: ORDERS[19].id, amt: 11200, date: '8 Oct' }, gw: { ref: 'NPX-76021', amt: 11030, date: '8 Oct' } });
  return out;
};
const diffOf = (x: Pair) => x.note ? 0 : x.kind === 'match' ? 0 : (x.ours?.amt ?? 0) - (x.gw?.amt ?? 0);
const lined = (x: Pair) => x.kind === 'match' || (x.kind === 'amount' && !!x.note);

export default function Reconcile() {
  const { toast } = useApp();
  const [period, setPeriod] = useState(0);
  const [data, setData] = useState<Record<number, Pair[]>>({});
  const [reconciled, setReconciled] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [tick, setTick] = useState(0);
  const tried = useRef(false);
  const [manual, setManual] = useState<Pair | null>(null);
  const [reason, setReason] = useState('Bank fee or rounding');
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState('');

  const pairs = data[period];
  const fetchIt = async () => {
    setBusy(true); setErr(false); await sleep(1300);
    if (period === 0 && !tried.current) { tried.current = true; setBusy(false); setErr(true); return; }
    setData((d) => ({ ...d, [period]: d[period] ?? build(period) })); setTick((t) => t + 1); setBusy(false);
    toast('Settlement fetched', { body: `${PERIODS[period]} loaded from the gateway.` });
  };
  const ours = useMemo(() => (pairs ?? []).filter((x) => x.ours), [pairs]);
  const gws = useMemo(() => (pairs ?? []).filter((x) => x.gw).sort((a, b) => parseInt(a.gw!.ref.slice(-5)) - parseInt(b.gw!.ref.slice(-5)) || a.id.localeCompare(b.id)), [pairs]);
  const unresolved = (pairs ?? []).filter((x) => x.kind !== 'match' && !x.note);
  const total = (pairs ?? []).reduce((a, x) => a + diffOf(x), 0);
  const balanced = !!pairs && unresolved.length === 0;
  const done = !!reconciled[period];

  const lines = (pairs ?? []).filter(lined).map((x) => ({ x, y1: ours.indexOf(x) * H + H / 2, y2: gws.indexOf(x) * H + H / 2 }));
  const rows = Math.max(ours.length, gws.length);

  const submit = () => {
    if (note.trim().length < 5) return setNoteErr('Add a short explanation (at least 5 characters).');
    setData((d) => ({ ...d, [period]: d[period].map((x) => x.id === manual!.id ? { ...x, note: `${reason}: ${note.trim()}` } : x) }));
    setManual(null); setNote(''); setNoteErr(''); setTick((t) => t + 1);
    toast('Matched manually', { body: 'Explanation saved with the period.' });
  };

  const Rec = ({ p, side }: { p: Pair; side: 'ours' | 'gw' }) => {
    const r = side === 'ours' ? p.ours! : p.gw!;
    const bad = !p.note && p.kind !== 'match';
    const tone = p.kind === 'amount' ? 'border-bad/50 bg-[color-mix(in_srgb,var(--bad)_7%,transparent)]' : 'border-warn/50 bg-[color-mix(in_srgb,var(--warn)_8%,transparent)]';
    return (
      <div style={{ height: H }} className="py-1.5">
        <div className={cn('h-full rounded-xl border px-3.5 flex items-center justify-between gap-3 transition-colors duration-500', bad ? tone : p.note ? 'border-sage/50 bg-[color-mix(in_srgb,var(--sage)_9%,transparent)]' : 'border-line bg-card')}>
          <div className="min-w-0"><div className="font-medium text-[13.5px] truncate num">{r.ref}</div><div className="text-muted text-[12px]">{r.date}{bad && <span className={cn('ml-2', p.kind === 'amount' ? 'text-bad' : 'text-warn')}>{p.kind === 'amount' ? `Differs by ${rs(Math.abs(diffOf(p)))}` : p.kind === 'ours' ? 'Missing at gateway' : 'Not in our records'}</span>}{p.note && <span className="ml-2 text-sage">Explained</span>}</div></div>
          <div className="text-right shrink-0"><div className="num font-medium">{rs(r.amt)}</div>
            {bad && (side === 'ours' ? p.kind !== 'gw' : p.kind === 'gw') && <button onClick={() => { setManual(p); setNote(''); setNoteErr(''); }} className="text-[12px] text-champagne hover:underline">Match manually</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card hover={false}>
      <CardHeader title="Reconcile with the gateway" sub="Compare what we recorded with what the gateway paid out." />
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <Select label="Period" value={String(period)} onChange={(v) => { setPeriod(+v); setErr(false); }} options={PERIODS.map((p, i) => ({ value: String(i), label: p }))} className="w-64" />
        <Button icon={CloudDownload} loading={busy} onClick={fetchIt}>Fetch settlement</Button>
        {done && <Pill tone="success" dot>Reconciled</Pill>}
      </div>
      {err ? <ErrorState title="Gateway did not respond" body="The settlement report timed out. Please try again." onRetry={fetchIt} /> :
        busy ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> :
        !pairs ? <div className="text-center text-muted py-14">Choose a period and fetch the settlement to start matching.</div> : (
          <div className="space-y-5">
            {balanced && (
              <div key={tick} className="flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--sage)_12%,transparent)] px-4 py-3 anim-fade-up">
                <Star size={22} twinkle /><div><div className="font-medium">Everything matches</div><div className="text-muted text-[13px]">{PERIODS[period]} balances to the rupee.</div></div>
              </div>
            )}
            <div className="grid grid-cols-[1fr_72px_1fr]">
              <div className="label-caps pb-2">Our records</div><div /><div className="label-caps pb-2">Gateway records</div>
              <div>{ours.map((p) => <Rec key={p.id} p={p} side="ours" />)}</div>
              <svg width="72" height={rows * H} key={tick} className="overflow-visible">
                {lines.map(({ x, y1, y2 }, i) => (
                  <g key={x.id}>
                    <path d={`M0 ${y1} C 36 ${y1}, 36 ${y2}, 72 ${y2}`} fill="none" stroke="var(--sage)" strokeWidth={1.75} strokeLinecap="round" pathLength={1} strokeDasharray={x.kind === 'amount' ? '0.04 0.03' : 1} strokeDashoffset={1} style={{ animation: `draw 700ms var(--ease) ${i * 90}ms forwards` }} />
                    <circle cx={0} cy={y1} r={3} fill="var(--sage)" /><circle cx={72} cy={y2} r={3} fill="var(--sage)" />
                  </g>
                ))}
              </svg>
              <div>{gws.map((p) => <Rec key={p.id} p={p} side="gw" />)}</div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <div className="flex gap-8">
                <div><div className="label-caps">Matched</div><div className="text-[20px] font-semibold num">{pairs.filter((x) => x.kind === 'match' || x.note).length} of {pairs.length}</div></div>
                <div><div className="label-caps">Difference</div><div className={cn('text-[20px] font-semibold num transition-colors duration-500', total === 0 ? 'text-ok' : 'text-bad')}>{total < 0 ? '-' : ''}{rs(Math.abs(total))}</div></div>
              </div>
              <div className="text-right">
                <Button icon={Check} disabled={!balanced || done} onClick={() => { setReconciled((r) => ({ ...r, [period]: true })); toast('Period reconciled', { body: PERIODS[period], star: true }); }}>{done ? 'Reconciled' : 'Mark period as reconciled'}</Button>
                {!balanced && <div className="text-muted text-[12px] mt-1.5">Resolve {unresolved.length} {unresolved.length === 1 ? 'difference' : 'differences'} or add an explanation to continue.</div>}
              </div>
            </div>
          </div>
        )}
      <Modal open={!!manual} onClose={() => setManual(null)} title="Match manually" size="sm"
        footer={<><Button variant="secondary" onClick={() => setManual(null)}>Cancel</Button><Button onClick={submit}>Save match</Button></>}>
        {manual && <div className="space-y-4">
          <p className="text-muted text-[13.5px]">{manual.kind === 'amount' ? `Our record and the gateway differ by ${rs(Math.abs(diffOf(manual)))}.` : manual.kind === 'ours' ? `${rs(manual.ours!.amt)} is in our records but not at the gateway.` : `${rs(manual.gw!.amt)} arrived at the gateway but is not in our records.`}</p>
          <Select label="What explains it?" value={reason} onChange={setReason} options={['Bank fee or rounding', 'Timing, settles next period', 'Duplicate or reversed payment', 'Matched to another record']} />
          <Field label="Explanation note" value={note} onChange={(v) => { setNote(v); setNoteErr(''); }} error={noteErr} multiline />
        </div>}
      </Modal>
    </Card>
  );
}

