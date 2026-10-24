import { useEffect, useState } from 'react';
import { Mail, MessageCircle, MessageSquare, Bell } from 'lucide-react';
import { Button, Field, Label, Modal, Segmented, Select } from '../../ui/kit';
import { useApp } from '../../store';
import { cn } from '../../lib/format';
import type { Customer } from '../../data/seed';

type Channel = 'Email' | 'SMS' | 'WhatsApp' | 'Push';
const TEMPLATES: Record<string, string> = {
  'Order update': 'Namaste {{name}}, your Richiva order is on its way and should reach you within 2 days. Thank you for your patience.',
  'Win-back offer': 'Namaste {{name}}, we have missed you. Enjoy 10% off your next piece with code WELCOME10 this week.',
  'Festive greeting': 'Happy Dashain, {{name}}. May your days be bright. Our festive edit is now open for you first.',
  'Thank you note': 'Dear {{name}}, thank you for shopping with Richiva. It means a great deal to a small team in Kathmandu.',
  'Custom message': '',
};
export function MessageModal({ open, onClose, people }: { open: boolean; onClose: () => void; people: Pick<Customer, 'name'>[] }) {
  const { toast } = useApp();
  const [ch, setCh] = useState<Channel>('Email'); const [tpl, setTpl] = useState('Order update'); const [text, setText] = useState(TEMPLATES['Order update']); const [err, setErr] = useState('');
  useEffect(() => { if (open) { setErr(''); setTpl('Order update'); setText(TEMPLATES['Order update']); } }, [open]);
  const first = people[0]?.name.split(' ')[0] ?? 'there';
  const send = () => {
    if (!text.trim()) return setErr('Write a message or choose a template.');
    onClose(); toast('Message sent', { body: `${ch} message sent to ${people.length === 1 ? people[0].name : `${people.length} customers`}.`, star: true });
  };
  return (
    <Modal open={open} onClose={onClose} title="Send message" size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={send}>Send via {ch}</Button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div><Label className="mb-2">To</Label><div className="text-[14px]">{people.length === 1 ? people[0].name : `${people.length} customers`}</div></div>
          <div><Label className="mb-2">Channel</Label><Segmented<Channel> value={ch} onChange={setCh} options={[{ value: 'Email', label: <><Mail size={13} />Email</> }, { value: 'SMS', label: <><MessageSquare size={13} />SMS</> }, { value: 'WhatsApp', label: <><MessageCircle size={13} />WhatsApp</> }, { value: 'Push', label: <><Bell size={13} />Push</> }]} className="flex-wrap" /></div>
          <Select label="Template" value={tpl} onChange={(v) => { setTpl(v); setText(TEMPLATES[v]); setErr(''); }} options={Object.keys(TEMPLATES)} />
          <Field multiline rows={5} label="Message" value={text} onChange={(v) => { setText(v); setErr(''); }} error={err} />
        </div>
        <div><Label className="mb-2">Preview</Label>
          <div className={cn('rounded-2xl border border-line p-4 min-h-[200px]', ch === 'WhatsApp' ? 'bg-[color-mix(in_srgb,var(--sage)_10%,transparent)]' : 'bg-soft')}>
            <div className="text-[11px] text-muted mb-2">{ch}{ch === 'Email' ? ' · Subject: A note from Richiva' : ''}</div>
            <div className="bg-card rounded-xl rounded-tl-sm p-3.5 text-[14px] shadow-[var(--shadow)] whitespace-pre-wrap">{text.replace(/\{\{name\}\}/g, first) || <span className="text-muted">Your message appears here.</span>}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function AmountModal({ open, onClose, title, label = 'Amount', prefix, signed, withExpiry, cta, onSubmit }: { open: boolean; onClose: () => void; title: string; label?: string; prefix?: string; signed?: boolean; withExpiry?: boolean; cta: string; onSubmit: (amount: number, reason: string, expiry: string) => void }) {
  const [amt, setAmt] = useState(''); const [reason, setReason] = useState(''); const [exp, setExp] = useState('2027-04-18'); const [e, setE] = useState<Record<string, string>>({});
  useEffect(() => { if (open) { setAmt(''); setReason(''); setE({}); } }, [open]);
  const go = () => {
    const n = +amt; const er: Record<string, string> = {};
    if (!amt || isNaN(n) || n === 0 || (!signed && n < 0)) er.amt = signed ? 'Enter an amount, like 200 or -200.' : 'Enter an amount above zero.';
    if (!reason.trim()) er.reason = 'Please give a reason for the record.';
    if (withExpiry && !exp) er.exp = 'Choose an expiry date.';
    setE(er); if (!Object.keys(er).length) { onSubmit(n, reason, exp); onClose(); }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={go}>{cta}</Button></>}>
      <div className="space-y-4">
        <Field label={label} type="number" prefix={prefix} value={amt} onChange={setAmt} error={e.amt} />
        <Field label="Reason" value={reason} onChange={setReason} error={e.reason} />
        {withExpiry && <Field label="Expires on" type="date" value={exp} onChange={setExp} error={e.exp} />}
      </div>
    </Modal>
  );
}
