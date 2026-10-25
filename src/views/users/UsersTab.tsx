"use client";
import { useMemo, useState } from 'react';
import { MoreHorizontal, ShieldCheck, ShieldAlert, UserPlus, KeyRound, LogOut, Ban, UserCheck, Repeat } from 'lucide-react';
import { Card, DataTable, SearchInput, Chip, Button, Avatar, Pill, StatusPill, IconButton, DropdownMenu, Drawer, Field, Select, Modal, EmptyState, type Col, type Tone } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { logAudit } from '../../data/seed';
import { useApp } from '../../store';
import { usersStore, matrixStore, customRolesStore, BASE_ROLES, modulesFor, activeOwners, type UserRow } from './data';

export const roleTone = (r: string): Tone => ({ Owner: 'champagne', Manager: 'neutral', Marketing: 'sage', Finance: 'info', Warehouse: 'warning', Support: 'neutral' } as Record<string, Tone>)[r] ?? 'ink';
const EXP = ['No expiry', '7 days', '30 days', '90 days'];

export default function UsersTab() {
  const { confirm, toast } = useApp();
  const [users, setUsers] = usersStore.use();
  const [matrix] = matrixStore.use();
  const [custom] = customRolesStore.use();
  const roles = [...BASE_ROLES, ...custom];
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState(''); const [role, setRole] = useState('Manager'); const [exp, setExp] = useState(EXP[0]); const [err, setErr] = useState('');
  const [flash, setFlash] = useState<string[]>([]);
  const [changing, setChanging] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState('Manager');
  const rows = useMemo(() => users.filter((u) => (f === 'All' || u.role === f || u.status === f) && (u.name + u.email).toLowerCase().includes(q.toLowerCase())), [users, q, f]);
  const patch = (id: string, p: Partial<UserRow>) => setUsers((a) => a.map((u) => (u.id === id ? { ...u, ...p } : u)));
  const lastOwnerBlock = async (u: UserRow, what: string) => {
    if (u.role === 'Owner' && u.status === 'Active' && activeOwners(users) <= 1) {
      await confirm({ title: 'This is the last Owner', body: `Richiva must always have at least one active Owner, so you cannot ${what}. Make someone else an Owner first.`, confirmLabel: 'Understood' });
      return true;
    }
    return false;
  };
  const audit = (action: string, item: string, before?: string, after?: string) => logAudit({ user: 'Anita Shrestha', module: 'Users', action, item, before, after });

  const applyRole = async () => {
    const u = changing!; if (!u || newRole === u.role) return setChanging(null);
    if (newRole !== 'Owner' && (await lastOwnerBlock(u, 'change this role'))) return setChanging(null);
    setChanging(null);
    if (!(await confirm({ title: `Change ${u.name} to ${newRole}?`, body: `Her access will change straight away. She is currently ${u.role}.`, confirmLabel: 'Change role' }))) return;
    const old = u.role; patch(u.id, { role: newRole }); audit('Changed role', u.name, `role: ${old}`, `role: ${newRole}`);
    toast('Role changed', { body: `${u.name} is now ${newRole}.`, undo: () => { patch(u.id, { role: old }); audit('Undid role change', u.name, `role: ${newRole}`, `role: ${old}`); } });
  };
  const disable = async (u: UserRow) => {
    if (await lastOwnerBlock(u, 'disable this account')) return;
    if (!(await confirm({ title: `Disable ${u.name}?`, body: 'She will be signed out and unable to log in until you enable her again.', confirmLabel: 'Disable', danger: true }))) return;
    const old = u.status; patch(u.id, { status: 'Disabled' }); audit('Disabled user', u.name, `status: ${old}`, 'status: Disabled');
    toast('User disabled', { undo: () => { patch(u.id, { status: old }); audit('Re-enabled user', u.name, 'status: Disabled', `status: ${old}`); } });
  };
  const enable = (u: UserRow) => { patch(u.id, { status: 'Active' }); audit('Enabled user', u.name, 'status: Disabled', 'status: Active'); toast('User enabled'); };
  const resetMfa = async (u: UserRow) => {
    if (!(await confirm({ title: `Reset MFA for ${u.name}?`, body: 'She will be asked to set up a new authenticator app at her next login.', confirmLabel: 'Reset MFA', danger: true }))) return;
    const old = u.mfa; patch(u.id, { mfa: false }); audit('Reset MFA', u.name, 'MFA: On', 'MFA: Not set up');
    toast('MFA reset', { undo: () => { patch(u.id, { mfa: old }); audit('Undid MFA reset', u.name, 'MFA: Not set up', 'MFA: On'); } });
  };
  const logout = (u: UserRow) => { patch(u.id, { last: 'Signed out' }); audit('Forced log out', u.name); toast(`${u.name} was signed out`, { star: true }); };

  const submit = () => {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return setErr('Please enter a valid email, like name@richiva.com.');
    if (users.some((u) => u.email.toLowerCase() === e.toLowerCase())) return setErr('This email already has an account.');
    const id = `u${Date.now()}`;
    const name = e.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    setUsers((a) => [...a, { id, name, email: e, role, mfa: false, last: 'Never', status: 'Pending', expires: exp === EXP[0] ? undefined : exp }]);
    setFlash([id]); audit('Invited user', e, undefined, `role: ${role}`); toast('Invitation sent', { body: e, star: true });
    setInvite(false); setEmail(''); setErr(''); setExp(EXP[0]);
  };
  const seeMods = modulesFor(matrix, role);

  const cols: Col<UserRow>[] = [
    { key: 'name', header: 'User', sort: (u) => u.name, render: (u) => <div className="flex items-center gap-3"><Avatar name={u.name} size={36} /><div><div className="font-medium">{u.name}</div><div className="text-muted text-[12px]">{u.email}</div></div></div> },
    { key: 'role', header: 'Role', sort: (u) => u.role, render: (u) => <Pill tone={roleTone(u.role)}>{u.role}</Pill> },
    { key: 'mfa', header: 'MFA', sort: (u) => +u.mfa, render: (u) => u.mfa ? <span className="inline-flex items-center gap-1.5 text-ok"><ShieldCheck size={16} strokeWidth={1.5} />On</span> : <span className="inline-flex items-center gap-1.5 text-bad"><ShieldAlert size={16} strokeWidth={1.5} />Not set up</span> },
    { key: 'last', header: 'Last active', hideBelow: 'lg', render: (u) => <span className="text-muted">{u.last}</span> },
    { key: 'status', header: 'Status', sort: (u) => u.status, render: (u) => <StatusPill status={u.status} /> },
    { key: 'm', header: '', width: '48px', render: (u) => (
      <DropdownMenu trigger={<IconButton icon={MoreHorizontal} label="Actions" />} items={[
        { label: 'Change role', icon: Repeat, onClick: () => { setNewRole(u.role); setChanging(u); } },
        { label: 'Reset MFA', icon: KeyRound, onClick: () => resetMfa(u) },
        { label: 'Force log out', icon: LogOut, onClick: () => logout(u) }, { divider: true, label: '' },
        u.status === 'Disabled' ? { label: 'Enable', icon: UserCheck, onClick: () => enable(u) } : { label: 'Disable', icon: Ban, danger: true, onClick: () => disable(u) },
      ]} />) },
  ];

  return (
    <Card pad={false} hover={false}>
      <div className="px-5 pt-4 text-[14px] text-muted">{`${rows.length} ${rows.length === 1 ? 'person has' : 'people have'} access.`}</div>
      <div className="p-4 flex flex-wrap items-center gap-3 border-b border-line">
        <SearchInput value={q} onChange={setQ} placeholder="Search name or email" className="w-64" />
        {['All', 'Owner', 'Manager', 'Pending', 'Disabled'].map((c) => <Chip key={c} active={f === c} onClick={() => setF(c)}>{c}</Chip>)}
        <div className="ml-auto"><Button icon={UserPlus} onClick={() => setInvite(true)}>Invite user</Button></div>
      </div>
      <DataTable columns={cols} rows={rows} rowId={(u) => u.id} flashIds={flash} empty={<EmptyState icon={ShieldCheck} title="No users found" body="Try a different search or filter." />} />
      <Modal open={!!changing} onClose={() => setChanging(null)} title={`Change role for ${changing?.name ?? ''}`} size="sm" footer={<><Button variant="ghost" onClick={() => setChanging(null)}>Cancel</Button><Button onClick={applyRole}>Continue</Button></>}>
        <Select label="New role" value={newRole} onChange={setNewRole} options={roles} />
      </Modal>
      <Drawer open={invite} onClose={() => setInvite(false)} title="Invite user" subtitle="They will get an email with a link to join" footer={<><Button variant="ghost" onClick={() => setInvite(false)}>Cancel</Button><Button icon={UserPlus} onClick={submit}>Send invite</Button></>}>
        <div className="space-y-5">
          <Field label="Email" type="email" value={email} onChange={(v) => { setEmail(v); setErr(''); }} error={err} autoFocus />
          <Select label="Role" value={role} onChange={setRole} options={roles} />
          <Select label="Access expires (optional)" value={exp} onChange={setExp} options={EXP} />
          <div className="rounded-xl bg-soft p-4 flex gap-3 text-[14px]"><Star size={14} className="mt-1" twinkle /><div>This person will be able to see: <b>{seeMods.length === 0 ? 'nothing yet' : role === 'Owner' ? 'Everything' : seeMods.join(', ')}</b></div></div>
        </div>
      </Drawer>
    </Card>
  );
}

