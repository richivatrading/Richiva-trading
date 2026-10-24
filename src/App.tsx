import { useCallback, useEffect, useState } from 'react';
import AuthFlow from './app/Auth';
import Shell from './app/Shell';
import { Tour, Welcome } from './app/Welcome';
import { AppProvider, navigate } from './store';

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('rv-auth') === '1');
  const [welcome, setWelcome] = useState(false);
  const [tour, setTour] = useState(false);
  const logout = useCallback(() => { sessionStorage.removeItem('rv-auth'); setAuthed(false); setWelcome(false); window.location.hash = ''; }, []);
  const openPalette = useCallback(() => window.dispatchEvent(new Event('rv-palette')), []);
  useEffect(() => { const t = () => setTour(true); window.addEventListener('rv-tour', t); return () => window.removeEventListener('rv-tour', t); }, []);
  const done = () => {
    sessionStorage.setItem('rv-auth', '1'); setAuthed(true);
    if (!localStorage.getItem('rv-welcomed')) { setWelcome(true); localStorage.setItem('rv-welcomed', '1'); }
    if (!window.location.hash || window.location.hash === '#') navigate('/overview');
  };
  return (
    <AppProvider onLogout={logout} openPalette={openPalette}>
      {authed ? (
        <>
          <Shell />
          {welcome && <Welcome onClose={() => setWelcome(false)} onTour={() => { setWelcome(false); setTour(true); }} />}
          {tour && <Tour onClose={() => setTour(false)} />}
        </>
      ) : <AuthFlow onDone={done} />}
    </AppProvider>
  );
}
