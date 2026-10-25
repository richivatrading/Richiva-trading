"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Check, Clock, Download, FileLock2, ShieldCheck } from 'lucide-react';
import { Button, PageHeader, Card, CelebrateState, DataTable, Drawer, Field, Modal, Pill, Progress, SearchInput, Skeleton, Tabs, useFakeLoad, type Col } from '../ui/kit';
import { cn } from '../lib/format';
import { useApp, navigate } from '../store';
import { deletedCustomersStore, logAudit } from '../data/seed';
import { SEED, customerOf, dataCounts, daysLeft, dueOf, fmtDate, receivedOf, TODAY, type PrvStatus, type Req } from './privacy/data';

const STATUSES: PrvStatus[] = ['New', 'In progress', 'Completed', 'Rejected'];
const audit = (action: string, item: string, before: string, after: string) => logAudit({ user: 'Anita Shrestha', module: 'Privacy', action, item, before, after });

function DueChip({ r }: { r: Req }) {
  const d = daysLeft(r);
  if (r.status === 'Completed' || r.status === 'Rejected') return <span className="text-muted text-[13px]">Closed</span>;
  const over = d < 0; const soon = d <= 7;
  return (
    <Pill tone={over ? 'danger' : soon ? 'warning' : 'neutral'} className="num">
      <span className={cn('size-1.5 rounded-full bg-current pulse-dot', over ? 'text-bad' : soon ? 'text-warn' : 'text-muted')} />
      {over ? `${-d} ${-d === 1 ? 'day' : 'days'} overdue` : d === 0 ? 'Due today' : `${d} ${d === 1 ? 'day' : 'days'} left`}
    </Pill>
  );
}
function LiveCountdown({ r }: { r: Req }) {
  const [now, setNow] = useState(() => TODAY.getTime());
  useEffect(() => { const t = setInterval(() => setNow((n) => n + 1000), 1000); return () => clearInterval(t); }, []);
  const ms = dueOf(r).getTime() - now; const over = ms < 0; const a = Math.abs(ms);
  const p = (n: number) => String(Math.floor(n)).padStart(2, '0');
  return (
    <div className={cn('rounded-xl border px-4 py-3 flex items-center justify-between', over ? 'border-bad/40 bg-[color-mix(in_srgb,var(--bad)_8%,transparent)]' : 'border-line bg-soft')}>
      <div><div className="label-caps">{over ? 'Overdue by' : 'Time left to reply'}</div><div className={cn('text-[26px] font-semibold num', over && 'text-bad')}>{Math.floor(a / 86400000)}d {p((a / 3600000) % 24)}:{p((a / 60000) % 60)}:{p((a / 1000) % 60)}</div></div>
      <div className="text-right text-[12.5px] text-muted">Due by<br /><b className="text-fg font-medium">{fmtDate(dueOf(r))}</b></div>
    </div>
  );
}

export default function Privacy() {
  const { toast } = useApp();
  const loading = useFakeLoad(600);
  const [reqs, setReqs] = useState<Req[]>(SEED);
  const [tab, setTab] = useState<PrvStatus>('New');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [exp, setExp] = useState<Record<string, { p: number; sent: boolean }>>({});
  const [modal, setModal] = useState<null | 'delete' | 'reject'>(null);
  const [word, setWord] = useState(''); const [reason, setReason] = useState(''); const [tried, setTried] = useState(false);
  const timers = useRef<Record<string, number>>({});
  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), []);

  const cur = reqs.find((r) => r.id === openId) ?? null;
  const counts = (s: PrvStatus) => reqs.filter((r) => r.status === s).length;
  const overdue = reqs.filter((r) => (r.status === 'New' || r.status === 'In progress') && daysLeft(r) < 0);
  const openCount = counts('New') + counts('In progress');
  const rows = useMemo(() => reqs.filter((r) => r.status === tab && (!q || `${r.id} ${r.customer} ${r.type}`.toLowerCase().includes(q.toLowerCase()))), [reqs, tab, q]);
  const setStatus = (id: string, status: PrvStatus, note?: string) => setReqs((a) => a.map((r) => (r.id === id ? { ...r, status, note: note ?? r.note } : r)));
  const openModal = (m: 'delete' | 'reject') => { setWord(''); setReason(''); setTried(false); setModal(m); };

  const startWork = (r: Req) => { setStatus(r.id, 'In progress'); audit('Started privacy request', r.id, 'New', 'In progress'); toast('Request started', { body: r.id }); };
  const verify = (r: Req, k: 'email' | 'phone') => { setReqs((a) => a.map((x) => (x.id === r.id ? { ...x, [k]: true } : x))); audit(`Verified customer ${k}`, r.id, `${k}: not verified`, `${k}: verified`); toast(`${k === 'email' ? 'Email' : 'Phone'} marked as verified`); };
  const prepare = (r: Req) => {
    audit('Started data export', r.id, 'Not prepared', 'Preparing');
    setExp((e) => ({ ...e, [r.id]: { p: 0, sent: false } }));
    timers.current[r.id] = window.setInterval(() => setExp((e) => {
      const p = Math.min(100, (e[r.id]?.p ?? 0) + 7 + Math.random() * 9);
      if (p >= 100) { clearInterval(timers.current[r.id]); audit('Data export ready', r.id, 'Preparing', 'Ready (zip, 2.4 MB)'); }
      return { ...e, [r.id]: { p, sent: false } };
    }), 280);
  };
  const sendLink = (r: Req) => {
    setExp((e) => ({ ...e, [r.id]: { p: 100, sent: true } })); setStatus(r.id, 'Completed');
    audit('Sent secure export link', r.id, 'Ready', 'Link sent, expires in 7 days'); toast('Secure link sent', { body: r.customer, star: true });
  };
  const doDelete = (r: Req) => {
    setTried(true); if (word !== 'DELETE' || reason.trim().length < 5) return;
    const c = customerOf(r.customer); if (c) deletedCustomersStore.set((a) => (a.includes(c.id) ? a : [...a, c.id]));
    setStatus(r.id, 'Completed', reason.trim());
    audit('Deleted customer data', `${r.id} / ${c?.id ?? r.customer}`, 'Profile, addresses, try-on and reviews present', `Deleted. Kept by law: invoices. Reason: ${reason.trim()}`);
    setModal(null); toast('Data deleted', { body: `${r.customer} is marked "Data deleted"`, star: true });
  };
  const doReject = (r: Req) => {
    setTried(true); if (reason.trim().length < 10) return;
    setStatus(r.id, 'Rejected', reason.trim());
    audit('Rejected privacy request', r.id, r.status, `Rejected: ${reason.trim()}`);
    setModal(null); toast('Message sent', { body: `${r.customer} was told why, in plain words` });
  };
  const doCorrect = (r: Req) => { setStatus(r.id, 'Completed'); audit('Corrected customer data', r.id, 'Correction pending', 'Corrected and confirmed'); toast('Marked as corrected', { body: r.customer }); };

  const cols: Col<Req>[] = [
    { key: 'id', header: 'Request', sort: (r) => r.id, render: (r) => <span className="font-medium num">{r.id}</span> },
    { key: 'cust', header: 'Customer', sort: (r) => r.customer, render: (r) => <span>{r.customer}{deletedCustomersStore.get().includes(customerOf(r.customer)?.id ?? '') && <Pill className="ml-2">Data deleted</Pill>}</span> },
    { key: 'type', header: 'Type', sort: (r) => r.type, hideBelow: 'lg', render: (r) => r.type },
    { key: 'rec', header: 'Received', sort: (r) => -r.ago, hideBelow: 'lg', render: (r) => <span className="text-muted">{fmtDate(receivedOf(r))}</span> },
    { key: 'due', header: 'Due', sort: (r) => daysLeft(r), render: (r) => <DueChip r={r} /> },
    { key: 'status', header: 'Status', render: (r) => <Pill tone={r.status === 'Completed' ? 'success' : r.status === 'Rejected' ? 'danger' : r.status === 'New' ? 'info' : 'warning'} dot>{r.status}</Pill> },
  ];

  const ex = cur ? exp[cur.id] : undefined;
  const idOk = cur ? cur.email || cur.phone || !!cur.order : false;
  const closed = cur ? cur.status === 'Completed' || cur.status === 'Rejected' : false;

  return (
    <div>
      <PageHeader title="Privacy requests" subtitle={`${overdue.length ? `${overdue.length} ${overdue.length === 1 ? 'request is' : 'requests are'} overdue. ` : ''}Customers can ask to see, correct or delete their data. We reply within 30 days.`} />
      {overdue.length > 0 && (
        <div className="rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3 text-bad bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] border border-bad/30 anim-fade-up">
          <CalendarClock size={20} strokeWidth={1.5} /><div className="text-[14px]"><b className="font-semibold">{overdue.length} {overdue.length === 1 ? 'request is' : 'requests are'} overdue.</b> Please reply today: {overdue.map((o) => o.customer).join(' and ')}.</div>
        </div>
      )}
      <Card pad={false} hover={false}>
        <div className="px-5 pt-2 flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={STATUSES.map((s) => ({ id: s, label: s, count: counts(s) }))} value={tab} onChange={setTab} className="flex-1 min-w-0 border-b-0" />
          <SearchInput value={q} onChange={setQ} placeholder="Search by number, name or type" className="w-72 max-w-full mb-2" />
        </div>
        <div className="border-t border-line">
          {openCount === 0 && !loading && (tab === 'New' || tab === 'In progress') ? (
            <CelebrateState title="All requests handled on time" body="Nothing is waiting for you. Thank you for looking after customer data." />
          ) : (
            <DataTable loading={loading} columns={cols} rows={rows} rowId={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} activeId={openId}
              defaultSort={{ key: 'due', dir: 'asc' }} empty={<div className="py-14 text-center text-muted">No {tab.toLowerCase()} requests{q ? ' match your search' : ''}.</div>} />
          )}
        </div>
      </Card>
      {loading && <div className="hidden"><Skeleton /></div>}

      <Drawer open={!!cur} onClose={() => setOpenId(null)} width={560} title={cur?.id} subtitle={cur && `${cur.customer} · ${cur.type}`}
        actions={cur && <Pill tone={cur.status === 'Completed' ? 'success' : cur.status === 'Rejected' ? 'danger' : cur.status === 'New' ? 'info' : 'warning'} dot className="mr-2">{cur.status}</Pill>}>
        {cur && (
          <div className="flex flex-col gap-6" key={cur.id}>
            {closed ? <div className="rounded-xl bg-soft px-4 py-3 text-[13.5px] flex items-center gap-2"><Check size={16} className="text-ok" />This request is {cur.status.toLowerCase()}. {cur.note}</div> : <LiveCountdown r={cur} />}
            <section>
              <div className="label-caps mb-2 flex items-center gap-2"><ShieldCheck size={14} />Identity check</div>
              {([['Email', cur.email, customerOf(cur.customer)?.email ?? 'on file', 'email'], ['Phone', cur.phone, customerOf(cur.customer)?.phone ?? 'on file', 'phone'], ['Order', !!cur.order, cur.order ? `Matched ${cur.order}` : 'No order given', null]] as const).map(([k, ok, v, key]) => (
                <div key={k} className="flex items-center justify-between py-2.5 border-b border-line last:border-0 text-[14px]">
                  <div><div className="text-muted text-[12px]">{k}</div>{v}</div>
                  {ok ? <Pill tone="success" icon={Check}>Verified</Pill> : key && !closed ? <Button size="sm" variant="secondary" onClick={() => verify(cur, key)}>Mark verified</Button> : <Pill tone="warning">Not verified</Pill>}
                </div>
              ))}
              {!idOk && <div className="text-warn text-[12.5px] mt-2">Please verify at least one detail before sharing or deleting anything.</div>}
            </section>
            <section>
              <div className="label-caps mb-2 flex items-center gap-2"><FileLock2 size={14} />Data we hold</div>
              <div className="grid grid-cols-5 gap-2">
                {dataCounts(cur.customer).map((d, i) => <div key={d.k} className="rounded-xl bg-soft border border-line p-3 text-center anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}><div className="text-[22px] font-semibold num">{d.n}</div><div className="text-[11.5px] text-muted leading-tight">{d.k}</div></div>)}
              </div>
            </section>
            <section>
              <div className="label-caps mb-3">What would you like to do?</div>
              {closed ? <div className="text-muted text-[13.5px]">Nothing more to do. Every step is saved in the audit log.</div> : (
                <div className="flex flex-col gap-3">
                  {cur.status === 'New' && <Button variant="secondary" icon={Clock} onClick={() => startWork(cur)}>Start working on this</Button>}
                  {cur.type === 'Export my data' && (
                    <div className="rounded-xl border border-line p-4">
                      <div className="text-[14px] mb-1">Export my data</div>
                      <div className="text-muted text-[12.5px] mb-3">Gathers profile, orders, addresses, try-on and reviews into one file.</div>
                      {!ex ? <Button icon={Download} disabled={!idOk} onClick={() => prepare(cur)}>Prepare export</Button> : (
                        <div>
                          <div className="flex justify-between text-[12.5px] mb-1.5"><span>{ex.p >= 100 ? 'Export ready (2.4 MB)' : 'Preparing export…'}</span><span className="num">{Math.round(ex.p)}%</span></div>
                          <Progress value={ex.p} color="var(--champagne)" />
                          {ex.p >= 100 && <Button className="mt-4 anim-fade-in" onClick={() => sendLink(cur)}>Send secure link to customer</Button>}
                        </div>
                      )}
                    </div>
                  )}
                  {cur.type === 'Delete my data' && <Button variant="danger" disabled={!idOk} onClick={() => openModal('delete')}>Review and delete data</Button>}
                  {cur.type === 'Correct my data' && (
                    <div className="rounded-xl border border-line p-4 flex flex-wrap gap-2">
                      <Button variant="secondary" disabled={!customerOf(cur.customer)} onClick={() => navigate(`/customers/${customerOf(cur.customer)?.id}`)}>Open customer profile</Button>
                      <Button disabled={!idOk} onClick={() => doCorrect(cur)}>Mark as corrected</Button>
                    </div>
                  )}
                  <Button variant="ghost" onClick={() => openModal('reject')}>Reject this request</Button>
                </div>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <Modal open={modal === 'delete' && !!cur} onClose={() => setModal(null)} title="Delete this customer's data" size="md"
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" onClick={() => cur && doDelete(cur)}>Delete data</Button></>}>
        {cur && <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-line p-4"><div className="label-caps mb-2">Will be deleted</div><ul className="text-[13.5px] space-y-1">{dataCounts(cur.customer).map((d) => <li key={d.k}>{d.k} <span className="text-muted num">({d.n})</span></li>)}</ul></div>
            <div className="rounded-xl border border-line bg-soft p-4"><div className="label-caps mb-2">Must be kept by law</div><ul className="text-[13.5px] space-y-1"><li>Invoices</li><li>Tax and VAT records</li></ul><div className="text-muted text-[12px] mt-2">Nepal tax rules require these for 6 years. They are locked and made anonymous where possible.</div></div>
          </div>
          <Field label="Type DELETE to confirm" value={word} onChange={setWord} error={tried && word !== 'DELETE' ? 'Please type DELETE in capital letters.' : undefined} />
          <Field label="Reason" multiline rows={2} value={reason} onChange={setReason} error={tried && reason.trim().length < 5 ? 'Please write a short reason (5 letters or more).' : undefined} />
        </div>}
      </Modal>
      <Modal open={modal === 'reject' && !!cur} onClose={() => setModal(null)} title="Reject this request" size="sm"
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => cur && doReject(cur)}>Reject and send message</Button></>}>
        <div className="text-muted mb-4">The customer will get your reason in a polite message.</div>
        <Field label="Reason" multiline rows={3} value={reason} onChange={setReason} error={tried && reason.trim().length < 10 ? 'Please explain in at least 10 letters.' : undefined} />
      </Modal>
    </div>
  );
}

