import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Check, ImageUp } from 'lucide-react';
import { Card, CardHeader, DataTable, StatusPill, Button, Label, Photo, SearchInput, Chip, CountUp, type Col } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { PRODUCTS, photo, logAudit, type Product } from '../../data/seed';
import { useApp } from '../../store';
import { cn } from '../../lib/format';

type St = 'Ready' | 'Needs cutout' | 'In review';
const ROWS = PRODUCTS.filter((p) => p.status !== 'Archived').slice(0, 24);
const initial = (i: number): St => (i % 3 === 0 ? 'Ready' : i % 3 === 1 ? 'Needs cutout' : 'In review');
const COLOURS = ['Ivory', 'Sage', 'Ink', 'Champagne', 'Rose', 'Sand'];
const coloursOf = (p: Product) => { const c = p.variants[0].color; const i = COLOURS.indexOf(c); return [c, COLOURS[(i + 2) % 6]]; };

export default function Readiness() {
  const { toast } = useApp();
  const [status, setStatus] = useState<Record<string, St>>(() => Object.fromEntries(ROWS.map((p, i) => [p.id, initial(i)])));
  const [sel, setSel] = useState<string>(ROWS[1].id);
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [colour, setColour] = useState<string>(coloursOf(ROWS[1])[0]);
  const [q, setQ] = useState('');
  const [f, setF] = useState<'All' | St>('All');
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

  const ready = Object.values(status).filter((s) => s === 'Ready').length;
  const pct = Math.round((ready / ROWS.length) * 100);
  const [bar, setBar] = useState(0);
  useEffect(() => { const t = setTimeout(() => setBar(pct), 80); return () => clearTimeout(t); }, [pct]);

  const p = ROWS.find((r) => r.id === sel)!;
  const key = `${p.id}:${colour}`;
  const rows = useMemo(() => ROWS.filter((r) => (f === 'All' || status[r.id] === f) && r.name.toLowerCase().includes(q.toLowerCase())), [q, f, status]);
  const choose = (r: Product) => { setSel(r.id); setColour(coloursOf(r)[0]); };

  const take = (file?: File) => {
    if (!file) return;
    if (file.type !== 'image/png') return toast('Please use a transparent PNG', { body: 'Other file types cannot be cut out properly.' });
    const u = URL.createObjectURL(file); urls.current.push(u);
    setUploads((x) => ({ ...x, [key]: u }));
    setStatus((s) => (s[p.id] === 'Needs cutout' ? { ...s, [p.id]: 'In review' } : s));
    toast('Cutout uploaded', { body: `${p.name}, ${colour}` });
  };
  const markReady = () => {
    setStatus((s) => ({ ...s, [p.id]: 'Ready' }));
    logAudit({ user: 'Anita Shrestha', module: 'Try-on', action: 'Marked garment ready', item: p.name, before: `status: ${status[p.id]}`, after: 'status: Ready' });
    toast(`${p.name} is ready for try-on`, { star: true });
  };
  const img = uploads[key] ?? photo(p.photo, 300, 400);

  const cols: Col<Product>[] = [
    { key: 'n', header: 'Product', sort: (r) => r.name, render: (r) => <div className="flex items-center gap-3"><Photo src={photo(r.photo, 80, 100)} size={40} /><div><div className="font-medium">{r.name}</div><div className="text-muted text-[12px]">{r.category}</div></div></div> },
    { key: 'c', header: 'Colours', hideBelow: 'lg', render: (r) => <span className="text-muted">{coloursOf(r).join(', ')}</span> },
    { key: 's', header: 'Status', sort: (r) => status[r.id], render: (r) => <StatusPill status={status[r.id]} /> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Star size={14} twinkle /><span className="font-medium"><CountUp value={ready} /> of {ROWS.length} garments ready for try-on</span></div><span className="num text-muted">{pct}%</span></div>
        <div className="h-3 rounded-full bg-stone overflow-hidden"><div className="h-full rounded-full bg-ink" style={{ width: `${bar}%`, transition: 'width 1200ms var(--ease)' }} /></div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card pad={false} hover={false} className="xl:col-span-3 overflow-hidden">
          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-line">
            <SearchInput value={q} onChange={setQ} placeholder="Search products" className="w-60" />
            {(['All', 'Ready', 'Needs cutout', 'In review'] as const).map((s) => <Chip key={s} active={f === s} onClick={() => setF(s)}>{s}</Chip>)}
          </div>
          <DataTable columns={cols} rows={rows} rowId={(r) => r.id} onRowClick={choose} activeId={sel} pageSize={8} dense />
        </Card>
        <Card className="xl:col-span-2" hover={false}>
          <CardHeader title={p.name} sub={<StatusPill status={status[p.id]} />} />
          <Label className="mb-2">Colour</Label>
          <div className="flex gap-2 mb-4">{coloursOf(p).map((c) => <Chip key={c} active={colour === c} onClick={() => setColour(c)}>{c}</Chip>)}</div>
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]); }}
            onClick={() => input.current?.click()}
            className={cn('rounded-xl border border-dashed p-5 text-center cursor-pointer transition-all duration-200', drag ? 'border-champagne bg-soft scale-[1.01]' : 'border-line hover:border-champagne')}>
            <input ref={input} type="file" accept="image/png" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
            {uploads[key] ? <div className="flex items-center justify-center gap-2 text-ok"><Check size={16} />Cutout added for {colour}. Drop another to replace.</div>
              : <><ImageUp size={22} strokeWidth={1.25} className="mx-auto text-muted mb-1.5" /><div className="text-[14px]">Drop a transparent PNG for {colour}</div><div className="text-muted text-[12px]">or click to browse</div></>}
          </div>
          <Label className="mt-5 mb-2">Preview on a sample body</Label>
          <div className="rounded-xl bg-soft flex justify-center py-3">
            <svg viewBox="0 0 200 330" width={170} height={280}>
              <defs><clipPath id="garm"><path d="M72 84 Q100 98 128 84 L140 150 L162 292 Q100 304 38 292 L60 150 Z" /></clipPath></defs>
              <circle cx="100" cy="36" r="22" fill="var(--line)" />
              <rect x="90" y="56" width="20" height="26" fill="var(--line)" />
              <path d="M62 84 Q100 74 138 84 L148 160 L128 160 L124 96 L100 100 L76 96 L72 160 L52 160 Z" fill="var(--line)" />
              <rect x="78" y="150" width="18" height="170" rx="8" fill="var(--line)" /><rect x="104" y="150" width="18" height="170" rx="8" fill="var(--line)" />
              <image href={img} x="30" y="80" width="140" height="224" preserveAspectRatio="xMidYMid slice" clipPath="url(#garm)" opacity={0.95} />
              <path d="M72 84 Q100 98 128 84 L140 150 L162 292 Q100 304 38 292 L60 150 Z" fill="none" stroke="var(--champagne)" strokeWidth="1.2" strokeDasharray="4 3" />
            </svg>
          </div>
          <Button className="w-full mt-4" icon={status[p.id] === 'Ready' ? Check : Upload} variant={status[p.id] === 'Ready' ? 'secondary' : 'primary'} disabled={status[p.id] === 'Ready'} onClick={markReady}>{status[p.id] === 'Ready' ? 'Ready for try-on' : 'Mark ready'}</Button>
        </Card>
      </div>
    </div>
  );
}
