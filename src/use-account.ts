import { listenForSessionExpiration } from './services/session-events';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { authSetup, finishNativeSignIn, listenForAccountChange, readAccount, rememberAccount, takeJoinIntent, takeReturnPath, takeSharedReturn, type Account } from './services/auth';

export function useAccount() {
  const [user, setUser] = useState<Account | null>(null);
  const currentUser = useRef<Account | null>(null);
  const [expired, setExpired] = useState(false);
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(!authSetup.enabled);
  const [signInError, setSignInError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [resumeSharedId, setResumeSharedId] = useState<string>();
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
        await rememberAccount(next);
        if (!active || current !== attempt) return;
        if (next || !currentUser.current) { setUser(next); currentUser.current = next; }
        if (next) {
          setExpired(false);
          const shared = await takeSharedReturn();
          if (shared && active && current === attempt) setResumeSharedId(shared);
          const path = await takeReturnPath();
          if (path && active && current === attempt) router.replace(path as `/meetups/${string}`);
        }
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
    const stopExpiration = listenForSessionExpiration(() => {
      if (active) setExpired(true);
    });
    const stop = listenForAccountChange(next => {
      if (!active) return;
      ++attempt;
      setUser(next);
      currentUser.current = next;
      setExpired(false);
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
      return () => { active = false; stop(); stopExpiration(); window.removeEventListener('focus', focus); };
    }
    const links = Linking.addEventListener('url', ({ url }) => { void handleLink(url); });
    const state = AppState.addEventListener('change', status => { if (status === 'active') void refresh(); });
    void Linking.getInitialURL().then(async url => { if (active && url) await handleLink(url); })
      .catch(() => { if (active) setSignInError('Couldn’t open the sign-in link.'); })
      .finally(() => { if (active) void refresh(); });
    return () => { active = false; stop(); stopExpiration(); links.remove(); state.remove(); };
  }, [retry]);
  return { user, ready, expired, resumeSharedId, refresh: () => setRetry(value => value + 1), error: signInError || connectionError, joinAfterSignIn };
}
