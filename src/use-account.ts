import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { authSetup } from './services/auth';

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!authSetup.client);
  useEffect(() => {
    const auth = authSetup.client?.auth;
    if (!auth) return;
    let active = true;
    const { data } = auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setReady(true);
      }
    });
    const refresh = (state: string) => {
      if (state === 'active') void auth.startAutoRefresh();
      else void auth.stopAutoRefresh();
    };
    const listener = Platform.OS === 'web' ? undefined : AppState.addEventListener('change', refresh);
    if (listener) refresh(AppState.currentState);
    return () => {
      active = false;
      data.subscription.unsubscribe();
      listener?.remove();
      if (listener) void auth.stopAutoRefresh();
    };
  }, []);
  return { user, ready };
}
