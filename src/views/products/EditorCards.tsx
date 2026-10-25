"use client";
import { useEffect, useRef, useState } from 'react';
import { Bold, ImagePlus, Italic, Link2, List, Sparkles, UploadCloud, X } from 'lucide-react';
import { Button, Card, CardHeader, CountUp, Field, Select, Sortable, Switch } from '../../ui/kit';
import MediaPicker from '../../ui/MediaPicker';
import { useApp } from '../../store';
import { cn, rs } from '../../lib/format';
import { COLORS, SIZES, TEMPLATES, barcode, rid, slugify, variantSku, type Draft, type VRow } from './editorModel';

export interface CP { d: Draft; set: (p: Partial<Draft>) => void; showErr?: boolean }
export const plainInput = 'h-9 rounded-lg bg-card border border-line px-2.5 text-[13px] outline-none transition-all focus:border-champagne focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--champagne)_22%,transparent)] num';
const SwitchRow = ({ title, body, checked, onChange }: { title: string; body?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-6"><div><div className="font-medium">{title}</div>{body && <div className="text-muted text-[13px]">{body}</div>}</div><Switch checked={checked} onChange={onChange} label={title} /></div>
);

/* ---------- rich text ---------- */
function RichText({ html, onChange }: { html: string; onChange: (h: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html; }, [html]);
  const exec = (cmd: string, v?: string) => { ref.current?.focus(); document.execCommand(cmd, false, v); onChange(ref.current?.innerHTML ?? ''); };
  const saveRange = () => { const s = window.getSelection(); if (s && s.rangeCount && ref.current?.contains(s.anchorNode)) range.current = s.getRangeAt(0).cloneRange(); };
  const btn = (I: typeof Bold, label: string, f: () => void) => <button type="button" title={label} aria-label={label} onMouseDown={(e) => { e.preventDefault(); f(); }} className="size-8 rounded-lg flex items-center justify-center text-fg/80 hover:bg-stone active:scale-95 transition-all"><I size={16} strokeWidth={1.5} /></button>;
  const applyLink = () => {
    const url = (link ?? '').trim(); setLink(null); if (!url) return;
    ref.current?.focus(); const s = window.getSelection(); if (range.current) { s?.removeAllRanges(); s?.addRange(range.current); }
    document.execCommand('createLink', false, /^https?:/.test(url) ? url : `https://${url}`); onChange(ref.current?.innerHTML ?? '');
  };
  return (
    <div className="rounded-[10px] border border-line focus-within:border-champagne focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--champagne)_22%,transparent)] transition-all">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-line">
        {btn(Bold, 'Bold', () => exec('bold'))}{btn(Italic, 'Italic', () => exec('italic'))}{btn(List, 'Bulleted list', () => exec('insertUnorderedList'))}{btn(Link2, 'Link', () => { saveRange(); setLink(''); })}
        {link !== null && (
          <div className="flex items-center gap-2 ml-2 anim-fade-in">
            <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') setLink(null); }} placeholder="richiva.com/size-guide" className={cn(plainInput, 'w-56')} />
            <Button size="sm" onClick={applyLink}>Add link</Button>
          </div>)}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => onChange(ref.current?.innerHTML ?? '')} data-ph="Describe the fabric, fit and feel…"
        className="min-h-[140px] px-3.5 py-3 text-[14px] outline-none leading-relaxed empty:before:content-[attr(data-ph)] empty:before:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2 [&_a]:underline [&_a]:text-info [&_b]:font-semibold [&_strong]:font-semibold" />
    </div>
  );
}

export function Basics({ d, set, showErr }: CP) {
  return (
    <Card hover={false}>
      <CardHeader title="Basics" sub="The name and story customers will read first." />
      <div className="space-y-4">
        <Field label="Product title" value={d.title} error={showErr && !d.title.trim() ? 'A title is required to publish' : undefined}
          onChange={(v) => set({ title: v, ...(d.slugEdited ? {} : { slug: slugify(v) }) })} />
        <div><div className="label-caps mb-2">Description</div><RichText html={d.description} onChange={(h) => set({ description: h })} /></div>
        <div><div className="label-caps mb-2">Three highlights</div>
          <div className="grid gap-3">{d.highlights.map((h, i) => <Field key={i} label={`Highlight ${i + 1}`} value={h} onChange={(v) => set({ highlights: d.highlights.map((x, j) => (j === i ? v : x)) })} />)}</div></div>
      </div>
    </Card>
  );
}

/* ---------- media ---------- */
export function Media({ d, set, showErr }: CP) {
  const { toast } = useApp();
  const [hot, setHot] = useState(false);
  const [pick, setPick] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const addFiles = (fl: FileList | File[]) => {
    const imgs = [...fl].filter((f) => f.type.startsWith('image/')); if (!imgs.length) return toast('Only image files can be added');
    set({ images: [...d.images, ...imgs.map((f) => ({ id: rid(), url: URL.createObjectURL(f), alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') }))] }); toast(`${imgs.length} ${imgs.length === 1 ? 'image' : 'images'} added`);
  };
  return (
    <Card hover={false}>
      <CardHeader title="Media" sub="Drag to reorder. The first image is the main image." action={<Button size="sm" variant="secondary" icon={ImagePlus} onClick={() => setPick(true)}>Choose from media library</Button>} />
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
      <div onClick={() => file.current?.click()} onDragOver={(e) => { e.preventDefault(); setHot(true); }} onDragLeave={() => setHot(false)} onDrop={(e) => { e.preventDefault(); setHot(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
        className={cn('h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300', hot ? 'border-champagne bg-[color-mix(in_srgb,var(--champagne)_10%,transparent)] scale-[1.01]' : showErr && !d.images.length ? 'border-bad' : 'border-line hover:border-champagne/70 hover:bg-soft')}>
        <UploadCloud size={30} strokeWidth={1.25} className={cn('mb-2 transition-transform duration-300', hot && '-translate-y-1')} />
        <div className="font-title text-[22px]">Drop photos here</div>
        <div className="text-muted text-[13px]">or click to browse · JPG or PNG, up to 10 MB</div>
      </div>
      {showErr && !d.images.length && <div className="text-bad text-[12px] mt-2">Add at least one image to publish</div>}
      {d.images.length > 0 && (
        <Sortable horizontal className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-5" items={d.images} getId={(i) => i.id} onChange={(images) => set({ images })}
          render={(im, { index }) => (
            <div className="group anim-pop">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone cursor-grab active:cursor-grabbing">
                <img src={im.url} alt={im.alt} draggable={false} className="size-full object-cover" />
                {index === 0 && <span className="absolute top-2 left-2 h-6 px-2.5 rounded-full bg-ink text-inkfg text-[11px] flex items-center">Main image</span>}
                <button onClick={() => set({ images: d.images.filter((x) => x.id !== im.id) })} aria-label="Remove image" className="absolute top-2 right-2 size-7 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
              </div>
              <input value={im.alt} onChange={(e) => set({ images: d.images.map((x) => (x.id === im.id ? { ...x, alt: e.target.value } : x)) })} placeholder="Alt text" aria-label="Alt text" className="mt-2 w-full h-8 bg-transparent border-b border-line text-[12px] outline-none focus:border-champagne transition-colors" />
            </div>)} />
      )}
      <MediaPicker open={pick} onClose={() => setPick(false)} onSelect={(urls) => { set({ images: [...d.images, ...urls.map((u) => ({ id: rid(), url: u, alt: `${d.title || 'Product'} photo` }))] }); toast(`${urls.length} images added`); }} />
    </Card>
  );
}

/* ---------- variants ---------- */
export function Variants({ d, set }: CP) {
  const { toast } = useApp();
  const [fresh, setFresh] = useState<string[]>([]);
  const tog = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const generate = () => {
    if (!d.sizes.length || !d.colors.length) return toast('Pick at least one size and one colour');
    const added: string[] = [];
    const rows: VRow[] = d.sizes.flatMap((s) => d.colors.map((c) => {
      const ex = d.variants.find((v) => v.size === s && v.color === c); if (ex) return ex;
      const r: VRow = { id: rid(), size: s, color: c, sku: variantSku(d.sku, c, s), barcode: barcode(), price: d.price, sale: d.sale, stock: '10', on: true }; added.push(r.id); return r;
    }));
    set({ variants: rows }); setFresh(added); setTimeout(() => setFresh([]), 1800);
    toast(added.length ? `${added.length} variants generated` : 'Variants are up to date', { star: !!added.length });
  };
  const upd = (id: string, p: Partial<VRow>) => set({ variants: d.variants.map((v) => (v.id === id ? { ...v, ...p } : v)) });
  const num = (v: string, f: (s: string) => void, w = 'w-24') => <input inputMode="numeric" value={v} onChange={(e) => f(e.target.value.replace(/[^\d]/g, ''))} className={cn(plainInput, w)} />;
  return (
    <Card hover={false}>
      <CardHeader title="Variants" sub="Choose sizes and colours, then generate every combination." action={<Button icon={Sparkles} onClick={generate}>Generate variants</Button>} />
      <div className="grid gap-5 md:grid-cols-2">
        <div><div className="label-caps mb-2">Sizes</div><div className="flex flex-wrap gap-2">{SIZES.map((s) => { const on = d.sizes.includes(s); return <button key={s} onClick={() => set({ sizes: tog(d.sizes, s) })} className={cn('h-9 min-w-11 px-3.5 rounded-full border text-[13px] transition-all duration-200 active:scale-95', on ? 'bg-ink text-inkfg border-ink anim-pop' : 'border-line hover:border-champagne')}>{s}</button>; })}</div></div>
        <div><div className="label-caps mb-2">Colours</div><div className="flex flex-wrap gap-3">{COLORS.map((c) => { const on = d.colors.includes(c.name); return (
          <button key={c.name} onClick={() => set({ colors: tog(d.colors, c.name) })} title={c.name} aria-label={c.name} className="flex flex-col items-center gap-1 group">
            <span className={cn('size-9 rounded-full border border-line transition-all duration-200 group-hover:scale-110', on && 'ring-2 ring-champagne ring-offset-2 ring-offset-card scale-105')} style={{ background: c.hex }} /><span className={cn('text-[11px]', on ? 'text-fg' : 'text-muted')}>{c.name}</span>
          </button>); })}</div></div>
      </div>
      {d.variants.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-[13px] border-separate border-spacing-0 min-w-[820px]">
            <thead><tr>{['Variant', 'SKU', 'Barcode', 'Price', 'Sale price', 'Stock', 'On'].map((h) => <th key={h} className="label-caps text-left px-3 py-2.5 border-b border-line bg-soft whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{d.variants.map((v, i) => (
              <tr key={v.id} className={cn(fresh.includes(v.id) && 'anim-slide-in', !v.on && 'opacity-50')} style={{ animationDelay: `${Math.max(0, fresh.indexOf(v.id)) * 50}ms` }}>
                <td className="px-3 py-2 border-b border-line whitespace-nowrap font-medium">{v.size} · {v.color}</td>
                <td className="px-3 py-2 border-b border-line"><input value={v.sku} onChange={(e) => upd(v.id, { sku: e.target.value })} className={cn(plainInput, 'w-40')} aria-label={`SKU ${i + 1}`} /></td>
                <td className="px-3 py-2 border-b border-line"><input value={v.barcode} onChange={(e) => upd(v.id, { barcode: e.target.value })} className={cn(plainInput, 'w-36')} aria-label="Barcode" /></td>
                <td className="px-3 py-2 border-b border-line">{num(v.price, (s) => upd(v.id, { price: s }))}</td>
                <td className="px-3 py-2 border-b border-line">{num(v.sale, (s) => upd(v.id, { sale: s }))}</td>
                <td className="px-3 py-2 border-b border-line">{num(v.stock, (s) => upd(v.id, { stock: s }), 'w-20')}</td>
                <td className="px-3 py-2 border-b border-line"><Switch checked={v.on} onChange={(on) => upd(v.id, { on })} label={`${v.size} ${v.color} on or off`} /></td>
              </tr>))}</tbody>
          </table>
        </div>
      ) : <div className="mt-6 rounded-xl border border-dashed border-line py-8 text-center text-muted text-[13px]">No variants yet. Pick sizes and colours, then press Generate variants.</div>}
    </Card>
  );
}

/* ---------- pricing, inventory, made to order, seo ---------- */
export function Pricing({ d, set, showErr }: CP) {
  const price = Number(d.price) || 0, sale = Number(d.sale) || 0, cost = Number(d.cost) || 0;
  const eff = sale > 0 ? sale : price;
  const margin = eff > 0 ? ((eff - cost) / eff) * 100 : 0;
  const money = (k: 'price' | 'sale' | 'cost') => (v: string) => set({ [k]: v.replace(/[^\d]/g, '') });
  const date = (label: string, k: 'saleFrom' | 'saleTo') => <label className="block"><span className="label-caps block mb-1.5">{label}</span><input type="date" value={d[k]} onChange={(e) => set({ [k]: e.target.value })} className={cn(plainInput, 'h-12 w-full text-[14px] rounded-[10px]')} /></label>;
  return (
    <Card hover={false}>
      <CardHeader title="Pricing" sub="Margin updates as you type." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price" prefix="Rs" value={d.price} onChange={money('price')} error={showErr && !(price > 0) ? 'Set a price to publish' : undefined} />
        <Field label="Sale price" prefix="Rs" value={d.sale} onChange={money('sale')} error={sale > 0 && sale >= price ? 'Sale price should be lower than the price' : undefined} />
        {sale > 0 && <>{date('Sale starts', 'saleFrom')}{date('Sale ends', 'saleTo')}</>}
        <Field label="Cost per item" prefix="Rs" value={d.cost} onChange={money('cost')} />
        <div className="rounded-[10px] bg-soft px-4 py-2.5 flex items-center justify-between">
          <div><div className="label-caps">Margin</div><div className={cn('text-[22px] font-semibold', eff > 0 && margin < 20 ? 'text-warn' : 'text-fg')}>{eff > 0 ? <CountUp value={margin} decimals={1} duration={300} format={(n) => `${n.toFixed(1)}%`} /> : '—'}</div></div>
          <div className="text-right text-[12px] text-muted">Profit<div className="text-fg text-[14px] num">{eff > 0 ? rs(eff - cost) : '—'}</div></div>
        </div>
      </div>
    </Card>
  );
}
export function Inventory({ d, set }: CP) {
  const total = d.variants.filter((v) => v.on).reduce((a, v) => a + (Number(v.stock) || 0), 0);
  return (
    <Card hover={false}>
      <CardHeader title="Inventory" sub={`${total} units across ${d.variants.filter((v) => v.on).length} active variants`} />
      <div className="space-y-5">
        <SwitchRow title="Track stock" body="Count units as orders come in." checked={d.track} onChange={(v) => set({ track: v })} />
        {d.track && <div className="grid sm:grid-cols-2 gap-4 anim-fade-up"><Field label="Low-stock level" value={d.lowLevel} onChange={(v) => set({ lowLevel: v.replace(/[^\d]/g, '') })} hint="You will be alerted at or below this number." /></div>}
        <SwitchRow title="Allow orders when out of stock" body="Customers can still buy and wait for new stock." checked={d.allowOOS} onChange={(v) => set({ allowOOS: v })} />
      </div>
    </Card>
  );
}
export function MadeToOrder({ d, set }: CP) {
  return (
    <Card hover={false}>
      <CardHeader title="Made to order" sub="For pieces stitched after the order arrives." />
      <SwitchRow title="This product is made to order" body="Shows a production time on the product page." checked={d.mto} onChange={(v) => set({ mto: v })} />
      {d.mto && <div className="grid sm:grid-cols-2 gap-4 mt-5 anim-fade-up"><Field label="Production days" value={d.prodDays} onChange={(v) => set({ prodDays: v.replace(/[^\d]/g, '') })} /><Select label="Builder template" value={d.template} onChange={(v) => set({ template: v })} options={TEMPLATES} /></div>}
    </Card>
  );
}
export function Seo({ d, set }: CP) {
  const title = d.metaTitle || d.title || 'Product title';
  const desc = d.metaDesc || 'Add a meta description so shoppers know what to expect before they click.';
  const count = (n: number, max: number) => <span className={cn('text-[11px] num', n > max ? 'text-bad' : 'text-muted')}>{n}/{max}</span>;
  return (
    <Card hover={false}>
      <CardHeader title="SEO" sub="How this product appears in search results." />
      <div className="space-y-4">
        <Field label="URL slug" value={d.slug} onChange={(v) => set({ slug: slugify(v), slugEdited: true })} hint={`richiva.com/products/${d.slug || 'product-name'}`} />
        <Field label="Meta title" value={d.metaTitle} onChange={(v) => set({ metaTitle: v })} right={count(d.metaTitle.length, 60)} />
        <Field label="Meta description" multiline rows={3} value={d.metaDesc} onChange={(v) => set({ metaDesc: v })} hint={<div className="flex justify-end">{count(d.metaDesc.length, 160)}</div>} />
        <div className="rounded-xl bg-soft p-4"><div className="label-caps mb-2">Search preview</div>
          <div className="text-[12px] text-muted truncate">richiva.com › products › {d.slug || 'product-name'}</div>
          <div className="text-[18px] text-info leading-snug truncate">{title.slice(0, 70)}</div>
          <div className="text-[13px] text-muted line-clamp-2">{desc.slice(0, 170)}</div></div>
      </div>
    </Card>
  );
}

