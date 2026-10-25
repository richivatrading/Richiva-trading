"use client";
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Ban, Copy, Download, MessageSquare, MoreHorizontal, PenLine, ShieldAlert, Trash2, ArrowUpRight } from 'lucide-react';
import { Avatar, Button, Card, CountUp, EmptyState, Field, Label, Modal, Pill, Select, Skeleton, StatusPill, Tabs, stagger, useFakeLoad, DropdownMenu, IconButton } from '../../ui/kit';
import { blockedCustomersStore, customersStore, deletedCustomersStore, ordersStore, ORDERS, type Customer } from '../../data/seed';
import { navigate, useApp } from '../../store';
import { rs } from '../../lib/format';
import OrderDrawer from '../orders/OrderDrawer';
import { AmountModal, MessageModal } from './Modals';
import { TabBody, type Ctx } from './ProfileTabs';
import { createPrivacy, privacyStore, redact } from './shared';

type TabId = 'Overview' | 'Orders' | 'Addresses' | 'Loyalty' | 'Try-on' | 'Reviews' | 'Notes' | 'Activity';
const TABS: TabId[] = ['Overview', 'Orders', 'Addresses', 'Loyalty', 'Try-on', 'Reviews', 'Notes', 'Activity'];

export default function Profile({ id }: { id: string }) {
  const { toast, confirm } = useApp();
  const [all, setAll] = customersStore.use(); const [blocked, setBlocked] = blockedCustomersStore.use(); const [deleted, setDeleted] = deletedCustomersStore.use();
  const [privacy] = privacyStore.use(); const [orders] = ordersStore.use();
  const loading = useFakeLoad(600, [id]);
  const c = all.find((x) => x.id === id);
  const [tab, setTab] = useState<TabId>('Overview');
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [msg, setMsg] = useState(false); const [note, setNote] = useState(false); const [noteText, setNoteText] = useState(''); const [noteErr, setNoteErr] = useState('');
  const [merge, setMerge] = useState(false); const [dupId, setDupId] = useState('');
  const [points, setPoints] = useState(false); const [credit, setCredit] = useState(false);
  const [notes, setNotes] = useState<{ text: string; time: string }[]>([{ text: 'Prefers WhatsApp over calls. Usually orders before festivals.', time: '3 Oct 2026, by Maya Tuladhar' }]);
  const [activity, setActivity] = useState<{ title: string; meta: string }[]>([{ title: 'Placed an order', meta: 'Recently' }, { title: 'Logged in from the mobile app', meta: '2 days ago' }, { title: 'Account created', meta: 'Earlier this year' }]);
  const [ledger, setLedger] = useState<{ title: string; amount: number; time: string }[]>([]);
  const [tryUsed, setTryUsed] = useState(2); const [resetOpen, setResetOpen] = useState(false); const [resetWhy, setResetWhy] = useState(''); const [resetErr, setResetErr] = useState('');
  useEffect(() => { setTab('Overview'); setLedger([]); setTryUsed(2); }, [id]);
  const log = (title: string) => setActivity((a) => [{ title, meta: 'Just now' }, ...a]);

  const myOrders = useMemo(() => c ? orders.filter((o) => o.customer === c.name).sort((a, b) => 0) : [], [orders, c]);
  useEffect(() => {
    if (!c || myOrders.length) return;
    const n = Math.min(c.orders, 4); const idx = Number(c.id.slice(1));
    ordersStore.set((os) => [...os, ...Array.from({ length: n }, (_, k) => ({ ...ORDERS[(idx * 3 + k) % ORDERS.length], id: `RCV-${9000 + idx * 10 + k}`, customer: c.name, phone: c.phone, city: c.city, status: 'Delivered' as const, date: `${3 + k * 6} Sep 2026, 14:20`, tracking: `WB${100000 + idx * 7 + k}NP` }))]);
  }, [c?.id, myOrders.length]); // eslint-disable-line

  if (loading) return <div className="space-y-6"><Skeleton className="h-28 w-full" /><div className="grid grid-cols-2 lg:grid-cols-5 gap-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-72 w-full" /></div>;
  if (!c) return <EmptyState title="Customer not found" body="This profile may have been merged or removed." action={<Button variant="secondary" onClick={() => navigate('/customers')}>Back to customers</Button>} />;

  const isDeleted = deleted.includes(c.id); const isBlocked = blocked.includes(c.id);
  const status = isDeleted ? 'Deleted' : isBlocked ? 'Blocked' : c.status === 'Blocked' ? 'Active' : c.status;
  const name = isDeleted ? 'Deleted customer' : c.name;
  const patch = (p: Partial<Customer>) => setAll((cs) => cs.map((x) => (x.id === c.id ? { ...x, ...p } : x)));
  const myPriv = privacy.filter((p) => p.customerId === c.id);
  const dups = all.filter((x) => x.id !== c.id && !deleted.includes(x.id));
  const dup = dups.find((x) => x.id === dupId) ?? dups.find((x) => x.city === c.city) ?? dups[0];

  const block = async () => {
    if (await confirm({ title: `Block ${c.name}?`, body: 'They will not be able to place new orders until you unblock them.', confirmLabel: 'Block customer', danger: true })) {
      setBlocked((b) => [...b, c.id]); log('Blocked by you');
      toast('Customer blocked', { body: c.name, undo: () => setBlocked((b) => b.filter((x) => x !== c.id)) });
    }
  };
  const del = async () => {
    if (await confirm({ title: 'Delete personal data?', body: 'Name, phone, email and addresses will be redacted. Order totals stay for accounting.', confirmLabel: 'Delete data', danger: true })) {
      const pid = createPrivacy(c.id, 'Delete'); setDeleted((d) => [...d, c.id]); log(`Data deletion requested (${pid})`);
      toast(`Privacy request ${pid} created`, { body: 'Track it on the Privacy page.' });
    }
  };
  const exportData = () => { const pid = createPrivacy(c.id, 'Export'); log(`Data export requested (${pid})`); toast(`Privacy request ${pid} created`, { body: 'The export will be ready on the Privacy page.' }); };
  const doMerge = () => {
    if (!dup) return; const prev = all;
    setAll((cs) => cs.filter((x) => x.id !== dup.id).map((x) => x.id === c.id ? { ...x, orders: x.orders + dup.orders, spent: x.spent + dup.spent, points: x.points + dup.points, credit: x.credit + dup.credit, tags: [...new Set([...x.tags, ...dup.tags])] } : x));
    setMerge(false); log(`Merged with ${dup.name}`); toast('Profiles merged', { body: `${dup.name} is now part of ${c.name}.`, undo: () => setAll(prev) });
  };
  const addNote = () => { if (!noteText.trim()) return setNoteErr('Write a note first.'); setNotes((n) => [{ text: noteText.trim(), time: 'Just now, by you' }, ...n]); log('Note added'); setNote(false); setNoteText(''); setNoteErr(''); setTab('Notes'); toast('Note added'); };
  const doReset = () => { if (!resetWhy.trim()) return setResetErr('Please give a reason.'); setTryUsed(0); log(`Try-on time reset: ${resetWhy}`); setResetOpen(false); setResetWhy(''); setResetErr(''); toast("Today's try-on time reset", { body: `${c.name} has 3 minutes again.` }); };

  const aov = c.orders ? c.spent / c.orders : 0;
  const cards: [string, number, (n: number) => string][] = [['Lifetime value', c.spent, rs], ['Orders', c.orders, (n) => String(n)], ['Average order value', aov, rs], ['Loyalty points', c.points, (n) => n.toLocaleString('en-IN')], ['Store credit', c.credit, rs]];
  const ctx: Ctx = { c, name, isDeleted, myOrders, openOrder: setOpenOrder, ledger, adjustPoints: () => setPoints(true), issueCredit: () => setCredit(true), tryUsed, resetTry: () => setResetOpen(true), notes, addNote: () => setNote(true), activity, patch, setTab: (t) => setTab(t as TabId), msg: () => setMsg(true) };

  return (
    <div>
      <button onClick={() => navigate('/customers')} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-fg mb-4 transition-colors"><ArrowLeft size={14} />All customers</button>
      {isBlocked && !isDeleted && <div className="mb-5 rounded-2xl bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] text-bad px-5 py-3.5 flex items-center justify-between gap-3 anim-fade-up"><span className="flex items-center gap-2.5 text-[14px]"><Ban size={18} strokeWidth={1.5} />This customer is blocked and cannot place new orders.</span><Button size="sm" variant="secondary" onClick={() => { setBlocked((b) => b.filter((x) => x !== c.id)); log('Unblocked by you'); toast('Customer unblocked'); }}>Unblock</Button></div>}
      {isDeleted && <div className="mb-5 rounded-2xl bg-stone px-5 py-3.5 flex items-center gap-2.5 text-[14px] anim-fade-up"><ShieldAlert size={18} strokeWidth={1.5} className="text-muted" />Data deleted. Personal details are redacted; order totals are kept for accounting.</div>}
      <Card hover={false} className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5 min-w-0">
            <Avatar name={isDeleted ? 'X X' : c.name} size={84} />
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap"><h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-none">{name}</h1><StatusPill status={status === 'Deleted' ? 'Archived' : status} />{status === 'Deleted' && <span className="sr-only">Deleted</span>}</div>
              <div className="text-muted text-[14px] mt-2 num">{isDeleted ? `${redact(c.phone)} · ${redact(c.email)}` : `${c.phone} · ${c.email} · ${c.city}`}</div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">{c.tags.map((t) => <Pill key={t} tone="champagne">{t}</Pill>)}{!c.tags.length && <span className="text-[13px] text-muted">No tags yet</span>}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button icon={MessageSquare} disabled={isDeleted} onClick={() => setMsg(true)}>Send message</Button>
            <Button variant="secondary" icon={PenLine} onClick={() => setNote(true)}>Add note</Button>
            <DropdownMenu trigger={<IconButton icon={MoreHorizontal} label="More" className="border border-line" />} items={[
              { label: isBlocked ? 'Already blocked' : 'Block', icon: Ban, onClick: () => !isBlocked && block(), danger: true }, { label: 'Merge duplicate', icon: Copy, onClick: () => setMerge(true) }, { divider: true, label: '' },
              { label: 'Export data', icon: Download, onClick: exportData }, { label: 'Delete data', icon: Trash2, danger: true, onClick: () => !isDeleted && del() },
            ]} />
          </div>
        </div>
        {myPriv.length > 0 && <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">{myPriv.slice(0, 2).map((p) => <span key={p.id} className="flex items-center gap-2"><Pill tone="info">{p.id}</Pill>{p.kind} request · {p.time}</span>)}<button className="ml-auto flex items-center gap-1 text-fg hover:text-champagne" onClick={() => navigate('/privacy')}>View on Privacy page<ArrowUpRight size={14} /></button></div>}
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {cards.map(([l, v, f], i) => <Card key={l} style={stagger(i)} className="!p-5"><Label>{l}</Label><div className="text-[28px] font-semibold mt-2 leading-none"><CountUp value={v} format={f} /></div></Card>)}
      </div>
      <Card hover={false} pad={false}>
        <div className="px-5 pt-2"><Tabs<TabId> value={tab} onChange={setTab} tabs={TABS.map((t) => ({ id: t, label: t, count: t === 'Orders' ? myOrders.length : t === 'Notes' ? notes.length : undefined }))} /></div>
        <div className="p-6" key={tab}><div className="anim-fade-up"><TabBody tab={tab} ctx={ctx} /></div></div>
      </Card>

      <OrderDrawer orderId={openOrder} onClose={() => setOpenOrder(null)} />
      <MessageModal open={msg} onClose={() => setMsg(false)} people={[{ name }]} />
      <Modal open={note} onClose={() => setNote(false)} size="sm" title="Add note" footer={<><Button variant="ghost" onClick={() => setNote(false)}>Cancel</Button><Button onClick={addNote}>Save note</Button></>}><Field multiline rows={4} label="Note" value={noteText} onChange={(v) => { setNoteText(v); setNoteErr(''); }} error={noteErr} /></Modal>
      <AmountModal open={points} onClose={() => setPoints(false)} title="Adjust points" label="Points (use a minus to remove)" signed cta="Apply" onSubmit={(n, why) => { patch({ points: Math.max(0, c.points + n) }); setLedger((l) => [{ title: `Adjustment: ${why}`, amount: n, time: 'Just now' }, ...l]); log(`Points adjusted by ${n}: ${why}`); toast('Points adjusted', { body: `${n > 0 ? '+' : ''}${n} points for ${c.name}.` }); }} />
      <AmountModal open={credit} onClose={() => setCredit(false)} title="Issue credit" prefix="Rs" withExpiry cta="Issue credit" onSubmit={(n, why, exp) => { patch({ credit: c.credit + n }); log(`Store credit ${rs(n)} issued: ${why} (expires ${exp})`); toast('Credit issued', { body: `${rs(n)} added to ${c.name}.`, star: true }); }} />
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} size="sm" title="Reset today's time" footer={<><Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button><Button onClick={doReset}>Reset time</Button></>}><Field label="Reason" value={resetWhy} onChange={(v) => { setResetWhy(v); setResetErr(''); }} error={resetErr} /></Modal>
      <Modal open={merge} onClose={() => setMerge(false)} size="lg" title="Merge duplicate" footer={<><Button variant="ghost" onClick={() => setMerge(false)}>Cancel</Button><Button disabled={!dup} onClick={doMerge}>Merge profiles</Button></>}>
        <Select label="Duplicate profile to merge in" value={dup?.id ?? ''} onChange={setDupId} options={dups.map((d) => ({ value: d.id, label: `${d.name} · ${d.city}` }))} />
        {dup && <div className="grid grid-cols-3 gap-4 mt-5 text-[13.5px] anim-fade-up">
          <div className="text-muted">&nbsp;</div><Label>Before</Label><Label>After</Label>
          {([['Name', `${c.name} / ${dup.name}`, c.name], ['Orders', `${c.orders} + ${dup.orders}`, c.orders + dup.orders], ['Total spent', `${rs(c.spent)} + ${rs(dup.spent)}`, rs(c.spent + dup.spent)], ['Loyalty points', `${c.points} + ${dup.points}`, c.points + dup.points], ['Store credit', `${rs(c.credit)} + ${rs(dup.credit)}`, rs(c.credit + dup.credit)], ['Tags', [...c.tags, ...dup.tags].join(', ') || 'None', [...new Set([...c.tags, ...dup.tags])].join(', ') || 'None']] as [string, string, string | number][]).map(([k, b, a]) => <div key={k} className="contents"><div className="text-muted py-2 border-t border-line">{k}</div><div className="py-2 border-t border-line">{b}</div><div className="py-2 border-t border-line font-medium">{a}</div></div>)}
        </div>}
      </Modal>
    </div>
  );
}

