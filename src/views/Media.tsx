"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, FileText, Film, FolderOpen, Grid2x2, Image as ImageIcon, List, Replace, Scissors, Sparkles, Tag, Trash2, Upload, UploadCloud } from 'lucide-react';
import { Button, PageHeader, Card, Checkbox, Chip, DataTable, Drawer, DropdownMenu, EmptyState, ErrorState, Field, Label, Modal, Pill, Progress, SearchInput, Segmented, Select, Skeleton, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp } from '../store';
import { FABRIC_IDS, PHOTO_IDS } from '../data/seed';
import { cn, img, uid } from '../lib/format';

type Kind = 'image' | 'video' | 'document' | 'cutout';
interface Asset { id: string; name: string; kind: Kind; folder: string; url?: string; kb: number; w: number; h: number; alt: string; used: string[]; tags: string[]; added: number }
const FOLDERS = ['Products', 'Banners', 'Try-on cutouts', 'Journal'];
const FILTERS: { id: 'all' | Kind; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'image', label: 'Images' }, { id: 'video', label: 'Videos' }, { id: 'document', label: 'Documents' }, { id: 'cutout', label: 'Try-on cutouts' }];
const PRODS = ['Satin Slip Dress', 'Linen Wrap Blouse', 'Silk Palazzo Pants', 'Himal Kurta Set', 'Embroidered Anarkali', 'Wool Blend Coat'];
const ALT: Record<string, string> = {};
const HEIGHTS = [750, 640, 820, 700, 780, 600, 860, 720, 560, 760, 680, 800, 640, 740];
const fmtSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);

const seed = (): Asset[] => {
  const out: Asset[] = [];
  PHOTO_IDS.forEach((id, i) => {
    const folder = i < 8 ? 'Products' : i < 11 ? 'Banners' : 'Journal';
    const h = HEIGHTS[i];
    const hasAlt = i % 5 === 0 || i === 7;
    out.push({ id: `m${i}`, name: `lookbook-${String(i + 1).padStart(2, '0')}.jpg`, kind: 'image', folder, url: img(id, 600, h), kb: 380 + i * 53, w: 2400, h: Math.round((2400 * h) / 600), alt: hasAlt ? `Richiva ${PRODS[i % 6].toLowerCase()} styled for autumn` : '', used: i < 8 ? [`Product: ${PRODS[i % 6]}`, ...(i < 3 ? ['Home page hero'] : [])] : i < 11 ? ['Banners and announcement'] : [], tags: [], added: 100 - i });
  });
  FABRIC_IDS.forEach((id, i) => out.push({ id: `f${i}`, name: `fabric-swatch-${i + 1}.jpg`, kind: 'image', folder: 'Journal', url: img(id, 600, 450), kb: 240 + i * 31, w: 1800, h: 1350, alt: i < 2 ? '' : `Close up of woven fabric swatch ${i + 1}`, used: i < 2 ? ['Custom builder: Fabrics'] : [], tags: ['fabric'], added: 80 - i }));
  [['autumn-campaign.mp4', 'Banners', 18400], ['atelier-behind-scenes.mp4', 'Journal', 24100], ['dashain-reel.mp4', 'Banners', 9800]].forEach(([n, f, kb], i) => out.push({ id: `v${i}`, name: n as string, kind: 'video', folder: f as string, kb: kb as number, w: 1920, h: 1080, alt: '', used: i === 0 ? ['Home page hero'] : [], tags: [], added: 60 - i }));
  [['size-guide.pdf', 310], ['care-instructions.pdf', 190], ['wholesale-lookbook.pdf', 4200]].forEach(([n, kb], i) => out.push({ id: `d${i}`, name: n as string, kind: 'document', folder: 'Journal', kb: kb as number, w: 0, h: 0, alt: '', used: i === 0 ? ['Policies: Size guide'] : [], tags: [], added: 50 - i }));
  ['satin-dress', 'kurta-set', 'wool-coat', 'blazer'].forEach((n, i) => out.push({ id: `c${i}`, name: `cutout-${n}.png`, kind: 'cutout', folder: 'Try-on cutouts', kb: 520 + i * 40, w: 1600, h: 2000, alt: '', used: ['Try-on'], tags: ['cutout'], added: 40 - i }));
  return out;
};
const needsAlt = (a: Asset) => (a.kind === 'image') && !a.alt;

function Tile({ a, big }: { a: Asset; big?: boolean }) {
  if (a.url) return <img src={a.url} alt={a.alt} loading="lazy" className="w-full h-full object-cover" />;
  const I = a.kind === 'video' ? Film : a.kind === 'document' ? FileText : Scissors;
  return <div className="w-full h-full bg-soft flex flex-col items-center justify-center gap-2 text-muted"><I size={big ? 44 : 30} strokeWidth={1.1} /><span className="label-caps">{a.kind === 'cutout' ? 'Cutout' : a.kind}</span></div>;
}

export default function Media() {
  const { toast, confirm } = useApp();
  const loading = useFakeLoad(600);
  const [assets, setAssets] = useState<Asset[]>(seed);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [folder, setFolder] = useState('All');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sel, setSel] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<{ id: string; name: string; p: number }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagText, setTagText] = useState('');
  const [err, setErr] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const upload = (files: File[]) => {
    if (!files.length) return;
    files.forEach((f, n) => {
      const id = uid('up');
      setUploads((u) => [{ id, name: f.name, p: 0 }, ...u]);
      let p = 0;
      const t = setInterval(() => {
        p = Math.min(100, p + 8 + Math.random() * 14);
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, p } : x)));
        if (p >= 100) {
          clearInterval(t);
          const isImg = f.type.startsWith('image/');
          const k: Kind = isImg ? (folder === 'Try-on cutouts' ? 'cutout' : 'image') : f.type.startsWith('video/') ? 'video' : 'document';
          const url = isImg ? URL.createObjectURL(f) : undefined;
          const a: Asset = { id: uid('m'), name: f.name, kind: k, folder: folder === 'All' ? 'Products' : folder, url, kb: f.size / 1024, w: 1200, h: 1500, alt: '', used: [], tags: [], added: 200 + n };
          if (url) { const im = new Image(); im.onload = () => setAssets((as) => as.map((x) => (x.id === a.id ? { ...x, w: im.naturalWidth, h: im.naturalHeight } : x))); im.src = url; }
          setTimeout(() => { setUploads((u) => u.filter((x) => x.id !== id)); setAssets((as) => [a, ...as]); setFresh((fr) => [...fr, a.id]); }, 350);
        }
      }, 140);
    });
    toast(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}`);
  };

  useEffect(() => {
    const has = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const enter = (e: DragEvent) => { if (has(e)) { depth.current++; setDragging(true); } };
    const leave = (e: DragEvent) => { if (has(e)) { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); } };
    const over = (e: DragEvent) => { if (has(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => { if (has(e)) { e.preventDefault(); depth.current = 0; setDragging(false); upload(Array.from(e.dataTransfer?.files ?? [])); } };
    window.addEventListener('dragenter', enter); window.addEventListener('dragleave', leave); window.addEventListener('dragover', over); window.addEventListener('drop', drop);
    return () => { window.removeEventListener('dragenter', enter); window.removeEventListener('dragleave', leave); window.removeEventListener('dragover', over); window.removeEventListener('drop', drop); };
  });

  const counts = useMemo(() => Object.fromEntries(FOLDERS.map((f) => [f, assets.filter((a) => a.folder === f).length])), [assets]);
  const list = useMemo(() => {
    let r = assets.filter((a) => (folder === 'All' || a.folder === folder) && (kind === 'all' || a.kind === kind) && (!q || (a.name + a.alt + a.tags.join()).toLowerCase().includes(q.toLowerCase())));
    r = [...r].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.kb - a.kb : b.added - a.added));
    return r;
  }, [assets, q, kind, folder, sort]);
  const missing = assets.filter(needsAlt).length;
  const open = assets.find((a) => a.id === openId) ?? null;
  const patch = (id: string, p: Partial<Asset>) => setAssets((as) => as.map((a) => (a.id === id ? { ...a, ...p } : a)));
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const remove = async (ids: string[]) => {
    const rm = assets.filter((a) => ids.includes(a.id));
    const used = rm.filter((a) => a.used.length);
    const body = used.length ? `Still in use: ${used.map((a) => `${a.name} (${a.used.join(', ')})`).join('; ')}. Removing will leave empty spots there.` : 'This cannot be undone from the library after you leave this page.';
    if (!(await confirm({ title: `Delete ${rm.length === 1 ? rm[0].name : rm.length + ' files'}?`, body, confirmLabel: 'Delete', danger: true }))) return false;
    const snapshot = assets;
    setAssets((as) => as.filter((a) => !ids.includes(a.id))); setSel((s) => s.filter((x) => !ids.includes(x))); setOpenId(null);
    toast('Deleted', { body: `${rm.length} file${rm.length > 1 ? 's' : ''} removed`, undo: () => setAssets(snapshot) });
    return true;
  };
  const quickFix = () => {
    const n = missing;
    setAssets((as) => as.map((a) => (needsAlt(a) ? { ...a, alt: ALT[a.id] ?? `Richiva ${a.folder === 'Journal' ? 'fabric and atelier detail' : 'garment'} photo, ${a.name.replace(/\.\w+$/, '').replace(/-/g, ' ')}` } : a)));
    toast('Alt text added', { body: `Suggested text for ${n} images`, star: true });
  };
  const replaceFile = (f?: File) => {
    if (!f || !open) return;
    patch(open.id, { url: f.type.startsWith('image/') ? URL.createObjectURL(f) : open.url, kb: f.size / 1024, name: open.name });
    toast('File replaced', { body: `${open.name} now uses ${f.name}` });
  };

  return (
    <div>
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      <input ref={replaceRef} type="file" className="hidden" onChange={(e) => { replaceFile(e.target.files?.[0]); e.target.value = ''; }} />
      <PageHeader title="Media library" subtitle={`${assets.length} files across ${FOLDERS.length} folders. Drop files anywhere to upload.`} actions={<Button icon={Upload} onClick={() => fileRef.current?.click()}>Upload</Button>} />

      {missing > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-soft px-5 py-3 anim-fade-up">
          <Star size={16} twinkle /><span className="flex-1 min-w-48">{missing === 12 ? 'Add alt text to 12 images to improve search' : `Add alt text to ${missing} images to improve search`}</span>
          <Button size="sm" variant="champagne" icon={Sparkles} onClick={quickFix}>Quick fix</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        <Card pad={false} className="p-3 lg:sticky lg:top-4">
          <Label className="px-3 pt-2 pb-2">Folders</Label>
          {[{ n: 'All', c: assets.length }, ...FOLDERS.map((f) => ({ n: f, c: counts[f] }))].map((f) => (
            <button key={f.n} onClick={() => setFolder(f.n)} className={cn('w-full flex items-center gap-2.5 px-3 h-10 rounded-xl text-[14px] transition-colors duration-200', folder === f.n ? 'bg-soft font-medium' : 'text-muted hover:text-fg hover:bg-soft/70')}>
              <FolderOpen size={16} strokeWidth={1.5} className={folder === f.n ? 'text-champagne' : ''} /><span className="flex-1 text-left">{f.n === 'All' ? 'All files' : f.n}</span><span className="text-[12px] num">{f.c}</span>
            </button>
          ))}
        </Card>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <SearchInput value={q} onChange={setQ} placeholder="Search name, alt text or tag" className="w-full sm:w-64" />
            <div className="flex flex-wrap gap-2">{FILTERS.map((f) => <Chip key={f.id} active={kind === f.id} onClick={() => setKind(f.id)}>{f.label}</Chip>)}</div>
            <div className="flex-1" />
            <Select value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Newest first' }, { value: 'name', label: 'Name A to Z' }, { value: 'size', label: 'Largest first' }]} className="w-44 [&_select]:h-10 [&_select]:rounded-full" />
            <Segmented value={view} onChange={setView} options={[{ value: 'grid', label: <Grid2x2 size={15} /> }, { value: 'list', label: <List size={15} /> }]} />
          </div>

          {uploads.length > 0 && (
            <div className="grid gap-2 mb-5">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center gap-4 bg-card border border-line rounded-xl px-4 py-2.5 anim-fade-up">
                  <UploadCloud size={18} strokeWidth={1.5} className="text-champagne" /><span className="text-[13px] w-48 truncate">{u.name}</span>
                  <Progress value={u.p} className="flex-1" color="var(--champagne)" /><span className="text-[12px] text-muted num w-9 text-right">{Math.round(u.p)}%</span>
                </div>
              ))}
            </div>
          )}

          {err ? <Card><ErrorState onRetry={() => setErr(false)} /></Card> : loading ? (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-4">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="break-inside-avoid mb-4"><Skeleton className="w-full rounded-xl" /></div>)}</div>
          ) : list.length === 0 && !uploads.length ? (
            <Card><EmptyState icon={ImageIcon} title="No files found" body="Try another folder, filter or search." action={<Button variant="secondary" onClick={() => { setQ(''); setKind('all'); setFolder('All'); }}>Clear filters</Button>} /></Card>
          ) : view === 'grid' ? (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-4">
              {list.map((a, i) => {
                const on = sel.includes(a.id);
                return (
                  <div key={a.id} className="break-inside-avoid mb-4 anim-fade-up" style={stagger(Math.min(i, 20), 40)}>
                    <div onClick={() => setOpenId(a.id)} className={cn('group relative rounded-xl overflow-hidden cursor-pointer bg-stone transition-all duration-300', on && 'ring-2 ring-champagne ring-offset-2 ring-offset-page', fresh.includes(a.id) && 'anim-flash')} style={{ aspectRatio: a.url ? `${a.w} / ${a.h}` : '4 / 3' }}>
                      <div className="size-full transition-transform duration-700 group-hover:scale-[1.04]"><Tile a={a} /></div>
                      <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/65 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-[13px] font-medium truncate">{a.name}</div><div className="text-[11.5px] opacity-80">{fmtSize(a.kb)}{a.w ? ` · ${a.w} × ${a.h}` : ''}</div>
                      </div>
                      <div className={cn('absolute top-2.5 left-2.5 transition-opacity duration-200', on ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} onClick={(e) => e.stopPropagation()}><Checkbox checked={on} onChange={() => toggle(a.id)} /></div>
                      {needsAlt(a) && <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-champagne" title="Missing alt text" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card pad={false}>
              <DataTable rows={list} rowId={(a) => a.id} selectable onRowClick={(a) => setOpenId(a.id)} flashIds={fresh}
                columns={[
                  { key: 'n', header: 'File', sort: (a) => a.name, render: (a) => <div className="flex items-center gap-3"><div className="size-11 rounded-lg overflow-hidden shrink-0"><Tile a={a} /></div><div><div className="font-medium">{a.name}</div><div className="text-[12px] text-muted">{a.folder}</div></div></div> },
                  { key: 'k', header: 'Type', hideBelow: 'lg', render: (a) => <Pill>{a.kind === 'cutout' ? 'Try-on cutout' : a.kind}</Pill> },
                  { key: 's', header: 'Size', sort: (a) => a.kb, align: 'right', render: (a) => <span className="num">{fmtSize(a.kb)}</span> },
                  { key: 'd', header: 'Dimensions', hideBelow: 'xl', render: (a) => <span className="num text-muted">{a.w ? `${a.w} × ${a.h}` : '—'}</span> },
                  { key: 'a', header: 'Alt text', hideBelow: 'lg', render: (a) => (needsAlt(a) ? <Pill tone="warning">Missing</Pill> : <span className="text-muted">{a.alt ? 'Added' : '—'}</span>) },
                ]}
                bulk={(ids, clear) => <><Button size="sm" variant="ghost" icon={Trash2} onClick={async () => { if (await remove(ids)) clear(); }}>Delete</Button></>} />
            </Card>
          )}
        </div>
      </div>

      {sel.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[94vw]">
          <div className="bg-ink text-inkfg rounded-full pl-5 pr-2 py-2 flex items-center gap-1 shadow-[var(--shadow-lg)] anim-slide-up [&_button]:text-inkfg">
            <span className="text-[13px] font-medium pr-3 whitespace-nowrap">{sel.length} selected</span>
            <DropdownMenu align="left" width={200} trigger={<Button size="sm" variant="ghost" icon={FolderOpen} className="hover:bg-white/15">Move</Button>} items={FOLDERS.map((f) => ({ label: f, onClick: () => { setAssets((as) => as.map((a) => (sel.includes(a.id) ? { ...a, folder: f } : a))); toast(`Moved to ${f}`, { body: `${sel.length} files` }); setSel([]); } }))} />
            <Button size="sm" variant="ghost" icon={Tag} className="hover:bg-white/15" onClick={() => setTagOpen(true)}>Tag</Button>
            <Button size="sm" variant="ghost" icon={Trash2} className="hover:bg-white/15" onClick={() => remove(sel)}>Delete</Button>
            <button onClick={() => setSel([])} className="h-8 px-3 rounded-full text-[13px] hover:bg-white/15">Clear</button>
          </div>
        </div>
      )}

      <Modal open={tagOpen} onClose={() => setTagOpen(false)} size="sm" title="Tag files" footer={<><Button variant="secondary" onClick={() => setTagOpen(false)}>Cancel</Button><Button disabled={!tagText.trim()} onClick={() => { const t = tagText.trim().toLowerCase(); setAssets((as) => as.map((a) => (sel.includes(a.id) && !a.tags.includes(t) ? { ...a, tags: [...a.tags, t] } : a))); toast('Tag added', { body: `"${t}" on ${sel.length} files` }); setTagText(''); setTagOpen(false); setSel([]); }}>Add tag</Button></>}>
        <Field label="Tag name" value={tagText} onChange={setTagText} hint={`Applied to ${sel.length} selected files`} autoFocus />
      </Modal>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title="File details" subtitle={open?.folder} width={480}
        footer={open && <><Button variant="danger" icon={Trash2} onClick={() => remove([open.id])}>Delete</Button><Button variant="secondary" icon={Check} onClick={() => setOpenId(null)}>Done</Button></>}>
        {open && (
          <div className="grid gap-5">
            <div className="rounded-xl overflow-hidden bg-stone max-h-[420px] flex items-center justify-center anim-pop">
              {open.url ? <img src={open.url} alt={open.alt} className="max-h-[420px] w-full object-contain" /> : <div className="w-full aspect-[4/3]"><Tile a={open} big /></div>}
            </div>
            <Field label="Name" value={open.name} onChange={(v) => patch(open.id, { name: v })} error={open.name.trim() ? undefined : 'Name cannot be empty'} />
            {open.kind !== 'document' && open.kind !== 'video' && <Field label="Alt text" multiline rows={2} value={open.alt} onChange={(v) => patch(open.id, { alt: v })} hint="Describe the image for screen readers and search." />}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="rounded-xl bg-soft p-3"><Label>Size</Label><div className="mt-1 num">{fmtSize(open.kb)}</div></div>
              <div className="rounded-xl bg-soft p-3"><Label>Dimensions</Label><div className="mt-1 num">{open.w ? `${open.w} × ${open.h}` : 'Not applicable'}</div></div>
            </div>
            {open.tags.length > 0 && <div className="flex gap-1.5 flex-wrap">{open.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>}
            <div>
              <Label className="mb-2">Used in</Label>
              {open.used.length ? <ul className="grid gap-1.5">{open.used.map((u) => <li key={u} className="text-[14px] flex items-center gap-2"><span className="size-1.5 rounded-full bg-champagne" />{u}</li>)}</ul> : <div className="text-muted text-[13px]">Not used anywhere yet.</div>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" icon={Copy} onClick={() => { const l = open.url?.startsWith('http') ? open.url : `https://cdn.richiva.com/media/${open.name}`; navigator.clipboard?.writeText(l); toast('Link copied', { body: l }); }}>Copy link</Button>
              <Button variant="secondary" size="sm" icon={Replace} onClick={() => replaceRef.current?.click()}>Replace file</Button>
            </div>
          </div>
        )}
      </Drawer>

      {dragging && (
        <div className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm flex items-center justify-center p-10 anim-fade-in pointer-events-none">
          <div className="w-full h-full max-w-3xl max-h-[60vh] rounded-3xl border-2 border-dashed border-champagne bg-card/90 flex flex-col items-center justify-center gap-3 anim-pop">
            <UploadCloud size={48} strokeWidth={1.1} className="text-champagne" /><div className="font-title text-[32px]">Drop to upload</div><div className="text-muted">Files will be added to {folder === 'All' ? 'Products' : folder}</div>
          </div>
        </div>
      )}
    </div>
  );
}

