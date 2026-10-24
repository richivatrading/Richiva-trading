import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button, Field, Select, Switch, Pill } from '../../ui/kit';
import { Logo } from '../../ui/brand';
import { rs, cn } from '../../lib/format';
import { Grid2, SettingCard, SwitchRow, type SecProps } from './common';

export function StoreSection({ form, patch, err }: SecProps) {
  const s = form.store; const up = (p: Partial<typeof s>) => patch('store', p);
  const file = useRef<HTMLInputElement>(null);
  const [fileErr, setFileErr] = useState('');
  const pick = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setFileErr('Please choose an image file (PNG, JPG or SVG).');
    if (f.size > 2 * 1024 * 1024) return setFileErr('That image is over 2 MB. Please choose a smaller one.');
    setFileErr(''); up({ logo: URL.createObjectURL(f), logoName: f.name });
  };
  const setHour = (i: number, p: Partial<(typeof s.hours)[number]>) => up({ hours: s.hours.map((h, j) => (j === i ? { ...h, ...p } : h)) });
  return (
    <div className="flex flex-col gap-6">
      <SettingCard title="Store details" sub="The name and logo customers see on invoices and emails.">
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="h-24 min-w-52 px-6 rounded-2xl bg-soft border border-line flex items-center justify-center">
            {s.logo ? <img key={s.logo} src={s.logo} alt="New logo" className="max-h-16 max-w-40 object-contain anim-fade-in" /> : <Logo width={140} />}
          </div>
          <div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => file.current?.click()}>Replace</Button>
              {s.logo && <Button variant="ghost" size="sm" icon={X} onClick={() => up({ logo: '', logoName: '' })}>Remove new logo</Button>}
            </div>
            <div className="text-muted text-[12.5px] mt-2">{s.logoName ? `New logo: ${s.logoName}` : 'PNG, JPG or SVG, up to 2 MB.'}</div>
            {fileErr && <div className="text-bad text-[12px] mt-1 anim-fade-in">{fileErr}</div>}
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
        <Grid2>
          <Field label="Store name" value={s.name} onChange={(v) => up({ name: v })} error={err['store.name']} />
          <Field label="Contact email" value={s.email} onChange={(v) => up({ email: v })} error={err['store.email']} />
          <Field label="Contact phone" value={s.phone} onChange={(v) => up({ phone: v })} error={err['store.phone']} />
          <Field label="City" value={s.city} onChange={(v) => up({ city: v })} error={err['store.city']} />
          <Field className="md:col-span-2" label="Address" value={s.address} onChange={(v) => up({ address: v })} error={err['store.address']} />
        </Grid2>
      </SettingCard>
      <SettingCard title="Opening hours" sub="Shown on your contact page and in order emails." i={1}>
        <div className="flex flex-col">
          {s.hours.map((h, i) => (
            <div key={h.day} className="flex flex-wrap items-center gap-4 py-2.5 border-b border-line last:border-0">
              <div className="w-28 text-[14px]">{h.day}</div>
              <Switch checked={h.open} onChange={(v) => setHour(i, { open: v })} label={`${h.day} open`} />
              {h.open ? (
                <div className="flex items-center gap-2 anim-fade-in">
                  <input type="time" value={h.from} onChange={(e) => setHour(i, { from: e.target.value })} className={cn('h-10 rounded-[10px] bg-card border px-3 text-[14px] outline-none focus:border-champagne', err[`store.hours.${i}`] ? 'border-bad' : 'border-line')} />
                  <span className="text-muted">to</span>
                  <input type="time" value={h.to} onChange={(e) => setHour(i, { to: e.target.value })} className={cn('h-10 rounded-[10px] bg-card border px-3 text-[14px] outline-none focus:border-champagne', err[`store.hours.${i}`] ? 'border-bad' : 'border-line')} />
                  {err[`store.hours.${i}`] && <span className="text-bad text-[12px]">{err[`store.hours.${i}`]}</span>}
                </div>
              ) : <Pill>Closed</Pill>}
            </div>
          ))}
        </div>
      </SettingCard>
      <SettingCard title="Social links" sub="Leave blank to hide a link." i={2}>
        <Grid2>
          <Field label="Instagram" value={s.instagram} onChange={(v) => up({ instagram: v })} error={err['store.instagram']} />
          <Field label="Facebook" value={s.facebook} onChange={(v) => up({ facebook: v })} error={err['store.facebook']} />
          <Field label="TikTok" value={s.tiktok} onChange={(v) => up({ tiktok: v })} error={err['store.tiktok']} hint="Optional" />
        </Grid2>
      </SettingCard>
    </div>
  );
}

const SAMPLE = [{ n: 'Satin Slip Dress', q: 1, p: 5900 }, { n: 'Pashmina Shawl', q: 2, p: 4200 }];
export function TaxSection({ form, patch, err }: SecProps) {
  const t = form.tax; const up = (p: Partial<typeof t>) => patch('tax', p);
  const sum = SAMPLE.reduce((a, i) => a + i.p * i.q, 0);
  const vat = t.incl ? Math.round((sum * 13) / 113) : Math.round(sum * 0.13);
  const net = t.incl ? sum - vat : sum; const total = t.incl ? sum : sum + vat;
  const no = `${t.prefix || '—'}-${String(/^\d+$/.test(t.next) ? t.next : 0).padStart(5, '0')}`;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div className="flex flex-col gap-6">
        <SettingCard title="Tax and VAT" sub="Nepal VAT is 13 percent. It is applied to every taxable order.">
          <div className="flex items-center justify-between rounded-xl bg-soft border border-line px-4 py-3 mb-2">
            <div><div className="label-caps">VAT rate</div><div className="text-[22px] font-semibold num">13%</div></div><Pill tone="neutral">Set by law</Pill>
          </div>
          <SwitchRow title="Prices include VAT" sub={t.incl ? 'The price on the product page is the final price.' : 'VAT is added on top at checkout.'} checked={t.incl} onChange={(v) => up({ incl: v })} />
          <Field className="mt-4" label="PAN or VAT number" value={t.pan} onChange={(v) => up({ pan: v.replace(/\D/g, '').slice(0, 9) })} error={err['tax.pan']} hint="9 digits, printed on every invoice." />
        </SettingCard>
        <SettingCard title="Invoices" sub="How your invoice numbers and footer look." i={1}>
          <Grid2>
            <Field label="Invoice prefix" value={t.prefix} onChange={(v) => up({ prefix: v.toUpperCase() })} error={err['tax.prefix']} />
            <Field label="Next invoice number" value={t.next} onChange={(v) => up({ next: v.replace(/\D/g, '') })} error={err['tax.next']} />
          </Grid2>
          <Field className="mt-4" multiline rows={3} label="Invoice footer text" value={t.footer} onChange={(v) => up({ footer: v })} error={err['tax.footer']} hint={`${t.footer.length}/160`} />
        </SettingCard>
      </div>
      <SettingCard title="Live invoice preview" sub="Updates as you type." i={2}>
        <div className="rounded-xl border border-line bg-white text-[#1a1a1a] p-6 shadow-[var(--shadow)]">
          <div className="flex justify-between items-start"><div className="[&_svg]:text-[#1a1a1a]"><Logo width={100} /></div><div className="text-right text-[12px]"><div className="font-semibold text-[13px]">TAX INVOICE</div><div className="num">{no}</div><div className="text-[#777]">18 Oct 2026</div></div></div>
          <div className="text-[12px] text-[#555] mt-3">{form.store.name} · {form.store.address}<br />PAN/VAT: <span className="num">{t.pan || '—'}</span></div>
          <table className="w-full text-[12.5px] mt-4"><thead><tr className="text-left text-[#777] border-b border-[#e3e1e5]"><th className="py-1.5 font-normal">Item</th><th className="font-normal text-right">Qty</th><th className="font-normal text-right">Price</th></tr></thead>
            <tbody>{SAMPLE.map((i) => <tr key={i.n} className="border-b border-[#f0eff1]"><td className="py-1.5">{i.n}</td><td className="text-right num">{i.q}</td><td className="text-right num">{rs(i.p * i.q)}</td></tr>)}</tbody></table>
          <div className="text-[12.5px] mt-3 ml-auto w-48 space-y-1">
            <div className="flex justify-between"><span className="text-[#777]">Subtotal</span><span className="num">{rs(net)}</span></div>
            <div className="flex justify-between"><span className="text-[#777]">VAT 13%</span><span className="num">{rs(vat)}</span></div>
            <div className="flex justify-between font-semibold border-t border-[#e3e1e5] pt-1"><span>Total</span><span className="num">{rs(total)}</span></div>
          </div>
          <div className="text-[11.5px] text-[#777] mt-5 pt-3 border-t border-[#e3e1e5] min-h-8">{t.footer || 'Your footer text appears here.'}</div>
        </div>
      </SettingCard>
    </div>
  );
}

const NE = '०१२३४५६७८९';
export function CurrencySection({ form, patch }: SecProps) {
  const c = form.currency; const [raw, setRaw] = useState('12500000');
  const n = +raw || 0;
  return (
    <SettingCard title="Currency and formats" sub="Richiva sells in Nepali rupees only.">
      <Grid2>
        <Select label="Currency" value="NPR" onChange={() => {}} options={[{ value: 'NPR', label: 'NPR · Nepali rupee (fixed)' }]} />
        <Select label="Date format" value={c.dateFmt} onChange={(v) => patch('currency', { dateFmt: v })} options={['DD MMM YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']} />
      </Grid2>
      <div className="mt-6 rounded-xl bg-soft border border-line p-5">
        <div className="label-caps mb-3">Digit grouping preview</div>
        <Field label="Try a number" value={raw} onChange={(v) => setRaw(v.replace(/\D/g, '').slice(0, 10))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div><div className="text-muted text-[12px]">Shown to customers</div><div key={raw} className="font-title text-[34px] num anim-fade-in">{rs(n)}</div></div>
          <div><div className="text-muted text-[12px]">In Nepali digits</div><div className="font-title text-[34px] num">रु {rs(n).slice(3).replace(/\d/g, (d) => NE[+d])}</div></div>
        </div>
        <div className="text-muted text-[12.5px] mt-2">Groups follow the lakh and crore pattern: 3 digits, then pairs.</div>
      </div>
    </SettingCard>
  );
}
