"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Check, CornerDownRight, Keyboard, Settings2, Star as StarIcon, X } from 'lucide-react';
import { Avatar, Button, Card, Checkbox, Chip, CountUp, Drawer, DropdownMenu, EmptyState, Field, IconButton, Lightbox, Modal, PageHeader, Pill, Progress, Select, Skeleton, Switch, Tabs, stagger, useFakeLoad } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp, useRoute } from '../store';
import { PRODUCTS, photo } from '../data/seed';
import { cn } from '../lib/format';
import { RATING_BARS, REJECT_REASONS, REPLY_TEMPLATES, SEED_REVIEWS, type AiTag, type RStatus, type Review } from './reviews/data';

const TABS: RStatus[] = ['Pending', 'Approved', 'Rejected', 'Flagged'];
const AI_TONE: Record<AiTag, 'success' | 'neutral' | 'warning' | 'danger'> = { Positive: 'success', Neutral: 'neutral', Negative: 'warning', 'Possible spam': 'danger' };
const prod = (id: string) => PRODUCTS.find((p) => p.id === id)!;

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} strokeWidth={1.5} className={cn('text-champagne', i <= n ? 'fill-current' : 'opacity-40')} style={i <= n ? { animation: 'pop 380ms var(--ease) both', animationDelay: `${i * 90}ms` } : undefined} />
      ))}
    </span>
  );
}

const RULES = [
  ['Links or web addresses', 'Hold any review that contains a link', true],
  ['Offensive words', 'Hold reviews containing words from the blocked list', true],
  ['One-star from unverified buyers', 'Send to Flagged for a closer look', false],
  ['Same customer posting repeatedly', 'More than three reviews in a day', true],
  ['Phone numbers and email addresses', 'Protect customer privacy', false],
] as const;

export default function Reviews() {
  const { toast } = useApp();
  const { query } = useRoute();
  const loading = useFakeLoad(600);
  const [items, setItems] = useState<Review[]>(SEED_REVIEWS);
  const [tab, setTab] = useState<RStatus>(TABS.includes(query.tab as RStatus) ? (query.tab as RStatus) : 'Pending');
  const [product, setProduct] = useState('All products');
  const [rating, setRating] = useState('Any rating');
  const [withPhotos, setWithPhotos] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [exiting, setExiting] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [replying, setReplying] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [zoom, setZoom] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rules, setRules] = useState<boolean[]>(RULES.map((r) => r[2]));

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, items.filter((r) => r.status === t).length])) as Record<RStatus, number>, [items]);
  const productNames = useMemo(() => ['All products', ...Array.from(new Set(items.map((r) => prod(r.productId).name)))], [items]);
  const list = items.filter((r) => r.status === tab && (product === 'All products' || prod(r.productId).name === product) && (rating === 'Any rating' || r.rating === +rating[0]) && (!withPhotos || r.photos.length) && (!verified || r.verified));

  const move = (ids: string[], status: RStatus, extra?: Partial<Review>) => {
    setExiting((e) => [...e, ...ids]);
    setTimeout(() => {
      setItems((a) => a.map((r) => (ids.includes(r.id) ? { ...r, status, ...extra } : r)));
      setExiting((e) => e.filter((x) => !ids.includes(x)));
      setSel((s) => s.filter((x) => !ids.includes(x)));
    }, 380);
  };
  const approve = (ids: string[]) => { move(ids, 'Approved'); toast(ids.length > 1 ? `${ids.length} reviews approved` : 'Review approved', { star: true }); };
  const submitReject = () => {
    if (!reason) return setReasonErr('Please choose a reason so the customer can be told.');
    move([rejecting!], 'Rejected', { reason: note ? `${reason}: ${note}` : reason });
    toast('Review rejected', { body: reason }); setRejecting(null); setReason(''); setNote(''); setReasonErr('');
  };
  const feature = (id: string) => setItems((a) => a.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r)));
  const sendReply = () => {
    if (!replyText.trim()) return;
    setItems((a) => a.map((r) => (r.id === replying ? { ...r, reply: replyText.trim() } : r)));
    setReplying(null); setReplyText(''); toast('Reply posted');
  };

  const live = useRef({ visible: list, focus });
  live.current = { visible: list.filter((r) => !exiting.includes(r.id)), focus };
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey || rejecting || zoom || rulesOpen) return;
      const { visible: v, focus: fc } = live.current; if (!v.length) return;
      const idx = v.findIndex((r) => r.id === fc); const cur = v[idx];
      const k = e.key.toLowerCase();
      if (k === 'arrowdown') { e.preventDefault(); const nx = v[Math.min(v.length - 1, idx + 1)]; setFocus(nx.id); document.getElementById(`rv-${nx.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      else if (!cur) return;
      else if (k === 'a' && cur.status !== 'Approved') { const nx = v[idx + 1] ?? v[idx - 1]; approve([cur.id]); setFocus(nx?.id ?? null); }
      else if (k === 'r' && cur.status !== 'Rejected') setRejecting(cur.id);
      else if (k === 'f') feature(cur.id);
    };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }); // eslint-disable-line

  const avgBase = RATING_BARS.reduce((a, b) => a + b.n, 0);
  const rejectTarget = items.find((r) => r.id === rejecting);

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Read each guest book entry, then approve, reply or set it aside."
        actions={<>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-muted"><Keyboard size={14} strokeWidth={1.5} /> <kbd className="px-1.5 rounded bg-stone">A</kbd> approve <kbd className="px-1.5 rounded bg-stone">R</kbd> reject <kbd className="px-1.5 rounded bg-stone">F</kbd> feature <kbd className="px-1.5 rounded bg-stone">&darr;</kbd> next</span>
          <DropdownMenu trigger={<IconButton icon={Settings2} label="Review settings" />} items={[{ label: 'Auto-flag rules', icon: Settings2, onClick: () => setRulesOpen(true) }, { label: 'Clear filters', onClick: () => { setProduct('All products'); setRating('Any rating'); setWithPhotos(false); setVerified(false); } }]} />
        </>} />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_200px] gap-8 items-center">
          <div>
            <div className="font-title text-[64px] leading-none"><CountUp value={4.7} decimals={1} /></div>
            <div className="mt-2"><Stars n={5} size={18} /></div>
            <div className="text-muted text-[13px] mt-1">from {avgBase} reviews</div>
          </div>
          <div className="space-y-2">
            {RATING_BARS.map((b) => (
              <div key={b.s} className="flex items-center gap-3 text-[13px]"><span className="w-6 num flex items-center gap-0.5">{b.s}<StarIcon size={11} className="text-champagne fill-current" /></span><Progress className="flex-1" value={(b.n / avgBase) * 100} color="var(--champagne)" /><span className="w-10 text-right text-muted num">{b.n}</span></div>
            ))}
          </div>
          <div className="md:border-l md:border-line md:pl-8">
            <div className="label-caps">Reviews this month</div>
            <div className="text-[32px] font-semibold mt-1"><CountUp value={38} /></div>
            <div className="text-muted text-[13px]">12 more than September</div>
          </div>
        </div>
      </Card>

      <Tabs className="mb-5" value={tab} onChange={(t) => { setTab(t); setSel([]); }} tabs={TABS.map((t) => ({ id: t, label: t, count: counts[t] }))} />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select className="w-52" value={product} onChange={setProduct} options={productNames} />
        <Select className="w-40" value={rating} onChange={setRating} options={['Any rating', '5 stars', '4 stars', '3 stars', '2 stars', '1 star']} />
        <Chip active={withPhotos} onClick={() => setWithPhotos(!withPhotos)}>With photos</Chip>
        <Chip active={verified} onClick={() => setVerified(!verified)}>Verified purchase</Chip>
        <div className="flex-1" />
        {tab === 'Pending' && list.length > 0 && (
          <>
            <Checkbox checked={sel.length === list.length && sel.length > 0} indeterminate={sel.length > 0} onChange={(v) => setSel(v ? list.map((r) => r.id) : [])} label="Select all" />
            <Button size="sm" icon={Check} disabled={!sel.length} onClick={() => approve(sel)}>Approve selected{sel.length ? ` (${sel.length})` : ''}</Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <Card hover={false}>
          {tab === 'Pending' && counts.Pending === 0 ? (
            <div className="flex flex-col items-center text-center py-14"><Star size={40} twinkle /><div className="font-title text-[30px] mt-3">All reviews are moderated</div><div className="text-muted mt-1">Nothing is waiting for you. Enjoy the quiet.</div></div>
          ) : <EmptyState title="No reviews here" body="Try another tab or clear the filters." />}
        </Card>
      ) : (
        <div className="space-y-5">
          {list.map((r, i) => {
            const p = prod(r.productId); const out = exiting.includes(r.id);
            return (
              <div key={r.id} id={`rv-${r.id}`} className={cn('transition-all duration-[380ms] ease-[var(--ease)]', out && 'opacity-0 translate-x-24 scale-[0.98]')} style={out ? { maxHeight: 0, marginBottom: -20, overflow: 'hidden' } : { maxHeight: 900 }}>
                <Card hover={false} onClick={() => setFocus(r.id)} style={stagger(i)} className={cn('!p-7', focus === r.id && 'ring-2 ring-champagne')}>
                  <div className="flex gap-5">
                    {tab === 'Pending' && <div className="pt-1"><Checkbox checked={sel.includes(r.id)} onChange={(v) => setSel(v ? [...sel, r.id] : sel.filter((x) => x !== r.id))} /></div>}
                    <img src={photo(p.photo, 120, 150)} alt={p.name} className="w-16 h-20 rounded-xl object-cover bg-stone shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Stars n={r.rating} />
                        <span className="text-[13px] text-muted">{p.name}</span>
                        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[12px] font-medium bg-stone text-fg"><Star size={10} />{r.ai}<span className={cn('size-1.5 rounded-full bg-current', r.ai === 'Possible spam' ? 'text-bad' : r.ai === 'Negative' ? 'text-warn' : r.ai === 'Positive' ? 'text-ok' : 'text-muted')} /></span>
                        {r.featured && <Pill tone="champagne" icon={StarIcon}>Featured</Pill>}
                        {tab === 'Flagged' && <Pill tone="danger">Held by auto-flag</Pill>}
                      </div>
                      <h3 className="font-title text-[26px] leading-tight mt-2">{r.title}</h3>
                      <p className="text-[15px] leading-relaxed mt-1.5 max-w-3xl">{r.text}</p>
                      {r.photos.length > 0 && (
                        <div className="flex gap-3 mt-4">
                          {r.photos.map((ph) => <button key={ph} onClick={(e) => { e.stopPropagation(); setZoom(photo(ph, 1000, 1250)); }} className="group overflow-hidden rounded-2xl cursor-zoom-in"><img src={photo(ph, 320, 400)} alt="Customer photo" className="w-32 h-40 md:w-40 md:h-52 object-cover transition-transform duration-500 group-hover:scale-105" /></button>)}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-4 text-[13px]">
                        <Avatar name={r.name} size={28} /><span className="font-medium">{r.name}</span>
                        {r.verified ? <span className="inline-flex items-center gap-1 text-sage"><BadgeCheck size={15} strokeWidth={1.5} />Verified purchase</span> : <span className="text-muted">Not a verified purchase</span>}
                        <span className="text-muted">{r.date}</span>
                      </div>
                      {r.reason && <div className="text-[13px] text-bad mt-2">Rejected: {r.reason}</div>}
                      {r.reply && <div className="mt-4 pl-4 border-l-2 border-champagne text-[14px]"><div className="label-caps mb-1">Your reply</div>{r.reply}</div>}
                      {replying === r.id && (
                        <div className="mt-4 anim-fade-up" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap gap-2 mb-3">{REPLY_TEMPLATES.map((t, k) => <Chip key={k} onClick={() => setReplyText(t)}>Template {k + 1}</Chip>)}</div>
                          <Field multiline rows={3} label="Your reply" value={replyText} onChange={setReplyText} />
                          <div className="flex justify-end gap-2 mt-3"><Button size="sm" variant="ghost" onClick={() => setReplying(null)}>Cancel</Button><Button size="sm" disabled={!replyText.trim()} onClick={sendReply}>Post reply</Button></div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-5" onClick={(e) => e.stopPropagation()}>
                        {r.status !== 'Approved' && <Button size="sm" icon={Check} onClick={() => approve([r.id])}>Approve</Button>}
                        {r.status !== 'Rejected' && <Button size="sm" variant="secondary" icon={X} onClick={() => setRejecting(r.id)}>Reject</Button>}
                        <Button size="sm" variant="secondary" icon={CornerDownRight} onClick={() => { setReplying(r.id); setReplyText(r.reply ?? ''); }}>Reply</Button>
                        <button onClick={() => feature(r.id)} className={cn('ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] border transition-all duration-200', r.featured ? 'border-champagne text-fg bg-champagne/15' : 'border-line text-muted hover:text-fg hover:border-champagne')}>
                          <StarIcon size={14} strokeWidth={1.5} className={cn('text-champagne', r.featured && 'fill-current anim-pop')} />Feature on product page
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!rejecting} onClose={() => { setRejecting(null); setReasonErr(''); }} title="Reject this review" size="sm"
        footer={<><Button variant="secondary" onClick={() => { setRejecting(null); setReasonErr(''); }}>Cancel</Button><Button variant="danger" onClick={submitReject}>Reject review</Button></>}>
        <p className="text-muted text-[14px] mb-4">&ldquo;{rejectTarget?.title}&rdquo; by {rejectTarget?.name}</p>
        <Select label="Reason" value={reason} onChange={(v) => { setReason(v); setReasonErr(''); }} options={[{ value: '', label: 'Choose a reason' }, ...REJECT_REASONS]} />
        {reasonErr && <div className="text-bad text-[12px] mt-1.5 anim-shake">{reasonErr}</div>}
        <Field className="mt-4" multiline rows={3} label="Note (optional)" value={note} onChange={setNote} />
      </Modal>

      <Drawer open={rulesOpen} onClose={() => setRulesOpen(false)} title="Auto-flag rules" subtitle="Reviews that match are sent to Flagged." width={460} footer={<Button onClick={() => { setRulesOpen(false); toast('Rules saved'); }}>Done</Button>}>
        <div className="space-y-5">
          {RULES.map((r, i) => (
            <div key={r[0]} className="flex items-start justify-between gap-4 anim-fade-up" style={stagger(i)}>
              <div><div className="font-medium">{r[0]}</div><div className="text-muted text-[13px]">{r[1]}</div></div>
              <Switch label={r[0]} checked={rules[i]} onChange={(v) => setRules(rules.map((x, k) => (k === i ? v : x)))} />
            </div>
          ))}
        </div>
      </Drawer>
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}

