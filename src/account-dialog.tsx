import { useState } from 'react';
import { EditorDialog } from './editor-dialog';
import { authSetup, signOut, startSignIn, type Account } from './services/auth';
import { Button, Feedback, Label } from './ui';

export function AccountDialog({ user, forInvite, close }: { user: Account | null; forInvite?: boolean; close: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (user) {
        await signOut();
        close();
      } else {
        await startSignIn(!!forInvite);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Couldn’t reach the account service. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const action = authSetup.enabled && <Button busy={busy} busyLabel={user ? 'Signing out…' : 'Opening Google…'} onPress={submit}>
    {user ? 'Sign out of this device' : 'Sign in with Google'}
  </Button>;
  return <EditorDialog title={user ? 'Your account' : 'Sign in'} close={close} busy={busy} actions={action}>
    {!authSetup.enabled ? <Feedback title="Sign-in unavailable">{authSetup.message}</Feedback> : user ? <>
      {user.display_name && <Label kind="value">{user.display_name}</Label>}
      <Label>Signed in with Google. Your on-device plans stay in this browser or app.</Label>
    </> : <Label>{forInvite ? 'Sign in with Google to enter your meetup invite.' : 'Sign in with Google to plan a meetup with friends.'}</Label>}
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </EditorDialog>;
}
