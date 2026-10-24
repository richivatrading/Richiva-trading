import logoSrc from '../assets/richiva-logo.png';
import { cn } from '../lib/format';

/** Crops the supplied logo to its wordmark and turns its white background transparent (colour pixels untouched). */
export function Logo({ className = '', inverted = false, width = 150 }: { className?: string; inverted?: boolean; width?: number }) {
  const id = inverted ? 'rv-logo-light' : 'rv-logo-dark';
  const c = inverted ? 1 : 0;
  return (
    <div className={cn('relative overflow-hidden shrink-0', className)} style={{ width, aspectRatio: '924 / 249' }} aria-label="Richiva">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`0 0 0 0 ${c}  0 0 0 0 ${c}  0 0 0 0 ${c}  -1.15 0 0 0 1.12`} />
        </filter>
      </svg>
      <img
        src={logoSrc.src}
        alt="Richiva"
        draggable={false}
        className="absolute max-w-none"
        style={{
          width: `${(1376 / 924) * 100}%`,
          left: `${-(233 / 924) * 100}%`,
          top: `${-(273 / 249) * 100}%`,
          filter: `url(#${id})`,
        }}
      />
    </div>
  );
}

export function Leaf({ size = 20, className = '', draw = false, stroke = 'currentColor' }: { size?: number; className?: string; draw?: boolean; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 29V13" style={draw ? { strokeDasharray: 30, strokeDashoffset: 30, animation: 'draw 1.2s var(--ease) forwards' } : undefined} />
      <path d="M16 17C9 17 5 12 5 6c7 0 11 4 11 11Z" style={draw ? { strokeDasharray: 60, strokeDashoffset: 60, animation: 'draw 1.4s var(--ease) 0.3s forwards' } : undefined} />
      <path d="M16 13c0-6 3.5-9 10-9 0 6-3.500 9-10 9Z" style={draw ? { strokeDasharray: 60, strokeDashoffset: 60, animation: 'draw 1.4s var(--ease) 0.6s forwards' } : undefined} />
    </svg>
  );
}

export function Star({ size = 14, className = '', twinkle = false }: { size?: number; className?: string; twinkle?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn('text-champagne inline-block shrink-0', twinkle && 'anim-twinkle', className)} fill="currentColor" aria-hidden>
      <path d="M12 1.5c.6 5.6 4.900 9.900 10.500 10.500-5.600.6-9.900 4.900-10.500 10.500C11.400 16.900 7.100 12.600 1.500 12 7.100 11.400 11.400 7.100 12 1.500Z" />
    </svg>
  );
}

export function LeafLoader({ label, size = 36 }: { label?: string; size?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status">
      <div className="anim-spin" style={{ animationDuration: '2.4s' }}><Leaf size={size} className="text-sage" /></div>
      {label && <div className="text-[13px]">{label}</div>}
    </div>
  );
}
