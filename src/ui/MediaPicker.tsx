import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Chip, Modal } from './kit';
import { FABRIC_IDS, PHOTO_IDS } from '../data/seed';
import { img, cn } from '../lib/format';

export const LIBRARY = [
  ...PHOTO_IDS.map((id, i) => ({ id, name: `lookbook-${String(i + 1).padStart(2, '0')}.jpg`, folder: 'Products', url: img(id, 600, 750) })),
  ...FABRIC_IDS.map((id, i) => ({ id, name: `fabric-swatch-${i + 1}.jpg`, folder: 'Journal', url: img(id, 600, 450) })),
];
/** Shared picker modal: used by Product editor, CMS, Builder. */
export default function MediaPicker({ open, onClose, onSelect, multiple = true }: { open: boolean; onClose: () => void; onSelect: (urls: string[]) => void; multiple?: boolean }) {
  const [sel, setSel] = useState<string[]>([]);
  const [folder, setFolder] = useState('All');
  const list = LIBRARY.filter((m) => folder === 'All' || m.folder === folder);
  return (
    <Modal open={open} onClose={onClose} title="Media library" size="xl" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!sel.length} onClick={() => { onSelect(sel); setSel([]); onClose(); }}>Select{sel.length ? ` (${sel.length})` : ''}</Button></>}>
      <div className="flex gap-2 mb-4">{['All', 'Products', 'Journal'].map((f) => <Chip key={f} active={folder === f} onClick={() => setFolder(f)}>{f}</Chip>)}</div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {list.map((m) => { const on = sel.includes(m.url); return (
          <button key={m.id} onClick={() => setSel(multiple ? (on ? sel.filter((s) => s !== m.url) : [...sel, m.url]) : [m.url])} className={cn('relative aspect-[4/5] rounded-xl overflow-hidden bg-stone transition-all', on && 'ring-2 ring-champagne ring-offset-2 ring-offset-card')}>
            <img src={m.url} alt={m.name} className="size-full object-cover" />{on && <span className="absolute top-2 right-2 size-6 rounded-full bg-champagne text-white flex items-center justify-center anim-pop"><Check size={14} /></span>}
          </button>); })}
      </div>
    </Modal>
  );
}
