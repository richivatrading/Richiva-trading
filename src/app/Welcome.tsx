import { useEffect, useLayoutEffect, useState } from 'react';
import { Check, PackagePlus, CreditCard, Truck, Globe } from 'lucide-react';
import { Leaf } from '../ui/brand';
import { Button } from '../ui/kit';
import { navigate, useApp } from '../store';
import { setupStore, SETUP_STEPS } from '../data/seed';
import { cn } from '../lib/format';

const ICONS = { products: PackagePlus, payments: CreditCard, courier: Truck, home: Globe } as const;

export function Welcome({ onClose, onTour }: { onClose: () => void; onTour: () => void }) {
  const [done] = setupStore.use();
  const { user } = useApp();
  const first = user.name.split(' ')[0];
  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto anim-fade-in" style={{ background: 'color-mix(in srgb, var(--bg) 94%, transparent)', backdropFilter: 'blur(10px)' }}>
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-[920px] bg-card border border-line rounded-3xl p-10 shadow-[var(--shadow-lg)] text-center anim-fade-up">
          <div className="relative inline-block">
            <div style={{ transformOrigin: 'bottom center', animation: 'grow-y 1.2s var(--ease) both' }}><Leaf size={72} draw className="text-sage" /></div>
            {done.length > 0 && <div className="absolute -right-6 top-2 flex flex-col gap-1">{done.map((d) => <Leaf key={d} size={22} className="text-sage anim-pop" />)}</div>}
          </div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] leading-none mt-4">Welcome, {first}</h1>
          <p className="text-muted mt-2 text-[16px]">Here is your store in 4 quick steps</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {SETUP_STEPS.map((s, i) => {
              const I = ICONS[s.id as keyof typeof ICONS]; const d = done.includes(s.id);
              return (
                <div key={s.id} className="border border-line rounded-2xl p-5 text-left anim-fade-up hover:border-champagne hover:-translate-y-0.5 transition-all" style={{ animationDelay: `${600 + i * 120}ms` }}>
                  <div className={cn('size-10 rounded-full flex items-center justify-center mb-4', d ? 'bg-ok/15 text-ok' : 'bg-stone')}>{d ? <Check size={18} className="anim-pop" /> : <I size={18} strokeWidth={1.5} />}</div>
                  <div className="font-medium leading-snug h-10">{s.title}</div>
                  <Button size="sm" variant={d ? 'ghost' : 'secondary'} className="mt-3" onClick={() => { setupStore.set((x) => (x.includes(s.id) ? x : [...x, s.id])); onClose(); navigate(s.route); }}>{d ? 'Done' : 'Start'}</Button>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-3 mt-9">
            <Button size="lg" onClick={onTour}>Take the 30-second tour</Button>
            <button className="text-[13px] text-muted hover:text-fg underline underline-offset-4" onClick={onClose}>Skip for now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { sel: '[data-tour=sidebar]', title: 'Your sidebar', body: 'Every area of the business lives here, grouped by what you are doing.' },
  { sel: '[data-tour=search]', title: 'Search or press Ctrl K', body: 'Jump to any page, order, customer or product in a second. Try typing an order number.' },
  { sel: '[data-tour=bell]', title: 'Notifications', body: 'Orders to confirm, low stock, returns and system alerts gather here.' },
];
export function Tour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [r, setR] = useState<DOMRect | null>(null);
  useLayoutEffect(() => { const upd = () => { const el = document.querySelector(STEPS[i].sel); setR(el ? el.getBoundingClientRect() : null); }; upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd); }, [i]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  if (!r) return null;
  const pad = 6; const s = STEPS[i];
  const tipLeft = Math.min(window.innerWidth - 340, r.right + 18 > window.innerWidth - 340 ? r.left : r.right + 18);
  const tipTop = r.right + 18 > window.innerWidth - 340 ? r.bottom + 14 : Math.max(16, r.top);
  return (
    <div className="fixed inset-0 z-[95]">
      <div className="absolute rounded-2xl pointer-events-none transition-all duration-500 ease-[var(--ease)]" style={{ left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2, boxShadow: '0 0 0 9999px rgba(10,10,10,0.55), 0 0 0 2px var(--champagne)' }} />
      <div className="absolute w-[320px] bg-card rounded-2xl border border-line p-5 shadow-[var(--shadow-lg)] transition-all duration-500 ease-[var(--ease)]" style={{ left: tipLeft, top: tipTop }}>
        <div className="label-caps mb-1">Step {i + 1} of {STEPS.length}</div>
        <div className="font-title text-[24px] leading-tight">{s.title}</div>
        <p className="text-muted text-[13.5px] mt-1.5">{s.body}</p>
        <div className="flex items-center justify-between mt-4">
          <button className="text-[13px] text-muted hover:text-fg" onClick={onClose}>Skip</button>
          <div className="flex gap-2">{i > 0 && <Button size="sm" variant="secondary" onClick={() => setI(i - 1)}>Back</Button>}<Button size="sm" onClick={() => (i === STEPS.length - 1 ? onClose() : setI(i + 1))}>{i === STEPS.length - 1 ? 'Done' : 'Next'}</Button></div>
        </div>
      </div>
    </div>
  );
}
