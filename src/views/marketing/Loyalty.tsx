"use client";
import { useState } from 'react';
import { Card, CardHeader, CountUp, Field, Label, SaveBar, Slider, Switch } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { useApp } from '../../store';
import { CUSTOMERS } from '../../data/seed';
import { rs } from '../../lib/format';
import { loyaltyStore } from './data';

export default function Loyalty() {
  const { toast } = useApp();
  const [saved, setSaved] = loyaltyStore.use();
  const [c, setC] = useState(saved);
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);
  const tierErr = c.gold <= c.silver ? 'Gold must be higher than Silver.' : c.silver <= 0 ? 'Silver needs an amount above zero.' : '';
  const perk = (t: string, p: Partial<(typeof c.perks)[string]>) => setC({ ...c, perks: { ...c.perks, [t]: { ...c.perks[t], ...p } } });
  const members = { Bronze: CUSTOMERS.filter((x) => x.spent < c.silver).length, Silver: CUSTOMERS.filter((x) => x.spent >= c.silver && x.spent < c.gold).length, Gold: CUSTOMERS.filter((x) => x.spent >= c.gold).length };
  const save = () => { if (tierErr) return toast('Fix the tier amounts first'); setSaved(c); toast('Loyalty programme saved', { star: true }); };
  const num = (v: string) => Math.max(0, +v || 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card hover={false}>
        <CardHeader title="Earning points" sub="How customers collect points" />
        <div className="flex items-end justify-between mb-2"><Label>Points per Rs 100</Label><span className="font-title text-[40px] leading-none"><CountUp value={c.points} /></span></div>
        <Slider min={1} max={10} value={c.points} onChange={(v) => setC({ ...c, points: v })} />
        <div className="mt-5 text-[14px] flex items-center gap-2"><Star size={14} twinkle />A {rs(5000)} order earns <b className="font-medium"><CountUp value={c.points * 50} /></b> points</div>
      </Card>
      <Card hover={false}>
        <CardHeader title="Tier thresholds" sub="Total spent to reach each tier" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bronze (Rs)" value={0} disabled />
          <Field label="Silver (Rs)" type="number" value={c.silver} onChange={(v) => setC({ ...c, silver: num(v) })} error={tierErr && c.silver <= 0 ? ' ' : undefined} />
          <Field label="Gold (Rs)" type="number" value={c.gold} onChange={(v) => setC({ ...c, gold: num(v) })} error={tierErr && c.gold <= c.silver ? ' ' : undefined} />
        </div>
        {tierErr && <div className="text-bad text-[12px] mt-2">{tierErr}</div>}
        <div className="flex gap-6 mt-5 text-[13px] text-muted">{(['Bronze', 'Silver', 'Gold'] as const).map((t) => <span key={t}>{t} <b className="text-fg font-medium"><CountUp value={members[t]} /></b> customers</span>)}</div>
      </Card>
      <Card hover={false} className="lg:col-span-2">
        <CardHeader title="Tier perks" sub="What each tier unlocks" />
        <div className="grid md:grid-cols-3 gap-5">
          {(['Bronze', 'Silver', 'Gold'] as const).map((t) => (
            <div key={t} className="rounded-2xl bg-soft border border-line p-5 space-y-4">
              <div className="font-title text-[26px]">{t}</div>
              <Field label="Extra discount (%)" type="number" value={c.perks[t].disc} onChange={(v) => perk(t, { disc: Math.min(50, num(v)) })} />
              <Field label="Extra try-on minutes" type="number" value={c.perks[t].tryon} onChange={(v) => perk(t, { tryon: num(v) })} />
              <div className="flex items-center justify-between text-[14px]">Free delivery<Switch label={`${t} free delivery`} checked={c.perks[t].ship} onChange={(v) => perk(t, { ship: v })} /></div>
            </div>
          ))}
        </div>
      </Card>
      <Card hover={false} className="lg:col-span-2">
        <CardHeader title="Referral rewards" sub="Invite a friend, both are rewarded" />
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Friend saves (Rs)" type="number" value={c.refFriend} onChange={(v) => setC({ ...c, refFriend: num(v) })} />
          <Field label="You give credit (Rs)" type="number" value={c.refYou} onChange={(v) => setC({ ...c, refYou: num(v) })} />
          <Field label="Friend's minimum order (Rs)" type="number" value={c.refMin} onChange={(v) => setC({ ...c, refMin: num(v) })} />
        </div>
        <div className="mt-5 rounded-xl bg-soft border border-line p-4 text-[14px] flex items-center gap-2"><Star size={14} twinkle className="shrink-0" /><span key={`${c.refFriend}${c.refYou}${c.refMin}`} className="anim-fade-in">When a friend places their first order of {rs(c.refMin)} or more, they save {rs(c.refFriend)} and the customer who invited them receives {rs(c.refYou)} credit.</span></div>
      </Card>
      <SaveBar show={dirty} onSave={save} onDiscard={() => setC(saved)} />
    </div>
  );
}

