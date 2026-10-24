import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { navigate } from '../../store';
import { ordersStore } from '../../data/seed';
import { Button, Drawer, KV, Label, Photo, Pill, StatusPill, Timeline } from '../../ui/kit';
import { photo } from '../../data/seed';
import { rs } from '../../lib/format';
import { NEXT, eventsFor, eventsStore, payStatusOf, payStore, productOf, txnOf, unitPrice } from './shared';
import { useOrderFlow } from './Dialogs';

export default function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const [orders] = ordersStore.use();
  const [evs] = eventsStore.use();
  const [pay] = payStore.use();
  const o = orders.find((x) => x.id === orderId);
  const flow = useOrderFlow(o, pay[o?.id ?? '']?.refunded ?? 0);
  const next = o && NEXT[o.status];
  return (
    <>
      <Drawer open={!!orderId} onClose={onClose} width={500} title={<span>{o?.id ?? orderId}</span>} subtitle={o && `${o.date} · ${o.channel}`}
        actions={o && <Button variant="ghost" size="sm" onClick={() => { onClose(); navigate(`/orders/${o.id}`); }}>Open full page<ArrowUpRight size={14} /></Button>}
        footer={o && (next ? <Button size="lg" className="w-full" onClick={() => flow.run(next.action)}>{next.label}</Button> : <div className="text-muted text-[13px] w-full text-center">No further steps for a {o.status.toLowerCase()} order.</div>)}>
        {!o ? <div className="text-muted">We could not find this order.</div> : (
          <div className="grid gap-7">
            <div className="flex items-center justify-between"><StatusPill status={o.status} /><div className="font-title text-[28px] num">{rs(o.total)}</div></div>
            <section>
              <Label className="mb-3">Items</Label>
              <div className="grid gap-3">
                {o.items.map((i, k) => { const p = productOf(i.productId); return (
                  <div key={k} className="flex items-center gap-3 anim-fade-up" style={{ animationDelay: `${k * 50}ms` }}>
                    <Photo src={photo(p.photo, 120, 150)} size={52} />
                    <div className="flex-1 min-w-0"><div className="truncate font-medium">{p.name}</div><div className="text-muted text-[12.5px]">{i.color} · {i.size} · Qty {i.qty}</div></div>
                    <div className="num">{rs(unitPrice(i.productId) * i.qty)}</div>
                  </div>); })}
              </div>
            </section>
            <section>
              <Label className="mb-2">Customer and address</Label>
              <div className="font-medium">{o.customer}</div>
              <div className="flex items-center gap-2 text-muted text-[13px] mt-1"><Phone size={13} />{o.phone}</div>
              <div className="flex items-start gap-2 text-muted text-[13px] mt-1"><MapPin size={13} className="mt-0.5" />{o.address}</div>
            </section>
            <section>
              <Label className="mb-1">Payment</Label>
              <KV k="Method"><Pill tone="neutral">{o.pay}</Pill></KV>
              <KV k="Status"><StatusPill status={payStatusOf(o, pay)} /></KV>
              <KV k="Transaction"><span className="num">{txnOf(o)}</span></KV>
              <KV k="Courier">{o.courier}{o.tracking && <span className="text-muted num"> · {o.tracking}</span>}</KV>
            </section>
            <section>
              <Label className="mb-3">Timeline</Label>
              <Timeline items={eventsFor(o, evs).slice(0, 4).map((e) => ({ title: e.title, meta: `${e.at} · ${e.by}` }))} />
            </section>
          </div>
        )}
      </Drawer>
      {flow.node}
    </>
  );
}
