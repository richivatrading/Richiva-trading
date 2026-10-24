import { useEffect, useState } from 'react';
import { ImagePlus, Plus } from 'lucide-react';
import { Button, Card, Drawer, EmptyState, Field, Label, Switch, stagger } from '../../ui/kit';
import MediaPicker, { LIBRARY } from '../../ui/MediaPicker';
import { useApp } from '../../store';
import { cn } from '../../lib/format';
import { bannersStore, PLACEMENTS, type Banner } from './data';

const blank = { name: '', placement: 'Home hero', image: '', headline: '', link: '/collections/new', start: '2026-10-20', end: '2026-10-31' };
function Frame({ b, className }: { b: typeof blank; className?: string }) {
  const p = PLACEMENTS.find((x) => x.id === b.placement)!;
  return (
    <div className={cn('relative w-full overflow-hidden rounded-xl bg-stone', className)} style={{ aspectRatio: p.ratio, maxHeight: p.ratio < 1.5 ? 320 : undefined, margin: p.ratio < 1.5 ? '0 auto' : undefined, maxWidth: p.ratio < 1.5 ? 320 : undefined }}>
      {b.image ? <img src={b.image} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-muted text-[12px]">No image yet</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      {b.headline && <div className={cn('absolute left-[6%] bottom-[14%] text-white font-title leading-none', p.ratio > 8 ? 'top-1/2 -translate-y-1/2 bottom-auto text-[14px]' : 'text-[26px]')}>{b.headline}</div>}
      <div className="absolute inset-[8%] border border-dashed border-champagne/90 rounded pointer-events-none" />
      <div className="absolute inset-y-0 left-1/3 w-px bg-white/30 pointer-events-none" /><div className="absolute inset-y-0 left-2/3 w-px bg-white/30 pointer-events-none" />
    </div>
  );
}

export default function Banners({ autoCreate }: { autoCreate: boolean }) {
  const { toast } = useApp();
  const [list, setList] = bannersStore.use();
  const [open, setOpen] = useState(autoCreate);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [f, setF] = useState(blank);
  const [pick, setPick] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const openNew = () => { setEditing(null); setF({ ...blank, image: LIBRARY[0].url }); setErr({}); setOpen(true); };
  useEffect(() => { if (autoCreate) openNew(); }, []); // eslint-disable-line
  const openEdit = (b: Banner) => { setEditing(b); setF({ name: b.name, placement: b.placement, image: b.image, headline: b.headline, link: b.link, start: '2026-10-20', end: '2026-10-31' }); setErr({}); setOpen(true); };
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Give the banner a name.';
    if (!f.image) e.image = 'Choose an image from the media library.';
    if (!f.headline.trim()) e.headline = 'Add a headline.';
    if (!/^(\/|https?:\/\/)/.test(f.link)) e.link = 'Start the link with / or https://';
    setErr(e); if (Object.keys(e).length) return;
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const b: Banner = { id: editing?.id ?? `b${Date.now()}`, name: f.name, placement: f.placement, image: f.image, headline: f.headline, link: f.link, start: fmt(f.start), end: fmt(f.end), active: editing?.active ?? true };
    setList((a) => (editing ? a.map((x) => (x.id === b.id ? b : x)) : [b, ...a]));
    setOpen(false); toast(editing ? 'Banner updated' : 'Banner added', { star: true });
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-5"><div className="text-muted">Banners appear on your storefront for the dates you choose.</div><Button icon={Plus} onClick={openNew}>New banner</Button></div>
      {list.length === 0 ? <Card><EmptyState title="No banners yet" body="Add one to welcome customers." /></Card> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map((b, i) => (
            <Card key={b.id} style={stagger(i)} className="!p-4 bg-soft cursor-pointer" onClick={() => openEdit(b)}>
              <Frame b={{ ...blank, ...b }} />
              <div className="flex items-start justify-between mt-4 px-1"><div><div className="font-medium">{b.name}</div><div className="text-muted text-[12px]">{b.placement} · {b.start} to {b.end}</div></div><Switch label={`${b.name} active`} checked={b.active} onChange={(v) => setList((a) => a.map((x) => (x.id === b.id ? { ...x, active: v } : x)))} /></div>
            </Card>
          ))}
        </div>
      )}
      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? 'Edit banner' : 'New banner'} width={620} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save banner</Button></>}>
        <div className="space-y-5">
          <div><Label className="mb-2">Preview and crop guide</Label><div key={f.placement} className="anim-fade-in"><Frame b={f} /></div><div className="text-[12px] text-muted mt-2">Keep key content inside the dashed safe area. Thirds lines help you balance the picture.</div></div>
          <Field label="Banner name" value={f.name} onChange={(v) => set({ name: v })} error={err.name} />
          <div><Label className="mb-2">Placement</Label>
            <div className="grid grid-cols-2 gap-3">{PLACEMENTS.map((p) => (
              <button key={p.id} onClick={() => set({ placement: p.id })} className={cn('rounded-xl border p-3 text-left transition-all duration-200', f.placement === p.id ? 'border-champagne bg-champagne/10' : 'border-line hover:border-champagne')}>
                <div className="h-8 flex items-center"><span className="block bg-line rounded-sm" style={{ width: Math.min(64, 26 * Math.sqrt(p.ratio) + 4), aspectRatio: p.ratio, maxHeight: 32 }} /></div>
                <div className="text-[13px] font-medium mt-1.5">{p.id}</div><div className="text-[11px] text-muted">{p.size}</div></button>))}</div></div>
          <div><Button variant="secondary" icon={ImagePlus} onClick={() => setPick(true)}>{f.image ? 'Change image' : 'Choose from media library'}</Button>{err.image && <div className="text-bad text-[12px] mt-1.5">{err.image}</div>}</div>
          <Field label="Headline" value={f.headline} onChange={(v) => set({ headline: v })} error={err.headline} />
          <Field label="Link" value={f.link} onChange={(v) => set({ link: v })} error={err.link} />
          <div className="grid grid-cols-2 gap-4"><Field label="Shows from" type="date" value={f.start} onChange={(v) => set({ start: v })} /><Field label="Until" type="date" value={f.end} onChange={(v) => set({ end: v })} /></div>
        </div>
      </Drawer>
      <MediaPicker open={pick} multiple={false} onClose={() => setPick(false)} onSelect={(u) => set({ image: u[0] })} />
    </div>
  );
}
