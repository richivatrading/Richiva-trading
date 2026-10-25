"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Check, Copy, History, MoreHorizontal, RotateCcw, X } from 'lucide-react';
import { Button, Drawer, DropdownMenu, EmptyState, IconButton, Modal, PageHeader, Progress, StatusPill, Timeline } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { navigate, useApp } from '../../store';
import { productsStore, type ProductStatus } from '../../data/seed';
import { cn } from '../../lib/format';
import { addProducts } from './shared';
import { completeness, draftToProduct, getVersions, loadDraft, pushVersion, type Draft } from './editorModel';
import { Basics, Inventory, MadeToOrder, Media, Pricing, Seo, Variants } from './EditorCards';
import Side from './EditorSide';

/* leaving-the-page guard, survives the editor unmounting */
type Confirm = (o: { title: string; body?: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;

export default function ProductEditor({ id }: { id: string }) {
  const [products] = productsStore.use();
  if (id !== 'new' && !products.find((p) => p.id === id)) return <EmptyState title="Product not found" body="It may have been deleted." action={<Button onClick={() => navigate('/products')}>Back to products</Button>} />;
  return <Editor id={id} />;
}

function Editor({ id }: { id: string }) {
  const { confirm, toast } = useApp();
  const [products, setProducts] = productsStore.use();
  const isNew = id === 'new';
  const existing = products.find((p) => p.id === id);
  const [d, setD] = useState<Draft>(() => loadDraft(existing, products.length));
  const snap = useRef(JSON.stringify(d));
  const dirty = JSON.stringify(d) !== snap.current;
  const [showErr, setShowErr] = useState(false);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [hist, setHist] = useState(false);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const comp = useMemo(() => completeness(d), [d]);
  const vkey = isNew ? 'new' : id;

  const guard = useRef({ dirty: false, last: '', confirm: null as Confirm | null });

  useEffect(() => {
    const handler = (e: HashChangeEvent) => {
      if (!guard.current.dirty || !guard.current.confirm) { guard.current.last = window.location.hash; return; }
      const target = window.location.hash;
      history.replaceState(null, '', guard.current.last || '#/products');
      e.stopImmediatePropagation();
      guard.current.confirm({ title: 'Leave without saving?', body: 'You have unsaved changes on this product. If you leave now they will be lost.', confirmLabel: 'Leave page', danger: true }).then((ok) => {
        if (ok) { guard.current.dirty = false; window.location.hash = target; }
      });
    };
    window.addEventListener('hashchange', handler, true);
    return () => window.removeEventListener('hashchange', handler, true);
  }, []);

  guard.current.confirm = confirm;

  const persist = (status: ProductStatus, label: string) => {
    const nd = { ...d, status };
    const newId = isNew ? `p${Math.max(...products.map((p) => Number(p.id.slice(1)))) + 1}` : id;
    const prod = draftToProduct(nd, status, existing, newId);
    if (isNew) addProducts([prod]); else setProducts((a) => a.map((p) => (p.id === id ? prod : p)));
    pushVersion(vkey, nd, label);
    setD(nd); snap.current = JSON.stringify(nd); guard.current.dirty = false;
    if (isNew) navigate(`/products/edit/${newId}`);
  };
  const saveDraft = () => { persist(d.status === 'Published' ? 'Draft' : d.status, 'Saved draft'); toast('Draft saved', { body: d.title || 'Untitled product' }); };
  const publish = () => {
    setShowErr(true);
    const m = [!d.title.trim() && 'A product title', d.images.length === 0 && 'At least one image', !(Number(d.price) > 0) && 'A price greater than zero'].filter(Boolean) as string[];
    if (m.length) return setMissing(m);
    const st: ProductStatus = d.status === 'Scheduled' ? 'Scheduled' : 'Published';
    persist(st, st === 'Scheduled' ? 'Scheduled' : 'Published'); toast(st === 'Scheduled' ? 'Product scheduled' : 'Product published', { body: d.title, star: true });
  };
  const discard = async () => {
    if (!dirty) return navigate('/products');
    if (await confirm({ title: 'Discard your changes?', body: 'Everything you changed since the last save will be lost.', confirmLabel: 'Discard', danger: true })) { setD(JSON.parse(snap.current)); setShowErr(false); toast('Changes discarded'); }
  };
  const archive = async () => { if (await confirm({ title: 'Archive this product?', body: 'It will be hidden from your store but kept in your catalogue.', confirmLabel: 'Archive' })) { persist('Archived', 'Archived'); toast('Product archived'); } };
  const duplicate = () => {
    if (isNew) return toast('Save the product first, then duplicate it');
    const n = Math.max(...products.map((p) => Number(p.id.slice(1)))) + 1;
    addProducts([{ ...draftToProduct(d, 'Draft', existing, `p${n}`), name: `${d.title} (copy)`, sku: `RV-${1000 + products.length}` }]);
    toast('Duplicated as draft'); guard.current.dirty = false; snap.current = JSON.stringify(d); navigate(`/products/edit/p${n}`);
  };
  const versions = getVersions(vkey, d);
  const restore = async (i: number) => {
    if (await confirm({ title: 'Restore this version?', body: 'The editor will show that version. You can still discard it before saving.', confirmLabel: 'Restore' })) { setD({ ...versions[i].snap }); setHist(false); toast('Version restored', { body: 'Review and save to keep it' }); }
  };

  return (
    <div className="anim-fade-in">
      <nav className="text-[13px] text-muted mb-3 flex items-center gap-2 anim-fade-up">
        <button onClick={() => navigate('/products')} className="hover:text-fg underline-offset-4 hover:underline">Products</button><span>/</span><span className="text-fg truncate">{d.title || 'New product'}</span>
      </nav>
      <PageHeader title={d.title || 'New product'} badge={<StatusPill status={d.status} />}
        actions={<DropdownMenu trigger={<IconButton icon={MoreHorizontal} label="More actions" className="border border-line" />} width={200} items={[
          { label: 'Duplicate', icon: Copy, onClick: duplicate }, { label: 'Archive', icon: Archive, onClick: archive, divider: false }, { label: 'Version history', icon: History, onClick: () => setHist(true) }]} />} />
      <div className="mb-6 -mt-2 anim-fade-up">
        <div className="flex items-center justify-between text-[12px] mb-1.5"><span className="text-muted num">{comp.pct} percent complete</span>{comp.pct < 100 && <span className="text-muted hidden sm:inline">Next: {comp.items.find((i) => !i.done)?.label}</span>}</div>
        <Progress value={comp.pct} className="h-[3px]" color="var(--champagne)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Basics d={d} set={set} showErr={showErr} /><Media d={d} set={set} showErr={showErr} /><Variants d={d} set={set} />
          <Pricing d={d} set={set} showErr={showErr} /><Inventory d={d} set={set} /><MadeToOrder d={d} set={set} /><Seo d={d} set={set} />
        </div>
        <Side d={d} set={set} />
      </div>

      <div className="sticky bottom-4 z-30 mt-8">
        <div className="mx-auto max-w-3xl bg-card border border-line rounded-full shadow-[var(--shadow-lg)] pl-6 pr-2 py-2 flex items-center justify-between gap-3">
          <span className="text-[13px] flex items-center gap-2 text-muted"><span className={cn('size-2 rounded-full', dirty ? 'bg-champagne pulse-dot text-champagne' : 'bg-ok')} />{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <div className="flex gap-2"><Button variant="ghost" onClick={discard}>Discard</Button><Button variant="secondary" onClick={saveDraft}>Save draft</Button><Button onClick={publish}>Publish</Button></div>
        </div>
      </div>

      <Modal open={!!missing} onClose={() => setMissing(null)} size="sm" title="Almost ready to publish" footer={<Button onClick={() => setMissing(null)}>Got it</Button>}>
        <div className="text-muted text-[14px] mb-4">Please add the following before publishing.</div>
        <ul className="space-y-2.5">{missing?.map((m) => <li key={m} className="flex items-center gap-3 anim-slide-in"><span className="size-6 rounded-full bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-bad flex items-center justify-center"><X size={13} /></span>{m}</li>)}</ul>
      </Modal>

      <Drawer open={hist} onClose={() => setHist(false)} title="Version history" subtitle="Restore any earlier save" width={460}>
        <Timeline items={versions.map((v, i) => ({ title: <div className="flex items-center justify-between gap-3"><div><div className="font-medium flex items-center gap-2">{v.label}{i === 0 && <Star size={12} />}</div><div className="text-muted text-[12px]">{v.time} · {v.by}</div></div>{i === 0 ? <span className="text-[12px] text-muted flex items-center gap-1"><Check size={13} />Current</span> : <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => restore(i)}>Restore</Button>}</div> }))} />
      </Drawer>
    </div>
  );
}
