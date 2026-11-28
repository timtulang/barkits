import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { readSecurity, revokeOtherSessions, deleteAccount, type SecurityReview } from './services/account';
import { clearAccountSession, startSignIn } from './services/auth';
import { meetupStorageKey } from './meetup-storage';
import { ChoiceField, FormSection } from './form-controls';
import { EditorDialog } from './editor-dialog';
import { useSharedData } from './use-shared-data';
import { Button, Feedback, Field, Label, LoadingState } from './ui';

export function AccountSecurityDialog({ userId, close }: { userId: string; close: () => void }) {
  const state = useSharedData(readSecurity);
  if (!state.data) return <EditorDialog title="Account settings" close={close}>
    {state.loading ? <LoadingState label="Loading account settings…" /> : <Feedback tone="error"
      action={<Button secondary onPress={state.refresh}>Try again</Button>}>{state.error}</Feedback>}
  </EditorDialog>;
  return <SecuritySettings initial={state.data} userId={userId} close={close} />;
}
function SecuritySettings({ initial, userId, close }: { initial: SecurityReview; userId: string; close: () => void }) {
  const [review, setReview] = useState(initial);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [successors, setSuccessors] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleted, setDeleted] = useState(false);
  const [revoking, setRevoking] = useState(false);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await task(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t complete this account action.'); }
    finally { setBusy(false); }
  }
  async function refresh() { setReview(await readSecurity()); setConfirmation(''); setSuccessors({}); }
  async function cleanLocal() {
    await AsyncStorage.removeItem(`${meetupStorageKey}.${userId}`);
    await clearAccountSession();
    close();
  }
  const shared = review.owned.filter(group => group.members.length);
  const allChosen = shared.every(group => group.members.some(member => member.id === successors[group.id]));
  if (deleted) return <EditorDialog title="Account deleted" close={() => { void run(cleanLocal); }} busy={busy} actions={
    <Button busy={busy} onPress={() => run(cleanLocal)}>Finish device cleanup</Button>}>
    <Feedback tone="success">Your account and personal shared records have been deleted.</Feedback>
    {!!error && <Feedback tone="error">Account deletion succeeded, but device cleanup could not finish. {error}</Feedback>}
  </EditorDialog>;
  return <EditorDialog title={deleting ? 'Delete your account' : 'Account settings'} close={close} busy={busy} actions={deleting ? <>
    <Button variant="danger" busy={busy} busyLabel="Deleting account…" disabled={confirmation !== 'DELETE' || !allChosen || !review.recent_login}
      onPress={() => run(async () => { const result = await deleteAccount(review.revision,successors);
        if (!result.deleted) throw new Error('Barkits did not confirm account deletion.'); setDeleted(true); await cleanLocal(); })}>Delete account permanently</Button>
    <Button secondary disabled={busy} onPress={() => setDeleting(false)}>Keep my account</Button>
  </> : <Button secondary disabled={busy} onPress={close}>Back to account</Button>}>
    {!deleting ? <>
      <Label>Signed in with Google. Your Barkits session expires {new Date(review.expires_at).toLocaleString()}.</Label>
      <Label>{review.session_count} active {review.session_count === 1 ? 'session' : 'sessions'} across devices.</Label>
      {revoking ? <Feedback title="Sign out other devices?" action={<Button disabled={busy} onPress={() => run(async () => {
        const result = await revokeOtherSessions(); if (!result.revoked) throw new Error('Session revocation was not confirmed.');
        await refresh(); setRevoking(false); setNotice('Other sessions signed out. This device stays signed in.');
      })}>Confirm sign-out</Button>}>Pending native sign-in handoffs will also expire. <Button quiet onPress={() => setRevoking(false)}>Cancel</Button></Feedback> :
        <Button secondary disabled={busy} onPress={() => setRevoking(true)}>Sign out other devices</Button>}
      <FormSection title="Account deletion">
        <Label>Review your shared plans and choose a replacement organizer before permanently deleting your account.</Label>
        <Button variant="danger" disabled={busy} onPress={() => run(async () => { await refresh(); setDeleting(true); })}>Review account deletion</Button>
      </FormSection>
    </> : <>
      <Feedback tone="warning">This permanently removes your profile, Google identity link, sessions, redeemed-invite account links, memberships, starting points, trip estimates, votes, recaps and ratings. You will leave {review.meetup_count} meetups.</Feedback>
      <Label>Your {review.owned.length - shared.length} meetup(s) with no other members will be deleted. Other people’s shared plans and contributions remain.</Label>
      {shared.map(group => <ChoiceField key={group.id} label={'Next organizer for ' + group.name} value={successors[group.id] ?? ''} disabled={busy}
        options={[{value:'',label:'Choose a current member'},...group.members.map(member=>({value:member.id,label:member.name}))]}
        change={id=>setSuccessors({...successors,[group.id]:id})} />)}
      <Label>On this device, account-owned local plans are removed. Guest plans are kept. Copies on other devices must be removed there. Rejoining with Google creates a new account.</Label>
      {!review.recent_login && <Feedback tone="warning" action={<Button disabled={busy} onPress={() => run(() => startSignIn(false))}>Sign in again with Google</Button>}>
        A Google sign-in within the last 15 minutes is required. Return to this review after signing in.</Feedback>}
      <Field label="Type DELETE to confirm" required value={confirmation} onChange={setConfirmation} disabled={busy} />
      <Button quiet disabled={busy} onPress={() => run(refresh)}>Reload deletion review</Button>
    </>}
    {!!notice && <Feedback tone="success">{notice}</Feedback>}
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </EditorDialog>;
}
