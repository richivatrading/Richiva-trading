"use client";
import { useEffect, useMemo, useState } from 'react';
import { Archive, Banknote, Coins, Globe, Mail, Receipt, ShieldAlert, ShoppingBag, Store, Truck } from 'lucide-react';
import { Card, PageHeader, SaveBar, Skeleton, useFakeLoad } from '../ui/kit';
import { cn } from '../lib/format';
import { useApp, useRoute, navigate } from '../store';
import { Star } from '../ui/brand';
import { INITIAL, usePasswordAsk, validate, type Form, type Patch, type SecProps } from './settings/common';
import { CurrencySection, StoreSection, TaxSection } from './settings/SecStore';
import { CheckoutSection, CouriersSection, PaymentsSection } from './settings/SecPay';
import { BackupsSection, DangerSection, DomainsSection, MessagingSection } from './settings/SecOps';

const SECTIONS = [
  { id: 'store', label: 'Store details', icon: Store, C: StoreSection },
  { id: 'tax', label: 'Tax and VAT', icon: Receipt, C: TaxSection },
  { id: 'currency', label: 'Currency and formats', icon: Coins, C: CurrencySection },
  { id: 'payments', label: 'Payments', icon: Banknote, C: PaymentsSection },
  { id: 'couriers', label: 'Couriers', icon: Truck, C: CouriersSection },
  { id: 'checkout', label: 'Checkout', icon: ShoppingBag, C: CheckoutSection },
  { id: 'domains', label: 'Domains and SSL', icon: Globe, C: DomainsSection },
  { id: 'backups', label: 'Backups', icon: Archive, C: BackupsSection },
  { id: 'messaging', label: 'Email and SMS', icon: Mail, C: MessagingSection },
  { id: 'danger', label: 'Danger zone', icon: ShieldAlert, C: DangerSection },
];

export default function Settings() {
  const { query } = useRoute();
  const { toast } = useApp();
  const loading = useFakeLoad(600);
  const section = SECTIONS.some((s) => s.id === query.section) ? query.section : 'store';
  const [saved, setSaved] = useState<Form>(INITIAL);
  const [form, setForm] = useState<Form>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [ask, pwNode] = usePasswordAsk();
  const errors = useMemo(() => validate(form), [form]);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const dirtySecs = useMemo(() => new Set((Object.keys(form) as (keyof Form)[]).filter((k) => JSON.stringify(form[k]) !== JSON.stringify(saved[k]))), [form, saved]);
  const errSecs = new Set(Object.keys(errors).map((k) => k.split('.')[0]));
  const patch: Patch = (k, p) => setForm((f) => ({ ...f, [k]: { ...f[k], ...p } }));
  const go = (id: string) => navigate(`/settings?section=${id}`);
  useEffect(() => { document.getElementById('main-scroll')?.scrollTo({ top: 0 }); }, [section]);

  const save = () => {
    const keys = Object.keys(errors);
    if (keys.length) {
      const first = SECTIONS.find((s) => keys.some((k) => k.startsWith(s.id + '.')));
      if (first) go(first.id);
      toast(`Please fix ${keys.length} ${keys.length === 1 ? 'thing' : 'things'} first`, { body: 'Errors are shown in red' });
      return;
    }
    setSaving(true);
    setTimeout(() => { setSaved(form); setSaving(false); toast('Settings saved', { star: true }); }, 700);
  };
  const Cur = SECTIONS.find((s) => s.id === section)!.C;
  const props: SecProps = { form, patch, err: errors, ask };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Every setting in its own folder."
        hint={<div className="flex items-center gap-2 text-[13.5px]"><span className="size-2 rounded-full bg-ok text-ok pulse-dot" /><span>All set. SSL valid for 212 days. Last backup 2 hours ago.</span><Star size={12} twinkle className="text-champagne" /></div>} />
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start">
        <Card pad={false} hover={false} className="p-2 lg:sticky lg:top-4">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto hide-scroll">
            {SECTIONS.map(({ id, label, icon: I }) => {
              const active = id === section;
              return (
                <button key={id} onClick={() => go(id)} className={cn('relative flex items-center gap-3 h-11 px-3.5 rounded-xl text-[14px] whitespace-nowrap transition-all duration-200 text-left', active ? 'bg-soft text-fg font-medium' : 'text-muted hover:text-fg hover:bg-stone', id === 'danger' && !active && 'hover:text-bad')}>
                  <span className={cn('absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-champagne transition-transform duration-300 origin-center', active ? 'scale-y-100' : 'scale-y-0')} />
                  <I size={17} strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  {errSecs.has(id) ? <span className="size-2 rounded-full bg-bad" /> : dirtySecs.has(id as keyof Form) && <span className="size-2 rounded-full bg-champagne" />}
                </button>
              );
            })}
          </nav>
        </Card>
        {loading ? (
          <div className="flex flex-col gap-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
        ) : (
          <div key={section} className="anim-fade-in min-w-0"><Cur {...props} /></div>
        )}
      </div>
      <SaveBar show={dirty} saving={saving} onSave={save} onDiscard={() => { setForm(saved); toast('Changes discarded'); }} />
      {pwNode}
    </div>
  );
}

