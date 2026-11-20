import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MeetupEditor } from '../src/meetup-editor';
import { ParticipantEditor } from '../src/editor';
import { Home } from '../src/home';
import { MeetupScreen } from '../src/meetup';
import { example, Meetup, Participant } from '../src/planner';
import { palette, radius } from '../src/theme';
import { Button, Chip, Icon, Label, layout } from '../src/ui';

const storageKey = 'barkits.meetups.v1';

export default function Index() {
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
  }, []);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(meetups))
      .then(() => setStorageError(''))
      .catch(() => setStorageError('Couldn’t save your changes on this device.'));
  }, [meetups, ready]);

  function save(meetup: Meetup) {
    setMeetups(current => current.map((item, itemIndex) => itemIndex === index ? meetup : item));
  }
  const selected = index === null ? null : meetups[index];
  function saveEditor(meetup: Meetup) {
    if (editor === 'new') {
      setIndex(meetups.length);
      setMeetups(current => [...current, meetup]);
    } else {
      save(meetup);
    }
    setEditor(null);
    setEditedFriend(undefined);
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><View style={[styles.container, styles.headerInner]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Barkits home" onPress={() => setIndex(null)} style={layout.row}>
        <View style={styles.logo}><Icon name="map-pin" size={21} /></View>
        <Label size={width < 350 ? 22 : 26} weight="title">barkits.</Label>
      </Pressable>
      {wide && <View style={layout.row}>
        <Chip icon="home" selected={!selected} onPress={() => setIndex(null)}>Home</Chip>
        <Chip icon="calendar" selected={!!selected} onPress={() => setIndex(0)}>Demo meetup</Chip>
      </View>}
      <View><Button secondary disabled={!ready} icon={width < 350 ? undefined : "plus"} onPress={() => setEditor('new')}>New meetup</Button></View>
    </View></View>
    <ScrollView keyboardShouldPersistTaps="handled" key={index ?? 'home'} contentContainerStyle={[styles.container, styles.content]}>
      {!!storageError && <Label color={palette.plum}>{storageError}</Label>}
      {ready && (selected ? <MeetupScreen key={index} meetup={selected} save={save} editDetails={() => setEditor('details')} editFriend={friend => { setEditedFriend(friend); setEditor('participant'); }} back={() => setIndex(null)} /> :
        <Home wide={wide} titleSize={width >= 1050 ? 55 : wide ? 43 : 36} meetups={meetups} create={() => setEditor('new')} open={setIndex} />)}
      <View style={styles.footer}>
        <View style={layout.row}><Icon name="map-pin" size={14} color={palette.plum} /><Label size={13} weight="bold" color={palette.plum}>Barkits</Label></View>
        <Label size={13} color={palette.muted}>Made for the barkada.</Label>
      </View>
    </ScrollView>
    {(editor === 'new' || editor === 'details') && <MeetupEditor key={editor} meetup={editor === 'details' && selected ? selected : undefined}
      close={() => setEditor(null)} save={saveEditor} />}
    {editor === 'participant' && selected && <ParticipantEditor meetup={selected} participant={editedFriend}
      close={() => { setEditedFriend(undefined); setEditor(null); }} save={saveEditor} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  container: { width: '100%', maxWidth: 1112, alignSelf: 'center', paddingHorizontal: 20 },
  header: { backgroundColor: palette.paper, borderBottomWidth: 1, borderColor: palette.line },
  headerInner: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  logo: { backgroundColor: palette.coral, width: 38, height: 38, borderRadius: radius.control, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 27, paddingBottom: 32, gap: 24 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12, borderTopWidth: 1, borderColor: palette.line, paddingTop: 18 },
});
