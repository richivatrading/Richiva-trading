import { ChevronDown, Film, Play, Star as StarIcon, Image as ImageIcon, Type, LayoutGrid, Rows3, Megaphone, Quote, Mail, MoveHorizontal, HelpCircle, Layers, ShoppingBag } from 'lucide-react';
import { Logo } from '../../ui/brand';
import { PRODUCTS, photo } from '../../data/seed';
import { cn, rs } from '../../lib/format';

export type BType = 'hero' | 'products' | 'collection' | 'banner' | 'text' | 'imagetext' | 'video' | 'faq' | 'newsletter' | 'marquee' | 'testimonials';
export type Bg = 'ivory' | 'ink' | 'champagne' | 'sage';
export interface Block { id: string; type: BType; heading: string; text: string; image: string; alt: string; link: string; cta: string; bg: Bg; space: 'sm' | 'md' | 'lg' }

export const LIB: { type: BType; label: string; icon: typeof Type; fields: ('heading' | 'text' | 'image' | 'link')[] }[] = [
  { type: 'hero', label: 'Hero', icon: Layers, fields: ['heading', 'text', 'image', 'link'] },
  { type: 'products', label: 'Product grid', icon: ShoppingBag, fields: ['heading', 'link'] },
  { type: 'collection', label: 'Collection', icon: LayoutGrid, fields: ['heading', 'link'] },
  { type: 'banner', label: 'Banner', icon: Megaphone, fields: ['heading', 'link'] },
  { type: 'text', label: 'Text', icon: Type, fields: ['heading', 'text'] },
  { type: 'imagetext', label: 'Image and text', icon: Rows3, fields: ['heading', 'text', 'image', 'link'] },
  { type: 'video', label: 'Video', icon: Film, fields: ['heading', 'image', 'link'] },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, fields: ['heading'] },
  { type: 'newsletter', label: 'Newsletter', icon: Mail, fields: ['heading', 'text'] },
  { type: 'marquee', label: 'Marquee strip', icon: MoveHorizontal, fields: ['text'] },
  { type: 'testimonials', label: 'Testimonials', icon: Quote, fields: ['heading'] },
];
export const labelOf = (t: BType) => LIB.find((l) => l.type === t)!.label;
export const hasImage = (b: Block) => LIB.find((l) => l.type === b.type)!.fields.includes('image');

const D: Record<BType, Partial<Block>> = {
  hero: { heading: 'The Autumn Atelier', text: 'Hand finished pieces in silk, linen and Himalayan wool.', cta: 'Shop the edit', image: photo(0, 1400, 800), bg: 'ink', space: 'lg' },
  products: { heading: 'New arrivals', cta: 'View all', bg: 'ivory', space: 'md' },
  collection: { heading: 'Shop by collection', cta: 'Explore', bg: 'ivory', space: 'md' },
  banner: { heading: 'Free delivery inside Kathmandu Valley on orders above Rs 8,000', cta: 'Learn more', bg: 'champagne', space: 'sm' },
  text: { heading: 'Made slowly, worn for years', text: 'Every Richiva garment is cut and stitched in small batches in Lalitpur by a team of twenty tailors and embroiderers.', bg: 'ivory', space: 'md' },
  imagetext: { heading: 'Our atelier', text: 'Visit the studio in Jawalakhel to see fabrics, meet the tailors and book a fitting.', cta: 'Book a visit', image: photo(3, 900, 900), bg: 'ivory', space: 'md' },
  video: { heading: 'Behind the seams', cta: 'Watch film', image: photo(5, 1400, 700), bg: 'ink', space: 'md' },
  faq: { heading: 'Questions, answered', bg: 'ivory', space: 'md' },
  newsletter: { heading: 'Letters from the atelier', text: 'New arrivals and fabric stories, once a month.', cta: 'Subscribe', bg: 'sage', space: 'md' },
  marquee: { text: 'Handmade in Nepal  ·  Free alterations  ·  Cash on delivery  ·  Dashain edit now live', bg: 'ink', space: 'sm' },
  testimonials: { heading: 'Loved in Kathmandu and beyond', bg: 'ivory', space: 'md' },
};
let n = 0;
export const makeBlock = (type: BType): Block => ({ id: `b${Date.now().toString(36)}${n++}`, type, heading: '', text: '', image: '', alt: '', link: '/collections/all', cta: 'Shop now', bg: 'ivory', space: 'md', ...D[type] });

export const BG: Record<Bg, string> = { ivory: 'bg-soft text-fg', ink: 'bg-ink text-inkfg', champagne: 'bg-champagne text-white', sage: 'bg-sage text-white' };
const SP = { sm: 'py-6', md: 'py-12 @3xl:py-16', lg: 'py-20 @3xl:py-32' };
const Btn = ({ children, solid }: { children: React.ReactNode; solid?: boolean }) => <span className={cn('inline-flex items-center h-10 px-6 rounded-full text-[13px] tracking-wide', solid ? 'bg-current/0 border border-current' : 'border border-current')}>{children}</span>;
const H = ({ children, className }: { children: React.ReactNode; className?: string }) => <h2 className={cn('font-title text-[32px] @3xl:text-[44px] leading-[1.05] font-medium', className)}>{children}</h2>;

export function StoreHeader() {
  return (
    <div className="bg-card border-b border-line">
      <div className="bg-ink text-inkfg text-[11px] text-center py-1.5 tracking-wide">Free delivery in Kathmandu Valley on orders above Rs 8,000</div>
      <div className="flex items-center justify-between px-5 @3xl:px-10 py-4">
        <div className="hidden @3xl:flex gap-6 text-[12px] text-muted"><span>New in</span><span>Dresses</span><span>Tops</span><span>Custom</span></div>
        <Logo width={104} /><div className="flex gap-4 text-[12px] text-muted"><span>Search</span><span>Bag (0)</span></div>
      </div>
    </div>
  );
}
export function StoreFooter() {
  return <div className="bg-card border-t border-line px-6 py-10 text-center"><Logo width={96} className="mx-auto" /><div className="text-[12px] text-muted mt-3">Kathmandu · Lalitpur · Pokhara</div></div>;
}

export function BlockView({ b }: { b: Block }) {
  const wrap = (children: React.ReactNode, cls = '') => <section className={cn(BG[b.bg], SP[b.space], 'px-6 @3xl:px-14', cls)}>{children}</section>;
  switch (b.type) {
    case 'hero':
      return (
        <section className={cn('relative overflow-hidden', BG[b.bg], b.space === 'lg' ? 'min-h-[420px] @3xl:min-h-[540px]' : 'min-h-[300px]', 'flex items-end')}>
          {b.image && <img src={b.image} alt={b.alt} className="absolute inset-0 size-full object-cover" style={{ animation: 'zoom-slow 12s ease-out both' }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          <div className="relative text-white px-6 @3xl:px-14 pb-10 @3xl:pb-16 max-w-2xl"><H className="!text-[40px] @3xl:!text-[68px]">{b.heading}</H><p className="mt-3 text-[15px] opacity-90">{b.text}</p><div className="mt-6"><Btn>{b.cta}</Btn></div></div>
        </section>
      );
    case 'products':
      return wrap(<><div className="flex items-end justify-between mb-6"><H>{b.heading}</H><span className="text-[13px] underline underline-offset-4">{b.cta}</span></div>
        <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-4">{PRODUCTS.slice(7, 11).map((p) => <div key={p.id}><img src={photo(p.photo, 400, 520)} alt={p.name} className="w-full aspect-[4/5] object-cover rounded-sm" /><div className="mt-2 text-[13px]">{p.name}</div><div className="text-[13px] opacity-60 num">{rs(p.salePrice ?? p.price)}</div></div>)}</div></>);
    case 'collection':
      return wrap(<><H className="mb-6">{b.heading}</H><div className="grid grid-cols-1 @xl:grid-cols-3 gap-4">{['Autumn Atelier', 'Festive Edit', 'Everyday Linen'].map((c, i) => <div key={c} className="relative aspect-[4/5] overflow-hidden rounded-sm"><img src={photo(i + 6, 500, 640)} alt={c} className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><div className="absolute bottom-4 left-4 text-white"><div className="font-title text-[28px]">{c}</div><div className="text-[12px] underline underline-offset-4">{b.cta}</div></div></div>)}</div></>);
    case 'banner':
      return wrap(<div className="flex flex-wrap items-center justify-center gap-4 text-center"><span className="font-title text-[22px] @3xl:text-[26px]">{b.heading}</span><Btn>{b.cta}</Btn></div>);
    case 'text':
      return wrap(<div className="max-w-2xl mx-auto text-center"><H>{b.heading}</H><p className="mt-4 text-[15px] leading-relaxed opacity-75">{b.text}</p></div>);
    case 'imagetext':
      return wrap(<div className="grid grid-cols-1 @3xl:grid-cols-2 gap-8 items-center">{b.image ? <img src={b.image} alt={b.alt} className="w-full aspect-square object-cover rounded-sm" /> : <div className="aspect-square bg-stone grid place-items-center text-muted"><ImageIcon /></div>}<div><H>{b.heading}</H><p className="mt-4 text-[15px] leading-relaxed opacity-75">{b.text}</p><div className="mt-6"><Btn>{b.cta}</Btn></div></div></div>);
    case 'video':
      return wrap(<><H className="mb-6 text-center">{b.heading}</H><div className="relative aspect-video overflow-hidden rounded-sm bg-stone">{b.image && <img src={b.image} alt={b.alt} className="size-full object-cover" />}<div className="absolute inset-0 grid place-items-center bg-black/20"><span className="size-16 rounded-full bg-white/90 text-black grid place-items-center"><Play size={22} fill="currentColor" /></span></div></div></>);
    case 'faq':
      return wrap(<div className="max-w-2xl mx-auto"><H className="text-center mb-6">{b.heading}</H>{['How long does delivery take?', 'Can I return a made-to-order piece?', 'Do you offer cash on delivery?'].map((q) => <div key={q} className="flex items-center justify-between py-4 border-b border-current/20 text-[15px]">{q}<ChevronDown size={18} /></div>)}</div>);
    case 'newsletter':
      return wrap(<div className="max-w-xl mx-auto text-center"><H>{b.heading}</H><p className="mt-3 opacity-85 text-[15px]">{b.text}</p><div className="mt-6 flex flex-col @xl:flex-row gap-2"><div className="flex-1 h-11 rounded-full bg-white/90 text-black/50 text-[13px] px-5 flex items-center">Your email address</div><span className="h-11 px-7 rounded-full bg-ink text-inkfg text-[13px] inline-flex items-center justify-center">{b.cta}</span></div></div>);
    case 'marquee': {
      const t = (b.text || '').trim() + '   ·   ';
      return <section className={cn(BG[b.bg], SP[b.space], 'overflow-hidden whitespace-nowrap')}><style>{'@keyframes cms-marquee{to{transform:translateX(-50%)}}'}</style><div className="inline-block font-title text-[22px] tracking-wide" style={{ animation: 'cms-marquee 22s linear infinite' }}>{t.repeat(8)}</div></section>;
    }
    case 'testimonials':
      return wrap(<><H className="text-center mb-8">{b.heading}</H><div className="grid grid-cols-1 @3xl:grid-cols-3 gap-6">{[['The Anarkali fit perfectly after one alteration.', 'Sunita G., Kathmandu'], ['Fabric quality is beautiful. Arrived in two days.', 'Priya M., Pokhara'], ['My go to for festive wear every year.', 'Anjali T., Lalitpur']].map(([q, a]) => <figure key={a} className="bg-card text-fg rounded-sm p-6"><div className="flex gap-0.5 text-champagne mb-3">{[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} size={14} fill="currentColor" />)}</div><blockquote className="font-title text-[22px] leading-snug">{q}</blockquote><figcaption className="mt-3 text-[12px] text-muted">{a}</figcaption></figure>)}</div></>);
  }
}
