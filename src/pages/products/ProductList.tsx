import { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowUpRight, ChevronDown, Copy, Eye, EyeOff, FolderPlus, LayoutGrid, MoreHorizontal, Pencil, Percent, Rows3, Tag, Trash2 } from 'lucide-react';
import { Button, Card, Chip, DataTable, Drawer, DropdownMenu, EmptyState, ErrorState, Field, IconButton, Lightbox, Modal, Pill, SearchInput, Segmented, Skeleton, StatusPill, stagger, useFakeLoad, type Col } from '../../ui/kit';
import { navigate, useApp, useRoute } from '../../store';
import { logAudit, productsStore, type Product, type ProductStatus } from '../../data/seed';
import { cn, rs } from '../../lib/format';
import { CATEGORIES, TODAY, collectionsStore, filterStore, inCollection, isLow, prodImg, stockTone } from './shared';

const STATUSES: ProductStatus[] = ['Published', 'Draft', 'Scheduled', 'Archived'];
const ALL = 'All';

function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const on = value !== ALL;
  return (
    <DropdownMenu align="left" width={210} trigger={<Chip active={on} onRemove={on ? () => onChange(ALL) : undefined}>{on ? `${label}: ${value}` : label}{!on && <ChevronDown size={13} />}</Chip>}
      items={[ALL, ...options].map((o) => ({ label: o === ALL ? `All ${label.toLowerCase()}` : o, active: value === o, onClick: () => onChange(o) }))} />
  );
}

const priceCell = (p: Product) => p.salePrice ? <div className="num"><span className="font-medium">{rs(p.salePrice)}</span> <span className="text-muted line-through text-[12px] ml-1">{rs(p.price)}</span></div> : <span className="num">{rs(p.price)}</span>;
const MtoTag = () => <span className="inline-flex items-center h-5 px-2 rounded-full border border-line text-[11px] text-muted whitespace-nowrap">Made to order</span>;

export default function ProductList() {
  const route = useRoute();
  const { confirm, toast } = useApp();
  const [products, setProducts] = productsStore.use();
  const [collections] = collectionsStore.use();
  const loading = useFakeLoad(600);
  const [failed, setFailed] = useState(route.query.error === '1');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [stock, setStock] = useState(route.query.filter === 'low' ? 'Low stock' : ALL);
  const [mto, setMto] = useState(ALL);
  const [coll, setColl] = useState(ALL);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [open, setOpen] = useState<string | null>(null);
  const [gi, setGi] = useState(0);
  const [light, setLight] = useState<string | null>(null);
  const [pick, setPick] = useState<null | { kind: 'category' | 'collection'; ids: string[]; clear: () => void }>(null);
  const [price, setPrice] = useState<null | { ids: string[]; clear: () => void }>(null);
  const [pct, setPct] = useState('-10');

  useEffect(() => { if (route.query.filter === 'low') setStock('Low stock'); }, [route.query.filter]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const col = collections.find((c) => c.name === coll);
    return products.filter((p) =>
      (!t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t) || p.category.toLowerCase().includes(t)) &&
      (cat === ALL || p.category === cat) && (status === ALL || p.status === status) &&
      (stock === ALL || (stock === 'Low stock' ? isLow(p) : stock === 'Out of stock' ? p.stock === 0 : p.stock > 0 && !isLow(p))) &&
      (mto === ALL || (mto === 'Made to order' ? p.mto : !p.mto)) && (coll === ALL || (col ? inCollection(col, p) : false)));
  }, [products, q, cat, status, stock, mto, coll, collections]);

  useEffect(() => { const active = [cat, status, stock, mto, coll].filter((x) => x !== ALL).length + (q ? 1 : 0); filterStore.set({ ids: list.map((p) => p.id), label: active ? 'Current filter' : 'All products' }); }, [list, cat, status, stock, mto, coll, q]);
  const anyFilter = q || [cat, status, stock, mto, coll].some((x) => x !== ALL);
  const clearAll = () => { setQ(''); setCat(ALL); setStatus(ALL); setStock(ALL); setMto(ALL); setColl(ALL); };

  const patch = (ids: string[], f: (p: Product) => Product) => setProducts((a) => a.map((p) => (ids.includes(p.id) ? { ...f(p), updated: TODAY } : p)));
  const setSt = (ids: string[], s: ProductStatus, clear?: () => void) => { patch(ids, (p) => ({ ...p, status: s })); clear?.(); toast(`${ids.length} ${ids.length === 1 ? 'product' : 'products'} ${s === 'Published' ? 'published' : s === 'Draft' ? 'moved to draft' : 'archived'}`); };
  const remove = async (ids: string[], clear?: () => void) => {
    if (!(await confirm({ title: `Delete ${ids.length} ${ids.length === 1 ? 'product' : 'products'}?`, body: 'They will be removed from your store. You can undo right after.', confirmLabel: 'Delete', danger: true }))) return;
    const gone = productsStore.get().filter((p) => ids.includes(p.id));
    setProducts((a) => a.filter((p) => !ids.includes(p.id))); clear?.(); setOpen(null);
    toast('Deleted', { undo: () => setProducts((a) => [...a, ...gone].sort((x, y) => Number(x.id.slice(1)) - Number(y.id.slice(1)))) });
  };
  const duplicate = (p: Product) => {
    const n = Math.max(...productsStore.get().map((x) => Number(x.id.slice(1)))) + 1;
    setProducts((a) => [{ ...p, id: `p${n}`, name: `${p.name} (copy)`, sku: `RV-${1000 + a.length}`, status: 'Draft', updated: TODAY }, ...a]); toast('Product duplicated', { body: 'Saved as draft' });
  };

  const pctN = Number(pct);
  const pctOk = pct.trim() !== '' && !Number.isNaN(pctN) && pctN !== 0 && pctN >= -90 && pctN <= 200;
  const newPrice = (n: number) => Math.max(100, Math.round(n * (1 + pctN / 100)));
  const priceRows = price ? products.filter((p) => price.ids.includes(p.id)) : [];
  const applyPrice = () => {
    if (!price || !pctOk) return;
    const before = priceRows.reduce((a, p) => a + p.price, 0);
    patch(price.ids, (p) => ({ ...p, price: newPrice(p.price), salePrice: p.salePrice ? newPrice(p.salePrice) : undefined }));
    logAudit({ user: 'Anita Shrestha', module: 'Products', action: `Changed price by ${pctN}%`, item: `${price.ids.length} products`, before: `total: ${rs(before)}`, after: `total: ${rs(priceRows.reduce((a, p) => a + newPrice(p.price), 0))}` });
    toast('Prices updated', { body: `${price.ids.length} products, ${pctN > 0 ? '+' : ''}${pctN}%` }); price.clear(); setPrice(null);
  };

  const menu = (p: Product) => (
    <DropdownMenu trigger={<IconButton icon={MoreHorizontal} label="More" />} width={190} items={[
      { label: 'Edit product', icon: Pencil, onClick: () => navigate(`/products/edit/${p.id}`) },
      { label: 'Duplicate', icon: Copy, onClick: () => duplicate(p) },
      { label: p.status === 'Archived' ? 'Restore to draft' : 'Archive', icon: Archive, onClick: () => setSt([p.id], p.status === 'Archived' ? 'Draft' : 'Archived') },
      { divider: true, label: '' },
      { label: 'Delete', icon: Trash2, danger: true, onClick: () => remove([p.id]) },
    ]} />
  );

  const cols: Col<Product>[] = [
    { key: 'name', header: 'Product', sort: (p) => p.name.toLowerCase(), render: (p) => (
      <div className="flex items-center gap-4 min-w-[260px]">
        <img src={prodImg(p, 120, 120)} alt="" loading="lazy" className="size-14 rounded-2xl object-cover bg-stone shrink-0" />
        <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-medium truncate">{p.name}</span>{p.mto && <MtoTag />}</div><div className="text-muted text-[12px] num">{p.sku}</div></div>
      </div>) },
    { key: 'category', header: 'Category', sort: (p) => p.category, hideBelow: 'lg', render: (p) => <span className="text-muted">{p.category}</span> },
    { key: 'price', header: 'Price', sort: (p) => p.salePrice ?? p.price, align: 'right', render: priceCell },
    { key: 'stock', header: 'Stock', sort: (p) => p.stock, render: (p) => <span className="inline-flex items-center gap-2 num"><span className={cn('size-2 rounded-full', stockTone(p), p.stock === 0 && 'pulse-dot')} />{p.stock}</span> },
    { key: 'status', header: 'Status', sort: (p) => p.status, render: (p) => <StatusPill status={p.status} /> },
    { key: 'updated', header: 'Updated', sort: (p) => Number.parseInt(p.updated) || 0, hideBelow: 'xl', render: (p) => <span className="text-muted num">{p.updated}</span> },
    { key: 'menu', header: '', width: '56px', render: menu },
  ];

  const sel = products.find((p) => p.id === open) ?? null;
  const bulk = (ids: string[], clear: () => void) => (
    <>
      <Button size="sm" variant="ghost" icon={Eye} onClick={() => setSt(ids, 'Published', clear)}>Publish</Button>
      <Button size="sm" variant="ghost" icon={EyeOff} onClick={() => setSt(ids, 'Draft', clear)}>Unpublish</Button>
      <Button size="sm" variant="ghost" icon={Archive} onClick={() => setSt(ids, 'Archived', clear)}>Archive</Button>
      <Button size="sm" variant="ghost" icon={Tag} onClick={() => setPick({ kind: 'category', ids, clear })}>Change category</Button>
      <Button size="sm" variant="ghost" icon={Percent} onClick={() => { setPct('-10'); setPrice({ ids, clear }); }}>Change price by percent</Button>
      <Button size="sm" variant="ghost" icon={FolderPlus} onClick={() => setPick({ kind: 'collection', ids, clear })}>Add to collection</Button>
      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(ids, clear)}>Delete</Button>
    </>
  );
  const empty = <EmptyState title="No products found" body="Try a different search or clear your filters." action={anyFilter ? <Button variant="secondary" onClick={clearAll}>Clear filters</Button> : undefined} />;

  return (
    <>
      <Card pad={false} hover={false}>
        <div className="px-5 pt-4 text-[14px] text-muted">{`${list.length} products in this view.`}</div>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
          <SearchInput className="w-full sm:w-72" value={q} onChange={setQ} placeholder="Search name, SKU or category" />
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip label="Category" value={cat} options={CATEGORIES} onChange={setCat} />
            <FilterChip label="Status" value={status} options={STATUSES} onChange={setStatus} />
            <FilterChip label="Stock" value={stock} options={['In stock', 'Low stock', 'Out of stock']} onChange={setStock} />
            <FilterChip label="Made to order" value={mto} options={['Made to order', 'Ready to ship']} onChange={setMto} />
            <FilterChip label="Collection" value={coll} options={collections.map((c) => c.name)} onChange={setColl} />
            {anyFilter && <button onClick={clearAll} className="text-[13px] text-muted hover:text-fg px-2">Clear all</button>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted text-[13px] hidden md:inline num">{list.length} of {products.length}</span>
            <Segmented value={view} onChange={setView} options={[{ value: 'table', label: <><Rows3 size={14} strokeWidth={1.5} />Table</> }, { value: 'grid', label: <><LayoutGrid size={14} strokeWidth={1.5} />Grid</> }]} />
          </div>
        </div>
        {failed ? <ErrorState onRetry={() => setFailed(false)} /> : view === 'table' ? (
          <DataTable columns={cols} rows={list} rowId={(p) => p.id} selectable loading={loading} empty={empty} bulk={bulk} onRowClick={(p) => { setGi(0); setOpen(p.id); }} activeId={open} pageSize={20} />
        ) : (
          <div className="p-5">
            {loading ? <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}</div>
              : list.length === 0 ? empty : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {list.slice(0, 40).map((p, i) => (
                    <div key={p.id} onClick={() => { setGi(0); setOpen(p.id); }} style={stagger(i % 12, 40)} className="group cursor-pointer anim-fade-up">
                      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone">
                        <img src={prodImg(p, 600, 750)} alt={p.name} loading="lazy" className="size-full object-cover transition-transform duration-[900ms] ease-[var(--ease)] group-hover:scale-110" />
                        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5"><StatusPill status={p.status} className="bg-card/90" />{p.mto && <span className="inline-flex items-center h-5 px-2 rounded-full bg-card/90 text-[11px]">Made to order</span>}</div>
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><span className="size-9 rounded-full bg-card flex items-center justify-center"><ArrowUpRight size={16} strokeWidth={1.5} /></span></div>
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="font-medium truncate">{p.name}</div><div className="text-muted text-[12px]">{p.category}</div></div>
                        <div className="text-right text-[13px]">{priceCell(p)}<div className="flex items-center gap-1.5 justify-end text-[12px] text-muted num mt-0.5"><span className={cn('size-1.5 rounded-full', stockTone(p))} />{p.stock} in stock</div></div>
                      </div>
                    </div>
                  ))}
                </div>)}
            {list.length > 40 && <div className="text-center text-muted text-[13px] mt-6">Showing 40 of {list.length}. Use search or filters to narrow down.</div>}
          </div>
        )}
      </Card>

      <Drawer open={!!sel} onClose={() => setOpen(null)} title={sel?.name} subtitle={sel && <span className="num">{sel.sku} · {sel.category}</span>} width={540}
        footer={sel && <><Button variant="secondary" onClick={() => duplicate(sel)} icon={Copy}>Duplicate</Button><Button icon={Pencil} onClick={() => navigate(`/products/edit/${sel.id}`)}>Edit product</Button></>}>
        {sel && (
          <div className="space-y-6">
            <div>
              <img src={prodImg(sel, 800, 1000, gi)} alt="" onClick={() => setLight(prodImg(sel, 1200, 1500, gi))} className="w-full aspect-[4/5] object-cover rounded-2xl bg-stone cursor-zoom-in" />
              <div className="flex gap-2.5 mt-3">{[0, 1, 2, 3].map((o) => <button key={o} onClick={() => setGi(o)} className={cn('size-16 rounded-xl overflow-hidden transition-all', gi === o ? 'ring-2 ring-champagne ring-offset-2 ring-offset-card' : 'opacity-70 hover:opacity-100')}><img src={prodImg(sel, 160, 160, o)} alt="" className="size-full object-cover" /></button>)}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap"><StatusPill status={sel.status} />{sel.mto && <Pill tone="champagne">Made to order</Pill>}<Pill tone="neutral">{sel.collection}</Pill></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-soft p-4"><div className="label-caps mb-1">Price</div><div className="text-[22px] font-semibold num">{rs(sel.salePrice ?? sel.price)}</div>{sel.salePrice && <div className="text-muted text-[12px] line-through num">{rs(sel.price)}</div>}</div>
              <div className="rounded-xl bg-soft p-4"><div className="label-caps mb-1">Total stock</div><div className="text-[22px] font-semibold num flex items-center gap-2"><span className={cn('size-2.5 rounded-full', stockTone(sel))} />{sel.stock}</div>{isLow(sel) && <div className="text-warn text-[12px]">Low on stock</div>}</div>
            </div>
            <div>
              <div className="label-caps mb-2">Stock per variant</div>
              <div className="rounded-xl border border-line divide-y divide-line">
                {sel.variants.map((v) => <div key={v.sku} className="flex items-center justify-between px-4 py-2.5 text-[13px]"><span>{v.size} · {v.color}<span className="text-muted num ml-2">{v.sku}</span></span><span className="inline-flex items-center gap-2 num"><span className={cn('size-1.5 rounded-full', v.stock === 0 ? 'bg-bad' : v.stock < 5 ? 'bg-warn' : 'bg-ok')} />{v.stock}</span></div>)}
              </div>
            </div>
          </div>)}
      </Drawer>
      <Lightbox src={light} onClose={() => setLight(null)} />

      <Modal open={!!pick} onClose={() => setPick(null)} size="sm" title={pick?.kind === 'category' ? 'Change category' : 'Add to collection'}>
        <div className="text-muted text-[13px] mb-3">{pick?.ids.length} selected products</div>
        <div className="flex flex-col gap-2">
          {(pick?.kind === 'category' ? CATEGORIES : collections.filter((c) => c.type === 'Manual').map((c) => c.name)).map((o) => (
            <button key={o} onClick={() => { if (!pick) return; patch(pick.ids, (p) => (pick.kind === 'category' ? { ...p, category: o } : { ...p, collection: o })); toast(pick.kind === 'category' ? `Moved to ${o}` : `Added to ${o}`, { body: `${pick.ids.length} products` }); pick.clear(); setPick(null); }}
              className="h-11 px-4 rounded-xl border border-line text-left hover:border-champagne hover:bg-soft transition-colors">{o}</button>))}
        </div>
      </Modal>

      <Modal open={!!price} onClose={() => setPrice(null)} size="md" title="Change price by percent"
        footer={<><Button variant="secondary" onClick={() => setPrice(null)}>Cancel</Button><Button disabled={!pctOk} onClick={applyPrice}>Apply to {price?.ids.length} products</Button></>}>
        <Field label="Percent change (use a minus to reduce)" type="number" value={pct} onChange={setPct} error={pct.trim() !== '' && !pctOk ? 'Enter a number between -90 and 200, not zero' : undefined} hint="Sale prices change by the same percent." />
        <div className="label-caps mt-5 mb-2">Before and after</div>
        <div className="rounded-xl border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-4 py-2 bg-soft label-caps"><span>Product</span><span className="text-right">Before</span><span className="text-right">After</span></div>
          {priceRows.slice(0, 6).map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-4 py-2.5 border-t border-line text-[13px] items-center">
              <span className="truncate">{p.name}</span><span className="num text-muted text-right">{rs(p.price)}</span><span className={cn('num font-medium text-right transition-colors', pctOk && 'text-fg')}>{pctOk ? rs(newPrice(p.price)) : '—'}</span>
            </div>))}
          {priceRows.length > 6 && <div className="px-4 py-2.5 border-t border-line text-[12px] text-muted">and {priceRows.length - 6} more products</div>}
        </div>
      </Modal>
    </>
  );
}
