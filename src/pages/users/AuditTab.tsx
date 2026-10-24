import { useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Card, DataTable, SearchInput, Select, Drawer, KV, Button, Avatar, Pill, Label, EmptyState, type Col } from '../../ui/kit';
import { auditStore, type AuditEntry } from '../../data/seed';
import { useApp } from '../../store';

const EXTRA: AuditEntry[] = [
  { id: 'x1', time: '14 Oct, 11:20', user: 'Dipesh Lama', module: 'Inventory', action: 'Adjusted stock', item: 'Linen Wrap Blouse, M', ip: '202.79.33.9', device: 'Chrome on Android', before: 'stock: 4', after: 'stock: 24' },
  { id: 'x2', time: '14 Oct, 10:05', user: 'Maya Tuladhar', module: 'Customers', action: 'Added note', item: 'Sunita Gurung', ip: '202.79.32.50', device: 'Firefox on Windows', before: 'note: none', after: 'note: Prefers evening delivery' },
  { id: 'x3', time: '13 Oct, 16:48', user: 'Anita Shrestha', module: 'Settings', action: 'Changed setting', item: 'Free shipping limit', ip: '202.79.32.11', device: 'Chrome on macOS', before: 'limit: Rs 7,000', after: 'limit: Rs 8,000' },
  { id: 'x4', time: '12 Oct, 09:30', user: 'Sneha Pradhan', module: 'CMS', action: 'Published banner', item: 'Dashain Edit', ip: '202.79.32.40', device: 'Safari on macOS', before: 'status: Draft', after: 'status: Published' },
];

export default function AuditTab() {
  const { toast } = useApp();
  const [store] = auditStore.use();
  const seen = useRef(new Set(store.map((e) => e.id)));
  const all = useMemo(() => [...store, ...EXTRA], [store]);
  const [q, setQ] = useState(''); const [user, setUser] = useState('All users'); const [mod, setMod] = useState('All modules');
  const [open, setOpen] = useState<AuditEntry | null>(null);
  const rows = all.filter((e) => (user === 'All users' || e.user === user) && (mod === 'All modules' || e.module === mod) && `${e.action} ${e.item}`.toLowerCase().includes(q.toLowerCase()));
  const flash = all.filter((e) => !seen.current.has(e.id)).map((e) => e.id);
  const exportCsv = () => {
    const csv = ['Time,User,Module,Action,Item,IP,Device', ...rows.map((e) => [e.time, e.user, e.module, e.action, e.item, e.ip, e.device].map((x) => `"${x}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'audit-log.csv'; a.click(); URL.revokeObjectURL(a.href); toast('Audit log exported');
  };
  const cols: Col<AuditEntry>[] = [
    { key: 't', header: 'Time', render: (e) => <span className={e.time === 'Just now' ? 'text-champagne font-medium' : 'text-muted'}>{e.time}</span> },
    { key: 'u', header: 'User', sort: (e) => e.user, render: (e) => <span className="flex items-center gap-2"><Avatar name={e.user} size={24} />{e.user}</span> },
    { key: 'm', header: 'Module', sort: (e) => e.module, render: (e) => <Pill>{e.module}</Pill> },
    { key: 'a', header: 'Action', render: (e) => e.action },
    { key: 'i', header: 'Item', render: (e) => <span className="font-medium">{e.item}</span> },
    { key: 'ip', header: 'IP', hideBelow: 'lg', render: (e) => <span className="num text-muted">{e.ip}</span> },
    { key: 'd', header: 'Device', hideBelow: 'xl', render: (e) => <span className="text-muted">{e.device}</span> },
  ];
  const users = ['All users', ...Array.from(new Set(all.map((e) => e.user)))];
  const mods = ['All modules', ...Array.from(new Set(all.map((e) => e.module)))];
  return (
    <Card pad={false} hover={false}>
      <div className="p-4 flex flex-wrap items-center gap-3 border-b border-line">
        <SearchInput value={q} onChange={setQ} placeholder="Search action or item" className="w-60" />
        <Select value={user} onChange={setUser} options={users} className="w-44 [&_select]:h-10 [&_select]:rounded-full" />
        <Select value={mod} onChange={setMod} options={mods} className="w-44 [&_select]:h-10 [&_select]:rounded-full" />
        <Button variant="secondary" icon={Download} className="ml-auto" onClick={exportCsv}>Export CSV</Button>
      </div>
      <DataTable columns={cols} rows={rows} rowId={(e) => e.id} onRowClick={setOpen} activeId={open?.id} flashIds={flash} pageSize={12} empty={<EmptyState title="No activity found" body="Try clearing a filter." />} />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.action} subtitle={open && `${open.user}, ${open.time}`}>
        {open && <div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-line p-4"><Label className="mb-2">Before</Label><div className="text-[14px] break-words">{open.before ?? 'No earlier value'}</div></div>
            <div className="rounded-xl border border-champagne bg-soft p-4"><Label className="mb-2">After</Label><div className="text-[14px] break-words">{open.after ?? 'No new value'}</div></div>
          </div>
          <div className="mt-6"><KV k="Module">{open.module}</KV><KV k="Item">{open.item}</KV><KV k="IP address"><span className="num">{open.ip}</span></KV><KV k="Device">{open.device}</KV></div>
        </div>}
      </Drawer>
    </Card>
  );
}
