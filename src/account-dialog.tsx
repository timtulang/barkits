import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import { authSetup } from './services/auth';
import { Button, Field, Label, layout } from './ui';

export function AccountDialog({ user, close }: { user: User | null; close: () => void }) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const auth = authSetup.client?.auth;

  useEffect(() => {
    if (!resendAt) return;
    const timer = setTimeout(() => setResendAt(0), Math.max(0, resendAt - Date.now()));
    return () => clearTimeout(timer);
  }, [resendAt]);

  async function run(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Couldn’t reach the account service. Try again.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function send() {
    if (!auth) return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return setError('Enter a valid email address.');
    await run(async () => {
      const { error } = await auth.signInWithOtp({ email: address, options: { shouldCreateUser: true } });
      if (error) throw error;
      setSentTo(address);
      setCode('');
      setResendAt(Date.now() + 60_000);
    });
  }
  async function verify() {
    if (!auth) return;
    const token = code.trim();
    if (!/^\d{6,10}$/.test(token)) return setError('Enter the numeric code from your email.');
    await run(async () => {
      const { error } = await auth.verifyOtp({ email: sentTo, token, type: 'email' });
      if (error) throw error;
      close();
    });
  }
  async function signOut() {
    if (!auth) return;
    await run(async () => {
      const { error } = await auth.signOut({ scope: 'local' });
      if (error) throw error;
      close();
    });
  }

  return <EditorDialog title={user ? 'Your account' : 'Sign in'} close={close}>
    {!auth ? <Label>{authSetup.message}</Label> : user ? <>
      <Label weight="bold">{user.email}</Label>
      <Label>Your meetups are saved for this account on this device.</Label>
      <Button secondary disabled={busy} onPress={signOut}>Sign out of this device</Button>
    </> : sentTo ? <>
      <Label>Enter the code emailed to {sentTo}.</Label>
      <Field label="Email code" value={code} onChange={setCode} inputMode="numeric" autoComplete="one-time-code" />
      <Button disabled={busy} onPress={verify}>{busy ? 'Please wait…' : 'Verify code'}</Button>
      <View style={layout.wrap}>
        <Button secondary disabled={busy || Boolean(resendAt)} onPress={send}>Resend code</Button>
        <Button secondary disabled={busy} onPress={() => { setSentTo(''); setCode(''); setError(''); }}>Change email</Button>
      </View>
    </> : <>
      <Label>We’ll email you a sign-in code. Verifying your email for the first time creates your account.</Label>
      <Field label="Email address" value={email} onChange={setEmail} inputMode="email" autoComplete="email" />
      <Button disabled={busy} onPress={send}>{busy ? 'Sending…' : 'Send code'}</Button>
    </>}
    {!!error && <Label>{error}</Label>}

  </EditorDialog>;
}
