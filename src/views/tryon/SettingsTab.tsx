"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Activity, Camera, Lock, Play, Check } from 'lucide-react';
import { Card, CardHeader, Switch, Button, Field, Label, Segmented, Pill, CountUp, stagger } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { useApp } from '../../store';
import { cn } from '../../lib/format';
import type { TryonSettings } from './state';

export default function SettingsTab({ draft, setDraft }: { draft: TryonSettings; setDraft: Dispatch<SetStateAction<TryonSettings>> }) {
  const { confirm, toast } = useApp();
  const set = (p: Partial<TryonSettings>) => setDraft((d) => ({ ...d, ...p }));
  const [test, setTest] = useState<'idle' | 'running' | 'done'>('idle');
  const [lat, setLat] = useState(212);
  const timer = useRef<number>(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const runTest = () => { setTest('running'); timer.current = window.setTimeout(() => { setLat(180 + Math.floor(Math.random() * 70)); setTest('done'); }, 1600); };
  const toggleLive = async (v: boolean) => {
    if (!v && !(await confirm({ title: 'Turn off live try-on?', body: 'Customers will no longer see the Try it on button until you switch it back on.', confirmLabel: 'Turn off', danger: true }))) return;
    set({ live: v }); if (v) toast('Live try-on is on', { star: true });
  };
  const m = draft.minutes;
  const pct = (m / 10) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className={cn('lg:col-span-2 !p-8 relative overflow-hidden', draft.live && 'border-champagne/60')}>
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2"><Star size={16} twinkle={draft.live} /><Label>Master switch</Label></div>
            <h2 className="font-title text-[40px] leading-tight mt-1">Live try-on</h2>
            <p className="text-muted mt-1 max-w-md">{draft.live ? 'Customers can try garments on with their camera right now.' : 'Try-on is paused. Customers see the regular product photos only.'}</p>
          </div>
          <button role="switch" aria-checked={draft.live} aria-label="Live try-on" onClick={() => toggleLive(!draft.live)}
            className={cn('relative w-24 h-12 rounded-full transition-colors duration-300 shrink-0', draft.live ? 'bg-ink' : 'bg-line')}>
            <span className={cn('absolute top-1 left-1 size-10 rounded-full shadow transition-transform duration-300 ease-[var(--ease)] flex items-center justify-center', draft.live ? 'translate-x-12 bg-champagne' : 'bg-white')}>
              <Star size={16} className={draft.live ? 'text-white' : 'text-muted'} />
            </span>
          </button>
        </div>
      </Card>

      <Card style={stagger(1)}>
        <CardHeader title="Provider" sub="Where try-on images are made" />
        <div className="flex items-center gap-3">
          <span className={cn('size-2.5 rounded-full bg-ok pulse-dot text-ok')} />
          <div className="flex-1"><div className="font-medium">Fitroom Studio</div><div className="text-muted text-[12px]">Kathmandu edge, v2.4</div></div>
          <Pill tone="success">Healthy</Pill>
        </div>
        <div className="mt-5 flex items-center justify-between text-[13px]"><span className="text-muted flex items-center gap-1.5"><Activity size={14} strokeWidth={1.5} />Latency</span><span className="num font-medium">{lat} ms</span></div>
        <div className="mt-5 flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={test === 'running' ? undefined : Play} loading={test === 'running'} onClick={runTest}>Run test</Button>
          {test === 'done' && <span className="text-ok text-[13px] flex items-center gap-1.5 anim-fade-in"><Check size={14} />Test passed in {lat} ms</span>}
        </div>
      </Card>

      <Card className="lg:col-span-3" style={stagger(2)}>
        <CardHeader title="Daily try-on time" sub="How long each customer can try garments on, per day" />
        <div className="flex items-end justify-between mb-3"><div className="font-title text-[64px] leading-none"><CountUp value={m} decimals={m % 1 ? 1 : 0} duration={250} /><span className="text-[24px] text-muted ml-2">min</span></div>
          <div className="text-muted text-[13px] hidden sm:block">0 to 10 minutes</div></div>
        <div className="relative h-10 flex items-center">
          <div className="absolute inset-x-0 h-2 rounded-full bg-stone" />
          <div className="absolute left-0 h-2 rounded-full bg-ink" style={{ width: `${pct}%`, transition: 'width 150ms var(--ease)' }} />
          <div className="absolute size-7 rounded-full bg-champagne border-4 border-card -translate-x-1/2 shadow-[0_0_0_6px_color-mix(in_srgb,var(--champagne)_30%,transparent),0_0_28px_color-mix(in_srgb,var(--champagne)_70%,transparent)]" style={{ left: `${pct}%`, transition: 'left 150ms var(--ease)' }} />
          <input aria-label="Daily minutes" type="range" min={0} max={10} step={0.5} value={m} onChange={(e) => set({ minutes: +e.target.value })} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        </div>
        <div className="flex justify-between text-[11px] text-muted mt-1 num px-0.5">{Array.from({ length: 11 }, (_, i) => <span key={i}>{i}</span>)}</div>
        <p className="mt-5 text-[16px] flex items-center gap-2"><Star size={14} />{m === 0 ? 'Try-on time is set to 0, so customers cannot try anything on. Time refills at midnight Nepal time.' : <>Each customer gets <b className="num">{m}</b> {m === 1 ? 'minute' : 'minutes'} a day. Time refills at midnight Nepal time.</>}</p>
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {(['Bronze', 'Silver', 'Gold'] as const).map((t) => (
            <div key={t} className="rounded-xl border border-line p-4 flex items-center justify-between gap-3 hover:border-champagne transition-colors">
              <div><Label>{t} tier</Label><div className="text-[13px] text-muted mt-0.5">{m + draft.tiers[t]} min a day in total</div></div>
              <div className="flex items-center gap-2">
                <button className="size-8 rounded-full border border-line hover:bg-stone" onClick={() => set({ tiers: { ...draft.tiers, [t]: Math.max(0, draft.tiers[t] - 1) } })} aria-label={`Less for ${t}`}>-</button>
                <span className="num w-10 text-center font-medium">+{draft.tiers[t]}</span>
                <button className="size-8 rounded-full border border-line hover:bg-stone" onClick={() => set({ tiers: { ...draft.tiers, [t]: Math.min(10, draft.tiers[t] + 1) } })} aria-label={`More for ${t}`}>+</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2" style={stagger(3)}>
        <CardHeader title="Consent text" sub="Shown to customers before the camera starts" />
        <Field label="Consent message" multiline rows={6} value={draft.consent} maxLength={280} onChange={(v) => set({ consent: v })} error={draft.consent.trim().length < 20 ? 'Please write at least 20 characters.' : undefined} hint={`${draft.consent.length}/280`} />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <Label className="mb-2">Fallback mode</Label>
            <Segmented className="flex-wrap" value={draft.fallback} onChange={(v) => set({ fallback: v })} options={[{ value: 'Automatic', label: 'Automatic' }, { value: 'Off', label: 'Off' }, { value: 'Always static photo', label: 'Always static photo' }]} />
            <p className="text-muted text-[12px] mt-2">{draft.fallback === 'Automatic' ? 'If the camera or provider fails, a static photo is shown.' : draft.fallback === 'Off' ? 'No fallback. Customers see an error instead.' : 'Customers always see a static photo on the body outline.'}</p>
          </div>
          <div>
            <Label className="mb-2">Categories with try-on</Label>
            <div className="space-y-2">{Object.keys(draft.cats).map((c) => <div key={c} className="flex items-center justify-between"><span>{c}</span><Switch checked={draft.cats[c]} label={c} onChange={(v) => set({ cats: { ...draft.cats, [c]: v } })} /></div>)}</div>
          </div>
        </div>
      </Card>

      <Card style={stagger(4)} className="bg-soft">
        <Label className="mb-3">Live preview</Label>
        <div className="mx-auto w-[240px] rounded-[28px] border-[6px] border-ink bg-card p-5 text-center shadow-[var(--shadow-lg)]">
          <div className="mx-auto size-12 rounded-full bg-stone flex items-center justify-center mb-3"><Camera size={20} strokeWidth={1.5} /></div>
          <div className="font-title text-[22px] leading-tight">Try it on</div>
          <p className="text-[11.5px] text-muted mt-2 min-h-[72px] break-words">{draft.consent || 'Your consent message appears here.'}</p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] mt-3 py-1.5 rounded-full bg-stone"><Lock size={11} strokeWidth={1.75} />Your video is never stored</div>
          <div className="mt-3 h-9 rounded-full bg-ink text-inkfg text-[12px] flex items-center justify-center">Allow camera</div>
          <div className="text-[11px] text-muted mt-2">Not now</div>
        </div>
      </Card>
    </div>
  );
}

