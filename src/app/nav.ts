import { LayoutDashboard, ShoppingBag, Undo2, Users, Star, LifeBuoy, Shirt, Scissors, Images, Boxes, Megaphone, BarChart3, Sparkles, FileText, CreditCard, Truck, ShieldAlert, Wand2, KeyRound, Activity, Lock, Settings, Store, Bell as BellIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export type Role = 'Owner' | 'Manager' | 'Marketing' | 'Finance' | 'Warehouse' | 'Support';
export const ROLES: Role[] = ['Owner', 'Manager', 'Marketing', 'Finance', 'Warehouse', 'Support'];

export interface NavItem { id: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; roles?: Role[]; }
export interface NavGroup { label: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { label: 'Sell', items: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, roles: ['Owner', 'Manager', 'Finance', 'Warehouse', 'Support'] },
    { id: 'returns', label: 'Returns and exchanges', icon: Undo2, roles: ['Owner', 'Manager', 'Warehouse', 'Support', 'Finance'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['Owner', 'Manager', 'Marketing', 'Support'] },
    { id: 'reviews', label: 'Reviews', icon: Star, roles: ['Owner', 'Manager', 'Marketing', 'Support'] },
    { id: 'support', label: 'Support desk', icon: LifeBuoy, roles: ['Owner', 'Manager', 'Support'] },
  ] },
  { label: 'Catalogue', items: [
    { id: 'products', label: 'Products', icon: Shirt, roles: ['Owner', 'Manager', 'Marketing', 'Warehouse'] },
    { id: 'builder', label: 'Custom builder', icon: Scissors, roles: ['Owner', 'Manager'] },
    { id: 'media', label: 'Media library', icon: Images, roles: ['Owner', 'Manager', 'Marketing'] },
    { id: 'inventory', label: 'Inventory', icon: Boxes, roles: ['Owner', 'Manager', 'Warehouse', 'Finance'] },
  ] },
  { label: 'Grow', items: [
    { id: 'marketing', label: 'Marketing', icon: Megaphone, roles: ['Owner', 'Manager', 'Marketing'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['Owner', 'Manager', 'Marketing', 'Finance'] },
    { id: 'ai', label: 'AI insights', icon: Sparkles, roles: ['Owner', 'Manager', 'Marketing'] },
  ] },
  { label: 'Content', items: [{ id: 'cms', label: 'CMS', icon: FileText, roles: ['Owner', 'Manager', 'Marketing'] }] },
  { label: 'Money and delivery', items: [
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['Owner', 'Finance', 'Manager'] },
    { id: 'shipping', label: 'Shipping', icon: Truck, roles: ['Owner', 'Manager', 'Warehouse'] },
    { id: 'risk', label: 'Risk and COD', icon: ShieldAlert, roles: ['Owner', 'Manager', 'Support', 'Finance'] },
  ] },
  { label: 'Control', items: [
    { id: 'outlets', label: 'Outlets and branches', icon: Store, roles: ['Owner', 'Manager'] },
    { id: 'tryon', label: 'Try-on controls', icon: Wand2, roles: ['Owner', 'Manager'] },
    { id: 'users', label: 'Users and roles', icon: KeyRound, roles: ['Owner'] },
    { id: 'integrations', label: 'Integrations and health', icon: Activity, roles: ['Owner', 'Manager'] },
    { id: 'privacy', label: 'Privacy requests', icon: Lock, roles: ['Owner', 'Manager'] },
  ] },
];
export const SETTINGS_ITEM: NavItem = { id: 'settings', label: 'Settings', icon: Settings, roles: ['Owner'] };
const HIDDEN_ITEMS: NavItem[] = [{ id: 'notifications', label: 'Message templates', icon: BellIcon, roles: ['Owner', 'Manager', 'Marketing'] }];
export const ALL_ITEMS = [...NAV.flatMap((g) => g.items), SETTINGS_ITEM, ...HIDDEN_ITEMS];
export const canView = (role: Role, id: string) => {
  if (id === 'profile') return true;
  const it = ALL_ITEMS.find((i) => i.id === id);
  return !!it && (!it.roles || it.roles.includes(role));
};
export const BADGES: Record<string, number> = { orders: 12, returns: 3, reviews: 9, risk: 5, support: 4, inventory: 7 };
