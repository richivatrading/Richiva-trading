import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardHeader, Checkbox, Field, Ring, Segmented, Select, Switch } from '../../ui/kit';
import { cn } from '../../lib/format';
import { CATEGORIES, collectionsStore } from './shared';
import { SIZE_GUIDES, type Draft } from './editorModel';
import type { CP } from './EditorCards';

const SG_ROWS: Record<string, string[][]> = {
  'Women tops': [['S', '84', '66'], ['M', '88', '70'], ['L', '94', '76']], 'Women bottoms': [['S', '66', '90'], ['M', '70', '94'], ['L', '76', '100']],
  'Dresses and gowns': [['S', '84', '66'], ['M', '88', '70'], ['L', '94', '76']], Outerwear: [['S', '90', '72'], ['M', '95', '76'], ['L', '100', '82']],
};

export default function Side({ d, set }: CP) {
  const [tag, setTag] = useState('');
  const [cols] = collectionsStore.use();
  const addTag = () => { const t = tag.trim().toLowerCase(); if (t && !d.tags.includes(t)) set({ tags: [...d.tags, t] }); setTag(''); };
  const checks = [
    { label: 'Main image added', done: d.images.length > 0 }, { label: 'Three or more photos', done: d.images.length >= 3 },
    { label: 'Size guide chosen', done: d.sizeGuide !== 'None' }, { label: 'Category set', done: !!d.category }, { label: 'Variants generated', done: d.variants.length > 0 },
  ];
  const ready = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const tog = (n: string) => set({ collections: d.collections.includes(n) ? d.collections.filter((x) => x !== n) : [...d.collections, n] });
  return (
    <div className="space-y-6">
      <Card hover={false}><CardHeader title="Status" />
        <Segmented className="w-full [&>button]:flex-1 [&>button]:justify-center" value={d.status === 'Archived' ? 'Draft' : d.status} onChange={(v) => set({ status: v })} options={[{ value: 'Draft', label: 'Draft' }, { value: 'Published', label: 'Published' }, { value: 'Scheduled', label: 'Scheduled' }]} />
        {d.status === 'Archived' && <div className="text-muted text-[12px] mt-2">Archived. Pick a status to bring it back.</div>}
        {d.status === 'Scheduled' && <label className="block mt-4 anim-fade-up"><span className="label-caps block mb-1.5">Go live on</span><input type="datetime-local" value={d.schedule} onChange={(e) => set({ schedule: e.target.value })} className="w-full h-12 rounded-[10px] bg-card border border-line px-3.5 text-[14px] outline-none focus:border-champagne" /></label>}
      </Card>
      <Card hover={false}><CardHeader title="Channels" />
        <div className="space-y-3"><Checkbox checked={d.web} onChange={(v) => set({ web: v })} label="Website" /><Checkbox checked={d.app} onChange={(v) => set({ app: v })} label="Mobile app" /></div>
      </Card>
      <Card hover={false}><CardHeader title="Category and collections" />
        <Select label="Category" value={d.category} onChange={(v) => set({ category: v })} options={[{ value: '', label: 'Choose a category' }, ...CATEGORIES]} />
        <div className="label-caps mt-4 mb-2">Collections</div>
        <div className="flex flex-wrap gap-2">{cols.filter((c) => c.type === 'Manual').map((c) => { const on = d.collections.includes(c.name); return <button key={c.id} onClick={() => tog(c.name)} className={cn('h-8 px-3.5 rounded-full border text-[13px] transition-all active:scale-95', on ? 'bg-ink text-inkfg border-ink' : 'border-line hover:border-champagne')}>{c.name}</button>; })}</div>
      </Card>
      <Card hover={false}><CardHeader title="Tags" />
        <Field label="Add a tag, then press Enter" value={tag} onChange={setTag} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
        <div className="flex flex-wrap gap-2 mt-3">{d.tags.map((t) => <span key={t} className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-stone text-[12px] anim-pop">{t}<button aria-label={`Remove ${t}`} onClick={() => set({ tags: d.tags.filter((x) => x !== t) })}><X size={12} /></button></span>)}</div>
      </Card>
      <Card hover={false}><CardHeader title="Size guide" />
        <Select value={d.sizeGuide} onChange={(v) => set({ sizeGuide: v })} options={SIZE_GUIDES} />
        {SG_ROWS[d.sizeGuide] && (
          <table className="w-full text-[13px] mt-4 anim-fade-up"><thead><tr className="label-caps text-left"><th className="py-1.5">Size</th><th>{d.sizeGuide === 'Women bottoms' ? 'Waist (cm)' : 'Bust (cm)'}</th><th>{d.sizeGuide === 'Women bottoms' ? 'Hip (cm)' : 'Waist (cm)'}</th></tr></thead>
            <tbody>{SG_ROWS[d.sizeGuide].map((r) => <tr key={r[0]} className="border-t border-line">{r.map((c, i) => <td key={i} className={cn('py-1.5 num', i === 0 && 'font-medium')}>{c}</td>)}</tr>)}</tbody></table>)}
      </Card>
      <Card hover={false}><CardHeader title="Try-on readiness" />
        <div className="flex items-center gap-4"><Ring value={ready} size={68} /><div className="text-[13px] text-muted">{ready === 100 ? 'Ready for virtual try-on.' : 'Complete the checklist to enable try-on.'}</div></div>
        <ul className="mt-4 space-y-2">{checks.map((c) => <li key={c.label} className="flex items-center gap-2.5 text-[13px]"><span className={cn('size-5 rounded-full flex items-center justify-center', c.done ? 'bg-ink text-inkfg' : 'bg-stone text-muted')}>{c.done ? <Check size={12} strokeWidth={2.5} /> : null}</span><span className={c.done ? '' : 'text-muted'}>{c.label}</span></li>)}</ul>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-line"><span className="text-[14px]">Enable virtual try-on</span><Switch checked={d.tryon} onChange={(v) => set({ tryon: v })} label="Enable virtual try-on" disabled={ready < 60} /></div>
      </Card>
    </div>
  );
}
export type { Draft };
