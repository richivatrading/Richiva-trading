import { useState } from 'react';
import { Bell, Check, CornerDownRight, GripVertical, History, Image as ImageIcon, Megaphone, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, Chip, Field, Label, Modal, Pill, SaveBar, Segmented, Sortable, StatusPill, Switch, stagger } from '../../ui/kit';
import { Logo, Star } from '../../ui/brand';
import MediaPicker from '../../ui/MediaPicker';
import { useApp } from '../../store';
import { setupStore, photo } from '../../data/seed';
import { cn, uid } from '../../lib/format';
import { BG, type Bg } from './blocks';

const J = JSON.stringify;
const SW: Bg[] = ['ivory', 'ink', 'champagne', 'sage'];
const Sw = ({ value, onChange }: { value: Bg; onChange: (b: Bg) => void }) => (
  <div className="flex gap-3">{SW.map((s) => <button key={s} onClick={() => onChange(s)} title={s} className="flex flex-col items-center gap-1 text-[11px] text-muted capitalize"><span className={cn('size-8 rounded-full border border-line transition-all', BG[s].split(' ')[0], value === s && 'ring-2 ring-champagne ring-offset-2 ring-offset-card')} />{s}</button>)}</div>
);
const stop = { onDragStart: (e: React.DragEvent) => e.stopPropagation(), onDragOver: (e: React.DragEvent) => e.stopPropagation(), onDrop: (e: React.DragEvent) => e.stopPropagation(), onDragEnd: (e: React.DragEvent) => e.stopPropagation() };

/* ---------------- Home page ---------------- */
interface Sec { id: string; name: string; visible: boolean; img: number; h: number }
const HOME: Sec[] = [
  { id: 'ann', name: 'Announcement bar', visible: true, img: -1, h: 8 }, { id: 'hero', name: 'Hero banner', visible: true, img: 0, h: 52 }, { id: 'new', name: 'New arrivals', visible: true, img: 4, h: 34 },
  { id: 'col', name: 'Shop by collection', visible: true, img: 6, h: 38 }, { id: 'custom', name: 'Made to order', visible: true, img: 3, h: 30 }, { id: 'look', name: 'Lookbook', visible: false, img: 9, h: 40 },
  { id: 'rev', name: 'Testimonials', visible: true, img: -1, h: 26 }, { id: 'news', name: 'Newsletter', visible: true, img: -1, h: 22 },
];
export function HomeTab() {
  const { toast } = useApp();
  const [secs, setSecs] = useState(HOME); const [saved, setSaved] = useState(HOME);
  const dirty = J(secs) !== J(saved);
  const live = secs.filter((s) => s.visible);
  const publish = () => { setSaved(secs); setupStore.set((s) => (s.includes('home') ? s : [...s, 'home'])); toast('Home page published', { body: `${live.length} sections live`, star: true }); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      <Card>
        <CardHeader title="Home page sections" sub="Drag to reorder. Switch off to hide a section." action={<Button icon={Check} onClick={publish}>Publish home page</Button>} />
        <Sortable items={secs} getId={(s) => s.id} onChange={setSecs} className="grid gap-2"
          render={(s, o) => (
            <div className={cn('flex items-center gap-3 rounded-xl border border-line px-4 h-14 bg-card transition-colors', !s.visible && 'bg-soft/60')}>
              {o.handle}<span className="size-7 rounded-lg bg-stone text-[12px] grid place-items-center text-muted num">{o.index + 1}</span>
              <span className={cn('flex-1 transition-opacity', !s.visible && 'opacity-50')}>{s.name}</span>
              {!s.visible && <Pill>Hidden</Pill>}
              <Switch checked={s.visible} onChange={(v) => setSecs((a) => a.map((x) => (x.id === s.id ? { ...x, visible: v } : x)))} label={`Show ${s.name}`} />
            </div>
          )} />
      </Card>
      <Card className="lg:sticky lg:top-4">
        <CardHeader title="Live preview" sub={`${live.length} of ${secs.length} sections`} />
        <div className="mx-auto w-[210px] rounded-2xl border border-line bg-card overflow-hidden shadow-[var(--shadow)]">
          <div className="flex justify-center py-2 border-b border-line"><Logo width={56} /></div>
          <div className="max-h-[420px] overflow-hidden">
            {live.map((s, i) => (
              <div key={s.id} className="relative overflow-hidden border-b border-card anim-fade-up" style={{ ...stagger(i, 50), height: s.h }}>
                {s.img >= 0 ? <img src={photo(s.img, 300, 200)} alt="" className="size-full object-cover" /> : <div className={cn('size-full', s.id === 'ann' ? 'bg-ink' : 'bg-soft')} />}
                <span className={cn('absolute left-2 bottom-1 text-[8px] tracking-wide', s.img >= 0 ? 'text-white' : s.id === 'ann' ? 'text-inkfg' : 'text-muted')}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <SaveBar show={dirty} onSave={() => { setSaved(secs); toast('Home page saved as draft'); }} onDiscard={() => setSecs(saved)} />
    </div>
  );
}

/* ---------------- Banners & announcement ---------------- */
interface Ban { id: string; name: string; heading: string; img: number; start: string; end: string; on: boolean }
const BANS: Ban[] = [
  { id: 'b1', name: 'Hero banner', heading: 'Dashain edit is here', img: 1, start: '2026-10-10', end: '2026-11-05', on: true },
  { id: 'b2', name: 'Mid page banner', heading: 'Made to order in 7 days', img: 3, start: '2026-10-25', end: '2026-12-01', on: true },
  { id: 'b3', name: 'Pop up', heading: 'Welcome gift: 10% off your first order', img: 5, start: '2026-09-01', end: '2026-10-01', on: true },
];
const TODAY = '2026-10-18';
const bstatus = (b: Ban) => (!b.on ? 'Inactive' : b.start > TODAY ? 'Scheduled' : b.end < TODAY ? 'Expired' : 'Live');
export function BannersTab() {
  const { toast } = useApp();
  const init = { text: 'Free delivery in Kathmandu Valley on orders above Rs 8,000', link: '/collections/all', bg: 'ink' as Bg, on: true, start: '2026-10-10', end: '2026-11-05' };
  const [a, setA] = useState(init); const [bans, setBans] = useState(BANS);
  const [saved, setSaved] = useState({ a: init, bans: BANS });
  const [pick, setPick] = useState<string | null>(null);
  const dirty = J({ a, bans }) !== J(saved);
  const errs = { text: !a.text.trim() ? 'Write the announcement' : a.text.length > 90 ? 'Keep it under 90 characters' : '', end: a.end < a.start ? 'End date is before the start' : '' };
  const save = () => { if (errs.text || errs.end) return toast('Please fix the highlighted fields'); setSaved({ a, bans }); toast('Banners saved', { body: 'Changes are live on the store' }); };
  const setB = (id: string, p: Partial<Ban>) => setBans((x) => x.map((b) => (b.id === id ? { ...b, ...p } : b)));
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Announcement bar" sub="Shown above the store header" action={<Switch checked={a.on} onChange={(on) => setA({ ...a, on })} label="Announcement on" />} />
        <div className={cn('rounded-xl overflow-hidden border border-line mb-5 transition-opacity', !a.on && 'opacity-40')}>
          <div key={a.bg} className={cn('text-center text-[12.5px] py-2.5 px-4 tracking-wide anim-fade-in', BG[a.bg])}>{a.text || 'Your announcement appears here'}</div>
          <div className="bg-card flex justify-center py-4"><Logo width={96} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Text" value={a.text} onChange={(text) => setA({ ...a, text })} error={errs.text} hint={`${a.text.length}/90`} />
          <Field label="Link" value={a.link} onChange={(link) => setA({ ...a, link })} />
          <Field label="Starts" type="date" value={a.start} onChange={(start) => setA({ ...a, start })} />
          <Field label="Ends" type="date" value={a.end} onChange={(end) => setA({ ...a, end })} error={errs.end} />
        </div>
        <div className="mt-5"><Label className="mb-2">Colour</Label><Sw value={a.bg} onChange={(bg) => setA({ ...a, bg })} /></div>
      </Card>
      <Card>
        <CardHeader title="Promotional banners" sub="Scheduled automatically between the dates" />
        <div className="grid gap-4">
          {bans.map((b, i) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-3 anim-fade-up" style={stagger(i)}>
              <button onClick={() => setPick(b.id)} className="relative w-36 h-20 rounded-lg overflow-hidden group shrink-0"><img src={photo(b.img, 300, 170)} alt="" className="size-full object-cover" /><span className="absolute inset-0 bg-black/40 text-white text-[11px] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"><ImageIcon size={16} /></span></button>
              <div className="flex-1 min-w-48"><div className="flex items-center gap-2 mb-2"><span className="font-medium">{b.name}</span><StatusPill status={bstatus(b)} /></div><Field label="Heading" value={b.heading} onChange={(heading) => setB(b.id, { heading })} error={b.heading.trim() ? undefined : 'Heading is required'} /></div>
              <Field className="w-40" label="Starts" type="date" value={b.start} onChange={(start) => setB(b.id, { start })} />
              <Field className="w-40" label="Ends" type="date" value={b.end} onChange={(end) => setB(b.id, { end })} error={b.end < b.start ? 'Before start' : undefined} />
              <Switch checked={b.on} onChange={(on) => setB(b.id, { on })} label={`${b.name} on`} />
            </div>
          ))}
        </div>
      </Card>
      <MediaPicker open={!!pick} multiple={false} onClose={() => setPick(null)} onSelect={() => { if (pick) setB(pick, { img: (bans.find((x) => x.id === pick)!.img + 3) % 14 }); }} />
      <SaveBar show={dirty} onSave={save} onDiscard={() => { setA(saved.a); setBans(saved.bans); }} />
    </div>
  );
}

/* ---------------- FAQs ---------------- */
interface Qa { id: string; q: string; a: string }
interface Cat { id: string; name: string; items: Qa[] }
const qa = (q: string, a: string): Qa => ({ id: uid('q'), q, a });
const FAQ0: Cat[] = [
  { id: 'c1', name: 'Orders and delivery', items: [qa('How long does delivery take?', 'Inside Kathmandu Valley in 1 to 2 days, other cities in 3 to 5 days.'), qa('Do you offer cash on delivery?', 'Yes, across Nepal. We may call to confirm your order first.')] },
  { id: 'c2', name: 'Returns and exchanges', items: [qa('What is your return window?', 'Seven days from delivery for unworn items with tags.'), qa('Can I return a made-to-order piece?', 'Made-to-order pieces can be altered free of charge but not returned.')] },
  { id: 'c3', name: 'Sizing and care', items: [qa('How do I find my size?', 'Use the size guide on each product page or visit our Jawalakhel studio.')] },
];
export function FaqTab() {
  const { toast, confirm } = useApp();
  const [cats, setCats] = useState(FAQ0); const [saved, setSaved] = useState(FAQ0); const [bad, setBad] = useState(false);
  const dirty = J(cats) !== J(saved);
  const setCat = (id: string, p: Partial<Cat>) => setCats((c) => c.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const save = () => { if (cats.some((c) => !c.name.trim() || c.items.some((i) => !i.q.trim() || !i.a.trim()))) { setBad(true); return toast('Every category, question and answer needs text'); } setBad(false); setSaved(cats); toast('FAQs saved', { star: true }); };
  const removeCat = async (c: Cat) => { if (!(await confirm({ title: `Delete "${c.name}"?`, body: `${c.items.length} questions will be removed.`, confirmLabel: 'Delete', danger: true }))) return; const prev = cats; setCats(cats.filter((x) => x.id !== c.id)); toast('Category deleted', { undo: () => setCats(prev) }); };
  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-4"><div className="text-muted">Drag categories and questions to reorder them.</div><Button variant="secondary" icon={Plus} onClick={() => setCats([...cats, { id: uid('c'), name: '', items: [] }])}>Add category</Button></div>
      <Sortable items={cats} getId={(c) => c.id} onChange={setCats} className="grid gap-4"
        render={(c, o) => (
          <Card hover={false}>
            <div className="flex items-center gap-3 mb-4">{o.handle}<input value={c.name} placeholder="Category name" onChange={(e) => setCat(c.id, { name: e.target.value })} className={cn('flex-1 bg-transparent font-title text-[24px] outline-none border-b border-transparent focus:border-champagne', bad && !c.name.trim() && 'border-bad')} /><Pill>{c.items.length}</Pill><button onClick={() => removeCat(c)} aria-label="Delete category" className="size-8 grid place-items-center rounded-full text-muted hover:text-bad hover:bg-stone"><Trash2 size={15} /></button></div>
            <div {...stop}>
              <Sortable items={c.items} getId={(i) => i.id} onChange={(items) => setCat(c.id, { items })} className="grid gap-2"
                render={(it, p) => (
                  <div className="flex items-start gap-3 rounded-xl border border-line p-3 bg-card">{p.handle}
                    <div className="flex-1 grid gap-2">
                      <input value={it.q} placeholder="Question" onChange={(e) => setCat(c.id, { items: c.items.map((x) => (x.id === it.id ? { ...x, q: e.target.value } : x)) })} className={cn('bg-transparent font-medium outline-none border-b border-transparent focus:border-champagne', bad && !it.q.trim() && 'border-bad')} />
                      <textarea value={it.a} rows={2} placeholder="Answer" onChange={(e) => setCat(c.id, { items: c.items.map((x) => (x.id === it.id ? { ...x, a: e.target.value } : x)) })} className={cn('bg-transparent text-muted text-[13.5px] outline-none resize-none border-b border-transparent focus:border-champagne', bad && !it.a.trim() && 'border-bad')} />
                    </div>
                    <button aria-label="Delete question" onClick={() => setCat(c.id, { items: c.items.filter((x) => x.id !== it.id) })} className="size-7 grid place-items-center rounded-full text-muted hover:text-bad hover:bg-stone"><Trash2 size={14} /></button>
                  </div>
                )} />
            </div>
            <Button size="sm" variant="ghost" icon={Plus} className="mt-3" onClick={() => setCat(c.id, { items: [...c.items, qa('', '')] })}>Add question</Button>
          </Card>
        )} />
      <SaveBar show={dirty} onSave={save} onDiscard={() => setCats(saved)} />
    </div>
  );
}

/* ---------------- Policies ---------------- */
interface PV { n: number; date: string; by: string; body: string }
interface Pol { id: string; name: string; body: string; versions: PV[] }
const mk = (id: string, name: string, body: string): Pol => ({ id, name, body, versions: [{ n: 2, date: '2 Oct 2026', by: 'Anita Shrestha', body }, { n: 1, date: '14 Mar 2026', by: 'Bikram Thapa', body: body.split('.')[0] + '.' }] });
const POLS: Pol[] = [
  mk('ship', 'Shipping policy', 'We deliver across Nepal with Pathao and Nepal Can Move. Orders inside Kathmandu Valley arrive in 1 to 2 days. Free delivery above Rs 8,000.'),
  mk('ret', 'Returns and refunds', 'You can return unworn items within seven days of delivery. Refunds go back to your original payment method within five working days. Made-to-order items cannot be returned.'),
  mk('priv', 'Privacy policy', 'We collect only what we need to fulfil your order and improve your experience. We never sell your data. You can ask us to delete your account at any time.'),
  mk('terms', 'Terms of service', 'By placing an order you agree to these terms. Prices are in Nepali rupees and include VAT. We reserve the right to cancel orders with pricing errors.'),
];
export function PolicyTab() {
  const { toast } = useApp();
  const [pols, setPols] = useState(POLS); const [id, setId] = useState('ship'); const [draft, setDraft] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState(false);
  const pol = pols.find((p) => p.id === id)!; const body = draft[id] ?? pol.body;
  const dirty = body !== pol.body; const err = body.trim().length < 40 ? 'Please write at least 40 characters' : '';
  const save = (notify: boolean) => {
    setPols((a) => a.map((p) => (p.id === id ? { ...p, body, versions: [{ n: p.versions[0].n + 1, date: '18 Oct 2026', by: 'Anita Shrestha', body }, ...p.versions] } : p)));
    setDraft((d) => { const n = { ...d }; delete n[id]; return n; }); setAsk(false);
    toast(notify ? 'Policy saved, customers notified' : 'Policy saved', { body: `${pol.name} version ${pol.versions[0].n + 1}`, star: notify });
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
      <Card pad={false} className="p-2">{pols.map((p) => <button key={p.id} onClick={() => setId(p.id)} className={cn('w-full flex items-center justify-between px-3 h-11 rounded-xl text-[14px] transition-colors', id === p.id ? 'bg-soft font-medium' : 'text-muted hover:text-fg hover:bg-soft/60')}>{p.name}<span className="text-[11px] text-muted">v{p.versions[0].n}</span></button>)}</Card>
      <div className="grid gap-6">
        <Card>
          <CardHeader title={pol.name} sub={`Version ${pol.versions[0].n}, updated ${pol.versions[0].date}`} action={<Button disabled={!dirty || !!err} onClick={() => setAsk(true)}>Save</Button>} />
          <Field label="Policy text" multiline rows={9} value={body} onChange={(v) => setDraft({ ...draft, [id]: v })} error={dirty ? err || undefined : undefined} hint={`${body.length} characters`} />
        </Card>
        <Card>
          <CardHeader title="Versions" action={<History size={18} className="text-muted" />} />
          <div className="grid gap-2">{pol.versions.map((v, i) => (
            <div key={v.n} className="flex items-center gap-3 rounded-xl border border-line px-4 py-2.5"><Pill tone={i === 0 ? 'sage' : 'neutral'}>v{v.n}</Pill><span className="flex-1 text-[13.5px]">{v.date} by {v.by}</span>{i === 0 ? <span className="text-[12px] text-muted">Current</span> : <Button size="sm" variant="secondary" onClick={() => { setDraft({ ...draft, [id]: v.body }); toast('Version loaded', { body: 'Review and save to restore it' }); }}>Restore</Button>}</div>
          ))}</div>
        </Card>
      </div>
      <Modal open={ask} onClose={() => setAsk(false)} size="sm" title="Notify customers?" footer={<><Button variant="secondary" onClick={() => save(false)}>Save without notifying</Button><Button icon={Bell} onClick={() => save(true)}>Save and notify</Button></>}>
        <div className="text-muted">Changes to the {pol.name.toLowerCase()} can affect existing orders. We can email customers who ordered in the last 12 months about the update.</div>
      </Modal>
    </div>
  );
}

/* ---------------- Navigation ---------------- */
interface Nav { id: string; label: string; url: string; depth: number }
const n = (label: string, url: string, depth = 0): Nav => ({ id: uid('n'), label, url, depth });
const MENUS: Record<string, Nav[]> = {
  main: [n('Shop', '/collections/all'), n('Dresses', '/collections/dresses', 1), n('Tops', '/collections/tops', 1), n('Bottoms', '/collections/bottoms', 1), n('New in', '/collections/new'), n('Custom made', '/custom'), n('Journal', '/journal'), n('About', '/about')],
  footer: [n('Help', '/help'), n('Shipping', '/policies/shipping', 1), n('Returns', '/policies/returns', 1), n('Size guide', '/size-guide', 1), n('Contact', '/contact'), n('Visit the atelier', '/stores')],
};
export function NavTab() {
  const { toast } = useApp();
  const [menu, setMenu] = useState<'main' | 'footer'>('main');
  const [menus, setMenus] = useState(MENUS); const [saved, setSaved] = useState(MENUS);
  const [label, setLabel] = useState(''); const [url, setUrl] = useState(''); const [err, setErr] = useState('');
  const items = menus[menu]; const setItems = (x: Nav[]) => setMenus({ ...menus, [menu]: x });
  const [drag, setDrag] = useState<string | null>(null); const [drop, setDrop] = useState<{ index: number; depth: number } | null>(null);
  const subEnd = (i: number) => { let j = i + 1; while (j < items.length && items[j].depth > items[i].depth) j++; return j; };
  const over = (e: React.DragEvent, i: number) => {
    e.preventDefault(); if (!drag) return;
    const di = items.findIndex((x) => x.id === drag); if (i >= di && i < subEnd(di)) return setDrop(null);
    const r = e.currentTarget.getBoundingClientRect(); const row = items[i];
    if (e.clientY <= r.top + r.height / 2) return setDrop({ index: i, depth: row.depth });
    const nest = e.clientX > r.left + 90 + row.depth * 28 && row.depth < 2;
    setDrop(nest ? { index: i + 1, depth: row.depth + 1 } : { index: subEnd(i), depth: row.depth });
  };
  const doDrop = () => {
    if (drag && drop) {
      const di = items.findIndex((x) => x.id === drag); const de = subEnd(di); const sub = items.slice(di, de); const rest = [...items.slice(0, di), ...items.slice(de)];
      let idx = drop.index; if (idx >= de) idx -= sub.length; else if (idx > di) idx = di;
      const d = Math.max(0, Math.min(drop.depth, (rest[idx - 1]?.depth ?? -1) + 1, 2)); const delta = d - sub[0].depth;
      rest.splice(idx, 0, ...sub.map((s) => ({ ...s, depth: Math.min(2, Math.max(0, s.depth + delta)) }))); setItems(rest);
    }
    setDrag(null); setDrop(null);
  };
  const add = () => { if (!label.trim()) return setErr('Give the link a label'); if (!url.startsWith('/') && !/^https?:\/\//.test(url)) return setErr('Link must start with / or https://'); setItems([...items, n(label.trim(), url.trim())]); setLabel(''); setUrl(''); setErr(''); };
  const Line = ({ d }: { d: number }) => <div className="absolute right-0 -top-px h-0.5 bg-champagne rounded-full z-10 pointer-events-none flex items-center" style={{ left: 16 + d * 28 }}><span className="size-2 rounded-full bg-champagne -ml-1" /></div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <Card>
        <CardHeader title="Menus" sub="Drag a row to reorder. Drop it to the right of another row to nest it." action={<Segmented value={menu} onChange={setMenu} options={[{ value: 'main', label: 'Main menu' }, { value: 'footer', label: 'Footer menu' }]} />} />
        <div key={menu} className="relative" onDragOver={(e) => e.preventDefault()} onDrop={doDrop}>
          {items.map((it, i) => (
            <div key={it.id} draggable onDragStart={(e) => { setDrag(it.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setDrop(null); }} onDragOver={(e) => over(e, i)} className={cn('relative py-1 transition-all duration-200', drag === it.id && 'opacity-40')}>
              {drop?.index === i && <Line d={drop.depth} />}
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card h-12 pr-2 transition-[margin] duration-300 hover:border-champagne" style={{ marginLeft: it.depth * 28 }}>
                <GripVertical size={16} className="ml-2 text-muted cursor-grab shrink-0" />{it.depth > 0 && <CornerDownRight size={14} className="text-muted shrink-0" />}
                <input value={it.label} aria-label="Label" onChange={(e) => setItems(items.map((x) => (x.id === it.id ? { ...x, label: e.target.value } : x)))} className="bg-transparent outline-none w-36 font-medium" />
                <input value={it.url} aria-label="Link" onChange={(e) => setItems(items.map((x) => (x.id === it.id ? { ...x, url: e.target.value } : x)))} className="flex-1 min-w-0 bg-transparent outline-none text-muted text-[13px]" />
                <button aria-label="Remove" onClick={() => { const e = subEnd(i); setItems([...items.slice(0, i), ...items.slice(e)]); toast('Menu item removed', { undo: () => setItems(items) }); }} className="size-8 grid place-items-center rounded-full text-muted hover:text-bad hover:bg-stone"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {drop?.index === items.length && <div className="relative h-0"><Line d={drop.depth} /></div>}
          <div className="h-6" onDragOver={(e) => { e.preventDefault(); if (drag) setDrop({ index: items.length, depth: 0 }); }} />
        </div>
      </Card>
      <Card className="lg:sticky lg:top-4">
        <CardHeader title="Add a link" />
        <div className="grid gap-3"><Field label="Label" value={label} onChange={(v) => { setLabel(v); setErr(''); }} /><Field label="Link" value={url} onChange={(v) => { setUrl(v); setErr(''); }} error={err} onKeyDown={(e) => e.key === 'Enter' && add()} /><Button icon={Plus} onClick={add}>Add to {menu === 'main' ? 'main' : 'footer'} menu</Button></div>
        <div className="text-[12.5px] text-muted mt-4 flex items-start gap-2"><Megaphone size={14} className="mt-0.5 shrink-0" />Menus can nest up to three levels deep.</div>
      </Card>
      <SaveBar show={J(menus) !== J(saved)} onSave={() => { setSaved(menus); toast('Navigation saved', { star: true }); }} onDiscard={() => setMenus(saved)} />
    </div>
  );
}
void Chip; void Star;
