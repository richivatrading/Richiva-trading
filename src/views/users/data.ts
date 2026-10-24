import { makeStore } from '../../store';
import { TEAM } from '../../data/seed';

export const MODULES = ['Orders', 'Customers', 'Products', 'Payments', 'Shipping', 'Marketing', 'CMS', 'Analytics', 'Settings', 'Users', 'Support', 'Inventory'];
export const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Export', 'Approve'] as const;
export type Action = (typeof ACTIONS)[number];
export type Matrix = Record<string, Record<string, Record<Action, boolean>>>;
export const BASE_ROLES = ['Owner', 'Manager', 'Marketing', 'Finance', 'Warehouse', 'Support'];

const grant = (mods: Record<string, Action[]>) => Object.fromEntries(MODULES.map((m) => [m, Object.fromEntries(ACTIONS.map((a) => [a, !!mods[m]?.includes(a)]))])) as Matrix[string];
const ALL = [...ACTIONS] as Action[];
const noDel = ['View', 'Create', 'Edit', 'Export', 'Approve'] as Action[];
export const DEFAULT_MATRIX: Matrix = {
  Owner: grant(Object.fromEntries(MODULES.map((m) => [m, ALL]))),
  Manager: grant({ Orders: noDel, Customers: noDel, Products: noDel, Payments: ['View', 'Export'], Shipping: noDel, Marketing: noDel, CMS: noDel, Analytics: ['View', 'Export'], Support: noDel, Inventory: noDel }),
  Marketing: grant({ Marketing: ALL, CMS: noDel, Analytics: ['View', 'Export'], Customers: ['View'], Products: ['View'] }),
  Finance: grant({ Payments: ['View', 'Edit', 'Export', 'Approve'], Orders: ['View', 'Export'], Analytics: ['View', 'Export'], Customers: ['View'] }),
  Warehouse: grant({ Orders: ['View', 'Edit'], Shipping: ['View', 'Create', 'Edit'], Inventory: ['View', 'Create', 'Edit', 'Export'], Products: ['View'] }),
  Support: grant({ Orders: ['View', 'Edit'], Customers: ['View', 'Edit'], Support: ['View', 'Create', 'Edit'], Products: ['View'] }),
};
export const matrixStore = makeStore<Matrix>(DEFAULT_MATRIX);
export const customRolesStore = makeStore<string[]>([]);

export interface UserRow { id: string; name: string; email: string; role: string; mfa: boolean; last: string; status: 'Active' | 'Pending' | 'Disabled'; expires?: string }
export const usersStore = makeStore<UserRow[]>(TEAM.map((t) => ({ ...t, status: 'Active' as const })));

export const modulesFor = (matrix: Matrix, role: string) => (role === 'Owner' ? MODULES : MODULES.filter((m) => matrix[role]?.[m]?.View));
export const activeOwners = (u: UserRow[]) => u.filter((x) => x.role === 'Owner' && x.status === 'Active').length;
