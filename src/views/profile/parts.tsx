import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Card, CardHeader, Button, Switch, stagger } from '../../ui/kit';
import { cn } from '../../lib/format';
import { makeStore } from '../../store';

export const PASSWORD = 'Richiva@2026';
export const themeModeStore = makeStore<'light' | 'dark' | 'auto'>('light');

export function PCard({ id, title, sub, dirty, onSave, onReset, children, i = 0, hl, saveLabel = 'Save', valid = true }: { id: string; title: string; sub?: string; dirty: boolean; onSave: () => void; onReset?: () => void; children: ReactNode; i?: number; hl: boolean; saveLabel?: string; valid?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (hl) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [hl]);
  return (
    <div ref={ref} id={`card-${id}`} className={cn('rounded-2xl transition-shadow duration-700', hl && 'shadow-[0_0_0_3px_var(--champagne)]')}>
      <Card hover={false} className="h-full flex flex-col" style={stagger(i)}>
        <CardHeader title={title} sub={sub} />
        <div className="flex-1">{children}</div>
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-line">
          {dirty && onReset && <Button variant="ghost" size="sm" onClick={onReset}>Discard</Button>}
          <Button size="sm" disabled={!dirty || !valid} onClick={onSave}>{saveLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
export function Row({ title, sub, checked, onChange }: { title: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0"><div><div className="text-[14px]">{title}</div>{sub && <div className="text-muted text-[12.5px]">{sub}</div>}</div><Switch checked={checked} onChange={onChange} label={title} /></div>;
}
export function useSnap<T>(init: T) {
  const [saved, setSaved] = useState<T>(init);
  const [v, setV] = useState<T>(init);
  return { v, setV, saved, dirty: JSON.stringify(v) !== JSON.stringify(saved), commit: () => setSaved(v), reset: () => setV(saved) };
}
export function strength(p: string) {
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  const n = Math.min(4, Math.max(p ? 1 : 0, s - (s > 4 ? 1 : 0)));
  return { n, label: ['', 'Weak', 'Okay', 'Good', 'Strong'][n] };
}
