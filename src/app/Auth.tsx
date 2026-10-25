"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Copy, Download, ShieldCheck, Lock } from 'lucide-react';
import { Logo, Leaf } from '../ui/brand';
import { Button, Field, Checkbox } from '../ui/kit';
import { useApp } from '../store';
import { photo } from '../data/seed';
import { cn } from '../lib/format';

type Stage = 'login' | 'verify' | 'setup';
const LOCK_SECS = 15 * 60;

function Split({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-page">
      <div className="hidden lg:block relative overflow-hidden feature m-4 rounded-[32px]">
        <img src={photo(6, 1100, 1500)} alt="Richiva atelier" className="absolute inset-0 size-full object-cover opacity-30 grayscale" style={{ animation: 'zoom-slow 30s ease-out forwards' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#222]/90 via-[#222]/30 to-[#222]/60" />
        <Logo inverted width={170} className="absolute top-10 left-10" />
        <div className="absolute bottom-12 left-10 right-10 text-white">
          <div className="font-title text-[56px] leading-none anim-fade-up" style={{ animationDelay: '300ms' }}>Admin console</div>
          <div className="mt-3 text-white/70 text-[14px] anim-fade-up" style={{ animationDelay: '450ms' }}>Authorised staff only</div>
        </div>
      </div>
      <div className="relative flex items-center justify-center p-6" >
                {onBack && <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-muted hover:text-fg text-[13px]"><ArrowLeft size={16} />Back</button>}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2"><Logo width={110} /></div>
        {children}
      </div>
    </div>
  );
}

function Login({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('owner@richiva.com');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [fails, setFails] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [lock, setLock] = useState(0);
  useEffect(() => { if (lock <= 0) return; const t = setInterval(() => setLock((l) => { if (l <= 1) { setFails(0); setErr(''); } return l - 1; }), 1000); return () => clearInterval(t); }, [lock > 0]); // eslint-disable-line
  const submit = () => {
    if (lock > 0) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    setErr(''); setLoading(true);
setTimeout(() => {
        setLoading(false);
        if (email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL && pw === process.env.NEXT_PUBLIC_ADMIN_PASS) return onNext();
      const f = fails + 1; setFails(f); setShake((x) => x + 1);
      if (f >= 5) { setLock(LOCK_SECS); setErr(''); } else setErr(`Email or password is incorrect. ${5 - f} attempts left`);
    }, 900);
  };
  const mm = String(Math.floor(lock / 60)).padStart(2, '0'), ss = String(lock % 60).padStart(2, '0');
  return (
    <div key={shake} className={cn('w-full max-w-[400px] bg-card border border-line rounded-3xl p-9 shadow-[var(--shadow-lg)] anim-fade-up', shake > 0 && 'anim-shake')} style={shake ? { animation: 'shake 420ms var(--ease)' } : undefined}>
      <Leaf size={30} draw className="text-sage mb-4" />
      <div className="label-caps">Welcome back</div>
      <h1 className="font-title text-[44px] leading-none mt-1 mb-7">Log in</h1>
      {lock > 0 ? (
        <div className="text-center py-4 anim-fade-in">
          <div className="size-14 rounded-full bg-stone mx-auto flex items-center justify-center mb-4"><Lock size={22} strokeWidth={1.5} /></div>
          <div className="font-title text-[26px]">Account locked</div>
          <div className="text-muted mt-1">Too many attempts. Try again in</div>
          <div className="font-title text-[48px] my-2 num">{mm}:{ss}</div>
          <a className="text-[13px] underline underline-offset-4 text-muted hover:text-fg" href="mailto:owner@richiva.com">Contact the owner</a>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Password" value={pw} onChange={setPw} type="password" autoFocus />
          {err && <div className="text-bad text-[13px] anim-fade-in">{err}</div>}
          <div className="flex items-center justify-between pt-1">
            <Checkbox checked={remember} onChange={setRemember} label={<span className="text-[13px]">Remember this device for 30 days</span>} />
          </div>
          <div className="text-right -mt-1"><button type="button" className="text-[13px] text-muted hover:text-fg underline underline-offset-4" onClick={() => setErr('Reset link sent to owner@richiva.com')}>Forgot password?</button></div>
          <Button size="lg" className="w-full" loading={loading} type="submit">Continue</Button>
        </form>
      )}
    </div>
  );
}

function Ring30({ secs }: { secs: number }) {
  const r = 12, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted">
      <svg width="30" height="30" className="-rotate-90"><circle cx="15" cy="15" r={r} fill="none" stroke="var(--stone)" strokeWidth="3" /><circle cx="15" cy="15" r={r} fill="none" strokeWidth="3" strokeLinecap="round" stroke={secs <= 5 ? 'var(--champagne)' : 'var(--ink)'} strokeDasharray={c} strokeDashoffset={c * (1 - secs / 30)} style={{ transition: 'stroke-dashoffset 1s linear, stroke 300ms' }} /></svg>
      Code refreshes in {secs}s
    </div>
  );
}

function Verify({ onNext, onBackToLogin, onSetup }: { onNext: () => void; onBackToLogin: () => void; onSetup: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [secs, setSecs] = useState(30);
  const [wrong, setWrong] = useState(0);
  const [shake, setShake] = useState(0);
  const [backup, setBackup] = useState(false);
  const [bk, setBk] = useState('');
  const [msg, setMsg] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { const t = setInterval(() => setSecs((s) => (s <= 1 ? 30 : s - 1)), 1000); return () => clearInterval(t); }, []);
  const check = (code: string) => {
    if (code === process.env.NEXT_PUBLIC_ADMIN_2FA || (backup && code.toUpperCase() === process.env.NEXT_PUBLIC_ADMIN_BACKUP)) { onNext(); return; }
    const w = wrong + 1; setWrong(w); setShake((x) => x + 1); setDigits(Array(6).fill('')); setBk('');
    if (w >= 3) { setMsg('Too many wrong codes. Returning to login…'); setTimeout(onBackToLogin, 1300); } else { setMsg(`That code is not right. ${3 - w} tries left`); setTimeout(() => refs.current[0]?.focus(), 50); }
  };
  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) { const arr = clean.slice(0, 6).split(''); const n = [...Array(6)].map((_, k) => arr[k] ?? ''); setDigits(n); if (arr.length === 6) check(arr.join('')); else refs.current[arr.length]?.focus(); return; }
    const n = [...digits]; n[i] = clean; setDigits(n);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (n.every(Boolean)) check(n.join(''));
  };
return (
    <div key={shake} className="w-full max-w-[400px] bg-card border border-line rounded-3xl p-9 shadow-[var(--shadow-lg)]" style={{ animation: shake ? 'shake 420ms var(--ease)' : 'slide-in-r 500ms var(--ease) both' }}>
          <div className="size-11 rounded-full bg-stone flex items-center justify-center mb-4"><ShieldCheck size={20} strokeWidth={1.5} /></div>
          <h1 className="font-title text-[38px] leading-none">Enter your code</h1>
          <p className="text-muted mt-2 mb-6">Open your authenticator app and type the 6-digit code</p>
          {backup ? (
            <Field label="Backup code" value={bk} onChange={(v) => setBk(v.toUpperCase())} autoFocus onKeyDown={(e) => e.key === 'Enter' && check(bk)} />
          ) : (
            <div className="flex justify-center gap-2">
              {digits.map((d, i) => (
                <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" autoFocus={i === 0} onChange={(e) => setAt(i, e.target.value)}
                  onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()} onPaste={(e) => { e.preventDefault(); setAt(0, e.clipboardData.getData('text')); }}
                  className="size-14 rounded-xl border border-line bg-card text-center text-[22px] font-semibold outline-none transition-all focus:border-champagne focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--champagne)_25%,transparent)]" />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-5"><Ring30 secs={secs} /></div>
          {msg && <div className="text-bad text-[13px] text-center mt-3 anim-fade-in">{msg}</div>}
          <Button size="lg" className="w-full mt-5" onClick={() => check(backup ? bk : digits.join(''))}>Verify</Button>
          <div className="flex justify-between mt-5 text-[13px] text-muted">
            <button className="underline underline-offset-4 hover:text-fg" onClick={() => { setBackup(!backup); setMsg(''); }}>{backup ? 'Use authenticator code' : 'Use a backup code'}</button>
            <button className="underline underline-offset-4 hover:text-fg" onClick={onSetup}>Trouble with your code?</button>
          </div>
    </div>
  );
}

function Qr() {
  const cells = useMemo(() => Array.from({ length: 29 * 29 }, (_, i) => { const x = i % 29, y = Math.floor(i / 29); const f = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20); return f ? ((x % 7 === 0 || y % 7 === 0 || x === 6 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5) || (x > 22 && x < 26 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 22 && y < 26)) && !(x === 7 || y === 7 || x === 21 || y === 21)) : ((x * 7 + y * 13 + x * y) % 5 < 2); }), []);
  return <svg viewBox="0 0 29 29" className="size-36 bg-white p-2 rounded-xl border border-line">{cells.map((c, i) => c && <rect key={i} x={i % 29} y={Math.floor(i / 29)} width="1" height="1" fill="#222222" />)}</svg>;
}
const BACKUP = Array.from({ length: 8 }, (_, index) => `DEMO-CODE-${String(index + 1).padStart(2, '0')}`);
function Setup({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [code, setCode] = useState(''); const [copied, setCopied] = useState(false); const [err, setErr] = useState('');
  const key = 'Mock setup key - configure production 2FA on a server';
  const dl = () => { const b = new Blob([`Richiva backup codes\n\n${BACKUP.join('\n')}\n`], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'richiva-backup-codes.txt'; a.click(); };
  return (
    <div className="w-full max-w-[460px] bg-card border border-line rounded-3xl p-8 shadow-[var(--shadow-lg)] anim-slide-in max-h-[92vh] overflow-y-auto">
      <div className="label-caps">First-time setup</div>
      <h1 className="font-title text-[36px] leading-none mt-1 mb-5">Set up your authenticator</h1>
      <div className="text-[12px] text-muted mb-4">This setup preview uses mock data and is not a production authenticator enrollment.</div>
      <div className="flex gap-5 items-start"><Qr /><div className="min-w-0 flex-1"><div className="text-[13px] text-muted mb-1.5">Or type this key manually</div><div className="font-mono text-[12px] bg-stone rounded-lg p-2.5 break-all">{key}</div><Button size="sm" variant="secondary" className="mt-2" icon={copied ? Check : Copy} onClick={() => { navigator.clipboard?.writeText(key); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? 'Copied' : 'Copy'}</Button></div></div>
      <Field className="mt-5" label="Confirm 6-digit code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} error={err} />
      <div className="mt-5 flex items-center justify-between"><div className="label-caps">Backup codes</div><Button size="sm" variant="ghost" icon={Download} onClick={dl}>Download</Button></div>
      <div className="grid grid-cols-2 gap-2 mt-2">{BACKUP.map((b) => <div key={b} className="font-mono text-[12px] border border-line rounded-lg px-3 py-1.5 text-center">{b}</div>)}</div>
      <div className="flex gap-3 mt-6"><Button variant="secondary" onClick={onBack}>Back</Button><Button className="flex-1" onClick={() => (code === process.env.NEXT_PUBLIC_ADMIN_2FA ? onNext() : setErr('Enter the code shown in your app'))}>Confirm and continue</Button></div>
    </div>
  );
}

export default function AuthFlow({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('login');
  return (
    <Split onBack={stage === 'verify' ? () => setStage('login') : stage === 'setup' ? () => setStage('verify') : undefined}>
      {stage === 'login' && <Login onNext={() => setStage('verify')} />}
      {stage === 'verify' && <Verify onNext={onDone} onBackToLogin={() => setStage('login')} onSetup={() => setStage('setup')} />}
      {stage === 'setup' && <Setup onNext={onDone} onBack={() => setStage('verify')} />}
    </Split>
  );
}
