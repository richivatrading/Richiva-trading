import type { Zone } from './wh';
export const mkBlankZones = (n: number): Zone[] => Array.from({ length: n }, (_, i) => ({ name: `Zone ${String.fromCharCode(65 + i)}`, bins: Array.from({ length: 4 }, (_, j) => ({ code: `${String.fromCharCode(65 + i)}-${String(j + 1).padStart(2, '0')}`, product: 'Empty', units: 0, cap: 80 })) }));
