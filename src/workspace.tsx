import { usePreventRemove } from '@react-navigation/native';
import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDialog } from './account-dialog';
import { EditorDialog } from './editor-dialog';
import { MeetupEditor } from './meetup-editor';
import { ParticipantEditor } from './editor';
import { Home } from './home';
import { MeetupScreen } from './meetup';
import type { Meetup, Participant } from './planner';
import { AppHeader, shellStyles as styles, type RenderWorkspace } from './app-shell';
import { Button, EmptyState, Feedback, Label, LoadingState } from './ui';
import { JoinDialog, SharedList } from './shared-membership';
import { SharedMeetupScreen } from './shared-meetup-screen';
import { createShared } from './services/shared-meetups';
import { authSetup } from './services/auth';
import { useMeetups } from './meetups';

function browserEntryIndex() {
  return (window as Window & { navigation?: { currentEntry?: NavigationHistoryEntry } }).navigation?.currentEntry?.index;
}

export function Workspace({ meetupId }: { meetupId?: string }) {
  const { user, joining, setJoining, meetups, savedMeetups, saveFailed, loadFailed, retrySave, retryLoad, saveMeetup,
    past, setPast, sharedId: openSharedId, setSharedId } = useMeetups();
  const scroll = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [editor, setEditor] = useState<'new' | 'details' | 'participant' | null>(null);
  const [editedFriend, setEditedFriend] = useState<Participant>();
  const [planningDirty, setPlanningDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<() => void>();
  const leaveAfterDiscard = useRef<() => void>(undefined);
  const browserEntry = useRef<{ href: string; state: unknown; index: number | undefined }>(undefined);
  const wide = useWindowDimensions().width >= 860;
  const sharedId = meetupId === undefined ? openSharedId : undefined;
  const selected = meetupId === undefined ? undefined : meetups?.find(item => item.id === meetupId);
  const saveStatus = saveFailed ? 'Changes are not saved. Use Try again above.' : savedMeetups === meetups ?
    'Plan saved on this device' : 'Saving changes on this device…';

  usePreventRemove(planningDirty, ({ data }) => {
    setPendingLeave(() => () => navigation.dispatch(data.action));
  });
  useEffect(() => {
    browserEntry.current = planningDirty && typeof window !== 'undefined' && window.history
      ? { href: window.location.href, state: window.history.state, index: browserEntryIndex() }
      : undefined;
  }, [planningDirty]);
  useEffect(() => {
    if (planningDirty || !leaveAfterDiscard.current) return;
    const leave = leaveAfterDiscard.current;
    leaveAfterDiscard.current = undefined;
    leave();
  }, [planningDirty]);

  function keepPlanning() {
    setPendingLeave(undefined);
    const entry = browserEntry.current;
    if (!entry || window.location.href === entry.href) return;
    // expo router keeps the screen after a blocked popstate but leaves the browser on the target url.
    const index = browserEntryIndex();
    if (entry.index !== undefined && index !== undefined && entry.index !== index) {
      window.history.go(entry.index - index);
    } else {
      window.history.pushState(entry.state, '', entry.href);
    }
  }

  function leave(action: () => void) {
    if (planningDirty) setPendingLeave(() => action);
    else action();
  }

  function home() {
    leave(() => {
      setSharedId(undefined);
      if (meetupId !== undefined) router.dismissTo('/');
    });
  }

  function openLocal(id: string) {
    leave(() => {
      setSharedId(undefined);
      const href = { pathname: '/meetups/[id]' as const, params: { id } };
      if (meetupId === undefined) router.navigate(href);
      else router.replace(href);
    });
  }

  function openShared(id: string) {
    setJoining(false);
    setEditor(null);
    leave(() => {
      setSharedId(id);
      if (meetupId !== undefined) router.dismissTo('/');
    });
  }

  function saveEditor(meetup: Meetup) {
    saveMeetup(meetup);
    if (editor === 'new') openLocal(meetup.id);
    setEditor(null);
    setEditedFriend(undefined);
  }

  const renderWorkspace: RenderWorkspace = (content, footer) => <>
    <ScrollView ref={scroll} role="main" keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      key={sharedId ?? meetupId ?? 'home'} contentContainerStyle={[styles.container, styles.content]}>
      {loadFailed && <Feedback tone="error" title="Your meetups couldn’t load"
        action={<Button secondary onPress={retryLoad}>Try again</Button>}>Your saved data has not been replaced.</Feedback>}
      {saveFailed && selected?.status !== 'Completed' && selected?.status !== 'Archived' &&
        <Feedback tone="error" title="Changes are not saved"
          action={<Button secondary onPress={retrySave}>Try again</Button>}>Couldn’t save your changes on this device.</Feedback>}
      {!meetups && !loadFailed && <LoadingState label="Loading your meetups…" />}
      {content}
    </ScrollView>
    {footer}
  </>;
  const scrollToTop = () => scroll.current?.scrollTo({ y: 0, animated: false });

  return <SafeAreaView style={styles.safe}>
    <AppHeader signedIn={!!user} inMeetup={meetupId !== undefined || !!sharedId} compact={!wide}
      home={home} account={() => setAccountOpen(true)} create={() => setEditor('new')} />
    {meetups && sharedId && user ? <SharedMeetupScreen key={sharedId} frame={renderWorkspace} scrollToTop={scrollToTop} id={sharedId} userId={user.id} back={home} /> :
      selected ? <MeetupScreen key={selected.id} frame={renderWorkspace} reportDirty={setPlanningDirty} saveReady={savedMeetups === meetups && !saveFailed} saveStatus={saveStatus}
        retrySave={saveFailed ? retrySave : undefined}
        scrollToTop={scrollToTop} meetup={selected} save={saveMeetup} editDetails={() => setEditor('details')} editFriend={friend => { setEditedFriend(friend); setEditor('participant'); }} back={home} /> :
      renderWorkspace(meetups && (meetupId !== undefined ?
        <EmptyState title="Meetup unavailable" action={<Button secondary onPress={home}>Back to meetups</Button>}>
          This meetup isn’t saved on this device for the current account.
        </EmptyState> :
        <Home wide={wide} meetups={meetups} create={() => setEditor('new')} open={openLocal} signedIn={!!user} past={past} setPast={setPast}
          join={authSetup.client ? () => { setJoining(true); if (!user) setAccountOpen(true); } : undefined}
          shared={user ? <SharedList past={past} open={openShared} /> : undefined} />))}
    {pendingLeave && <EditorDialog title="Unsaved planning edits" close={keepPlanning} actions={<>
      <Button onPress={keepPlanning}>Keep planning</Button>
      <Button secondary onPress={() => {
        leaveAfterDiscard.current = pendingLeave;
        setPendingLeave(undefined);
        setPlanningDirty(false);
      }}>Discard unsaved edits &amp; leave</Button>
    </>}>
      <Label>Save your schedule, trip, or recap edits before leaving. Saved changes stay on this device.</Label>
    </EditorDialog>}
    {joining && user && <JoinDialog close={() => setJoining(false)} open={openShared} />}
    {accountOpen && <AccountDialog user={user} forInvite={joining && !user}
      close={() => { setAccountOpen(false); setJoining(false); }} />}
    {(editor === 'new' || editor === 'details') && <MeetupEditor key={editor} meetup={editor === 'details' && selected ? selected : undefined}
      share={editor === 'new' && user ? async (id, meetup, name) => openShared(await createShared(id, meetup, name)) : undefined}
      close={() => setEditor(null)} save={saveEditor} />}
    {editor === 'participant' && selected && <ParticipantEditor meetup={selected} participant={editedFriend}
      close={() => { setEditedFriend(undefined); setEditor(null); }} save={saveEditor} />}
  </SafeAreaView>;
}
