import { makeStore } from '../../store';

export interface TryonSettings {
  live: boolean; minutes: number; tiers: { Bronze: number; Silver: number; Gold: number };
  consent: string; fallback: 'Automatic' | 'Off' | 'Always static photo'; cats: Record<string, boolean>;
}
export const DEFAULT_SETTINGS: TryonSettings = {
  live: true, minutes: 3, tiers: { Bronze: 0, Silver: 1, Gold: 2 },
  consent: 'To show you how a garment looks on you, Richiva uses your camera for a few minutes. Nothing leaves your phone without your say.',
  fallback: 'Automatic', cats: { Dresses: true, Tops: true, Bottoms: true, Outerwear: false },
};
export const tryonStore = makeStore<TryonSettings>(DEFAULT_SETTINGS);

export const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; };
export const series = (seed: string, n: number, base: number, spread: number) => Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i * 0.9 + hash(seed)) * spread * 0.6 + ((hash(seed + i) % 100) / 100 - 0.5) * spread));
