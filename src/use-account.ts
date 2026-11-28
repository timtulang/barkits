import { useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { authSetup, finishNativeSignIn, listenForAccountChange, readAccount, takeJoinIntent, type Account } from './services/auth';

export function useAccount() {
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(!authSetup.enabled);
  const [signInError, setSignInError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [joinAfterSignIn, setJoinAfterSignIn] = useState(false);
  useEffect(() => {
    if (!authSetup.enabled) return;
    let active = true;
    let attempt = 0;
    let nativeHandoff: string | undefined;
    async function refresh() {
      const current = ++attempt;
      try {
        const next = await readAccount();
        if (!active || current !== attempt) return;
        setUser(next);
        setConnectionError('');
        if (next) setSignInError('');
        if (next && await takeJoinIntent() && active) setJoinAfterSignIn(true);
      } catch (problem) {
        if (active && current === attempt) setConnectionError(problem instanceof Error ? problem.message : 'Couldn’t load your account.');
      } finally {
        if (active && current === attempt) setReady(true);
      }
    }
    async function handleLink(href: string | null) {
      if (!href || nativeHandoff === href) return;
      nativeHandoff = href;
      try {
        await finishNativeSignIn(href);
      } catch (problem) {
        if (active) setSignInError(problem instanceof Error ? problem.message : 'Google sign-in couldn’t finish.');
      }
      if (active) void refresh();
    }
    const stop = listenForAccountChange(next => {
      if (!active) return;
      ++attempt;
      setUser(next);
      setConnectionError('');
      if (next) setSignInError('');
    });
    if (Platform.OS === 'web') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('signin') === 'failed') {
        url.searchParams.delete('signin');
        window.history.replaceState(window.history.state, '', url);
        setSignInError('Google sign-in couldn’t finish. Try again.');
      }
      const focus = () => { if (active) void refresh(); };
      window.addEventListener('focus', focus);
      void refresh();
      return () => { active = false; stop(); window.removeEventListener('focus', focus); };
    }
    const links = Linking.addEventListener('url', ({ url }) => { void handleLink(url); });
    const state = AppState.addEventListener('change', status => { if (status === 'active') void refresh(); });
    void Linking.getInitialURL().then(async url => { if (active && url) await handleLink(url); })
      .catch(() => { if (active) setSignInError('Couldn’t open the sign-in link.'); })
      .finally(() => { if (active) void refresh(); });
    return () => { active = false; stop(); links.remove(); state.remove(); };
  }, []);
  return { user, ready, error: signInError || connectionError, joinAfterSignIn };
}
