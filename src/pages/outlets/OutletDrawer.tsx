import { useEffect, useState } from 'react';
import { Pencil, Phone, MapPin, Trash2, Lock, Unlock } from 'lucide-react';
import { Avatar, Button, Field, KV, Label, Progress, Select, StatusPill, Drawer } from '../../ui/kit';
import { rs } from '../../lib/format';
import { recentOrders, type Outlet } from './data';

const DAYS = ['Every day', 'Sun to Fri', 'Mon to Sat', 'Weekdays only'];

export default function OutletDrawer({ outlet, onClose, onEdit, onHours, onToggle, onDelete }: {
  outlet: Outlet | null; onClose: () => void; onEdit: (o: Outlet) => void; onHours: (id: string, h: { opens: string; closes: string; days: string }) => void; onToggle: (o: Outlet) => void; onDelete: (o: Outlet) => void;
}) {
  const [h, setH] = useState({ opens: '', closes: '', days: '' });
  useEffect(() => { if (outlet) setH({ opens: outlet.opens, closes: outlet.closes, days: outlet.days }); }, [outlet?.id]); // eslint-disable-line
  const o = outlet;
  const dirty = !!o && (h.opens !== o.opens || h.closes !== o.closes || h.days !== o.days);
  const bad = h.closes <= h.opens;
  return (
    <Drawer open={!!o} onClose={onClose} title={o?.name} subtitle={o && <span className="inline-flex items-center gap-2">{o.type} in {o.city} <StatusPill status={o.status} /></span>} width={520}
      footer={o && <div className="flex flex-wrap gap-3 w-full">
        <Button variant="secondary" icon={Pencil} onClick={() => onEdit(o)}>Edit details</Button>
        <Button variant="secondary" icon={o.status === 'Closed' ? Unlock : Lock} onClick={() => onToggle(o)}>{o.status === 'Closed' ? 'Reopen' : 'Close outlet'}</Button>
        <Button variant="danger" icon={Trash2} className="ml-auto" onClick={() => onDelete(o)}>Delete</Button>
      </div>}>
      {o && <div className="grid gap-7">
        <section>
          <KV k={<span className="inline-flex items-center gap-1.5"><MapPin size={14} strokeWidth={1.5} />Address</span>}>{o.address}</KV>
          <KV k={<span className="inline-flex items-center gap-1.5"><Phone size={14} strokeWidth={1.5} />Phone</span>}>{o.phone}</KV>
          <KV k="Manager">{o.manager}</KV>
        </section>
        <section>
          <Label className="mb-3">Opening hours</Label>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opens at" type="time" value={h.opens} onChange={(x) => setH((s) => ({ ...s, opens: x }))} />
            <Field label="Closes at" type="time" value={h.closes} onChange={(x) => setH((s) => ({ ...s, closes: x }))} error={bad ? 'Must be after opening' : undefined} />
          </div>
          <Select className="mt-4" label="Open on" value={h.days} onChange={(x) => setH((s) => ({ ...s, days: x }))} options={DAYS} />
          {dirty && <div className="mt-3 flex gap-2 anim-fade-in"><Button size="sm" disabled={bad} onClick={() => onHours(o.id, h)}>Save hours</Button><Button size="sm" variant="ghost" onClick={() => setH({ opens: o.opens, closes: o.closes, days: o.days })}>Undo</Button></div>}
        </section>
        <section>
          <Label className="mb-3">Stock</Label>
          <div className="grid grid-cols-3 gap-3">
            {[['In stock', o.stock.toLocaleString('en-IN')], ['Running low', String(o.lowItems)], ["Today's sales", rs(o.sales)]].map(([k, v]) => <div key={k} className="bg-soft rounded-2xl p-4"><div className="text-[13px] text-muted">{k}</div><div className="text-[16px] font-semibold mt-1 num">{v}</div></div>)}
          </div>
          <div className="mt-4 text-[13px] text-muted flex justify-between"><span>Items in good supply</span><span>{o.stock ? Math.max(0, 100 - Math.round((o.lowItems / Math.max(1, o.stock / 60)) * 100)) : 0}%</span></div>
          <Progress className="mt-2" value={o.stock ? Math.max(0, 100 - Math.round((o.lowItems / Math.max(1, o.stock / 60)) * 100)) : 0} />
        </section>
        <section>
          <Label className="mb-3">Staff ({o.staff.length})</Label>
          {o.staff.length === 0 ? <p className="text-muted">No staff added yet.</p> : o.staff.map((s) => (
            <div key={s.name} className="flex items-center gap-3 py-2"><Avatar name={s.name} size={36} /><div className="font-medium">{s.name}</div><div className="ml-auto text-muted text-[13px]">{s.role}</div></div>
          ))}
        </section>
        <section>
          <Label className="mb-3">Recent orders</Label>
          {recentOrders(o).length === 0 ? <p className="text-muted">No orders yet.</p> : recentOrders(o).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-line last:border-0"><div><div className="font-medium">{r.id}</div><div className="text-[13px] text-muted">{r.customer} · {r.when}</div></div><div className="num font-medium">{rs(r.amount)}</div></div>
          ))}
        </section>
      </div>}
    </Drawer>
  );
}
