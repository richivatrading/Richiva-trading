import { PRODUCTS } from '../../data/seed';
import { makeStore } from '../../store';
import { hash } from './data';

export const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const TODAY = '2026-10-18';
export const REASONS = ['Damaged', 'Lost', 'Found', 'Miscount', 'Returned to supplier', 'Other'];
const pname = (i: number) => PRODUCTS[7 + (i % (PRODUCTS.length - 7))].name;
const pprice = (n: string) => PRODUCTS.find((p) => p.name === n)?.price ?? 3000;
export const PRODUCT_NAMES = Array.from(new Set(PRODUCTS.slice(7, 40).map((p) => p.name)));

export interface Bin { code: string; product: string; units: number; cap: number }
export interface Zone { name: string; bins: Bin[] }
export interface Warehouse { id: string; name: string; kind: 'Warehouse' | 'Outlet'; address: string; manager: string; phone: string; status: 'Active' | 'Inactive'; zones: Zone[] }
export const whUnits = (w: Warehouse) => w.zones.reduce((a, z) => a + z.bins.reduce((b, x) => b + x.units, 0), 0);
export const whCap = (w: Warehouse) => w.zones.reduce((a, z) => a + z.bins.reduce((b, x) => b + x.cap, 0), 0);
export const whPct = (w: Warehouse) => Math.round((whUnits(w) / Math.max(1, whCap(w))) * 100);

const mkZones = (seed: string, names: string[], n: number, fill: number): Zone[] => names.map((name, zi) => ({
  name, bins: Array.from({ length: n }, (_, i) => {
    const h = hash(seed + name + i); const cap = 60 + (h % 5) * 10;
    return { code: `${String.fromCharCode(65 + zi)}-${String(i + 1).padStart(2, '0')}`, product: pname(h + i * 7), units: Math.min(cap, Math.max(0, Math.round(cap * (fill + ((h % 20) - 10) / 100)))), cap };
  }),
}));
const ZN = ['Dresses', 'Kurtas and sets', 'Accessories'];
export const whStore = makeStore<Warehouse[]>([
  { id: 'wh1', name: 'Kathmandu Main Warehouse', kind: 'Warehouse', address: 'Balaju Industrial District, Kathmandu', manager: 'Suresh Shrestha', phone: '+977 9841-234567', status: 'Active', zones: mkZones('ktm', ZN, 6, 0.82) },
  { id: 'wh2', name: 'Lalitpur Warehouse', kind: 'Warehouse', address: 'Pulchowk, Lalitpur', manager: 'Anita Maharjan', phone: '+977 9851-348821', status: 'Active', zones: mkZones('lal', ZN, 5, 0.55) },
  { id: 'wh3', name: 'Pokhara Warehouse', kind: 'Warehouse', address: 'Bagar, Pokhara', manager: 'Dipak Gurung', phone: '+977 9846-120934', status: 'Active', zones: mkZones('pkr', ['Dresses', 'Kurtas and sets'], 6, 0.68) },
  { id: 'wh4', name: 'Bhaktapur Outlet', kind: 'Outlet', address: 'Durbar Square Road, Bhaktapur', manager: 'Rina Prajapati', phone: '+977 9803-771245', status: 'Active', zones: mkZones('bkt', ['Shop floor', 'Back room'], 4, 0.42) },
  { id: 'wh5', name: 'Butwal Warehouse', kind: 'Warehouse', address: 'Traffic Chowk, Butwal', manager: 'Hari Pandey', phone: '+977 9857-064418', status: 'Inactive', zones: mkZones('btw', ['Dresses'], 4, 0.15) },
]);
export const whName = (id: string) => whStore.get().find((w) => w.id === id)?.name ?? id;

export interface POLine { product: string; ordered: number; received: number }
export interface PO { id: string; supplier: string; warehouse: string; expected: string; lines: POLine[]; cost: number }
export const poStatus = (p: PO) => { const o = p.lines.reduce((a, l) => a + l.ordered, 0); const r = p.lines.reduce((a, l) => a + l.received, 0); return r >= o ? 'Received' : r > 0 ? 'Partly received' : 'Pending'; };
const SUP = ['Patan Handloom Weavers', 'Thamel Textile Traders', 'Bhaktapur Dhaka House', 'Pokhara Pashmina Co.', 'Kalimati Trims and Buttons', 'Himalayan Silk Mills'];
const dayOff = (n: number) => new Date(2026, 9, 18 + n).toISOString().slice(0, 10);
export const poStore = makeStore<PO[]>([
  [-3, 0, 'wh1', 0, 0], [-1, 0, 'wh1', 0, 1], [2, 1, 'wh2', 0, 2], [4, 2, 'wh1', 0, 3], [6, 3, 'wh3', 0, 4], [9, 4, 'wh1', 0, 5], [-12, 5, 'wh1', 1, 6], [-20, 0, 'wh2', 1, 7],
].map(([d, s, w, done, i], k) => {
  const lines = [0, 1].map((j) => { const ordered = 30 + ((k * 7 + j * 13) % 4) * 10; return { product: pname(k * 3 + j * 5), ordered, received: done ? ordered : k === 1 ? 20 : 0 }; });
  return { id: `PO-${2041 + k}`, supplier: SUP[s as number], warehouse: w as string, expected: dayOff(d as number), lines, cost: lines.reduce((a, l) => a + l.ordered * Math.round(pprice(l.product) * 0.42), 0) };
}));

export interface Transfer { id: string; from: string; to: string; product: string; qty: number; date: string; status: 'Draft' | 'Shipped' | 'Delivered' | 'Cancelled'; note?: string }
export const trStore = makeStore<Transfer[]>([
  { id: 'TR-3011', from: 'wh1', to: 'wh4', product: pname(2), qty: 24, date: dayOff(-1), status: 'Shipped' },
  { id: 'TR-3010', from: 'wh1', to: 'wh3', product: pname(5), qty: 40, date: dayOff(-2), status: 'Shipped' },
  { id: 'TR-3009', from: 'wh2', to: 'wh1', product: pname(8), qty: 18, date: dayOff(0), status: 'Draft' },
  { id: 'TR-3008', from: 'wh1', to: 'wh2', product: pname(11), qty: 30, date: dayOff(-6), status: 'Delivered' },
  { id: 'TR-3007', from: 'wh3', to: 'wh4', product: pname(14), qty: 12, date: dayOff(-9), status: 'Delivered' },
  { id: 'TR-3006', from: 'wh5', to: 'wh1', product: pname(17), qty: 55, date: dayOff(-14), status: 'Delivered' },
  { id: 'TR-3005', from: 'wh1', to: 'wh4', product: pname(20), qty: 10, date: dayOff(-16), status: 'Cancelled' },
]);

export interface CountLine { product: string; bin: string; expected: number; counted: number | null }
export interface Count { id: string; warehouse: string; zone: string; date: string; by: string; status: 'Draft' | 'Pending' | 'Approved'; reason: string; lines: CountLine[] }
export const variance = (c: Count) => c.lines.reduce((a, l) => a + (l.counted === null ? 0 : l.counted - l.expected), 0);
export const varianceValue = (c: Count) => c.lines.reduce((a, l) => a + (l.counted === null ? 0 : (l.counted - l.expected) * pprice(l.product)), 0);
export const linesFor = (w: Warehouse, zone: string): CountLine[] => (w.zones.find((z) => z.name === zone)?.bins ?? []).slice(0, 6).map((b) => ({ product: b.product, bin: b.code, expected: b.units, counted: null }));
const seedCount = (id: string, wi: number, zone: string, date: number, by: string, status: Count['status'], deltas: (number | null)[], reason: string): Count => {
  const w = whStore.get()[wi];
  return { id, warehouse: w.id, zone, date: dayOff(date), by, status, reason, lines: linesFor(w, zone).map((l, i) => ({ ...l, counted: deltas[i] === null || deltas[i] === undefined ? null : Math.max(0, l.expected + (deltas[i] as number)) })) };
};
export const countStore = makeStore<Count[]>([
  seedCount('CNT-1204', 0, 'Dresses', -1, 'Suresh Shrestha', 'Pending', [0, -2, 0, 1, 0, -1], 'Miscount'),
  seedCount('CNT-1203', 1, 'Kurtas and sets', 0, 'Anita Maharjan', 'Draft', [null, null, null, null, null, null], ''),
  seedCount('CNT-1202', 2, 'Dresses', -8, 'Dipak Gurung', 'Approved', [0, 0, -3, 0, 0, 0], 'Damaged'),
  seedCount('CNT-1201', 0, 'Accessories', -15, 'Suresh Shrestha', 'Approved', [0, 0, 0, 0, 0, 0], 'Other'),
]);

export interface Adjustment { id: string; date: string; warehouse: string; product: string; change: number; reason: string; by: string; ref?: string }
export const adjStore = makeStore<Adjustment[]>([
  { id: 'ADJ-801', date: dayOff(-8), warehouse: 'wh3', product: pname(3), change: -3, reason: 'Damaged', by: 'Dipak Gurung', ref: 'CNT-1202' },
  { id: 'ADJ-800', date: dayOff(-10), warehouse: 'wh1', product: pname(9), change: 5, reason: 'Found', by: 'Suresh Shrestha' },
  { id: 'ADJ-799', date: dayOff(-12), warehouse: 'wh2', product: pname(12), change: -2, reason: 'Lost', by: 'Anita Maharjan' },
  { id: 'ADJ-798', date: dayOff(-19), warehouse: 'wh1', product: pname(15), change: -4, reason: 'Returned to supplier', by: 'Suresh Shrestha' },
  { id: 'ADJ-797', date: dayOff(-23), warehouse: 'wh4', product: pname(18), change: 1, reason: 'Miscount', by: 'Rina Prajapati' },
]);

export type PickState = 'To pick' | 'Picked' | 'Packed';
export const pickStore = makeStore<Record<string, PickState>>({});
export const binFor = (sku: string) => { const h = hash(sku); return `${String.fromCharCode(65 + (h % 3))}-${String(1 + (h % 6)).padStart(2, '0')}`; };

import { useEffect } from 'react';
export function useTrigger(n: number, fn: () => void) { useEffect(() => { if (n > 0) fn(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [n]); }
export const toInt = (s: string) => (/^\d+$/.test(s.trim()) ? parseInt(s, 10) : NaN);
