import { useMemo, useState, type ReactNode } from 'react';
import { GripVertical, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import { Button, Card, CardHeader, CountUp, DataTable, Drawer, DropdownMenu, EmptyState, Field, IconButton, Pill, Segmented, Select, StatusPill, Switch, useFakeLoad, Skeleton, type Col } from '../../ui/kit';
import { useApp } from '../../store';
import { productsStore } from '../../data/seed';
import { cn, uid } from '../../lib/format';
import { CATEGORIES, RULE_FIELDS, categoriesStore, collectionsStore, inCollection, matchesRules, prodImg, type Cat, type Collection, type Rule } from './shared';

type Pos = 'before' | 'after' | 'inside';

function Tree() {
  const [cats, setCats] = categoriesStore.use();
  const { toast } = useApp();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; pos: Pos } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const kids = (p: string | null) => cats.filter((c) => c.parent === p);
  const total = (c: Cat): number => c.count + kids(c.id).reduce((a, k) => a + total(k), 0);
  const isDesc = (anc: string, id: string | null): boolean => { while (id) { if (id === anc) return true; id = cats.find((c) => c.id === id)?.parent ?? null; } return false; };

  const move = (id: string, target: string, pos: Pos) => {
    if (id === target || isDesc(id, target)) return;
    setCats((a) => {
      const node = a.find((c) => c.id === id)!; const rest = a.filter((c) => c.id !== id); const t = rest.findIndex((c) => c.id === target);
      if (pos === 'inside') return [...rest, { ...node, parent: target }];
      const moved = { ...node, parent: rest[t].parent }; const out = [...rest]; out.splice(pos === 'before' ? t : t + 1, 0, moved); return out;
    });
    const tn = cats.find((c) => c.id === target)?.name; toast(pos === 'inside' ? `Moved inside ${tn}` : 'Order updated');
  };
  const add = () => {
    const name = (adding ?? '').trim(); if (!name) return setAdding(null);
    setCats((a) => [...a, { id: uid('cat'), name, parent: null, visible: true, count: 0 }]); setAdding(null); toast('Category added', { body: name });
  };

  const row = (c: Cat, depth: number, dim: boolean): ReactNode => {
    const ch = kids(c.id);
    const here = over?.id === c.id && drag && drag !== c.id ? over.pos : null;
    return (
      <div key={c.id}>
        <div draggable onDragStart={(e) => { setDrag(c.id); e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
          onDragOver={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const y = (e.clientY - r.top) / r.height; setOver({ id: c.id, pos: y < 0.28 ? 'before' : y > 0.72 ? 'after' : 'inside' }); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (drag && over) move(drag, over.id, over.pos); setDrag(null); setOver(null); }}
          className={cn('relative flex items-center gap-3 h-12 rounded-xl px-3 border border-transparent transition-all duration-200 bg-card', dim && 'opacity-45',
            drag === c.id ? 'scale-[1.03] shadow-[var(--shadow-lg)] border-line z-10 opacity-90 rotate-[0.4deg]' : 'hover:bg-soft', here === 'inside' && 'ring-2 ring-champagne bg-[color-mix(in_srgb,var(--champagne)_12%,transparent)]')}>
          {here === 'before' && <span className="absolute -top-px left-3 right-3 h-0.5 rounded bg-champagne" />}
          {here === 'after' && <span className="absolute -bottom-px left-3 right-3 h-0.5 rounded bg-champagne" />}
          <GripVertical size={16} className="text-muted cursor-grab active:cursor-grabbing shrink-0" />
          <span className={cn('flex-1 truncate', depth === 0 && 'font-medium')}>{c.name}</span>
          <span className="text-muted text-[12px] num">{total(c)} products</span>
          <span className="hidden md:inline text-muted text-[12px]">Visible on site</span>
          <Switch checked={c.visible} label={`Visible on site: ${c.name}`} onChange={(v) => setCats((a) => a.map((x) => (x.id === c.id ? { ...x, visible: v } : x)))} />
        </div>
        {ch.length > 0 && <div className="ml-6 pl-3 border-l border-line">{ch.map((k) => row(k, depth + 1, dim || !c.visible))}</div>}
      </div>
    );
  };
  return (
    <Card hover={false}>
      <CardHeader title="Categories" sub="Drag to reorder. Drop on the middle of a row to nest." action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding('')}>Add category</Button>} />
      {adding !== null && <div className="flex gap-2 mb-3 anim-fade-up"><Field className="flex-1" label="Category name" value={adding} onChange={setAdding} autoFocus onKeyDown={(e) => e.key === 'Enter' && add()} /><Button onClick={add}>Add</Button><IconButton icon={X} label="Cancel" onClick={() => setAdding(null)} /></div>}
      <div className="space-y-1" onDragOver={(e) => e.preventDefault()} onDrop={() => { setDrag(null); setOver(null); }}>
        {kids(null).map((c) => row(c, 0, false))}
      </div>
    </Card>
  );
}

function CollectionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp();
  const [products] = productsStore.use();
  const [name, setName] = useState('');
  const [type, setType] = useState<'Manual' | 'Automatic'>('Automatic');
  const [join, setJoin] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<Rule[]>([{ id: 'n1', field: 'price', op: 'lt', value: '8000' }]);
  const [err, setErr] = useState<{ name?: string; rules?: string }>({});
  const matched = useMemo(() => products.filter((p) => matchesRules(join, rules, p)), [products, join, rules]);
  const upd = (id: string, p: Partial<Rule>) => setRules((a) => a.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const changeField = (id: string, f: Rule['field']) => upd(id, { field: f, op: RULE_FIELDS.find((x) => x.value === f)!.ops[0].value, value: f === 'category' ? 'Dresses' : f === 'status' ? 'Published' : f === 'stock' ? '10' : '8000' });
  const reset = () => { setName(''); setType('Automatic'); setJoin('AND'); setRules([{ id: uid('r'), field: 'price', op: 'lt', value: '8000' }]); setErr({}); };
  const save = () => {
    const e: typeof err = {};
    if (!name.trim()) e.name = 'Give the collection a name';
    if (type === 'Automatic' && (rules.length === 0 || rules.some((r) => !r.value.trim()))) e.rules = 'Add at least one complete rule';
    setErr(e); if (Object.keys(e).length) return;
    collectionsStore.set((a) => [...a, { id: uid('col'), name: name.trim(), type, status: 'Draft', join, rules: type === 'Automatic' ? rules : [] }]);
    toast('Collection created', { body: name.trim(), star: true }); reset(); onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title="New collection" subtitle="Group products for your storefront" width={560}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Create collection</Button></>}>
      <div className="space-y-6">
        <Field label="Collection name" value={name} onChange={(v) => { setName(v); setErr({ ...err, name: undefined }); }} error={err.name} />
        <div><div className="label-caps mb-2">Type</div><Segmented value={type} onChange={setType} options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automatic', label: 'Automatic' }]} />
          <div className="text-muted text-[13px] mt-2">{type === 'Manual' ? 'You pick the products yourself, from the products list.' : 'Products join automatically when they match your rules.'}</div></div>
        {type === 'Automatic' && (
          <div className="anim-fade-up">
            <div className="flex items-center justify-between mb-3"><div className="label-caps">Rules</div><Segmented value={join} onChange={setJoin} options={[{ value: 'AND', label: 'AND (all rules)' }, { value: 'OR', label: 'OR (any rule)' }]} /></div>
            <div className="space-y-2.5">
              {rules.map((r, i) => {
                const f = RULE_FIELDS.find((x) => x.value === r.field)!;
                return (
                  <div key={r.id} className="flex items-center gap-2 anim-slide-in">
                    <span className="w-9 text-[11px] text-muted label-caps shrink-0">{i === 0 ? 'If' : join}</span>
                    <Select className="w-32 shrink-0" value={r.field} onChange={(v) => changeField(r.id, v as Rule['field'])} options={RULE_FIELDS.map((x) => ({ value: x.value, label: x.label }))} />
                    <Select className="w-40 shrink-0" value={r.op} onChange={(v) => upd(r.id, { op: v })} options={f.ops} />
                    {r.field === 'category' ? <Select className="flex-1" value={r.value} onChange={(v) => upd(r.id, { value: v })} options={CATEGORIES} />
                      : r.field === 'status' ? <Select className="flex-1" value={r.value} onChange={(v) => upd(r.id, { value: v })} options={['Published', 'Draft', 'Scheduled', 'Archived']} />
                        : <Field className="flex-1" label={r.field === 'price' ? 'Amount (Rs)' : 'Units'} type="number" value={r.value} onChange={(v) => upd(r.id, { value: v })} />}
                    <IconButton icon={Trash2} label="Remove rule" onClick={() => setRules((a) => a.filter((x) => x.id !== r.id))} />
                  </div>);
              })}
            </div>
            {err.rules && <div className="text-bad text-[12px] mt-2">{err.rules}</div>}
            <Button className="mt-3" size="sm" variant="secondary" icon={Plus} onClick={() => setRules((a) => [...a, { id: uid('r'), field: 'category', op: 'is', value: 'Dresses' }])}>Add rule</Button>
            <div className="mt-6 rounded-2xl bg-soft p-5">
              <div className="flex items-baseline gap-2"><span className="text-[32px] font-semibold"><CountUp value={matched.length} duration={400} /></span><span className="text-muted">products match right now</span></div>
              <div className="flex gap-2 mt-3 flex-wrap">{matched.slice(0, 7).map((p) => <img key={p.id} src={prodImg(p, 100, 100)} alt={p.name} title={p.name} className="size-12 rounded-xl object-cover anim-pop" />)}{matched.length > 7 && <span className="size-12 rounded-xl bg-stone flex items-center justify-center text-[12px] text-muted">+{matched.length - 7}</span>}</div>
            </div>
          </div>)}
      </div>
    </Drawer>
  );
}

function Collections() {
  const { confirm, toast } = useApp();
  const [cols, setCols] = collectionsStore.use();
  const [products] = productsStore.use();
  const [drawer, setDrawer] = useState(false);
  const columns: Col<Collection>[] = [
    { key: 'name', header: 'Name', sort: (c) => c.name, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'type', header: 'Type', sort: (c) => c.type, render: (c) => <Pill tone={c.type === 'Automatic' ? 'champagne' : 'neutral'}>{c.type}</Pill> },
    { key: 'n', header: 'Products', align: 'right', sort: (c) => products.filter((p) => inCollection(c, p)).length, render: (c) => <span className="num">{products.filter((p) => inCollection(c, p)).length}</span> },
    { key: 'st', header: 'Status', render: (c) => <StatusPill status={c.status} /> },
    { key: 'm', header: '', width: '48px', render: (c) => (
      <DropdownMenu width={180} trigger={<IconButton icon={MoreHorizontal} label="More" />} items={[
        { label: c.status === 'Live' ? 'Move to draft' : 'Make live', onClick: () => setCols((a) => a.map((x) => (x.id === c.id ? { ...x, status: x.status === 'Live' ? 'Draft' : 'Live' } : x))) },
        { divider: true, label: '' },
        { label: 'Delete', icon: Trash2, danger: true, onClick: async () => { if (await confirm({ title: `Delete ${c.name}?`, body: 'Products stay in your store.', confirmLabel: 'Delete', danger: true })) { setCols((a) => a.filter((x) => x.id !== c.id)); toast('Collection deleted', { undo: () => setCols((a) => [...a, c]) }); } } },
      ]} />) },
  ];
  return (
    <Card hover={false} pad={false}>
      <div className="p-6 pb-2"><CardHeader title="Collections" sub={`${cols.length} collections`} action={<Button size="sm" icon={Plus} onClick={() => setDrawer(true)}>New collection</Button>} /></div>
      <DataTable columns={columns} rows={cols} rowId={(c) => c.id} empty={<EmptyState title="No collections yet" body="Create one to group products." />} />
      <CollectionDrawer open={drawer} onClose={() => setDrawer(false)} />
    </Card>
  );
}

export default function Categories() {
  const loading = useFakeLoad(500);
  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"><Tree /><Collections /></div>;
}
