import { useEffect, useState } from 'react';
import { PageHeader, Tabs, SaveBar, Skeleton, useFakeLoad, Pill } from '../ui/kit';
import { Star } from '../ui/brand';
import { useApp, useRoute, navigate } from '../store';
import { tryonStore, type TryonSettings } from './tryon/state';
import SettingsTab from './tryon/SettingsTab';
import Readiness from './tryon/Readiness';
import Usage from './tryon/Usage';
import Lookup from './tryon/Lookup';

const TABS = [{ id: 'settings', label: 'Settings' }, { id: 'readiness', label: 'Garment readiness' }, { id: 'usage', label: 'Usage report' }, { id: 'lookup', label: 'Customer lookup' }] as const;
type Tab = (typeof TABS)[number]['id'];

export default function Tryon() {
  const route = useRoute();
  const { toast } = useApp();
  const q = route.query.tab as Tab;
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === q) ? q : 'settings');
  useEffect(() => { if (TABS.some((t) => t.id === q)) setTab(q); }, [q]);
  const go = (t: Tab) => { setTab(t); navigate(`/tryon?tab=${t}`); };
  const loading = useFakeLoad(600);
  const [saved] = tryonStore.use();
  const [draft, setDraft] = useState<TryonSettings>(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const save = () => { tryonStore.set(draft); toast('Try-on settings saved', { star: true }); };

  return (
    <div>
      <PageHeader title={<span className="inline-flex items-center gap-3">Virtual try-on <Star size={22} twinkle /></span>} subtitle="Control how customers see garments on themselves, and keep an eye on readiness and cost."
        badge={<Pill tone={saved.live ? 'success' : 'neutral'} dot>{saved.live ? 'Live' : 'Paused'}</Pill>} />
      <Tabs tabs={[...TABS]} value={tab} onChange={go} className="mb-6" />
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-72 rounded-2xl lg:col-span-2" /></div>
      ) : (
        <div key={tab}>
          {tab === 'settings' && <SettingsTab draft={draft} setDraft={setDraft} />}
          {tab === 'readiness' && <Readiness />}
          {tab === 'usage' && <Usage />}
          {tab === 'lookup' && <Lookup />}
        </div>
      )}
      <SaveBar show={dirty && tab === 'settings'} onSave={save} onDiscard={() => setDraft(saved)} />
    </div>
  );
}
