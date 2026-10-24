import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, TrendingDown, TrendingUp, ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, GripVertical, Inbox, RotateCw, Search, TriangleAlert, X, Eye, EyeOff } from 'lucide-react';
import { cn, initials } from '../lib/format';
import { Leaf, Star } from './brand';

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
export const stagger = (i: number, step = 40): CSSProperties => ({ animationDelay: `${i * step}ms` });
export const C = { ink: '#222222', champagne: '#8a888d', sage: '#222222', stone: '#d9d7db', muted: '#77757a' };

/* ---------- Button ---------- */
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'champagne'; size?: 'sm' | 'md' | 'lg'; icon?: Icon; loading?: boolean; }
export function Button({ variant = 'primary', size = 'md', icon: I, loading, children, className, disabled, ...p }: BtnProps) {
  const v = {
    primary: 'bg-ink text-inkfg hover:bg-[#3a3a3c] border border-transparent',
    secondary: 'bg-card text-fg border border-transparent hover:bg-stone',
    ghost: 'bg-transparent text-fg hover:bg-stone border border-transparent',
    danger: 'bg-bad text-white hover:opacity-90 border border-transparent',
    champagne: 'bg-mid text-white hover:opacity-90 border border-transparent',
  }[variant];
  const s = { sm: 'h-8 px-3.5 text-[13px] gap-1.5', md: 'h-10 px-5 text-[14px] gap-2', lg: 'h-12 px-7 text-[15px] gap-2' }[size];
  return (
    <button {...p} disabled={disabled || loading} className={cn('inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100', v, s, className)}>
      {loading ? <span className="size-4 rounded-full border-2 border-current border-t-transparent anim-spin" /> : I && <I size={size === 'sm' ? 14 : 16} strokeWidth={1.5} />}
      {children}
    </button>
  );
}
export function IconButton({ icon: I, label, size = 36, className, badge, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: Icon; label: string; size?: number; badge?: number }) {
  return (
    <button {...p} title={label} aria-label={label} style={{ width: size, height: size }} className={cn('relative inline-flex items-center justify-center rounded-full text-fg/80 hover:bg-stone hover:text-fg transition-colors duration-200 active:scale-95', className)}>
      <I size={18} strokeWidth={1.5} />
      {!!badge && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-dot text-white text-[10px] font-semibold flex items-center justify-center">{badge}</span>}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children, hover = true, pad = true, style, onClick }: { className?: string; children: ReactNode; hover?: boolean; pad?: boolean; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={style} className={cn('bg-card rounded-[28px] shadow-[var(--shadow)] anim-fade-up transition-all duration-300', hover && 'hover:-translate-y-0.5', pad && 'p-6', onClick && 'cursor-pointer', className)}>
      {children}
    </div>
  );
}
export function CardHeader({ title, sub, action, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div><h3 className="text-[18px] font-medium leading-tight tracking-[-0.01em]">{title}</h3>{sub && <div className="text-muted text-[14px] mt-1">{sub}</div>}</div>
      {action}
    </div>
  );
}
export const Label = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('label-caps', className)}>{children}</div>;

/* ---------- Pill / Status ---------- */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'champagne' | 'sage' | 'ink';
const SOLID = 'bg-mid text-white';
const SOFT = 'bg-stone text-fg';
const ALERT = 'bg-card text-bad ring-1 ring-bad/70';
const toneCls: Record<Tone, string> = {
  success: SOLID, info: SOLID, champagne: SOLID, sage: SOLID, ink: 'bg-ink text-inkfg',
  warning: SOFT, neutral: SOFT, danger: ALERT,
};
export function Pill({ tone = 'neutral', children, dot, className, icon: I }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string; icon?: Icon }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors duration-500', toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}{I && <I size={12} strokeWidth={1.75} />}{children}
    </span>
  );
}
const STATUS_TONE: Record<string, Tone> = {
  published: 'success', delivered: 'success', shipped: 'success', paid: 'success', completed: 'success', approved: 'success', connected: 'success', ready: 'success', active: 'success', sent: 'success', matched: 'success', low: 'success', verified: 'success', resolved: 'success', remitted: 'success', healthy: 'success', visible: 'success', live: 'success',
  draft: 'neutral', archived: 'neutral', queued: 'neutral', inactive: 'neutral', new: 'info',
  scheduled: 'info', 'in review': 'info', packed: 'info', processing: 'info', requested: 'info', 'in progress': 'info', 'out for delivery': 'info', 'pickup scheduled': 'info', open: 'info', received: 'info', inspected: 'info', pending: 'warning', invited: 'warning',
  'to confirm': 'warning', 'needs cutout': 'warning', slow: 'warning', medium: 'warning', overstock: 'warning', warning: 'warning', unreachable: 'warning', 'low stock': 'warning', waiting: 'warning', unmatched: 'warning',
  cancelled: 'danger', closed: 'danger', failed: 'danger', rejected: 'danger', down: 'danger', high: 'danger', out: 'danger', refused: 'danger', blocked: 'danger', returned: 'danger', overdue: 'danger', 'out of stock': 'danger', disabled: 'danger', flagged: 'danger',
};
export const toneOf = (s: string): Tone => STATUS_TONE[s.toLowerCase()] ?? 'neutral';
export const StatusPill = ({ status, dot = true, className }: { status: string; dot?: boolean; className?: string }) => <Pill tone={toneOf(status)} dot={dot} className={className}>{status}</Pill>;

/* ---------- Chip ---------- */
export function Chip({ active, children, onClick, count, onRemove, icon: I, className }: { active?: boolean; children: ReactNode; onClick?: () => void; count?: number; onRemove?: () => void; icon?: Icon; className?: string }) {
  return (
    <button onClick={onClick} className={cn('inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[14px] border border-transparent transition-all duration-200 active:scale-95', active ? 'bg-mid text-white anim-pop' : 'bg-card text-fg hover:bg-stone', className)}>
      {I && <I size={14} strokeWidth={1.5} />}{children}
      {count !== undefined && <span className={cn('text-[11px]', active ? 'opacity-70' : 'text-muted')}>{count}</span>}
      {onRemove && <X size={12} onClick={(e) => { e.stopPropagation(); onRemove(); }} />}
    </button>
  );
}

/* ---------- Switch / Checkbox / Segmented ---------- */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={cn('relative w-10 h-6 rounded-full transition-colors duration-300 shrink-0 disabled:opacity-50', checked ? 'bg-mid' : 'bg-stone')}>
      <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full shadow transition-transform duration-300 ease-[var(--ease)]', checked ? 'translate-x-4 bg-white' : 'bg-white')} />
    </button>
  );
}
export function Checkbox({ checked, onChange, indeterminate, label }: { checked: boolean; onChange: (v: boolean) => void; indeterminate?: boolean; label?: ReactNode }) {
  const box = (
    <span role="checkbox" aria-checked={checked} tabIndex={0} onKeyDown={(e) => e.key === ' ' && (e.preventDefault(), onChange(!checked))} onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={cn('size-[18px] rounded-[6px] border flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer', checked || indeterminate ? 'bg-mid border-mid text-white' : 'border-stone bg-card hover:border-mid')}>
      {indeterminate && !checked ? <span className="w-2 h-px bg-current" /> : checked && <Check size={12} strokeWidth={2.5} className="anim-pop" />}
    </span>
  );
  return label ? <label className="inline-flex items-center gap-2.5 cursor-pointer text-[14px]" onClick={() => onChange(!checked)}>{box}<span>{label}</span></label> : box;
}
export function Segmented<T extends string>({ options, value, onChange, className }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('inline-flex p-1 rounded-full bg-field gap-0.5', className)}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('h-9 px-4 rounded-full text-[14px] transition-all duration-300 flex items-center gap-1.5', value === o.value ? 'bg-mid text-white font-medium' : 'text-muted hover:text-fg')}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- Tabs with sliding underline ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => { const el = refs.current[value]; if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth }); }, [value, tabs.length, tabs.map((t) => t.count).join()]);
  return (
    <div className={cn('relative flex gap-1 border-b border-line overflow-x-auto hide-scroll', className)}>
      {tabs.map((t) => (
        <button key={t.id} ref={(el) => { refs.current[t.id] = el; }} onClick={() => onChange(t.id)}
          className={cn('h-11 px-4 text-[14px] whitespace-nowrap flex items-center gap-2 transition-colors duration-200', value === t.id ? 'text-fg font-medium' : 'text-muted hover:text-fg')}>
          {t.label}{t.count !== undefined && <span className={cn('text-[11px] px-1.5 rounded-full min-w-5 text-center', value === t.id ? 'bg-mid text-white' : 'bg-stone text-muted')}><CountUp value={t.count} duration={400} /></span>}
        </button>
      ))}
      <span className="absolute bottom-[-1px] h-[2px] bg-ink transition-all duration-400 ease-[var(--ease)]" style={{ left: bar.left, width: bar.width }} />
    </div>
  );
}

/* ---------- Inputs ---------- */
const fieldBase = 'peer w-full h-12 rounded-2xl bg-field border border-transparent px-4 pt-4 pb-0 text-[14px] outline-none transition-all duration-200 focus:bg-card focus:border-mid focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--mid)_18%,transparent)] placeholder-transparent';
export function Field({ label, value, onChange, type = 'text', error, hint, right, className, multiline, rows = 3, name, autoFocus, onKeyDown, prefix, inputRef, disabled, maxLength }: { label: string; value: string | number; onChange?: (v: string) => void; type?: string; error?: string; hint?: ReactNode; right?: ReactNode; className?: string; multiline?: boolean; rows?: number; name?: string; autoFocus?: boolean; onKeyDown?: (e: React.KeyboardEvent) => void; prefix?: string; inputRef?: React.Ref<HTMLInputElement>; disabled?: boolean; maxLength?: number }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={className}>
      <div className="relative">
        {multiline ? (
          <textarea value={value} rows={rows} placeholder=" " disabled={disabled} maxLength={maxLength} onChange={(e) => onChange?.(e.target.value)} className={cn(fieldBase, 'h-auto pt-6 pb-2 resize-none', error && 'border-bad')} />
        ) : (
          <input ref={inputRef} name={name} autoFocus={autoFocus} onKeyDown={onKeyDown} disabled={disabled} maxLength={maxLength} type={isPw && show ? 'text' : type} value={value} placeholder=" " onChange={(e) => onChange?.(e.target.value)} className={cn(fieldBase, prefix && 'pl-10', (!!right || isPw) && 'pr-11', error && 'border-bad')} />
        )}
        <label className={cn('absolute pointer-events-none text-muted transition-all duration-200 origin-left left-3.5 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[14px] top-1.5 text-[11px] peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-fg', prefix && 'left-10')}>{label}</label>
        {prefix && <span className="absolute left-3.5 top-[22px] text-[13px] text-muted">{prefix}</span>}
        {isPw ? <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-muted hover:text-fg" aria-label="Toggle password">{show ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}</button> : right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error ? <div className="text-bad text-[12px] mt-1.5 anim-fade-in">{error}</div> : hint && <div className="text-muted text-[12px] mt-1.5">{hint}</div>}
    </div>
  );
}
export function Select({ label, value, onChange, options, className }: { label?: string; value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {label && <label className="absolute left-3.5 top-1.5 text-[11px] text-muted pointer-events-none z-10">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn('w-full h-12 rounded-2xl bg-field border border-transparent px-4 pr-9 text-[14px] outline-none appearance-none focus:bg-card focus:border-mid focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--mid)_18%,transparent)] transition-all', label && 'pt-4')}>
        {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  );
}
export function SearchInput({ value, onChange, placeholder = 'Search', className, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-10 rounded-full bg-card border border-transparent pl-10 pr-9 text-[14px] outline-none transition-all focus:border-mid focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--mid)_18%,transparent)]" />
      {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"><X size={14} /></button>}
    </div>
  );
}
export function Slider({ value, onChange, min = 0, max = 10, step = 1, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('relative h-6 flex items-center group', className)}>
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-stone" />
      <div className="absolute left-0 h-1.5 rounded-full bg-mid" style={{ width: `${p}%`, transition: 'width 200ms var(--ease)' }} />
      <div className="absolute size-5 rounded-full bg-card border-2 border-mid -translate-x-1/2 transition-shadow group-hover:shadow-[0_0_0_6px_color-mix(in_srgb,var(--mid)_25%,transparent)]" style={{ left: `${p}%` }} />
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
    </div>
  );
}

/* ---------- Overlays ---------- */
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => { if (!open) return; const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [open, onClose]);
}
export function Drawer({ open, onClose, title, subtitle, width = 520, children, footer, actions }: { open: boolean; onClose: () => void; title?: ReactNode; subtitle?: ReactNode; width?: number; children: ReactNode; footer?: ReactNode; actions?: ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] anim-fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full bg-card rounded-l-[28px] shadow-[var(--shadow-lg)] flex flex-col max-w-full" style={{ width, animation: 'slide-right 400ms var(--ease) both' }}>
        <header className="flex items-start justify-between gap-4 px-7 pt-6 pb-4 border-b border-line">
          <div className="min-w-0"><h2 className="text-[24px] font-semibold tracking-[-0.02em] leading-tight truncate">{title}</h2>{subtitle && <div className="text-muted text-[13px] mt-0.5">{subtitle}</div>}</div>
          <div className="flex items-center gap-1">{actions}<IconButton icon={X} label="Close" onClick={onClose} /></div>
        </header>
        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
        {footer && <footer className="px-7 py-4 border-t border-line flex items-center justify-end gap-3 bg-card">{footer}</footer>}
      </aside>
    </div>, document.body);
}
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEsc(open, onClose);
  if (!open) return null;
  const w = { sm: 420, md: 560, lg: 760, xl: 980 }[size];
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] anim-fade-in" onClick={onClose} />
      <div className="relative bg-card rounded-[28px] shadow-[var(--shadow-lg)] w-full max-h-[90vh] flex flex-col" style={{ maxWidth: w, animation: 'fade-up 360ms var(--ease) both' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3"><h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2><IconButton icon={X} label="Close" onClick={onClose} /></div>
        <div className="px-6 pb-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line flex justify-end gap-3">{footer}</div>}
      </div>
    </div>, document.body);
}
export function Lightbox({ src, onClose, caption }: { src: string | null; onClose: () => void; caption?: string }) {
  useEsc(!!src, onClose);
  if (!src) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-8 anim-fade-in cursor-zoom-out" onClick={onClose}>
      <img src={src} alt={caption ?? ''} className="max-h-full max-w-full rounded-xl object-contain" style={{ animation: 'pop 420ms var(--ease) both' }} />
      {caption && <div className="absolute bottom-6 text-white/80 text-[13px]">{caption}</div>}
      <button className="absolute top-6 right-6 text-white/80 hover:text-white"><X size={24} /></button>
    </div>, document.body);
}

/* ---------- Dropdown menu ---------- */
export interface MenuItem { label: ReactNode; icon?: Icon; onClick?: () => void; danger?: boolean; divider?: boolean; hint?: string; active?: boolean }
export function DropdownMenu({ trigger, items, align = 'right', width = 220, header }: { trigger: ReactNode; items: MenuItem[]; align?: 'left' | 'right'; width?: number; header?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const f = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false); const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); document.addEventListener('mousedown', f); document.addEventListener('keydown', k); return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k); }; }, [open]);
  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{trigger}</div>
      {open && (
        <div className={cn('absolute z-50 mt-2 bg-card rounded-2xl shadow-[var(--shadow-lg)] ring-1 ring-line py-1.5 anim-fade-up', align === 'right' ? 'right-0' : 'left-0')} style={{ width, animationDuration: '200ms' }}>
          {header}
          {items.map((it, i) => it.divider ? <div key={i} className="my-1.5 border-t border-line" /> : (
            <button key={i} onClick={(e) => { e.stopPropagation(); it.onClick?.(); setOpen(false); }} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] text-left hover:bg-stone transition-colors', it.danger && 'text-bad', it.active && 'font-medium')}>
              {it.icon && <it.icon size={15} strokeWidth={1.5} />}<span className="flex-1">{it.label}</span>{it.hint && <span className="text-muted text-[11px]">{it.hint}</span>}{it.active && <Check size={14} className="text-fg" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Avatar ---------- */
const AV = ['#d9d7db', '#cfcdd2', '#e3e1e5', '#c7c5ca', '#dcdadf', '#d2d0d5'];
export function Avatar({ name, size = 36, className, ring }: { name: string; size?: number; className?: string; ring?: boolean }) {
  const bg = AV[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
  return <span className={cn('inline-flex items-center justify-center rounded-full font-medium text-fg shrink-0 select-none', ring && 'ring-2 ring-mid ring-offset-2 ring-offset-card', className)} style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>{initials(name)}</span>;
}

/* ---------- Numbers & charts helpers ---------- */
export function CountUp({ value, format, duration = 800, decimals = 0 }: { value: number; format?: (n: number) => string; duration?: number; decimals?: number }) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now(); const a = from.current; let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - start) / duration); const e = 1 - Math.pow(1 - p, 3); const v = a + (value - a) * e; setN(v); from.current = v; if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  const v = decimals ? +n.toFixed(decimals) : Math.round(n);
  return <span className="num">{format ? format(v) : v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}
export function Sparkline({ data, color = '#222222', width = 90, height = 28, fill = false }: { data: number[]; color?: string; width?: number; height?: number; fill?: boolean }) {
  const { d, area } = useMemo(() => {
    const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
    const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 3 - ((v - mn) / r) * (height - 6)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return { d, area: d + ` L${width} ${height} L0 ${height} Z` };
  }, [data, width, height]);
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && <path d={area} fill={color} opacity={0.08} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 900ms var(--ease) forwards' }} />
    </svg>
  );
}
export function Ring({ value, size = 64, stroke = 5, color = '#7d7b80', children, track = '#d9d7db' }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; track?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(value), 60); return () => clearTimeout(t); }, [value]);
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: 'stroke-dashoffset 1s var(--ease), stroke 400ms' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold">{children ?? `${Math.round(value)}%`}</div>
    </div>
  );
}
export function Progress({ value, className, color = '#7d7b80' }: { value: number; className?: string; color?: string }) {
  return <div className={cn('h-1.5 rounded-full bg-stone overflow-hidden', className)}><div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: 'width 800ms var(--ease)' }} /></div>;
}
export function Delta({ value, inverse, suffix }: { value: number; inverse?: boolean; suffix?: string }) {
  const good = inverse ? value < 0 : value >= 0;
  return <span className={cn('inline-flex items-center gap-1 text-[13px] font-semibold', good ? 'text-ok' : 'text-bad')}>{value >= 0 ? <TrendingUp size={14} strokeWidth={2} /> : <TrendingDown size={14} strokeWidth={2} />}{Math.abs(value).toFixed(1)}%{suffix && <span className="font-normal text-muted">{suffix}</span>}</span>;
}
export const ChartTip = ({ active, payload, label, fmt }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; fmt?: (n: number) => string }) => !active || !payload?.length ? null : (
  <div className="bg-ink text-inkfg rounded-xl px-3 py-2 text-[12px] shadow-[var(--shadow-lg)]">
    {label && <div className="opacity-60 mb-1">{label}</div>}
    {payload.map((p, i) => <div key={i} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}: <b className="font-semibold">{fmt ? fmt(p.value) : p.value.toLocaleString('en-IN')}</b></div>)}
  </div>
);

/* ---------- States ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton', className)} />;
export function EmptyState({ icon: I = Inbox, title, body, action, star }: { icon?: Icon; title: string; body?: string; action?: ReactNode; star?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 anim-fade-up">
      <div className="size-14 rounded-full bg-field flex items-center justify-center text-muted mb-4 relative"><I size={24} strokeWidth={1.25} />{star && <Star size={16} twinkle className="absolute -top-1 -right-1" />}</div>
      <div className="text-[22px] font-semibold tracking-[-0.02em]">{title}</div>
      {body && <div className="text-muted max-w-sm mt-1">{body}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function CelebrateState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="relative"><Leaf size={56} draw className="text-sage" /><Star size={20} twinkle className="absolute -top-2 -right-4" /></div>
      <div className="text-[24px] font-semibold tracking-[-0.02em] mt-3">{title}</div>
      {body && <div className="text-muted mt-1">{body}</div>}
    </div>
  );
}
export function ErrorState({ onRetry, title = 'Something went wrong', body = 'We could not load this section. Please try again.' }: { onRetry?: () => void; title?: string; body?: string }) {
  return <EmptyState icon={TriangleAlert} title={title} body={body} action={onRetry && <Button variant="secondary" icon={RotateCw} onClick={onRetry}>Try again</Button>} />;
}
export function useFakeLoad(ms = 650, deps: unknown[] = []) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, deps); // eslint-disable-line
  return loading;
}

/* ---------- Page header ---------- */
export function PageHeader({ title, subtitle, chip, actions, hint, badge }: { title: ReactNode; subtitle?: ReactNode; chip?: ReactNode; actions?: ReactNode; hint?: ReactNode; badge?: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(() => document.getElementById('rv-title'));
  useLayoutEffect(() => { setSlot(document.getElementById('rv-title')); }, []);
  const titleNode = <div className="flex items-center gap-3 min-w-0"><h1 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] truncate">{title}</h1>{chip && <Pill tone="neutral">{chip}</Pill>}{badge}</div>;
  return (
    <>
      {slot && createPortal(titleNode, slot)}
      {!slot && <div className="mb-3">{titleNode}</div>}
      {(subtitle || hint || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 anim-fade-up">
          <div className="min-w-0">
            {subtitle && <div className="text-muted text-[14px]">{subtitle}</div>}
            {hint && <div className="mt-1.5">{hint}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap ml-auto">{actions}</div>}
        </div>
      )}
    </>
  );
}

/* ---------- Sticky save bar ---------- */
export function SaveBar({ show, onSave, onDiscard, saving, label = 'You have unsaved changes' }: { show: boolean; onSave: () => void; onDiscard: () => void; saving?: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink text-inkfg rounded-full pl-6 pr-2 py-2 flex items-center gap-4 shadow-[var(--shadow-lg)] anim-slide-up">
      <span className="text-[13px]">{label}</span>
      <div className="flex gap-2"><button onClick={onDiscard} className="h-9 px-4 rounded-full text-[13px] hover:bg-white/10">Discard</button><button onClick={onSave} disabled={saving} className="h-9 px-5 rounded-full text-[13px] font-medium bg-white text-ink hover:opacity-90">{saving ? 'Saving…' : 'Save changes'}</button></div>
    </div>
  );
}

/* ---------- DataTable ---------- */
export interface Col<T> { key: string; header: ReactNode; render: (r: T) => ReactNode; sort?: (r: T) => string | number; align?: 'left' | 'right' | 'center'; width?: string; hideBelow?: 'lg' | 'xl' }
export function DataTable<T>({ columns, rows, rowId, onRowClick, selectable, bulk, loading, empty, defaultSort, flashIds, activeId, dense, pageSize = 0 }: {
  columns: Col<T>[]; rows: T[]; rowId: (r: T) => string; onRowClick?: (r: T) => void; selectable?: boolean;
  bulk?: (ids: string[], clear: () => void) => ReactNode; loading?: boolean; empty?: ReactNode; defaultSort?: { key: string; dir: 'asc' | 'desc' };
  flashIds?: string[]; activeId?: string | null; dense?: boolean; pageSize?: number;
}) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const isAction = (c: Col<T>) => /^(actions?|menu|more|open|manage)$/i.test(c.key) || c.header === '' || c.header === null || c.header === undefined;
  const dataCols = columns.filter((c) => !isAction(c));
  const [hidden, setHidden] = useState<string[]>(() => dataCols.slice(6).map((c) => c.key));
  const cols = columns.filter((c) => !hidden.includes(c.key));
  const [sel, setSel] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key); if (!col?.sort) return rows;
    const f = col.sort; return [...rows].sort((a, b) => { const x = f(a), y = f(b); const r = x < y ? -1 : x > y ? 1 : 0; return sort.dir === 'asc' ? r : -r; });
  }, [rows, sort, columns]);
  useEffect(() => { setSel((s) => s.filter((id) => rows.some((r) => rowId(r) === id))); setPage(0); }, [rows.length]); // eslint-disable-line
  const visible = pageSize ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;
  const allSel = visible.length > 0 && visible.every((r) => sel.includes(rowId(r)));
  const toggleAll = () => setSel(allSel ? [] : visible.map(rowId));
  const al = (a?: string) => (a === 'right' ? 'text-right justify-end' : a === 'center' ? 'text-center justify-center' : 'text-left');
  const hb = (h?: string) => (h === 'lg' ? 'hidden lg:table-cell' : h === 'xl' ? 'hidden xl:table-cell' : '');
  return (
    <div className="relative">
      {dataCols.length > 6 && (
        <div className="flex justify-end px-5 pb-2 -mt-1">
          <DropdownMenu width={210} trigger={<button className="h-8 px-3.5 rounded-full bg-field text-[13px] text-muted hover:text-fg hover:bg-stone transition-colors flex items-center gap-1.5"><SlidersHorizontal size={14} strokeWidth={1.5} />Columns</button>}
            items={dataCols.map((c) => ({ label: c.header, active: !hidden.includes(c.key), onClick: () => setHidden((h) => h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key]) }))} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] border-separate border-spacing-0">
          <thead>
            <tr>
              {selectable && <th className="w-12 pl-5 py-3 border-b border-line text-left"><Checkbox checked={allSel} indeterminate={sel.length > 0} onChange={toggleAll} /></th>}
              {cols.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={cn('py-3.5 px-4 border-b border-line text-[14px] font-medium text-muted whitespace-nowrap', al(c.align), hb(c.hideBelow))}>
                  {c.sort ? (
                    <button className={cn('inline-flex items-center gap-1 hover:text-fg', al(c.align))} onClick={() => setSort((s) => s?.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' })}>
                      {c.header}{sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp size={12} className="text-fg" /> : <ArrowDown size={12} className="text-fg" />) : <ArrowUpDown size={11} className="opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>{selectable && <td className="pl-5"><Skeleton className="size-4" /></td>}{cols.map((c) => <td key={c.key} className={cn('px-4 border-b border-line', dense ? 'py-2.5' : 'py-4', hb(c.hideBelow))}><Skeleton className="h-4 w-3/4" /></td>)}</tr>
            )) : visible.map((r, i) => {
              const id = rowId(r); const checked = sel.includes(id);
              return (
                <tr key={id} onClick={() => onRowClick?.(r)} style={{ animationDelay: `${Math.min(i, 14) * 30}ms` }}
                  className={cn('group anim-fade-up transition-colors duration-200', onRowClick && 'cursor-pointer', (checked || activeId === id) ? 'bg-soft' : 'hover:bg-soft', flashIds?.includes(id) && 'anim-flash')}>
                  {selectable && <td className="w-12 pl-5 border-b border-line" onClick={(e) => e.stopPropagation()}><Checkbox checked={checked} onChange={() => setSel(checked ? sel.filter((x) => x !== id) : [...sel, id])} /></td>}
                  {cols.map((c) => <td key={c.key} className={cn('px-4 border-b border-line', dense ? 'py-2.5' : 'py-3.5', al(c.align), hb(c.hideBelow))}>{c.render(r)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (empty ?? <EmptyState title="Nothing here yet" body="Try changing your search or filters." />)}
      {pageSize > 0 && rows.length > pageSize && (
        <div className="flex items-center justify-between px-5 py-3 text-[13px] text-muted">
          <span>{page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}</span>
          <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="secondary" disabled={(page + 1) * pageSize >= rows.length} onClick={() => setPage(page + 1)}>Next</Button></div>
        </div>
      )}
      {selectable && sel.length > 0 && bulk && createPortal(
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 max-w-[94vw]">
          <div className="bg-ink text-inkfg rounded-full pl-5 pr-2 py-2 flex items-center gap-2 shadow-[var(--shadow-lg)] anim-slide-up overflow-x-auto hide-scroll">
            <span className="text-[13px] font-medium whitespace-nowrap pr-2">{sel.length} selected</span>
            <div className="flex items-center gap-1 [&_button]:text-inkfg [&_button]:bg-transparent [&_button]:border-transparent [&_button:hover]:bg-white/15 ">{bulk(sel, () => setSel([]))}</div>
            <button onClick={() => setSel([])} className="size-8 rounded-full hover:bg-white/15 flex items-center justify-center shrink-0"><X size={15} /></button>
          </div>
        </div>, document.body)}
    </div>
  );
}

/* ---------- Sortable list (native drag & drop) ---------- */
export function Sortable<T>({ items, onChange, getId, render, className, horizontal }: { items: T[]; onChange: (n: T[]) => void; getId: (t: T) => string; render: (t: T, o: { handle: ReactNode; dragging: boolean; index: number }) => ReactNode; className?: string; horizontal?: boolean }) {
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const drop = () => {
    if (drag === null || over === null) return setDrag(null);
    const from = items.findIndex((i) => getId(i) === drag); if (from < 0) return setDrag(null);
    const next = [...items]; const [m] = next.splice(from, 1); next.splice(over > from ? over - 1 : over, 0, m);
    onChange(next); setDrag(null); setOver(null);
  };
  return (
    <div className={className} onDragOver={(e) => e.preventDefault()} onDrop={drop}>
      {items.map((it, i) => {
        const id = getId(it); const dragging = drag === id;
        return (
          <div key={id} draggable onDragStart={(e) => { setDrag(id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
            onDragOver={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const after = horizontal ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2; setOver(after ? i + 1 : i); }}
            className={cn('relative transition-all duration-200', dragging && 'opacity-50 scale-[0.98]', drag && !dragging && over === i && (horizontal ? 'before:absolute before:-left-1.5 before:inset-y-0 before:w-0.5 before:bg-ink' : 'before:absolute before:-top-1 before:inset-x-0 before:h-0.5 before:bg-ink before:rounded'))}>
            {render(it, { handle: <GripVertical size={16} className="text-muted cursor-grab active:cursor-grabbing shrink-0" />, dragging, index: i })}
            {drag && i === items.length - 1 && over === items.length && <div className={horizontal ? 'absolute -right-1.5 inset-y-0 w-0.5 bg-ink' : 'absolute -bottom-1 inset-x-0 h-0.5 bg-ink rounded'} />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Misc ---------- */
export function Tip({ text, children }: { text: string; children: ReactNode }) { return <span title={text}>{children}</span>; }
export function KV({ k, children }: { k: ReactNode; children: ReactNode }) { return <div className="flex items-start justify-between gap-6 py-2.5 border-b border-line last:border-0"><span className="text-muted text-[13px]">{k}</span><span className="text-right text-[14px]">{children}</span></div>; }
export function Photo({ src, size = 56, className, alt = '' }: { src: string; size?: number | string; className?: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" style={{ width: size, height: typeof size === 'number' ? size : undefined }} className={cn('object-cover rounded-2xl bg-stone shrink-0', className)} />;
}
export function Timeline({ items }: { items: { title: ReactNode; meta?: ReactNode; tone?: Tone }[] }) {
  return (
    <ol className="relative pl-6">
      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-line" />
      {items.map((t, i) => (
        <li key={i} className="relative pb-5 last:pb-0 anim-slide-in" style={stagger(i, 60)}>
          <span className={cn('absolute -left-6 top-1.5 size-[15px] rounded-full border-2 border-card', i === 0 ? 'bg-mid' : 'bg-stone')} />
          <div className="text-[14px]">{t.title}</div>{t.meta && <div className="text-muted text-[12px] mt-0.5">{t.meta}</div>}
        </li>
      ))}
    </ol>
  );
}
