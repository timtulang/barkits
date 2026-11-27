import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Editor } from './editor';
import { Home } from './home';
import { MeetupScreen } from './meetup';
import { newMeetupId } from './meetup-storage';
import { useMeetups } from './meetups';
import { example, type Meetup, type Participant } from './planner';
import { palette, radius } from './theme';
import { Button, Chip, Icon, Label, layout, Panel } from './ui';

export function PlannerScreen({ meetupId }: { meetupId?: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const { meetups, loadFailed, saveFailed, retryLoad, retrySave, saveMeetup } = useMeetups();
  const [editor, setEditor] = useState<{ kind: 'new' } | { kind: 'participant'; friend?: Participant } | null>(null);
  const selected = meetups?.find(meetup => meetup.id === meetupId);
  const hasDemo = meetups?.some(meetup => meetup.id === example.id);

  function goHome() {
    if (meetupId !== undefined) router.dismissTo('/');
  }

  function openMeetup(id: string) {
    router.navigate({ pathname: '/meetups/[id]', params: { id } });
  }

  function createMeetup(draft: Pick<Meetup, 'name' | 'date'>) {
    const id = newMeetupId();
    saveMeetup({ ...draft, id, participants: [], status: 'Planning', votes: {}, ratings: {} });
    closeEditor();
    openMeetup(id);
  }

  function closeEditor() {
    setEditor(null);
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><View style={[styles.container, styles.headerInner]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Barkits home" onPress={goHome} style={layout.row}>
        <View style={styles.logo}><Icon name="map-pin" size={21} /></View>
        <Label size={width < 350 ? 22 : 26} weight="title">barkits.</Label>
      </Pressable>
      {wide && <View style={layout.row}>
        <Chip icon="home" selected={meetupId === undefined} onPress={goHome}>Home</Chip>
        {hasDemo && <Chip icon="calendar" selected={meetupId === example.id} onPress={() => openMeetup(example.id)}>Demo meetup</Chip>}
      </View>}
      <View><Button secondary disabled={!meetups} icon={width < 350 ? undefined : "plus"} onPress={() => setEditor({ kind: 'new' })}>New meetup</Button></View>
    </View></View>
    <ScrollView contentContainerStyle={[styles.container, styles.content]}>
      {saveFailed && <Panel>
        <Label color={palette.plum}>Couldn’t save your changes on this device.</Label>
        <Button secondary onPress={retrySave}>Retry save</Button>
      </Panel>}
      {loadFailed && <Panel>
        <Label color={palette.plum}>Couldn’t load saved meetups.</Label>
        <Button secondary onPress={retryLoad}>Retry loading</Button>
      </Panel>}
      {!meetups && !loadFailed && <Label color={palette.muted}>Loading meetups…</Label>}
      {meetups && meetupId === undefined && <Home wide={wide} titleSize={width >= 1050 ? 55 : wide ? 43 : 36}
        meetups={meetups} create={() => setEditor({ kind: 'new' })} />}
      {selected && <MeetupScreen meetup={selected} save={saveMeetup} editFriend={friend => setEditor({ kind: 'participant', friend })} back={goHome} />}
      {meetups && meetupId !== undefined && !selected && <Panel>
        <Label weight="title" size={27} heading>Meetup unavailable</Label>
        <Label>This meetup isn’t saved on this device. Open your meetups to continue.</Label>
        <Button secondary icon="arrow-left" onPress={goHome}>Back to meetups</Button>
      </Panel>}
      <View style={styles.footer}>
        <View style={layout.row}><Icon name="map-pin" size={14} color={palette.plum} /><Label size={13} weight="bold" color={palette.plum}>Barkits</Label></View>
        <Label size={13} color={palette.muted}>Made for the barkada.</Label>
      </View>
    </ScrollView>
    {editor?.kind === 'new' && <Editor kind="new" close={closeEditor} save={createMeetup} />}
    {editor?.kind === 'participant' && selected && <Editor kind="participant" meetup={selected} participant={editor.friend}
      close={closeEditor} save={meetup => { saveMeetup(meetup); closeEditor(); }} />}
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
