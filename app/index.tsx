import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDialog } from '../src/account-dialog';
import { MeetupEditor } from '../src/meetup-editor';
import { ParticipantEditor } from '../src/editor';
import { Home } from '../src/home';
import { MeetupScreen } from '../src/meetup';
import { example, Meetup, Participant } from '../src/planner';
import { AppFooter, AppHeader, shellStyles as styles } from '../src/app-shell';
import { Button, Feedback, Label, LoadingState } from '../src/ui';
import { JoinDialog, SharedList } from '../src/shared-membership';
import { SharedMeetupScreen } from '../src/shared-meetup-screen';
import { createShared } from '../src/services/shared-meetups';
import { authSetup } from '../src/services/auth';
import { useAccount } from '../src/use-account';

export default function Index() {
  const { ready, user } = useAccount();
  if (!ready) return <SafeAreaView style={styles.safe}><View style={styles.container}><LoadingState label="Loading your account…" /></View></SafeAreaView>;
  return <Workspace key={user?.id ?? 'guest'} user={user} />;
}

function Workspace({ user }: { user: User | null }) {
  const scroll = useRef<ScrollView>(null);
  const storageKey = user ? 'barkits.meetups.v1.' + user.id : 'barkits.meetups.v1';
  const [accountOpen, setAccountOpen] = useState(false);
  const [sharedId, setSharedId] = useState<string>();
  const [joining, setJoining] = useState(false);
  const [past, setPast] = useState(false);
  function navigateLocal(next: number | null) { setSharedId(undefined); setIndex(next); }
  function openShared(id: string) { setIndex(null); setJoining(false); setEditor(null); setSharedId(id); }
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const [meetups, setMeetups] = useState<Meetup[]>([example]);
  const [index, setIndex] = useState<number | null>(null);
  const [editor, setEditor] = useState<'new' | 'details' | 'participant' | null>(null);
  const [editedFriend, setEditedFriend] = useState<Participant>();
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [savedMeetups, setSavedMeetups] = useState<Meetup[]>();
  useEffect(() => {
    let active = true;
    setStorageError('');
    AsyncStorage.getItem(storageKey).then(stored => {
      if (!active) return;
      if (stored) setMeetups(JSON.parse(stored));
      setReady(true);
    }).catch(() => {
      if (active) setStorageError('Couldn’t load saved meetups. Your saved data has not been replaced.');
    });
    return () => { active = false; };
  }, [storageKey, loadAttempt]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    AsyncStorage.setItem(storageKey, JSON.stringify(meetups))
      .then(() => { if (active) { setStorageError(''); setSavedMeetups(meetups); } })
      .catch(() => { if (active) setStorageError('Couldn’t save your changes on this device.'); });
    return () => { active = false; };
  }, [meetups, ready, storageKey, saveAttempt]);
  const saveStatus = storageError ? 'Changes are not saved. Use Try again above.' : savedMeetups === meetups ?
    'Plan saved on this device. Save any form edits before leaving.' : 'Saving changes on this device…';

  function save(meetup: Meetup) {
    setMeetups(current => current.map((item, itemIndex) => itemIndex === index ? meetup : item));
  }
  const selected = index === null ? null : meetups[index];
  function saveEditor(meetup: Meetup) {
    if (editor === 'new') {
      navigateLocal(meetups.length);
      setMeetups(current => [...current, meetup]);
    } else {
      save(meetup);
    }
    setEditor(null);
    setEditedFriend(undefined);
  }

  return <SafeAreaView style={styles.safe}>
    <AppHeader signedIn={!!user} inMeetup={!!selected || !!sharedId} compact={!wide}
      home={() => navigateLocal(null)} account={() => setAccountOpen(true)} create={() => setEditor('new')} />
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" key={sharedId ?? index ?? 'home'} contentContainerStyle={[styles.container, styles.content]}>
      {!!storageError && <Feedback tone="error" title={ready ? 'Changes are not saved' : 'Your meetups couldn’t load'}
        action={<Button secondary onPress={() => ready ? setSaveAttempt(value => value + 1) : setLoadAttempt(value => value + 1)}>Try again</Button>}>{storageError}</Feedback>}
      {!ready && !storageError && <LoadingState label="Loading your meetups…" />}
      {ready && (sharedId && user ? <SharedMeetupScreen key={sharedId} scrollToTop={() => scroll.current?.scrollTo({ y: 0, animated: false })} id={sharedId} userId={user.id} back={() => navigateLocal(null)} /> : selected ? <MeetupScreen key={index} saveReady={savedMeetups === meetups && !storageError} saveStatus={saveStatus} scrollToTop={() => scroll.current?.scrollTo({ y: 0, animated: false })} meetup={selected} save={save} editDetails={() => setEditor('details')} editFriend={friend => { setEditedFriend(friend); setEditor('participant'); }} back={() => navigateLocal(null)} /> :
        <Home wide={wide} meetups={meetups} create={() => setEditor('new')} open={navigateLocal} signedIn={!!user} past={past} setPast={setPast}
          shared={user ? <SharedList past={past} open={openShared} join={() => setJoining(true)} /> : authSetup.client ?
            <View style={{ gap: 12 }}><Label kind="item" heading>With friends</Label><Label kind="detail">Sign in to create a shared plan or join your barkada with an invite code.</Label>
              <Button secondary icon="users" onPress={() => setAccountOpen(true)}>Sign in to join a meetup</Button></View> : undefined} />)}
      <AppFooter />
    </ScrollView>
    {joining && user && <JoinDialog close={() => setJoining(false)} open={openShared} />}
    {accountOpen && <AccountDialog user={user} close={() => setAccountOpen(false)} />}
    {(editor === 'new' || editor === 'details') && <MeetupEditor key={editor} meetup={editor === 'details' && selected ? selected : undefined}
      share={editor === 'new' && user ? async (id, meetup, name) => openShared(await createShared(id, meetup, name)) : undefined}
      close={() => setEditor(null)} save={saveEditor} />}
    {editor === 'participant' && selected && <ParticipantEditor meetup={selected} participant={editedFriend}
      close={() => { setEditedFriend(undefined); setEditor(null); }} save={saveEditor} />}
  </SafeAreaView>;
}
