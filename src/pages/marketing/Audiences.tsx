import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, X } from 'lucide-react';
import { Avatar, Button, Card, CountUp, Drawer, Field, IconButton, Segmented, Select, stagger } from '../../ui/kit';
import { navigate, useApp } from '../../store';
import { FIELDS, matching, reach, reachOf, segmentsStore, type Rule, type Segment } from './data';

const newRule = (): Rule => ({ id: `r${Math.random().toString(36).slice(2, 7)}`, field: 'tier', value: 'Gold' });
export default function Audiences({ autoCreate, onUse }: { autoCreate: boolean; onUse?: () => void }) {
  const { toast, confirm } = useApp();
  const [segs, setSegs] = segmentsStore.use();
  const [open, setOpen] = useState(autoCreate);
  const [name, setName] = useState('');
  const [match, setMatch] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<Rule[]>([newRule()]);
  const [err, setErr] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const openNew = () => { setEditId(null); setName(''); setMatch('AND'); setRules([newRule()]); setErr(''); setOpen(true); };
  useEffect(() => { if (autoCreate) openNew(); }, []); // eslint-disable-line
  const edit = (s: Segment) => { setEditId(s.id); setName(s.name); setMatch(s.match); setRules(s.rules.length ? s.rules : [newRule()]); setErr(''); setOpen(true); };
  const live = matching({ match, rules });
  const setRule = (id: string, p: Partial<Rule>) => setRules(rules.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const save = () => {
    if (!name.trim()) return setErr('Give this audience a name.');
    if (rules.some((r) => !r.value)) return setErr('Complete every rule.');
    const s: Segment = { id: editId ?? `s${Date.now()}`, name: name.trim(), match, rules };
    setSegs((a) => (editId ? a.map((x) => (x.id === editId ? s : x)) : [...a, s])); setOpen(false); toast('Audience saved', { star: true });
  };
  const del = async (s: Segment) => {
    if (await confirm({ title: `Delete ${s.name}?`, body: 'Campaigns already sent are not affected.', confirmLabel: 'Delete', danger: true })) { setSegs((a) => a.filter((x) => x.id !== s.id)); toast('Audience deleted', { undo: () => setSegs((a) => [...a, s]) }); }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-5"><div className="text-muted">Saved groups of customers you can message.</div><Button icon={Plus} onClick={openNew}>New audience</Button></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {segs.map((s, i) => (
          <Card key={s.id} style={stagger(i)} className="cursor-pointer" onClick={() => edit(s)}>
            <div className="flex justify-between"><div className="font-title text-[24px]">{s.name}</div><IconButton icon={Trash2} label="Delete audience" onClick={(e) => { e.stopPropagation(); del(s); }} /></div>
            <div className="text-[32px] font-semibold mt-1"><CountUp value={reach(s)} /></div>
            <div className="text-muted text-[13px]">customers · {s.rules.length ? `${s.rules.length} rule${s.rules.length > 1 ? 's' : ''}, match ${s.match === 'AND' ? 'all' : 'any'}` : 'everyone'}</div>
            <Button size="sm" variant="secondary" className="mt-4" onClick={(e) => { e.stopPropagation(); onUse?.(); navigate(`/marketing?tab=campaigns&create=1&segment=${encodeURIComponent(s.name)}`); }}>Use in a campaign</Button>
          </Card>
        ))}
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title={editId ? 'Edit audience' : 'New audience'} width={560} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save audience</Button></>}>
        <div className="space-y-5">
          <div className="rounded-2xl bg-soft border border-line p-5 flex items-center gap-5">
            <div className="font-title text-[56px] leading-none"><CountUp value={reachOf(live.length)} /></div>
            <div><div className="font-medium flex items-center gap-1.5"><Users size={15} strokeWidth={1.5} />customers match</div>
              <div className="flex -space-x-2 mt-2">{live.slice(0, 6).map((c) => <Avatar key={c.id} name={c.name} size={26} className="ring-2 ring-soft" />)}</div></div>
          </div>
          <Field label="Audience name" value={name} onChange={setName} />
          <div className="flex items-center gap-3 text-[14px]">Customers who match<Segmented value={match} onChange={setMatch} options={[{ value: 'AND', label: 'All rules (AND)' }, { value: 'OR', label: 'Any rule (OR)' }]} /></div>
          <div className="space-y-3">
            {rules.map((r) => { const fd = FIELDS.find((x) => x.id === r.field)!; return (
              <div key={r.id} className="flex items-start gap-2 anim-fade-up">
                <Select className="flex-1" value={r.field} onChange={(v) => setRule(r.id, { field: v as Rule['field'], value: FIELDS.find((x) => x.id === v)!.options?.[0] ?? '' })} options={FIELDS.map((x) => ({ value: x.id, label: x.label }))} />
                {fd.options ? <Select className="w-40" value={r.value} onChange={(v) => setRule(r.id, { value: v })} options={fd.options} /> : <Field className="w-40" label="Amount" type="number" value={r.value} onChange={(v) => setRule(r.id, { value: v })} />}
                <IconButton icon={X} label="Remove rule" className="mt-1.5" onClick={() => setRules(rules.filter((x) => x.id !== r.id))} />
              </div>); })}
          </div>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setRules([...rules, newRule()])}>Add rule</Button>
          {err && <div className="text-bad text-[12px]">{err}</div>}
        </div>
      </Drawer>
    </div>
  );
}
