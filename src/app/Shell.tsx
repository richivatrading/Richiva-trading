import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Bell, Command, Headphones, LogOut, Menu, Search, Settings, User, ShoppingBag, Boxes, Undo2, Activity, FlaskConical, Check } from 'lucide-react';
import { Logo, LeafLoader, Star } from '../ui/brand';
import { Avatar, Button, DropdownMenu, Drawer, Tabs } from '../ui/kit';
import { NAV, ALL_ITEMS, BADGES, canView } from './nav';
import { navigate, useApp, useRoute } from '../store';
import { ORDERS, PRODUCTS, CUSTOMERS } from '../data/seed';
import { StateScreen } from './States';
import { cn } from '../lib/format';

const PAGES: Record<string, React.LazyExoticComponent<() => ReactNode>> = {
  overview: lazy(() => import('../views/Overview')), orders: lazy(() => import('../views/Orders')), returns: lazy(() => import('../views/Returns')),
  customers: lazy(() => import('../views/Customers')), reviews: lazy(() => import('../views/Reviews')), support: lazy(() => import('../views/Support')),
  products: lazy(() => import('../views/Products')), builder: lazy(() => import('../views/Builder')), media: lazy(() => import('../views/Media')),
  inventory: lazy(() => import('../views/Inventory')), marketing: lazy(() => import('../views/Marketing')), notifications: lazy(() => import('../views/Notifications')),
  analytics: lazy(() => import('../views/Analytics')), ai: lazy(() => import('../views/Ai')), cms: lazy(() => import('../views/Cms')),
  payments: lazy(() => import('../views/Payments')), shipping: lazy(() => import('../views/Shipping')), risk: lazy(() => import('../views/Risk')),
  tryon: lazy(() => import('../views/Tryon')), users: lazy(() => import('../views/Users')), integrations: lazy(() => import('../views/Integrations')),
  privacy: lazy(() => import('../views/Privacy')), outlets: lazy(() => import('../views/Outlets')), settings: lazy(() => import('../views/Settings')), profile: lazy(() => import('../views/Profile')),
};

function SidebarBody({ onNav }: { onNav?: () => void }) {
  const { role, logout } = useApp();
  const route = useRoute();
  const cur = route.path[0] ?? 'overview';
  const go = (to: string) => { navigate(to); onNav?.(); };
  const Item = ({ it }: { it: (typeof ALL_ITEMS)[number] }) => {
    const active = cur === it.id; const b = BADGES[it.id];
    return (
      <button onClick={() => go('/' + it.id)} className={cn('group relative w-full flex items-center gap-3 h-11 px-4 rounded-full text-[14px] transition-all duration-200', active ? 'bg-mid text-white font-medium' : 'text-fg/80 hover:bg-field hover:text-fg')}>
        <it.icon size={18} strokeWidth={1.5} className="shrink-0" />
        <span className="flex-1 text-left truncate">{it.label}</span>
        {b && <span className={cn('min-w-6 h-6 px-1.5 rounded-full text-[12px] flex items-center justify-center', active ? 'bg-white/25 text-white' : 'bg-field text-muted')}>{b}</span>}
      </button>
    );
  };
  const Foot = ({ icon: I, label, onClick }: { icon: typeof Settings; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 h-10 px-4 rounded-full text-[14px] text-fg/80 hover:bg-field hover:text-fg transition-colors"><I size={18} strokeWidth={1.5} />{label}</button>
  );
  return (
    <>
      <div className="h-[84px] flex items-center shrink-0 px-6">
        <button onClick={() => go('/overview')} aria-label="Overview"><Logo width={150} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto hide-scroll px-4 pb-3">
        {NAV.map((g, gi) => {
          const items = g.items.filter((i) => canView(role, i.id));
          if (!items.length) return null;
          return (
            <div key={g.label} className={gi === 0 ? '' : 'mt-5'}>
              {gi > 0 && <div className="px-4 mb-1.5 text-[12px] font-medium text-muted/80">{g.label}</div>}
              <div className="space-y-0.5">{items.map((it) => <Item key={it.id} it={it} />)}</div>
            </div>
          );
        })}
      </nav>
      <div className="px-4 pt-2">
        <div className="feature rounded-[24px] p-4 text-center">
          <div className="text-[15px] font-semibold">Low stock</div>
          <p className="text-white/70 text-[12.5px] leading-snug mt-1">7 items are running low this week.</p>
          <button onClick={() => go('/inventory?filter=Low')} className="mt-3 h-9 px-5 rounded-full bg-mid text-white text-[13.5px] font-medium hover:opacity-90 transition-opacity">Review stock</button>
        </div>
      </div>
      <div className="p-4 pt-3 space-y-0.5">
        {canView(role, 'settings') && <Foot icon={Settings} label="Settings" onClick={() => go('/settings')} />}
        <DropdownMenu align="left" width={230} trigger={<span className="w-full flex items-center gap-3 h-10 px-4 rounded-full text-[14px] text-fg/80 hover:bg-field hover:text-fg transition-colors cursor-pointer"><Headphones size={18} strokeWidth={1.5} />Help Center</span>}
          items={[{ label: 'Take the tour', onClick: () => window.dispatchEvent(new Event('rv-tour')) }, { label: 'Search shortcuts', hint: 'Ctrl K', onClick: () => window.dispatchEvent(new Event('rv-palette')) }, { divider: true, label: '' }, { label: 'Preview: 404 page', onClick: () => go('/state/404') }, { label: 'Preview: No access', onClick: () => go('/state/noaccess') }, { label: 'Preview: Maintenance', onClick: () => go('/state/maintenance') }, { label: 'Preview: Session expired', onClick: () => go('/state/expired') }, { label: 'Preview: Offline', onClick: () => go('/state/offline') }]} />
        <Foot icon={LogOut} label="Log out" onClick={logout} />
      </div>
    </>
  );
}

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      <aside data-tour="sidebar" className="hidden md:flex flex-col shrink-0 bg-card w-[248px] h-screen sticky top-0">
        <SidebarBody />
      </aside>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30 anim-fade-in" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-[270px] bg-card flex flex-col" style={{ animation: 'slide-left 300ms var(--ease) both' }}><SidebarBody onNav={onClose} /></aside>
        </div>
      )}
    </>
  );
}

const NOTIFS = [
  { g: 'Orders', icon: ShoppingBag, t: '12 orders are waiting to be confirmed', m: '2 min ago', to: '/orders?tab=To confirm', unread: true },
  { g: 'Orders', icon: ShoppingBag, t: 'New order RCV-10482 from Sunita Gurung', m: '9 min ago', to: '/orders/RCV-10482', unread: true },
  { g: 'Stock', icon: Boxes, t: 'Satin Slip Dress (M) has only 2 left', m: '34 min ago', to: '/inventory', unread: true },
  { g: 'Stock', icon: Boxes, t: '7 products are below their reorder level', m: '1 hour ago', to: '/inventory' },
  { g: 'Returns', icon: Undo2, t: 'Return RET-2041 needs your decision', m: '3 hours ago', to: '/returns', unread: true },
  { g: 'System', icon: Activity, t: 'Pathao API responding slowly (1.8s)', m: 'Yesterday', to: '/integrations' },
  { g: 'System', icon: Activity, t: 'Nightly backup completed (2.4 GB)', m: 'Yesterday', to: '/integrations' },
];
function NotifDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [read, setRead] = useState<number[]>([]);
  return (
    <Drawer open={open} onClose={onClose} title="Notifications" width={440} actions={<Button size="sm" variant="ghost" icon={Check} onClick={() => setRead(NOTIFS.map((_, i) => i))}>Mark all read</Button>}
      footer={<Button variant="secondary" onClick={() => { onClose(); navigate('/notifications'); }}>Edit message templates</Button>}>
      {['Orders', 'Stock', 'Returns', 'System'].map((g) => (
        <div key={g} className="mb-6">
          <div className="text-[14px] font-medium text-muted mb-2">{g}</div>
          {NOTIFS.map((n, i) => ({ n, i })).filter(({ n }) => n.g === g).map(({ n, i }) => (
            <button key={i} onClick={() => { setRead((r) => [...r, i]); onClose(); navigate(n.to); }} className="w-full flex gap-3 text-left p-3 rounded-xl hover:bg-soft transition-colors">
              <span className="size-10 rounded-full bg-field flex items-center justify-center shrink-0"><n.icon size={16} strokeWidth={1.5} /></span>
              <span className="flex-1"><span className="block text-[14px]">{n.t}</span><span className="text-muted text-[12px]">{n.m}</span></span>
              {n.unread && !read.includes(i) && <span className="size-2 rounded-full bg-dot mt-2" />}
            </button>
          ))}
        </div>
      ))}
    </Drawer>
  );
}

function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, logout } = useApp();
  const [q, setQ] = useState(''); const [idx, setIdx] = useState(0); const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  const items = useMemo(() => {
    const l = q.toLowerCase().trim(); const m = (s: string) => !l || s.toLowerCase().includes(l);
    const out: { g: string; label: string; sub?: string; run: () => void }[] = [];
    ALL_ITEMS.filter((i) => canView(role, i.id) && m(i.label)).forEach((i) => out.push({ g: 'Pages', label: i.label, run: () => navigate('/' + i.id) }));
    [{ l: 'New product', to: '/products/edit/new' }, { l: 'New order', to: '/orders?create=1' }, { l: 'New discount', to: '/marketing?tab=discounts&create=1' }, { l: 'Log out', to: '' }].filter((a) => m(a.l)).forEach((a) => out.push({ g: 'Actions', label: a.l, run: () => (a.l === 'Log out' ? logout() : navigate(a.to)) }));
    if (l) {
      ORDERS.filter((o) => m(o.id + o.customer)).slice(0, 4).forEach((o) => out.push({ g: 'Orders', label: o.id, sub: o.customer, run: () => navigate('/orders/' + o.id) }));
      CUSTOMERS.filter((c) => m(c.name + c.phone)).slice(0, 4).forEach((c) => out.push({ g: 'Customers', label: c.name, sub: c.city, run: () => navigate('/customers/' + c.id) }));
      PRODUCTS.filter((p) => m(p.name + p.sku)).slice(0, 4).forEach((p) => out.push({ g: 'Products', label: p.name, sub: p.sku, run: () => navigate('/products/edit/' + p.id) }));
    }
    return out.slice(0, 14);
  }, [q, role, logout]);
  useEffect(() => setIdx(0), [q]);
  if (!open) return null;
  const go = (i: number) => { items[i]?.run(); onClose(); };
  let last = '';
  return (
    <div className="fixed inset-0 z-[88] flex items-start justify-center pt-[14vh] p-4" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); } if (e.key === 'Enter') go(idx); }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px] anim-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[640px] bg-card rounded-[28px] shadow-[var(--shadow-lg)] overflow-hidden anim-fade-up" style={{ animationDuration: '250ms' }}>
        <div className="flex items-center gap-3 px-5 h-14 border-b border-line"><Search size={18} strokeWidth={1.5} className="text-muted" /><input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, orders, customers, products, actions…" className="flex-1 bg-transparent outline-none text-[15px]" /><kbd className="text-[11px] text-muted border border-line rounded px-1.5 py-0.5">Esc</kbd></div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <div className="text-center text-muted py-10">No results for “{q}”</div>}
          {items.map((it, i) => { const head = it.g !== last; last = it.g; return (
            <div key={i}>{head && <div className="text-[13px] font-medium text-muted px-3 pt-3 pb-1">{it.g}</div>}
              <button onMouseEnter={() => setIdx(i)} onClick={() => go(i)} className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left text-[14px]', idx === i ? 'bg-field' : '')}><span>{it.label}</span>{it.sub && <span className="text-muted text-[12px]">{it.sub}</span>}</button></div>
          ); })}
        </div>
      </div>
    </div>
  );
}

function TopBar({ onBell, onPalette, onMenu }: { onBell: () => void; onPalette: () => void; onMenu: () => void }) {
  const { user, logout } = useApp();
  const route = useRoute();
  const id = route.path[0] ?? 'overview';
  const fallback = ALL_ITEMS.find((i) => i.id === id)?.label ?? (id === 'profile' ? 'My profile' : 'Page');
  return (
    <header className="h-[84px] shrink-0 sticky top-0 z-30 glass flex items-center gap-3 px-5 lg:px-8">
      <button onClick={onMenu} className="md:hidden size-10 rounded-full bg-card flex items-center justify-center" aria-label="Menu"><Menu size={18} strokeWidth={1.5} /></button>
      <div className="flex-1 min-w-0 flex items-center">
        <div id="rv-title" className="min-w-0 empty:hidden" />
        <h1 className="rv-title-fallback text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] truncate">{fallback}</h1>
      </div>
      <button data-tour="search" onClick={onPalette} className="hidden sm:flex items-center gap-2.5 w-[min(30vw,280px)] h-11 rounded-full bg-card px-4 text-muted text-[14px] hover:shadow-[var(--shadow)] transition-shadow">
        <Search size={17} strokeWidth={1.5} /><span className="flex-1 text-left">Search...</span><kbd className="text-[11px] text-muted/80 flex items-center gap-0.5"><Command size={10} />K</kbd>
      </button>
      <button data-tour="bell" onClick={onBell} aria-label="Notifications" className="relative size-11 rounded-full bg-card flex items-center justify-center hover:bg-stone transition-colors">
        <Bell size={18} strokeWidth={1.5} /><span className="absolute top-2.5 right-3 size-2 rounded-full bg-dot" />
      </button>
      <DropdownMenu width={240} trigger={<button className="rounded-full block" aria-label="Account"><Avatar name={user.name} size={44} /></button>}
        header={<div className="px-4 py-3 border-b border-line mb-1"><div className="text-[14px] font-semibold">{user.name}</div><div className="text-muted text-[13px]">{user.email}</div></div>}
        items={[{ label: 'My profile', icon: User, onClick: () => navigate('/profile') }, { divider: true, label: '' }, { label: 'Log out', icon: LogOut, danger: true, onClick: logout }]} />
    </header>
  );
}

export default function Shell() {
  const { role, testMode } = useApp();
  const route = useRoute();
  const [bell, setBell] = useState(false); const [pal, setPal] = useState(false); const [menu, setMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal(true); } };
    const p = () => setPal(true); const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener('keydown', k); window.addEventListener('rv-palette', p); window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('rv-palette', p); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const id = route.path[0] ?? 'overview';
  const Page = PAGES[id];
  let body: ReactNode;
  if (id === 'state') body = <StateScreen kind={route.path[1] ?? '404'} />;
  else if (!Page) body = <StateScreen kind="404" />;
  else if (!canView(role, id)) body = <StateScreen kind="noaccess" />;
  else body = <Suspense fallback={<LeafLoader label="Loading" />}><Page key={id} /></Suspense>;
  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar mobileOpen={menu} onClose={() => setMenu(false)} />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        {testMode && <div className="h-7 shrink-0 bg-ink text-white text-[12px] font-medium flex items-center justify-center gap-2"><FlaskConical size={13} />TEST MODE · payments and notifications are simulated</div>}
        {offline && <div className="h-8 shrink-0 bg-bad text-white text-[12px] flex items-center justify-center">You are offline. Changes will sync when you reconnect.</div>}
        <TopBar onBell={() => setBell(true)} onPalette={() => setPal(true)} onMenu={() => setMenu(true)} />
        <main id="main-scroll" className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-5 lg:px-8 pt-1 pb-28" key={route.path.join('/')}>{body}</div>
        </main>
      </div>
      <NotifDrawer open={bell} onClose={() => setBell(false)} />
      <Palette open={pal} onClose={() => setPal(false)} />
    </div>
  );
}
export { Star, Tabs };
