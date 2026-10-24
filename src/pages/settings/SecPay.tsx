import { Banknote, CreditCard, Landmark, Truck } from 'lucide-react';
import { Field, Pill, Switch } from '../../ui/kit';
import { useApp } from '../../store';
import { cn } from '../../lib/format';
import { Grid2, SecretField, SettingCard, SwitchRow, VerifyButton, type SecProps } from './common';

export function PaymentsSection({ form, patch, err, ask }: SecProps) {
  const { testMode, setTestMode } = useApp();
  const p = form.pay;
  const upk = (k: 'ips' | 'npx', d: Partial<(typeof p)['ips']>) => patch('pay', { [k]: { ...p[k], ...d } });
  const prov = [
    { k: 'ips' as const, name: 'ConnectIPS', sub: 'Bank transfer through Nepal Clearing House.', icon: Landmark },
    { k: 'npx' as const, name: 'NPX', sub: 'Nepal Payments Exchange: eSewa, Khalti, IME Pay and cards.', icon: CreditCard },
  ];
  return (
    <div className="flex flex-col gap-6">
      <SettingCard title="Payments" sub="Choose how customers can pay." action={
        <div className="flex items-center gap-3"><div className="text-right"><div className="text-[13.5px]">Test mode</div><div className="text-muted text-[12px]">{testMode ? 'No real money moves' : 'Live payments'}</div></div><Switch checked={testMode} onChange={(v) => { setTestMode(v); }} label="Test mode" /></div>}>
        <div className={cn('rounded-xl px-4 py-3 text-[13px] transition-colors duration-300', testMode ? 'bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-warn' : 'bg-soft text-muted')}>
          {testMode ? 'Test mode is on. A ribbon shows across the admin until you switch it off.' : 'Test mode is off. Customers are paying for real.'}
        </div>
      </SettingCard>
      {prov.map(({ k, name, sub, icon: I }, i) => (
        <SettingCard key={k} i={i + 1} title={<span className="flex items-center gap-2.5"><I size={20} strokeWidth={1.5} />{name}</span>} sub={sub}
          action={<div className="flex items-center gap-3"><Pill tone={p[k].on ? 'success' : 'neutral'} dot>{p[k].on ? 'Enabled' : 'Off'}</Pill><Switch checked={p[k].on} onChange={(v) => upk(k, { on: v })} label={`Enable ${name}`} /></div>}>
          <div className={cn('transition-opacity duration-300', !p[k].on && 'opacity-50 pointer-events-none')}>
            <Grid2>
              <Field label="Merchant ID" value={p[k].merchant} onChange={(v) => upk(k, { merchant: v })} error={err[`pay.${k}.merchant`]} />
              <SecretField label="Secret key" value={p[k].key} onChange={(v) => upk(k, { key: v })} ask={ask} error={err[`pay.${k}.key`]} />
            </Grid2>
            <div className="mt-4"><VerifyButton /></div>
          </div>
        </SettingCard>
      ))}
      <SettingCard i={3} title={<span className="flex items-center gap-2.5"><Banknote size={20} strokeWidth={1.5} />Cash on Delivery</span>} sub="Pay when the parcel arrives."
        action={<div className="flex items-center gap-3"><Pill tone={p.cod.on ? 'success' : 'neutral'} dot>{p.cod.on ? 'Enabled' : 'Off'}</Pill><Switch checked={p.cod.on} onChange={(v) => patch('pay', { cod: { ...p.cod, on: v } })} label="Enable Cash on Delivery" /></div>}>
        <div className={cn('transition-opacity duration-300', !p.cod.on && 'opacity-50 pointer-events-none')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field prefix="Rs" label="Smallest order" value={p.cod.min} onChange={(v) => patch('pay', { cod: { ...p.cod, min: v.replace(/\D/g, '') } })} error={err['pay.cod.min']} />
            <Field prefix="Rs" label="Largest order" value={p.cod.max} onChange={(v) => patch('pay', { cod: { ...p.cod, max: v.replace(/\D/g, '') } })} error={err['pay.cod.max']} />
            <Field prefix="Rs" label="COD fee" value={p.cod.fee} onChange={(v) => patch('pay', { cod: { ...p.cod, fee: v.replace(/\D/g, '') } })} error={err['pay.cod.fee']} />
          </div>
          <div className="text-muted text-[12.5px] mt-3">Orders outside these limits must be paid online.</div>
        </div>
      </SettingCard>
    </div>
  );
}

export function CouriersSection({ form, patch, err, ask }: SecProps) {
  const c = form.couriers;
  const upc = (k: 'pathao' | 'ncm', d: Partial<(typeof c)['pathao']>) => patch('couriers', { [k]: { ...c[k], ...d } });
  return (
    <div className="flex flex-col gap-6">
      {([['pathao', 'Pathao'], ['ncm', 'Nepal Can Move']] as const).map(([k, name], i) => (
        <SettingCard key={k} i={i} title={<span className="flex items-center gap-2.5"><Truck size={20} strokeWidth={1.5} />{name}</span>} sub="Used to book pickups and track parcels."
          action={<div className="flex items-center gap-3"><Pill tone={c[k].on ? 'success' : 'neutral'} dot>{c[k].on ? 'Connected' : 'Off'}</Pill><Switch checked={c[k].on} onChange={(v) => upc(k, { on: v })} label={`Enable ${name}`} /></div>}>
          <div className={cn('transition-opacity duration-300', !c[k].on && 'opacity-50 pointer-events-none')}>
            <Grid2>
              <Field label="Account ID" value={c[k].id} onChange={(v) => upc(k, { id: v })} error={err[`couriers.${k}.id`]} />
              <SecretField label="API key" value={c[k].key} onChange={(v) => upc(k, { key: v })} ask={ask} error={err[`couriers.${k}.key`]} />
            </Grid2>
            <div className="mt-4"><VerifyButton /></div>
          </div>
        </SettingCard>
      ))}
      <SettingCard i={2} title="Pickup address" sub="Riders collect parcels from here.">
        <Field label="Address" value={c.pickup} onChange={(v) => patch('couriers', { pickup: v })} error={err['couriers.pickup']} />
        <Grid2 className="mt-4">
          <Field label="Contact person" value={c.contact} onChange={(v) => patch('couriers', { contact: v })} error={err['couriers.contact']} />
          <Field label="Contact phone" value={c.phone} onChange={(v) => patch('couriers', { phone: v })} error={err['couriers.phone']} />
        </Grid2>
      </SettingCard>
    </div>
  );
}

export function CheckoutSection({ form, patch, err }: SecProps) {
  const c = form.checkout; const up = (d: Partial<typeof c>) => patch('checkout', d);
  return (
    <SettingCard title="Checkout" sub="What customers go through before paying.">
      <SwitchRow title="Guest checkout" sub="Let people order without making an account." checked={c.guest} onChange={(v) => up({ guest: v })} />
      <SwitchRow title="Phone number required" sub="Needed for courier calls and Cash on Delivery checks." checked={c.phoneReq} onChange={(v) => up({ phoneReq: v })} />
      <Field className="mt-5 md:w-1/2" prefix="Rs" label="Minimum order" value={c.minOrder} onChange={(v) => up({ minOrder: v.replace(/\D/g, '') })} error={err['checkout.minOrder']} hint="Use 0 for no minimum." />
      <Field className="mt-4" multiline rows={4} label="Terms text shown at checkout" value={c.terms} onChange={(v) => up({ terms: v })} error={err['checkout.terms']} />
    </SettingCard>
  );
}
