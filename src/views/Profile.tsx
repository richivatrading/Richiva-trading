"use client";
import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, Button, Card, Modal, Pill, Ring, Skeleton, Slider, useFakeLoad } from '../ui/kit';
import { useApp, useRoute } from '../store';
import { useEffect } from 'react';
import { LanguageCard, NotifyCard, PasswordCard, SessionsCard, TwoStepCard } from './profile/Cards';

export default function Profile() {
  const { role, user, toast } = useApp();
  const { query } = useRoute();
  const loading = useFakeLoad(600);
  const [photo, setPhoto] = useState(''); const [draft, setDraft] = useState(''); const [zoom, setZoom] = useState(1.2); const [err, setErr] = useState('');
  const [mfa, setMfa] = useState(true); const [codes, setCodes] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const [hlId, setHlId] = useState('');
  useEffect(() => { if (loading || !query.card) return; setHlId(query.card); const t = setTimeout(() => setHlId(''), 2600); return () => clearTimeout(t); }, [loading, query.card]);
  const hl = (id: string) => hlId === id;
  const pct = Math.round(([true, true, !!photo, mfa, codes].filter(Boolean).length / 5) * 100);
  const hint = !photo ? 'Add a photo to move closer.' : !codes ? 'Download your backup codes to finish.' : !mfa ? 'Set up your authenticator again.' : 'All done. Lovely.';
  const pickFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErr('Please choose an image (PNG or JPG).');
    if (f.size > 5 * 1024 * 1024) return setErr('That photo is over 5 MB.');
    setErr(''); setZoom(1.2); setDraft(URL.createObjectURL(f));
  };
  return (
    <div>
      <Card hover={false} className="mb-6 flex flex-wrap items-center gap-8">
        {loading ? <><Skeleton className="size-28 rounded-full" /><Skeleton className="h-16 w-72" /></> : <>
          <div className="flex flex-col items-center gap-2">
            {photo ? <img src={photo} alt="" className="size-28 rounded-full object-cover ring-2 ring-champagne ring-offset-2 ring-offset-card" /> : <Avatar name={user.name} size={112} ring />}
            <Button variant="ghost" size="sm" icon={Camera} onClick={() => file.current?.click()}>Change photo</Button>
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
            {err && <div className="text-bad text-[12px] anim-fade-in max-w-40 text-center">{err}</div>}
          </div>
          <div className="flex-1 min-w-60">
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-none">{user.name}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap"><Pill tone="champagne">{role}</Pill><span className="text-muted">{user.email}</span></div>
          </div>
          <div className="flex items-center gap-4"><Ring value={pct} size={88} stroke={6} /><div><div className="font-title text-[22px] leading-tight">Profile complete</div><div className="text-muted text-[12.5px] max-w-44">{hint}</div></div></div>
        </>}
      </Card>
      {loading ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <PasswordCard hl={hl} />
          <TwoStepCard hl={hl} codesDone={codes} onCodes={() => setCodes(true)} onActive={setMfa} />
          <NotifyCard hl={hl} />
          <LanguageCard hl={hl} />
          <SessionsCard hl={hl} />
        </div>
      )}
      <Modal open={!!draft} onClose={() => setDraft('')} title="Crop your photo" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDraft('')}>Cancel</Button><Button onClick={() => { setPhoto(draft); setDraft(''); toast('Photo updated', { star: true }); }}>Use this photo</Button></>}>
        <div className="flex flex-col items-center gap-5 anim-fade-in">
          <div className="size-56 rounded-full overflow-hidden bg-stone ring-2 ring-champagne ring-offset-4 ring-offset-card"><img src={draft} alt="Crop preview" className="size-full object-cover transition-transform duration-200" style={{ transform: `scale(${zoom})` }} /></div>
          <div className="w-full"><div className="text-muted text-[12.5px] mb-1">Zoom</div><Slider min={1} max={2.5} step={0.05} value={zoom} onChange={setZoom} /></div>
        </div>
      </Modal>
    </div>
  );
}

