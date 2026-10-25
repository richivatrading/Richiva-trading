"use client";
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { PageHeader, Tabs, Skeleton, useFakeLoad } from '../ui/kit';
import { useRoute, navigate } from '../store';
import UsersTab from './users/UsersTab';
import RolesTab from './users/RolesTab';
import AuditTab from './users/AuditTab';
import SecurityTab from './users/SecurityTab';

const TABS = [{ id: 'users', label: 'Users' }, { id: 'roles', label: 'Roles and permissions' }, { id: 'audit', label: 'Activity and audit log' }, { id: 'security', label: 'Security' }] as const;
type Tab = (typeof TABS)[number]['id'];

export default function Users() {
  const q = useRoute().query.tab as Tab;
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === q) ? q : 'users');
  useEffect(() => { if (TABS.some((t) => t.id === q)) setTab(q); }, [q]);
  const loading = useFakeLoad(600);
  const go = (t: Tab) => { setTab(t); navigate(`/users?tab=${t}`); };
  return (
    <div>
      <PageHeader title={<span className="inline-flex items-center gap-3"><Shield size={30} strokeWidth={1.25} className="text-champagne" />Users and roles</span>} subtitle="Decide who can see and change what, and keep a record of everything that happens." />
      <Tabs tabs={[...TABS]} value={tab} onChange={go} className="mb-6" />
      {loading ? <Skeleton className="h-96 rounded-2xl" /> : <div key={tab}>
        {tab === 'users' && <UsersTab />}{tab === 'roles' && <RolesTab />}{tab === 'audit' && <AuditTab />}{tab === 'security' && <SecurityTab />}
      </div>}
    </div>
  );
}

