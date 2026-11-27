import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { meetupStorageKey, readMeetups } from './meetup-storage';
import type { Meetup } from './planner';

type MeetupStore = {
  meetups: Meetup[] | null;
  loadFailed: boolean;
  saveFailed: boolean;
  retryLoad: () => void;
  retrySave: () => void;
  saveMeetup: (meetup: Meetup) => void;
};

const MeetupsContext = createContext<MeetupStore | null>(null);

export function MeetupsProvider({ children }: { children: ReactNode }) {
  const [meetups, setMeetups] = useState<Meetup[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const latest = useRef<Meetup[] | null>(null);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(meetupStorageKey);
        if (!active) return;
        const { meetups: saved, upgraded } = readMeetups(stored);
        if (upgraded) await AsyncStorage.setItem(meetupStorageKey, JSON.stringify(saved));
        if (!active) return;
        latest.current = saved;
        setMeetups(saved);
      } catch {
        if (active) setLoadFailed(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [loadAttempt]);

  function persist(next: Meetup[]) {
    writes.current = writes.current.then(async () => {
      try {
        await AsyncStorage.setItem(meetupStorageKey, JSON.stringify(next));
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

  return <MeetupsContext.Provider value={{ meetups, loadFailed, saveFailed, retryLoad, retrySave, saveMeetup }}>
    {children}
  </MeetupsContext.Provider>;
}

export function useMeetups() {
  const store = useContext(MeetupsContext);
  if (!store) throw new Error('Meetup screens require MeetupsProvider.');
  return store;
}
