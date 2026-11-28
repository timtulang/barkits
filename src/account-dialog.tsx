import { AccountSecurityDialog } from './account-security-dialog';
import { setStringAsync } from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AccountSettingsDialog } from './account-settings-dialog';
import { useAccountSettings } from './account-settings-context';
import { EditorDialog } from './editor-dialog';
import { authSetup, saveDisplayName, signOut, startSignIn, type Account } from './services/auth';
import { Button, Feedback, Field, Icon, Label } from './ui';

export function AccountDialog({ user, forInvite, expired, resumeSharedId, close }: { user: Account | null; forInvite?: boolean; expired?: boolean; resumeSharedId?: string; close: () => void }) {
  const settings = useAccountSettings();
  const [security, setSecurity] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(user?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState('');
  const previousName = useRef(user?.display_name ?? '');
  useEffect(() => {
    const next = user?.display_name ?? '';
    const previous = previousName.current;
    setName(draft => draft === previous ? next : draft);
    previousName.current = next;
  }, [user?.display_name]);
  async function saveProfile() {
    if (busy || saving) return;
    const trimmed = name.trim();
    if (!trimmed || [...trimmed].length > 160 || /\p{Cc}/u.test(trimmed)) {
      setNameError('Enter a display name of 1–160 characters without line breaks or control characters.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    setNameError('');
    try {
      const profile = await saveDisplayName(trimmed);
      setName(profile.display_name);
      setSaved(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Couldn’t save your profile. Try again.');
    } finally {
      setSaving(false);
    }
  }
  async function submit() {
    if (busy || saving) return;
    setBusy(true);
    setError('');
    try {
      if (user && !expired) {
        await signOut();
        close();
      } else {
        await startSignIn(!!forInvite, resumeSharedId);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Couldn’t reach the account service. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (user && security) return <AccountSecurityDialog userId={user.id} close={() => setSecurity(false)} />;
  if (user && preferences) return <AccountSettingsDialog close={() => setPreferences(false)} />;
  const action = authSetup.enabled && <>
    {user && !expired && <Button busy={saving} busyLabel="Saving profile…" disabled={busy || name.trim() === user.display_name}
      onPress={saveProfile}>Save profile</Button>}
    <Button secondary={!!user} busy={busy} disabled={saving} busyLabel={user && !expired ? 'Signing out…' : 'Opening Google…'} onPress={submit}>
      {user && !expired ? 'Sign out of this device' : 'Sign in with Google'}
    </Button>
  </>;
  return <EditorDialog title={user ? 'Your account' : 'Sign in'} close={close} busy={busy || saving} actions={action}>
    {!authSetup.enabled ? <Feedback title="Sign-in unavailable">{authSetup.message}</Feedback> : user && !expired ? <>
      {settings.data && <Icon name={settings.data.avatar} size={32} />}
      {settings.data?.username && <Label>@{settings.data.username}</Label>}
      {user.display_name && <Label kind="value">{user.display_name}</Label>}
      <Field label="Display name" required value={name} disabled={busy || saving} error={nameError}
        hint="Your Barkits profile name. Names in existing meetups stay as you entered them."
        onChange={value => { setName(value); setNameError(''); setSaved(false); setError(''); }} />
      {saved && <Feedback tone="success">Profile saved.</Feedback>}
      <Button secondary disabled={busy || saving} onPress={() => setPreferences(true)}>Profile and preferences</Button>
      <Button secondary disabled={busy || saving} onPress={() => setSecurity(true)}>Account settings</Button>
      <Label kind="detail">Barkits ID · {user.id}</Label>
      <Button quiet disabled={busy || saving} onPress={async () => {
        try { await setStringAsync(user.id); setError(''); }
        catch { setError('Couldn’t copy your Barkits ID. Try again.'); }
      }}>Copy Barkits ID</Button>
      <Label>Signed in with Google. Your on-device plans stay in this browser or app.</Label>
    </> : <Label>{expired ? 'Your session expired. Sign in with the same Google account to resume your shared plans. Save or copy any unsaved text before continuing.' : forInvite ? 'Sign in with Google to enter your meetup invite.' : 'Sign in with Google to plan a meetup with friends.'}</Label>}
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </EditorDialog>;
}
