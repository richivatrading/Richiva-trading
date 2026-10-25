import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Check, Star as StarIcon } from 'lucide-react';
import { type Role } from './app/nav';
import { Button, Modal } from './ui/kit';

/* ---------- tiny global data stores ---------- */
export function makeStore<T>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  const get = () => state;
  const set = (v: T | ((p: T) => T)) => { state = typeof v === 'function' ? (v as (p: T) => T)(state) : v; Array.from(subs).forEach((s) => s()); };
  const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
  const use = () => [useSyncExternalStore(sub, get, get), set] as const;
  return { get, set, use };
}

/* ---------- router (hash) ---------- */
export interface Route { path: string[]; query: Record<string, string>; }
const parseHash = (): Route => {
  if (typeof window === 'undefined') return { path: [], query: {} };
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [p, q = ''] = raw.split('?');
  const query: Record<string, string> = {};
  new URLSearchParams(q).forEach((v, k) => (query[k] = v));
  return { path: p.split('/').filter(Boolean), query };
};
export function navigate(to: string) { if (typeof window !== 'undefined') window.location.hash = to.startsWith('/') ? to : '/' + to; }

/* ---------- toasts ---------- */
interface ToastItem { id: number; title: string; body?: string; undo?: () => void; star?: boolean; }
interface AppCtx {
  theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') => void;
  role: Role; setRole: (r: Role) => void;
  route: Route;
  toast: (title: string, opts?: { body?: string; undo?: () => void; star?: boolean }) => void;
  confirm: (o: { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
  testMode: boolean; setTestMode: (b: boolean) => void;
  collapsed: boolean; setCollapsed: (b: boolean) => void;
  openPalette: () => void;
  user: { name: string; email: string };
  logout: () => void;
}
const Ctx = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(Ctx);
export const useRoute = () => useApp().route;

export function AppProvider({ children, onLogout, openPalette }: { children: ReactNode; onLogout: () => void; openPalette: () => void }) {
  const [theme, setThemeS] = useState<'light' | 'dark'>('light');
  const [role, setRole] = useState<Role>('Owner');
  const [route, setRoute] = useState<Route>({ path: [], query: {} });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dlg, setDlg] = useState<null | { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean; resolve: (b: boolean) => void }>(null);
  const idc = useRef(0);
  const mounted = useRef(false);

  useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
  useEffect(() => {
    mounted.current = true;
    setRoute(parseHash());
    const f = () => { setRoute(parseHash()); document.getElementById('main-scroll')?.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  const toast = useCallback<AppCtx['toast']>((title, opts = {}) => {
    const id = ++idc.current;
    setToasts((t) => [...t, { id, title, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.undo ? 6500 : 3800);
  }, []);
  const confirm = useCallback<AppCtx['confirm']>((o) => new Promise((resolve) => setDlg({ ...o, resolve })), []);
  const close = (b: boolean) => { dlg?.resolve(b); setDlg(null); };

  const value = useMemo<AppCtx>(() => ({
    theme, setTheme: () => setThemeS('light'), role, setRole, route, toast, confirm, testMode, setTestMode, collapsed, setCollapsed, openPalette,
    user: { name: 'Anita Shrestha', email: 'owner@richiva.com' }, logout: onLogout,
  }), [theme, role, route, toast, confirm, testMode, collapsed, openPalette, onLogout]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 bg-ink text-inkfg rounded-full pl-4 pr-2 py-2 shadow-[var(--shadow-lg)]" style={{ animation: 'toast-in 320ms var(--ease) both' }}>
            {t.star ? <StarIcon size={14} className="text-white" fill="currentColor" /> : <Check size={15} className="text-white" />}
            <div className="text-[13px]"><span className="font-medium">{t.title}</span>{t.body && <span className="opacity-70"> · {t.body}</span>}</div>
            {t.undo ? (
              <button className="text-[12px] font-semibold text-white px-3 py-1 rounded-full hover:bg-white/10" onClick={() => { t.undo?.(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>Undo</button>
            ) : <span className="w-2" />}
          </div>
        ))}
      </div>
      <Modal open={!!dlg} onClose={() => close(false)} title={dlg?.title ?? ''} size="sm"
        footer={<><Button variant="secondary" onClick={() => close(false)}>Cancel</Button><Button variant={dlg?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{dlg?.confirmLabel ?? 'Confirm'}</Button></>}>
        <div className="text-muted text-[14px]">{dlg?.body}</div>
      </Modal>
    </Ctx.Provider>
  );
}
