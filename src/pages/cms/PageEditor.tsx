import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, CalendarClock, Check, Copy, GripVertical, History, Image as ImageIcon, Monitor, MousePointerClick, Redo2, Smartphone, Tablet, Trash2, Undo2, Eye, X, Plus, Wand2 } from 'lucide-react';
import { Button, Drawer, EmptyState, Field, IconButton, Label, Modal, Pill, Progress, Ring, Segmented, StatusPill } from '../../ui/kit';
import MediaPicker from '../../ui/MediaPicker';
import { useApp } from '../../store';
import { cn } from '../../lib/format';
import { BG, BlockView, LIB, StoreFooter, StoreHeader, hasImage, labelOf, makeBlock, type BType, type Bg, type Block } from './blocks';

export interface Version { id: string; label: string; time: string; by: string; blocks: Block[] }
export interface CmsPage { id: string; title: string; url: string; status: 'Published' | 'Draft' | 'Scheduled'; by: string; date: string; seoTitle: string; seoDesc: string; blocks: Block[]; versions: Version[] }

const DEV = { desktop: 1040, tablet: 768, mobile: 390 } as const;
type Dev = keyof typeof DEV;
type Hist = { past: Block[][]; present: Block[]; future: Block[][] };
const SW: { id: Bg; label: string }[] = [{ id: 'ivory', label: 'Ivory' }, { id: 'ink', label: 'Ink' }, { id: 'champagne', label: 'Champagne' }, { id: 'sage', label: 'Sage' }];
const validLink = (l: string) => !l || l.startsWith('/') || /^https?:\/\//.test(l);

export default function PageEditor({ page, onExit }: { page: CmsPage; onExit: (p: CmsPage) => void }) {
  const { toast } = useApp();
  const [h, setH] = useState<Hist>({ past: [], present: page.blocks, future: [] });
  const [meta, setMeta] = useState({ title: page.title, url: page.url, seoTitle: page.seoTitle, seoDesc: page.seoDesc });
  const [status, setStatus] = useState(page.status);
  const [versions, setVersions] = useState(page.versions);
  const [sel, setSel] = useState<string | null>(null);
  const [dev, setDev] = useState<Dev>('desktop');
  const [dirty, setDirty] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [hist, setHist] = useState(false);
  const [pub, setPub] = useState(false);
  const [sched, setSched] = useState(false);
  const [schedAt, setSchedAt] = useState({ date: '2026-10-24', time: '09:00' });
  const [prog, setProg] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const last = useRef({ key: '', t: 0 });
  const blocks = h.present;
  const selected = blocks.find((b) => b.id === sel) ?? null;

  const commit = (next: Block[], key?: string) => {
    const now = Date.now(); const co = !!key && last.current.key === key && now - last.current.t < 900;
    last.current = { key: key ?? '', t: now };
    setH((s) => ({ past: co ? s.past : [...s.past, s.present].slice(-60), present: next, future: [] })); setDirty(true);
  };
  const undo = () => { last.current = { key: '', t: 0 }; setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s)); setDirty(true); };
  const redo = () => { last.current = { key: '', t: 0 }; setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)); setDirty(true); };
  const upd = (id: string, p: Partial<Block>, key?: string) => commit(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)), key ? `${id}:${key}` : undefined);
  const insert = (b: Block, at: number) => { const n = [...blocks]; n.splice(at, 0, b); commit(n); setSel(b.id); setFresh(b.id); };
  const move = (id: string, to: number) => { const from = blocks.findIndex((b) => b.id === id); if (from < 0) return; const n = [...blocks]; const [m] = n.splice(from, 1); n.splice(to > from ? to - 1 : to, 0, m); commit(n); setFresh(id); };
  const del = (id: string) => { commit(blocks.filter((b) => b.id !== id)); setSel(null); toast('Block deleted', { undo }); };
  const dup = (id: string) => { const i = blocks.findIndex((b) => b.id === id); insert({ ...blocks[i], id: makeBlock('text').id }, i + 1); };
  const shift = (id: string, d: number) => { const i = blocks.findIndex((b) => b.id === id); const j = i + d; if (j < 0 || j >= blocks.length) return; const n = [...blocks]; [n[i], n[j]] = [n[j], n[i]]; commit(n); setFresh(id); };

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) del(sel);
    };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  });

  /* quality */
  const noAlt = blocks.filter((b) => hasImage(b) && b.image && !b.alt.trim());
  const badLinks = blocks.filter((b) => !validLink(b.link));
  const checks = [
    { id: 'title', label: 'Page title added', ok: !!meta.title.trim(), req: true },
    { id: 'seo', label: 'SEO title and description (50+ characters)', ok: !!meta.seoTitle.trim() && meta.seoDesc.trim().length >= 50, req: true },
    { id: 'alt', label: noAlt.length ? `Alt text on every image (${noAlt.length} missing)` : 'Alt text on every image', ok: noAlt.length === 0, req: true },
    { id: 'links', label: 'All links are valid', ok: badLinks.length === 0, req: false },
    { id: 'blocks', label: 'At least 3 content blocks', ok: blocks.length >= 3, req: false },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const canPublish = checks.filter((c) => c.req).every((c) => c.ok);
  const autoFix = () => {
    setMeta((m) => ({ ...m, seoTitle: m.seoTitle.trim() || `${m.title} | Richiva`, seoDesc: m.seoDesc.trim().length >= 50 ? m.seoDesc : `${m.title}: handmade fashion from Richiva, designed and stitched in Nepal. Cash on delivery available.` }));
    if (noAlt.length) commit(blocks.map((b) => (hasImage(b) && b.image && !b.alt.trim() ? { ...b, alt: b.heading || labelOf(b.type) } : b)));
    setDirty(true); toast('Fixed for you', { body: 'SEO text and alt text filled in', star: true });
  };

  const snapshot = (label: string) => setVersions((v) => [{ id: `v${Date.now()}`, label, time: 'Just now', by: 'Anita Shrestha', blocks }, ...v]);
  const saveDraft = () => { snapshot('Draft saved'); setDirty(false); toast('Draft saved', { body: meta.title }); };
  const startPublish = () => {
    setProg(0); let p = 0;
    const t = setInterval(() => {
      p += 6 + Math.random() * 10;
      if (p >= 100) { clearInterval(t); setProg(100); setTimeout(() => { setStatus('Published'); snapshot('Published'); setDirty(false); setPub(false); setProg(null); toast('Page published', { body: `richiva.com${meta.url}`, star: true }); }, 450); } else setProg(p);
    }, 120);
  };
  const exit = () => onExit({ ...page, ...meta, status, blocks, versions, by: dirty ? 'Anita Shrestha' : page.by, date: dirty ? '18 Oct 2026' : page.date });

  /* DnD */
  const overBlock = (e: React.DragEvent, i: number) => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setDropIdx(e.clientY > r.top + r.height / 2 ? i + 1 : i); };
  const drop = (e: React.DragEvent) => {
    e.preventDefault(); const at = dropIdx ?? blocks.length; setDropIdx(null); setDragging(false);
    const t = e.dataTransfer.getData('text/block') as BType, mv = e.dataTransfer.getData('text/move');
    if (t) insert(makeBlock(t), at); else if (mv) move(mv, at);
  };
  const DropLine = () => <div className="absolute inset-x-0 -top-0.5 z-20 h-1 bg-champagne rounded-full pointer-events-none shadow-[0_0_0_3px_color-mix(in_srgb,var(--champagne)_30%,transparent)] anim-fade-in"><span className="absolute left-1/2 -translate-x-1/2 -top-3 text-[10px] px-2 py-0.5 rounded-full bg-champagne text-white">Drop here</span></div>;

  const Left = (
    <div className="bg-card border border-line rounded-2xl p-3 lg:sticky lg:top-24 self-start">
      <Label className="px-2 pt-1 pb-2">Blocks</Label>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
        {LIB.map((l) => (
          <div key={l.type} draggable onDragStart={(e) => { e.dataTransfer.setData('text/block', l.type); e.dataTransfer.effectAllowed = 'copy'; setDragging(true); }} onDragEnd={() => { setDragging(false); setDropIdx(null); }}
            onClick={() => insert(makeBlock(l.type), selected ? blocks.findIndex((b) => b.id === sel) + 1 : blocks.length)}
            className="group flex items-center gap-2.5 h-10 px-2.5 rounded-xl text-[13.5px] cursor-grab active:cursor-grabbing hover:bg-soft transition-colors">
            <l.icon size={16} strokeWidth={1.5} className="text-muted group-hover:text-champagne transition-colors" />{l.label}<Plus size={13} className="ml-auto opacity-0 group-hover:opacity-50" />
          </div>
        ))}
      </div>
      <div className="text-[12px] text-muted px-2 pt-3">Drag onto the canvas or click to add.</div>
    </div>
  );

  const fields = selected ? LIB.find((l) => l.type === selected.type)!.fields : [];
  const Right = (
    <div className="bg-card border border-line rounded-2xl p-4 lg:sticky lg:top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
      {selected ? (
        <div key={selected.id} className="grid gap-4 anim-fade-in">
          <div className="flex items-center justify-between"><div><Label>Selected block</Label><div className="font-title text-[22px] leading-tight">{labelOf(selected.type)}</div></div><IconButton icon={X} label="Deselect" onClick={() => setSel(null)} /></div>
          {fields.includes('heading') && <Field label="Heading" value={selected.heading} onChange={(v) => upd(selected.id, { heading: v }, 'heading')} />}
          {fields.includes('text') && <Field label={selected.type === 'marquee' ? 'Scrolling text' : 'Text'} multiline value={selected.text} onChange={(v) => upd(selected.id, { text: v }, 'text')} />}
          {fields.includes('image') && (
            <div className="grid gap-2">
              <Label>Image</Label>
              <div className="relative h-28 rounded-xl overflow-hidden bg-stone">{selected.image ? <img src={selected.image} alt="" className="size-full object-cover" /> : <div className="size-full grid place-items-center text-muted"><ImageIcon size={22} strokeWidth={1.25} /></div>}</div>
              <Button size="sm" variant="secondary" icon={ImageIcon} onClick={() => setPicker(true)}>Choose from media library</Button>
              <Field label="Alt text" value={selected.alt} onChange={(v) => upd(selected.id, { alt: v }, 'alt')} error={selected.image && !selected.alt.trim() ? 'Add a short description' : undefined} />
            </div>
          )}
          {fields.includes('link') && <>
            <Field label="Button label" value={selected.cta} onChange={(v) => upd(selected.id, { cta: v }, 'cta')} />
            <Field label="Link" value={selected.link} onChange={(v) => upd(selected.id, { link: v }, 'link')} error={validLink(selected.link) ? undefined : 'Start with / or https://'} />
          </>}
          <div><Label className="mb-2">Colour</Label>
            <div className="flex gap-3">{SW.map((s) => <button key={s.id} onClick={() => upd(selected.id, { bg: s.id })} title={s.label} className="flex flex-col items-center gap-1 text-[11px] text-muted"><span className={cn('size-8 rounded-full border border-line transition-all', BG[s.id].split(' ')[0], selected.bg === s.id && 'ring-2 ring-champagne ring-offset-2 ring-offset-card')} />{s.label}</button>)}</div></div>
          <div><Label className="mb-2">Spacing</Label><Segmented value={selected.space} onChange={(v) => upd(selected.id, { space: v })} options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]} /></div>
          <MediaPicker open={picker} multiple={false} onClose={() => setPicker(false)} onSelect={(u) => u[0] && upd(selected.id, { image: u[0] })} />
        </div>
      ) : (
        <div className="grid gap-4 anim-fade-in">
          <div><Label>Page settings</Label><div className="text-muted text-[12.5px] mt-1">Select a block on the canvas to edit it.</div></div>
          <Field label="Page title" value={meta.title} onChange={(v) => { setMeta({ ...meta, title: v }); setDirty(true); }} error={meta.title.trim() ? undefined : 'A title is required'} />
          <Field label="URL" prefix="/" value={meta.url.replace(/^\//, '')} onChange={(v) => { setMeta({ ...meta, url: '/' + v.toLowerCase().replace(/[^a-z0-9-/]/g, '-') }); setDirty(true); }} />
          <Field label="SEO title" value={meta.seoTitle} onChange={(v) => { setMeta({ ...meta, seoTitle: v }); setDirty(true); }} hint={`${meta.seoTitle.length}/60`} />
          <Field label="SEO description" multiline value={meta.seoDesc} onChange={(v) => { setMeta({ ...meta, seoDesc: v }); setDirty(true); }} hint={`${meta.seoDesc.length}/160`} />
        </div>
      )}
    </div>
  );

  return (
    <div className="anim-fade-in">
      <style>{'@keyframes cms-settle{0%{opacity:0;transform:translateY(-22px) scale(.97)}55%{opacity:1;transform:translateY(4px) scale(1.004)}100%{transform:none}}'}</style>
      <div className="sticky top-0 z-30 -mx-1 px-1 pb-3 pt-1 bg-page/90 backdrop-blur">
        <div className="bg-card border border-line rounded-2xl px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 shadow-[var(--shadow)]">
          <button onClick={exit} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg transition-colors"><ArrowLeft size={15} />Back to pages</button>
          <div className="h-5 w-px bg-line" />
          <div className="font-title text-[22px] leading-none truncate max-w-48">{meta.title || 'Untitled'}</div><StatusPill status={status} />{dirty && <Pill tone="champagne">Unsaved</Pill>}
          <div className="flex-1" />
          <Segmented value={dev} onChange={setDev} options={[{ value: 'desktop', label: <><Monitor size={14} />Desktop</> }, { value: 'tablet', label: <><Tablet size={14} />Tablet</> }, { value: 'mobile', label: <><Smartphone size={14} />Mobile</> }]} />
          <div className="flex items-center"><IconButton icon={Undo2} label="Undo" disabled={!h.past.length} onClick={undo} className="disabled:opacity-30" /><IconButton icon={Redo2} label="Redo" disabled={!h.future.length} onClick={redo} className="disabled:opacity-30" /></div>
          <div title="Page quality"><Ring value={score} size={40} stroke={4} color={score === 100 ? 'var(--sage)' : 'var(--champagne)'}>{score}</Ring></div>
          <IconButton icon={History} label="Version history" onClick={() => setHist(true)} />
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => { setPreviewing(!previewing); setSel(null); }}>{previewing ? 'Exit preview' : 'Preview'}</Button>
          <Button size="sm" variant="secondary" onClick={saveDraft}>Save draft</Button>
          <Button size="sm" variant="secondary" icon={CalendarClock} onClick={() => setSched(true)}>Schedule</Button>
          <Button size="sm" onClick={() => { setPub(true); setProg(null); }}>Publish</Button>
        </div>
      </div>

      <div className={cn('grid gap-4 items-start', previewing ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_300px]')}>
        {!previewing && Left}
        <div className="rounded-2xl bg-stone/70 border border-line p-4 @container overflow-x-auto min-h-[70vh]" onClick={() => setSel(null)}>
          <div className="mx-auto bg-card rounded-xl shadow-[var(--shadow-lg)] overflow-hidden @container" style={{ width: DEV[dev], maxWidth: '100%', transition: 'width 520ms var(--ease)' }}>
            <StoreHeader />
            <div onDragOver={(e) => { if (dragging) { e.preventDefault(); setDropIdx(blocks.length); } }} onDrop={drop} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropIdx(null); }} className="relative min-h-40">
              {blocks.length === 0 && <div className={cn('m-6 rounded-xl border-2 border-dashed grid place-items-center transition-colors', dropIdx !== null ? 'border-champagne bg-champagne/10' : 'border-line')}><EmptyState icon={MousePointerClick} title="Drop a block here" body="Drag from the library on the left, or click a block to add it." /></div>}
              {blocks.map((b, i) => (
                <div key={b.id} onDragOver={(e) => dragging && overBlock(e, i)} onClick={(e) => { e.stopPropagation(); !previewing && setSel(b.id); }}
                  className={cn('relative group/blk transition-shadow', !previewing && 'cursor-pointer hover:shadow-[inset_0_0_0_1px_var(--line)]', sel === b.id && !previewing && 'shadow-[inset_0_0_0_2px_var(--champagne)] z-10')}
                  style={fresh === b.id ? { animation: 'cms-settle 650ms var(--ease) both' } : undefined} onAnimationEnd={() => fresh === b.id && setFresh(null)}>
                  {dragging && dropIdx === i && <DropLine />}
                  <BlockView b={b} />
                  {sel === b.id && !previewing && (
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-0.5 bg-ink text-inkfg rounded-full p-1 shadow-[var(--shadow-lg)] anim-pop" onClick={(e) => e.stopPropagation()}>
                      <span draggable onDragStart={(e) => { e.dataTransfer.setData('text/move', b.id); e.dataTransfer.effectAllowed = 'move'; setDragging(true); }} onDragEnd={() => { setDragging(false); setDropIdx(null); }} title="Drag to move" className="size-8 grid place-items-center cursor-grab rounded-full hover:bg-white/15"><GripVertical size={15} /></span>
                      {[{ i: ArrowUp, l: 'Move up', f: () => shift(b.id, -1) }, { i: ArrowDown, l: 'Move down', f: () => shift(b.id, 1) }, { i: Copy, l: 'Duplicate', f: () => dup(b.id) }, { i: Trash2, l: 'Delete', f: () => del(b.id) }].map((a) => <button key={a.l} title={a.l} aria-label={a.l} onClick={a.f} className="size-8 grid place-items-center rounded-full hover:bg-white/15"><a.i size={15} strokeWidth={1.5} /></button>)}
                    </div>
                  )}
                </div>
              ))}
              {dragging && dropIdx === blocks.length && blocks.length > 0 && <div className="relative h-0"><DropLine /></div>}
              {dragging && blocks.length > 0 && <div className="h-10" onDragOver={(e) => { e.preventDefault(); setDropIdx(blocks.length); }} />}
            </div>
            <StoreFooter />
          </div>
        </div>
        {!previewing && Right}
      </div>

      <Drawer open={hist} onClose={() => setHist(false)} title="Version history" subtitle="Restore an earlier version of this page" width={440}>
        <div className="grid gap-3">
          {versions.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-line p-4 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex-1"><div className="font-medium">{v.label}</div><div className="text-[12.5px] text-muted">{v.time} by {v.by} · {v.blocks.length} blocks</div></div>
              {i === 0 ? <Pill tone="sage">Current</Pill> : <Button size="sm" variant="secondary" onClick={() => { commit(v.blocks); setSel(null); setHist(false); toast('Version restored', { body: v.label, undo }); }}>Restore</Button>}
            </div>
          ))}
        </div>
      </Drawer>

      <Modal open={pub} onClose={() => prog === null && setPub(false)} title="Ready to publish?" footer={<><Button variant="secondary" disabled={prog !== null} onClick={() => setPub(false)}>Cancel</Button><Button disabled={!canPublish || prog !== null} onClick={startPublish}>Publish page</Button></>}>
        <div className="flex items-center gap-4 mb-4"><Ring value={score} size={56} color={score === 100 ? 'var(--sage)' : 'var(--champagne)'} /><div><div className="font-medium">Page quality</div><div className="text-muted text-[13px]">{checks.filter((c) => c.ok).length} of {checks.length} checks passed</div></div></div>
        <div className="grid gap-1.5">
          {checks.map((c) => <div key={c.id} className="flex items-center gap-3 text-[14px] py-1.5"><span className={cn('size-5 rounded-full grid place-items-center transition-colors duration-500', c.ok ? 'bg-sage text-white' : 'bg-stone text-muted')}>{c.ok ? <Check size={12} strokeWidth={2.5} /> : <X size={11} />}</span><span className={c.ok ? '' : 'text-muted'}>{c.label}</span>{!c.req && !c.ok && <Pill>Optional</Pill>}</div>)}
        </div>
        {!canPublish && <Button className="mt-4" variant="champagne" size="sm" icon={Wand2} onClick={autoFix}>Fix required items for me</Button>}
        {prog !== null && <div className="mt-5 anim-fade-in"><div className="flex justify-between text-[12px] text-muted mb-1.5"><span>{prog >= 100 ? 'Live' : 'Publishing to richiva.com'}</span><span className="num">{Math.round(prog)}%</span></div><Progress value={prog} color="var(--champagne)" className="[&>div]:!transition-[width] [&>div]:!duration-150" /></div>}
      </Modal>

      <Modal open={sched} onClose={() => setSched(false)} size="sm" title="Schedule page" footer={<><Button variant="secondary" onClick={() => setSched(false)}>Cancel</Button><Button disabled={!schedAt.date || !checks[0].ok} onClick={() => { setStatus('Scheduled'); snapshot(`Scheduled for ${schedAt.date}`); setSched(false); setDirty(false); toast('Page scheduled', { body: `Goes live ${schedAt.date} at ${schedAt.time}` }); }}>Schedule</Button></>}>
        <div className="grid grid-cols-2 gap-3"><Field label="Date" type="date" value={schedAt.date} onChange={(v) => setSchedAt({ ...schedAt, date: v })} error={schedAt.date ? undefined : 'Pick a date'} /><Field label="Time" type="time" value={schedAt.time} onChange={(v) => setSchedAt({ ...schedAt, time: v })} /></div>
      </Modal>
    </div>
  );
}

export const seedBlocks = (types: BType[]) => types.map(makeBlock);
