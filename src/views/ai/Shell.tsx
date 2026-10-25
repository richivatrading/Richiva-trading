"use client";
import { useState, type ReactNode } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button, Card, Switch, stagger } from '../../ui/kit';
import { Star } from '../../ui/brand';
import { cn } from '../../lib/format';

export type Vote = 'up' | 'down' | undefined;
export function AiCard({ index, title, why, enabled, onToggle, vote, onVote, onDismiss, onApply, applyLabel = 'Apply', shim, className, children }: {
  index: number; title: string; why: string; enabled: boolean; onToggle: (v: boolean) => void; vote: Vote; onVote: (v: 'up' | 'down') => void;
  onDismiss: () => void; onApply?: () => void; applyLabel?: string; shim: boolean; className?: string; children: ReactNode;
}) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <Card className={cn('relative overflow-hidden flex flex-col', className)} style={stagger(index, 80)}>
      {shim && <div className="absolute inset-0 ai-shimmer pointer-events-none" style={stagger(index, 120)} />}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted mb-1.5"><Star size={12} twinkle={index === 0} />AI suggestion</div>
          <h3 className="font-title text-[24px] leading-tight">{title}</h3>
        </div>
        <Switch checked={enabled} onChange={onToggle} label={`${title} on or off`} />
      </div>
      <div className={cn('flex-1 transition-opacity duration-300', !enabled && 'opacity-35 pointer-events-none')}>
        {enabled ? children : <div className="text-muted text-[13px] py-6">This feature is turned off. Switch it on to see suggestions.</div>}
      </div>
      {showWhy && <div className="mt-4 text-[13px] bg-soft rounded-xl px-3.5 py-2.5 anim-fade-up flex gap-2"><Star size={12} className="mt-1" />{why}</div>}
      <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-line flex-wrap">
        <button onClick={() => setShowWhy(!showWhy)} className={cn('text-[13px] underline underline-offset-4 decoration-line hover:decoration-champagne mr-1', showWhy && 'text-champagne')}>Why?</button>
        <button aria-label="Helpful" onClick={() => onVote('up')} className={cn('size-8 rounded-full flex items-center justify-center transition-all active:scale-90', vote === 'up' ? 'bg-ink text-inkfg' : 'text-muted hover:bg-stone')}><ThumbsUp size={15} strokeWidth={1.5} /></button>
        <button aria-label="Not helpful" onClick={() => onVote('down')} className={cn('size-8 rounded-full flex items-center justify-center transition-all active:scale-90', vote === 'down' ? 'bg-ink text-inkfg' : 'text-muted hover:bg-stone')}><ThumbsDown size={15} strokeWidth={1.5} /></button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDismiss}>Dismiss</Button>
          {onApply && <Button size="sm" disabled={!enabled} onClick={onApply}>{applyLabel}</Button>}
        </div>
      </div>
    </Card>
  );
}

