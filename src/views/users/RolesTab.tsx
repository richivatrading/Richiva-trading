"use client";
import { useState } from 'react';
import { Lock, Eye, Plus, Shield } from 'lucide-react';
import { Card, CardHeader, Switch, Button, Modal, Field, Select, Pill, Label, SaveBar, stagger } from '../../ui/kit';
import { logAudit } from '../../data/seed';
import { useApp, navigate } from '../../store';
import { cn } from '../../lib/format';
import type { Role } from '../../app/nav';
import { matrixStore, customRolesStore, usersStore, MODULES, ACTIONS, BASE_ROLES, type Matrix } from './data';
import { roleTone } from './UsersTab';

export default function RolesTab() {
  const { toast, setRole } = useApp();
  const [saved] = matrixStore.use();
  const [custom] = customRolesStore.use();
  const [users] = usersStore.use();
  const roles = [...BASE_ROLES, ...custom];
  const [draft, setDraft] = useState<Matrix>(saved);
  const [sel, setSel] = useState('Manager');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''); const [from, setFrom] = useState('Manager'); const [err, setErr] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const locked = sel === 'Owner';
  const m = draft[sel] ?? draft.Manager;
  const count = (r: string) => MODULES.filter((x) => (draft[r] ?? {})[x]?.View).length;

  const flip = (mod: string, a: (typeof ACTIONS)[number], v: boolean) => setDraft((d) => {
    const row = { ...d[sel][mod], [a]: v }; if (a !== 'View' && v) row.View = true; if (a === 'View' && !v) ACTIONS.forEach((x) => (row[x] = false));
    return { ...d, [sel]: { ...d[sel], [mod]: row } };
  });
  const save = () => { matrixStore.set(draft); logAudit({ user: 'Anita Shrestha', module: 'Users', action: 'Updated role permissions', item: sel, before: 'permissions changed', after: 'permissions saved' }); toast('Permissions saved', { star: true }); };
  const create = () => {
    const n = name.trim();
    if (n.length < 3) return setErr('Please give the role a name of at least 3 letters.');
    if (roles.some((r) => r.toLowerCase() === n.toLowerCase())) return setErr('A role with this name already exists.');
    const copy = JSON.parse(JSON.stringify(draft[from])) as Matrix[string];
    if (from === 'Owner') MODULES.forEach((x) => { copy[x].Delete = false; copy[x].Approve = false; });
    matrixStore.set((x) => ({ ...x, [n]: copy })); setDraft((x) => ({ ...x, [n]: copy })); customRolesStore.set((c) => [...c, n]);
    logAudit({ user: 'Anita Shrestha', module: 'Users', action: 'Created custom role', item: n, after: `copied from ${from}` });
    toast('Custom role created', { body: n, star: true }); setSel(n); setOpen(false); setName(''); setErr('');
  };
  const preview = () => { setRole(sel as Role); toast(`Previewing as ${sel}`, { body: 'The menu now shows only what this role can see.' }); navigate('/overview'); };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((r, i) => (
          <Card key={r} style={stagger(i)} onClick={() => setSel(r)} className={cn('!p-5', sel === r && 'ring-1 ring-champagne border-champagne')}>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Shield size={16} strokeWidth={1.5} className="text-champagne" /><span className="font-medium">{r}</span></div><Pill tone={roleTone(r)}>{users.filter((u) => u.role === r).length} users</Pill></div>
            <div className="text-muted text-[13px] mt-2">Can see {r === 'Owner' ? MODULES.length : count(r)} of {MODULES.length} areas</div>
          </Card>
        ))}
      </div>
      <Card pad={false} hover={false}>
        <div className="p-6 pb-3 flex flex-wrap items-start justify-between gap-3">
          <CardHeader className="!mb-0" title={`${sel} permissions`} sub={locked ? 'The Owner role is locked. Owners can always do everything.' : 'Turn on what this role is allowed to do.'} />
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" icon={Eye} disabled={!BASE_ROLES.includes(sel)} onClick={preview} title={BASE_ROLES.includes(sel) ? '' : 'Preview works for the built-in roles'}>Preview as this role</Button>
            <Button icon={Plus} onClick={() => setOpen(true)}>Create custom role</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] border-separate border-spacing-0">
            <thead><tr><th className="text-left px-6 py-3 border-b border-line label-caps">Module</th>{ACTIONS.map((a) => <th key={a} className="px-3 py-3 border-b border-line label-caps text-center">{a}</th>)}</tr></thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod} className="group hover:bg-soft transition-colors duration-200">
                  <td className="px-6 py-3 border-b border-line font-medium"><span className="inline-flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-200">{locked && <Lock size={12} className="text-muted" />}{mod}</span></td>
                  {ACTIONS.map((a) => <td key={a} className="px-3 py-3 border-b border-line text-center"><span className="inline-flex"><Switch label={`${sel} ${mod} ${a}`} disabled={locked} checked={locked ? true : !!m[mod]?.[a]} onChange={(v) => flip(mod, a, v)} /></span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Create custom role" size="sm" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create role</Button></>}>
        <div className="space-y-4"><Field label="Role name" value={name} onChange={(v) => { setName(v); setErr(''); }} error={err} autoFocus /><Select label="Start from" value={from} onChange={setFrom} options={roles} /><Label>You can fine tune the switches after creating it.</Label></div>
      </Modal>
      <SaveBar show={dirty} onSave={save} onDiscard={() => setDraft(saved)} />
    </div>
  );
}

