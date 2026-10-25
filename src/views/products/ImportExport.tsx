"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Button, Card, CardHeader, Progress, Segmented, Skeleton, StatusPill, Pill } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { navigate, useApp } from '../../store';
import { productsStore, type Product } from '../../data/seed';
import { cn, rs } from '../../lib/format';
import { CATEGORIES, TODAY, addProducts, downloadCsv, filterStore, productsCsv } from './shared';

const NAMES = ['Lotus Wrap Dress', 'Kathmandu Linen Shirt', 'Rhododendron Midi', 'Thamel Wide Pants', 'Mustang Wool Cape', 'Phewa Silk Scarf', 'Patan Jacquard Blouse', 'Everest Puffer Vest', 'Boudha Cotton Kurta', 'Newari Border Saree', 'Annapurna Knit Cardigan', 'Janaki Tiered Skirt', 'Dhaka Weave Tunic'];
interface Row { n: number; name: string; sku: string; category: string; price: string; stock: number; error?: string }
const ERR: Record<number, string> = { 5: 'Price is missing', 14: 'SKU RV-1004 already exists', 28: 'Category "Gowns" was not found', 41: 'Stock must be a whole number' };
const buildRows = (): Row[] => Array.from({ length: 52 }, (_, i) => {
  const n = i + 1; const e = ERR[n];
  return { n, name: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ''}`, sku: n === 14 ? 'RV-1004' : `RV-${2000 + n}`, category: n === 28 ? 'Gowns' : CATEGORIES[i % 4], price: n === 5 ? '' : String(3200 + ((i * 937) % 9000)), stock: n === 41 ? NaN : 4 + ((i * 7) % 24), error: e };
});

export default function ImportExport() {
  const { toast } = useApp();
  const [stage, setStage] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'done'>('idle');
  const [file, setFile] = useState('');
  const [hot, setHot] = useState(false);
  const [prog, setProg] = useState(0);
  const [scope, setScope] = useState<'filter' | 'all'>('filter');
  const [products] = productsStore.use();
  const [fl] = filterStore.use();
  const input = useRef<HTMLInputElement>(null);
  const rows = useMemo(buildRows, []);
  const valid = rows.filter((r) => !r.error);

  const load = (name: string) => { setFile(name); setStage('parsing'); setProg(0); setTimeout(() => setStage('preview'), 700); };
  const onFiles = (f?: FileList | null) => { if (f?.[0]) load(f[0].name); };
  useEffect(() => {
    if (stage !== 'importing') return;
    const t = setInterval(() => setProg((p) => Math.min(100, p + 3 + Math.random() * 5)), 90);
    return () => clearInterval(t);
  }, [stage]);
  useEffect(() => {
    if (stage === 'importing' && prog >= 100) {
      const t = setTimeout(() => {
        const base = Math.max(...productsStore.get().map((p) => Number(p.id.slice(1)))) + 1;
        const add: Product[] = valid.map((r, i) => ({ id: `p${base + i}`, name: r.name, sku: r.sku, category: CATEGORIES.includes(r.category) ? r.category : 'Tops', collection: 'Autumn Atelier', price: Number(r.price), stock: r.stock, status: 'Draft', mto: false, updated: TODAY, photo: i % 14, variants: [{ size: 'M', color: 'Ivory', sku: `${r.sku}-IV-M`, stock: r.stock }] }));
        addProducts(add); setStage('done'); toast('Products imported', { body: `${add.length} drafts added`, star: true });
      }, 900);
      return () => clearTimeout(t);
    }
  }, [prog, stage]); // eslint-disable-line

  const template = () => { downloadCsv('richiva-product-template.csv', [['Name', 'SKU', 'Category', 'Price', 'Sale price', 'Stock', 'Status', 'Made to order'], ['Satin Slip Dress', 'RV-9001', 'Dresses', 6500, 5900, 24, 'Draft', 'No']]); toast('Template downloaded'); };
  const exportCsv = () => {
    const list = scope === 'all' ? products : products.filter((p) => fl.ids.includes(p.id));
    downloadCsv('richiva-products.csv', productsCsv(list)); toast('Export ready', { body: `${list.length} products` });
  };
  const exportCount = scope === 'all' ? products.length : products.filter((p) => fl.ids.includes(p.id)).length;

  return (
    <div className="space-y-6">
      {stage === 'done' ? (
        <Card hover={false} className="text-center py-14 flex flex-col items-center">
          <div className="relative"><span className="size-16 rounded-full bg-[color-mix(in_srgb,var(--sage)_18%,transparent)] flex items-center justify-center text-sage"><FileSpreadsheet size={28} strokeWidth={1.25} /></span><Star size={22} twinkle className="absolute -top-2 -right-3" /></div>
          <h2 className="font-title text-[34px] mt-4">Nice work, {valid.length} products added</h2>
          <p className="text-muted mt-1">They are saved as drafts, ready for photos and a final look. {rows.length - valid.length} rows were skipped.</p>
          <div className="flex gap-3 mt-6"><Button onClick={() => navigate('/products?tab=products')}>View them</Button><Button variant="secondary" onClick={() => { setStage('idle'); setProg(0); }}>Import another file</Button></div>
        </Card>
      ) : (
        <Card hover={false}>
          <CardHeader title="Import products" sub="Upload a CSV and check it before anything is added." action={<button onClick={template} className="text-[13px] underline underline-offset-4 hover:text-champagne inline-flex items-center gap-1.5"><Download size={14} strokeWidth={1.5} />Download CSV template</button>} />
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          <div onClick={() => stage === 'idle' && input.current?.click()} onDragOver={(e) => { e.preventDefault(); setHot(true); }} onDragLeave={() => setHot(false)} onDrop={(e) => { e.preventDefault(); setHot(false); if (stage === 'idle') onFiles(e.dataTransfer.files); }}
            className={cn('rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 px-6', stage === 'idle' ? 'h-60 cursor-pointer' : 'h-24', hot ? 'border-champagne bg-[color-mix(in_srgb,var(--champagne)_10%,transparent)] scale-[1.01]' : 'border-line hover:border-champagne/70 hover:bg-soft')}>
            {stage === 'idle' ? (<>
              <span className="size-14 rounded-full bg-stone flex items-center justify-center mb-3"><UploadCloud size={26} strokeWidth={1.25} /></span>
              <div className="font-title text-[24px]">Drop your CSV here</div>
              <div className="text-muted text-[13px] mt-1">or <span className="underline underline-offset-4">choose a file</span> · up to 5,000 rows</div>
              <button onClick={(e) => { e.stopPropagation(); load('richiva-new-arrivals.csv'); }} className="text-[13px] text-muted hover:text-fg mt-3 underline underline-offset-4">Try with a sample file</button>
            </>) : <div className="flex items-center gap-3 text-[14px]"><FileSpreadsheet size={20} strokeWidth={1.5} className="text-sage" /><span className="font-medium">{file}</span><span className="text-muted">{rows.length} rows</span></div>}
          </div>

          {stage === 'parsing' && <div className="mt-5 space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}

          {(stage === 'preview' || stage === 'importing') && (
            <div className="mt-6 anim-fade-up">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2"><Pill tone="success" dot>{valid.length} valid</Pill><Pill tone="danger" dot>{rows.length - valid.length} with errors</Pill></div>
                <div className="flex gap-2"><Button variant="secondary" disabled={stage === 'importing'} onClick={() => setStage('idle')}>Cancel</Button><Button disabled={stage === 'importing'} onClick={() => { setProg(0); setStage('importing'); }}>Import {valid.length} valid rows</Button></div>
              </div>
              {stage === 'importing' && <div className="mb-4"><div className="flex justify-between text-[13px] text-muted mb-1.5"><span>Adding products…</span><span className="num">{Math.floor(prog)}%</span></div><Progress value={prog} /></div>}
              <div className="rounded-xl border border-line overflow-auto max-h-[380px]">
                <table className="w-full text-[13px] border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-card z-10"><tr>{['Row', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Result'].map((h) => <th key={h} className="label-caps text-left px-4 py-2.5 border-b border-line whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.n} className={cn(r.error && 'bg-[color-mix(in_srgb,var(--bad)_9%,transparent)] anim-flash')}>
                        <td className="px-4 py-2.5 border-b border-line num text-muted">{r.n}</td>
                        <td className="px-4 py-2.5 border-b border-line">{r.name}</td>
                        <td className="px-4 py-2.5 border-b border-line num">{r.sku}</td>
                        <td className="px-4 py-2.5 border-b border-line">{r.category}</td>
                        <td className="px-4 py-2.5 border-b border-line num">{r.price ? rs(Number(r.price)) : '—'}</td>
                        <td className="px-4 py-2.5 border-b border-line num">{Number.isNaN(r.stock) ? 'abc' : r.stock}</td>
                        <td className="px-4 py-2.5 border-b border-line whitespace-nowrap">{r.error ? <span className="text-bad">{r.error}</span> : <StatusPill status="Ready" />}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>)}
        </Card>
      )}

      <Card hover={false}>
        <CardHeader title="Export" sub="Download your catalogue as a spreadsheet." />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Segmented value={scope} onChange={setScope} options={[{ value: 'filter', label: 'Current filter' }, { value: 'all', label: 'All products' }]} />
            <span className="text-muted text-[13px]"><span className="num">{exportCount}</span> products · {scope === 'filter' ? fl.label : 'Everything'}</span>
          </div>
          <Button icon={Download} onClick={exportCsv}>{scope === 'filter' ? 'Export current filter as CSV' : 'Export all products as CSV'}</Button>
        </div>
      </Card>
    </div>
  );
}

