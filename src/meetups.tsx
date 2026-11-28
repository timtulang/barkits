import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shellStyles } from './app-shell';
import { meetupStorageKey, readMeetups } from './meetup-storage';
import type { Account } from './services/auth';
import type { Meetup } from './planner';
import { LoadingState } from './ui';
import { useAccount } from './use-account';
import { AccountSettingsProvider } from './account-settings-context';

type MeetupStore = {
  user: Account | null;
  accountError: string;
  sessionExpired: boolean;
  refreshAccount: () => void;
  joining: boolean;
  setJoining: (value: boolean) => void;
  past: boolean;
  setPast: (value: boolean) => void;
  sharedId?: string;
  setSharedId: (id?: string) => void;
  meetups: Meetup[] | null;
  savedMeetups: Meetup[] | null;
  loadFailed: boolean;
  saveFailed: boolean;
  retryLoad: () => void;
  retrySave: () => void;
  saveMeetup: (meetup: Meetup) => void;
};

const MeetupsContext = createContext<MeetupStore | null>(null);

export function MeetupsProvider({ children }: { children: ReactNode }) {
  const { ready, user, error, expired, refresh, resumeSharedId, joinAfterSignIn } = useAccount();
  const [joining, setJoining] = useState(false);
  useEffect(() => { if (joinAfterSignIn) setJoining(true); }, [joinAfterSignIn]);
  if (!ready) return <SafeAreaView style={shellStyles.safe}>
    <LoadingState label="Loading your account…" />
  </SafeAreaView>;
  return <AccountMeetupStore key={user?.id ?? 'guest'} user={user} accountError={error} sessionExpired={expired} refreshAccount={refresh} resumeSharedId={resumeSharedId} joining={joining} setJoining={setJoining}>
    {user ? <AccountSettingsProvider>{children}</AccountSettingsProvider> : children}
  </AccountMeetupStore>;
}

function AccountMeetupStore({ children, user, accountError, sessionExpired, refreshAccount, resumeSharedId, joining, setJoining }: Pick<MeetupStore, 'user' | 'accountError' | 'sessionExpired' | 'refreshAccount' | 'joining' | 'setJoining'> & { children: ReactNode; resumeSharedId?: string }) {
  const storageKey = user ? `${meetupStorageKey}.${user.id}` : meetupStorageKey;
  const [past, setPast] = useState(false);
  const [sharedId, setSharedId] = useState<string | undefined>(resumeSharedId);
  useEffect(() => { if (resumeSharedId) setSharedId(resumeSharedId); }, [resumeSharedId]);
  const [meetups, setMeetups] = useState<Meetup[] | null>(null);
  const [savedMeetups, setSavedMeetups] = useState<Meetup[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const latest = useRef<Meetup[] | null>(null);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (!active) return;
        const { meetups: saved, upgraded } = readMeetups(stored);
        if (upgraded || stored === null) await AsyncStorage.setItem(storageKey, JSON.stringify(saved));
        if (!active) return;
        latest.current = saved;
        setMeetups(saved);
        setSavedMeetups(saved);
      } catch {
        if (active) setLoadFailed(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [loadAttempt, storageKey]);

  function persist(next: Meetup[]) {
    writes.current = writes.current.then(async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        setSavedMeetups(next);
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
    });
  }

  function saveMeetup(meetup: Meetup) {
    const current = latest.current;
    if (!current) return;
    const next = current.some(item => item.id === meetup.id)
      ? current.map(item => item.id === meetup.id ? meetup : item)
      : [...current, meetup];
    latest.current = next;
    setMeetups(next);
    persist(next);
  }

  function retryLoad() {
    setLoadFailed(false);
    setLoadAttempt(attempt => attempt + 1);
  }

  function retrySave() {
    if (latest.current) persist(latest.current);
  }

  return <MeetupsContext.Provider value={{ user, accountError, sessionExpired, refreshAccount, joining, setJoining, past, setPast, sharedId, setSharedId,
    meetups, savedMeetups, loadFailed, saveFailed, retryLoad, retrySave, saveMeetup }}>
    {children}
  </MeetupsContext.Provider>;
}

export function useMeetups() {
  const store = useContext(MeetupsContext);
  if (!store) throw new Error('Meetup screens require MeetupsProvider.');
  return store;
}
