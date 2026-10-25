"use client";
import { useEffect, useState } from 'react';
import { Button, Field, Modal, Segmented, Select } from '../../ui/kit';
import type { Outlet, OutletType } from './data';

export interface FormVals { name: string; type: OutletType; city: string; address: string; phone: string; manager: string; opens: string; closes: string }
const EMPTY: FormVals = { name: '', type: 'Outlet', city: 'Kathmandu', address: '', phone: '+977 ', manager: '', opens: '10:00', closes: '19:00' };
const CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Butwal', 'Bharatpur', 'Dharan', 'Birgunj'];

export default function OutletForm({ open, edit, onClose, onSave }: { open: boolean; edit: Outlet | null; onClose: () => void; onSave: (v: FormVals) => void }) {
  const [v, setV] = useState<FormVals>(EMPTY);
  const [err, setErr] = useState<Partial<Record<keyof FormVals, string>>>({});
  const [shake, setShake] = useState(0);
  useEffect(() => { if (open) { setErr({}); setV(edit ? { name: edit.name, type: edit.type, city: edit.city, address: edit.address, phone: edit.phone, manager: edit.manager, opens: edit.opens, closes: edit.closes } : EMPTY); } }, [open, edit]);
  const set = <K extends keyof FormVals>(k: K, x: FormVals[K]) => { setV((s) => ({ ...s, [k]: x })); setErr((e) => ({ ...e, [k]: undefined })); };
  const submit = () => {
    const e: typeof err = {};
    if (v.name.trim().length < 3) e.name = 'Please enter a name with at least 3 letters';
    if (v.address.trim().length < 5) e.address = 'Please enter the street or area';
    if (!/^\+977[\s-]?9\d{2}[\s-]?\d{6}$/.test(v.phone.trim()) && !/^\+977[\s-]?\d{1,2}[\s-]?\d{6,7}$/.test(v.phone.trim())) e.phone = 'Use a Nepal number, like +977 9801-234567';
    if (v.manager.trim().length < 3) e.manager = 'Please enter the manager\'s name';
    if (v.closes <= v.opens) e.closes = 'Closing time must be after opening time';
    setErr(e);
    if (Object.keys(e).length) { setShake((n) => n + 1); return; }
    onSave({ ...v, name: v.name.trim(), address: v.address.trim(), manager: v.manager.trim(), phone: v.phone.trim() });
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? 'Edit outlet' : 'Add outlet'} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>{edit ? 'Save changes' : 'Add outlet'}</Button></>}>
      <div key={shake} className={`grid gap-5 ${shake ? 'anim-shake' : ''}`}>
        <Segmented<OutletType> options={[{ value: 'Outlet', label: 'Outlet' }, { value: 'Branch', label: 'Branch' }]} value={v.type} onChange={(x) => set('type', x)} />
        <Field label="Name" value={v.name} onChange={(x) => set('name', x)} error={err.name} autoFocus />
        <div className="grid sm:grid-cols-2 gap-5">
          <Select label="City" value={v.city} onChange={(x) => set('city', x)} options={CITIES} />
          <Field label="Phone" value={v.phone} onChange={(x) => set('phone', x)} error={err.phone} />
        </div>
        <Field label="Street or area" value={v.address} onChange={(x) => set('address', x)} error={err.address} />
        <Field label="Manager" value={v.manager} onChange={(x) => set('manager', x)} error={err.manager} />
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Opens at" type="time" value={v.opens} onChange={(x) => set('opens', x)} />
          <Field label="Closes at" type="time" value={v.closes} onChange={(x) => set('closes', x)} error={err.closes} />
        </div>
      </div>
    </Modal>
  );
}

