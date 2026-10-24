import { useState } from 'react';
import { CircleCheck, MapPinned, PhoneCall, RotateCcw, Undo2 } from 'lucide-react';
import { Button, Card, CelebrateState, Field, Modal, Pill, Select, StatusPill } from '../../ui/kit';
import { navigate, useApp } from '../../store';
import { rs } from '../../lib/format';
import type { Shipment } from './data';

type Kind = 'call' | 'retry' | 'address';
export default function Problems({ ships, setShips }: { ships: Shipment[]; setShips: (f: (s: Shipment[]) => Shipment[]) => void }) {
  const { toast, confirm } = useApp();
  const [dlg, setDlg] = useState<{ kind: Kind; s: Shipment } | null>(null);
  const [when, setWhen] = useState('Tomorrow');
  const [courier, setCourier] = useState('Pathao');
  const [addr, setAddr] = useState('');
  const [err, setErr] = useState('');
  const rows = ships.filter((s) => s.status === 'Failed');

  const patch = (id: string, f: (s: Shipment) => Shipment, msg: string, body?: string) => {
    const prev = ships.find((s) => s.id === id)!;
    setShips((a) => a.map((s) => s.id === id ? f(s) : s));
    toast(msg, { body, undo: () => setShips((a) => a.map((s) => s.id === id ? prev : s)) });
    setDlg(null);
  };
  const ev = (s: Shipment, title: string, meta: string) => [...s.events, { title, meta }];
  const openDlg = (kind: Kind, s: Shipment) => { setDlg({ kind, s }); setAddr(s.address); setErr(''); setCourier(s.courier); setWhen('Tomorrow'); };
  const ret = async (s: Shipment) => {
    if (await confirm({ title: 'Return to warehouse?', body: `${s.waybill} will be sent back and the order marked Returned.`, confirmLabel: 'Return parcel', danger: true }))
      patch(s.id, (x) => ({ ...x, status: 'Returned', updated: 'Just now', events: ev(x, 'Returned to warehouse', 'Marked by staff') }), 'Parcel returning to warehouse', s.waybill);
  };

  if (!rows.length) return <Card hover={false}><CelebrateState title="No delivery problems" body="Every parcel is moving. Lovely." /></Card>;
  return (
    <div className="space-y-4">
      {rows.map((s, i) => (
        <Card key={s.id} hover={false} style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap"><span className="font-medium num">{s.waybill}</span><StatusPill status="Failed" />{s.note && <Pill tone="sage" icon={CircleCheck}>{s.note}</Pill>}</div>
              <div className="text-[14px] mt-1.5"><button className="underline decoration-line underline-offset-4 hover:text-champagne" onClick={() => navigate(`/orders/${s.order}`)}>{s.order}</button> · {s.customer} · <span className="num text-muted">{s.phone}</span></div>
              <div className="text-muted text-[13px] mt-1">{s.address} · {s.courier}{s.cod ? ` · Collect ${rs(s.cod)}` : ''}</div>
              <div className="text-warn text-[13px] mt-1.5">{s.reason}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={PhoneCall} onClick={() => openDlg('call', s)}>Call customer</Button>
              <Button size="sm" icon={RotateCcw} onClick={() => openDlg('retry', s)}>Re-attempt</Button>
              <Button size="sm" variant="secondary" icon={MapPinned} onClick={() => openDlg('address', s)}>Change address</Button>
              <Button size="sm" variant="ghost" icon={Undo2} onClick={() => ret(s)}>Return to warehouse</Button>
            </div>
          </div>
        </Card>
      ))}
      <Modal open={dlg?.kind === 'call'} onClose={() => setDlg(null)} title="Call customer" size="sm">
        {dlg && <div className="space-y-4">
          <div><div className="font-medium">{dlg.s.customer}</div><a href={`tel:${dlg.s.phone.replace(/\s|-/g, '')}`} className="num text-[20px] hover:text-champagne">{dlg.s.phone}</a></div>
          <div className="label-caps">How did it go?</div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => patch(dlg.s.id, (x) => ({ ...x, note: 'Customer reached, ready to receive', events: ev(x, 'Customer called', 'Reached, ready to receive') }), 'Call logged', 'Ready for a re-attempt.')}>Reached, ready to receive</Button>
            <Button variant="secondary" onClick={() => patch(dlg.s.id, (x) => ({ ...x, note: 'Called, no answer', events: ev(x, 'Customer called', 'No answer') }), 'Call logged', 'No answer. Try again later.')}>No answer</Button>
          </div>
        </div>}
      </Modal>
      <Modal open={dlg?.kind === 'retry'} onClose={() => setDlg(null)} title="Re-attempt delivery" size="sm" footer={dlg && <><Button variant="secondary" onClick={() => setDlg(null)}>Cancel</Button><Button onClick={() => patch(dlg.s.id, (x) => ({ ...x, status: 'Out for delivery', courier, updated: 'Just now', reason: undefined, note: undefined, events: ev(x, 'Re-attempt scheduled', `${when} with ${courier}`) }), 'Re-attempt scheduled', `${dlg.s.waybill} · ${when}`)}>Schedule</Button></>}>
        <div className="space-y-3"><Select label="When" value={when} onChange={setWhen} options={['Tomorrow', 'In 2 days', 'Saturday']} /><Select label="Courier" value={courier} onChange={setCourier} options={['Pathao', 'Nepal Can Move']} /></div>
      </Modal>
      <Modal open={dlg?.kind === 'address'} onClose={() => setDlg(null)} title="Change address" size="sm" footer={dlg && <><Button variant="secondary" onClick={() => setDlg(null)}>Cancel</Button><Button onClick={() => { if (addr.trim().length < 10) return setErr('Enter the full address, at least 10 characters.'); patch(dlg.s.id, (x) => ({ ...x, address: addr.trim(), note: 'Address updated', events: ev(x, 'Address changed', addr.trim()) }), 'Address updated', 'Now ready for a re-attempt.'); }}>Save address</Button></>}>
        <Field label="Delivery address" value={addr} onChange={(v) => { setAddr(v); setErr(''); }} error={err} multiline />
      </Modal>
    </div>
  );
}
