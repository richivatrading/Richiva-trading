import { FileQuestion, Lock, Wrench, Clock, WifiOff } from 'lucide-react';
import { Button } from '../ui/kit';
import { Leaf } from '../ui/brand';
import { navigate, useApp } from '../store';

const MAP: Record<string, { icon: typeof Lock; title: string; body: string; cta: string }> = {
  '404': { icon: FileQuestion, title: 'This page wandered off', body: 'We could not find what you were looking for. It may have moved or never existed.', cta: 'Back to overview' },
  noaccess: { icon: Lock, title: 'No access to this room', body: 'Your current role cannot open this page. Ask the owner if you need access.', cta: 'Back to overview' },
  maintenance: { icon: Wrench, title: 'A quick tidy-up', body: 'The admin is under scheduled maintenance. We expect to be back by 02:30 Nepal time.', cta: 'Check again' },
  expired: { icon: Clock, title: 'Your session expired', body: 'For your safety we logged you out after 30 minutes of inactivity.', cta: 'Log in again' },
  offline: { icon: WifiOff, title: 'You are offline', body: 'Check your internet connection. We will reconnect automatically.', cta: 'Retry' },
};
export function StateScreen({ kind }: { kind: string }) {
  const s = MAP[kind] ?? MAP['404']; const { logout } = useApp();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center anim-fade-up">
      <div className="relative size-20 rounded-full bg-stone flex items-center justify-center mb-6"><s.icon size={32} strokeWidth={1.25} /><Leaf size={24} className="absolute -top-2 -right-3 text-sage" draw /></div>
      <div className="label-caps mb-2">{kind === '404' ? 'Error 404' : 'Richiva admin'}</div>
      <h1 className="font-title text-[48px] leading-none">{s.title}</h1>
      <p className="text-muted max-w-md mt-3">{s.body}</p>
      <Button className="mt-7" size="lg" onClick={() => (kind === 'expired' ? logout() : navigate('/overview'))}>{s.cta}</Button>
    </div>
  );
}
