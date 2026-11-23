import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDialog } from '../src/account-dialog';
import { MeetupEditor } from '../src/meetup-editor';
import { ParticipantEditor } from '../src/editor';
import { Home } from '../src/home';
import { MeetupScreen } from '../src/meetup';
import { example, Meetup, Participant } from '../src/planner';
import { palette, radius } from '../src/theme';
import { Button, Icon, Label, layout } from '../src/ui';
import { JoinDialog, SharedList } from '../src/shared-membership';
import { SharedMeetupScreen } from '../src/shared-meetup-screen';
import { createShared } from '../src/services/shared-meetups';
import { authSetup } from '../src/services/auth';
import { useAccount } from '../src/use-account';

export default function Index() {
  const { ready, user } = useAccount();
  if (!ready) return <SafeAreaView style={styles.safe}><Label>Loading account…</Label></SafeAreaView>;
  return <Workspace key={user?.id ?? 'guest'} user={user} />;
}

function Workspace({ user }: { user: User | null }) {
  const scroll = useRef<ScrollView>(null);
  const storageKey = user ? 'barkits.meetups.v1.' + user.id : 'barkits.meetups.v1';
  const [accountOpen, setAccountOpen] = useState(false);
  const [sharedId, setSharedId] = useState<string>();
  const [joining, setJoining] = useState(false);
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
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(stored => {
      if (!active) return;
      if (stored) setMeetups(JSON.parse(stored));
      setReady(true);
    }).catch(() => {
      if (active) setStorageError('Couldn’t load saved meetups. Reload to try again.');
    });
    return () => { active = false; };
  }, [storageKey]);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(meetups))
      .then(() => setStorageError(''))
      .catch(() => setStorageError('Couldn’t save your changes on this device.'));
  }, [meetups, ready, storageKey]);

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
    <View style={styles.header}><View style={[styles.container, styles.headerInner]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Barkits home" onPress={() => navigateLocal(null)} style={layout.row}>
        <View style={styles.logo}><Icon name="map-pin" size={21} /></View>
        <Label size={width < 350 ? 22 : 26} weight="title" color={palette.cream}>barkits.</Label>
      </Pressable>
      <View style={layout.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={user ? 'Your account' : 'Sign in'} onPress={() => setAccountOpen(true)}
          style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
          <Icon name="user" color={palette.cream} />{wide && <Label weight="bold" color={palette.cream}>{user ? 'Account' : 'Sign in'}</Label>}
        </Pressable>
        {(selected || sharedId) && <Button secondary disabled={!ready} accessibilityLabel="New meetup" icon={width < 400 ? undefined : 'plus'}
          onPress={() => setEditor('new')}>{width < 400 ? 'New' : 'New meetup'}</Button>}
      </View>
    </View></View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" key={sharedId ?? index ?? 'home'} contentContainerStyle={[styles.container, styles.content]}>
      {!!storageError && <Label color={palette.plum}>{storageError}</Label>}
      {ready && (sharedId && user ? <SharedMeetupScreen key={sharedId} id={sharedId} userId={user.id} back={() => navigateLocal(null)} /> : selected ? <MeetupScreen key={index} scrollToTop={() => scroll.current?.scrollTo({ y: 0, animated: false })} meetup={selected} save={save} editDetails={() => setEditor('details')} editFriend={friend => { setEditedFriend(friend); setEditor('participant'); }} back={() => navigateLocal(null)} /> :
        <Home wide={wide} meetups={meetups} create={() => setEditor('new')} open={navigateLocal} signedIn={!!user}
          shared={past => user ? <SharedList past={past} open={openShared} join={() => setJoining(true)} /> : authSetup.client ?
            <Button secondary icon="users" onPress={() => setAccountOpen(true)}>Sign in to join a meetup</Button> : undefined} />)}
      <View style={styles.footer}>
        <View style={layout.row}><Icon name="map-pin" size={14} color={palette.plum} /><Label size={13} weight="bold" color={palette.plum}>Barkits</Label></View>
        <Label size={13} color={palette.muted}>Made for the barkada.</Label>
      </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  container: { width: '100%', maxWidth: 1112, alignSelf: 'center', paddingHorizontal: 20 },
  header: { backgroundColor: palette.ink, borderBottomWidth: 1, borderColor: palette.line },
  headerInner: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  logo: { backgroundColor: palette.coral, width: 38, height: 38, borderRadius: radius.control, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 24, paddingBottom: 32, gap: 24 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12, borderTopWidth: 1, borderColor: palette.line, paddingTop: 18 },
});
