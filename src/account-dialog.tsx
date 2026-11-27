import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import { authSetup } from './services/auth';
import { Button, Feedback, Field, Label, layout } from './ui';

type Action = 'send' | 'resend' | 'verify' | 'sign-out';

export function AccountDialog({ user, forInvite, close }: { user: User | null; forInvite?: boolean; close: () => void }) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [action, setAction] = useState<Action>();
  const [resendAt, setResendAt] = useState(0);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const pending = useRef(false);
  const auth = authSetup.client?.auth;
  const busy = !!action;

  useEffect(() => {
    if (!resendAt) return;
    const timer = setTimeout(() => setResendAt(0), Math.max(0, resendAt - Date.now()));
    return () => clearTimeout(timer);
  }, [resendAt]);

  async function run(next: Action, perform: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setAction(next);
    setError('');
    setFieldError('');
    try {
      await perform();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Couldn’t reach the account service. Try again.');
    } finally {
      pending.current = false;
      setAction(undefined);
    }
  }

  async function send() {
    if (!auth) return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return setFieldError('Enter a valid email address.');
    await run(sentTo ? 'resend' : 'send', async () => {
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
    if (!/^\d{6,10}$/.test(token)) return setFieldError('Enter the numeric code from your email.');
    await run('verify', async () => {
      const { error } = await auth.verifyOtp({ email: sentTo, token, type: 'email' });
      if (error) throw error;
      if (!forInvite) close();
    });
  }
  async function signOut() {
    if (!auth) return;
    await run('sign-out', async () => {
      const { error } = await auth.signOut({ scope: 'local' });
      if (error) throw error;
      close();
    });
  }

  const submit = user ? <Button secondary busy={action === 'sign-out'} busyLabel="Signing out…" onPress={signOut}>Sign out of this device</Button> :
    sentTo ? <Button disabled={action === 'resend'} busy={action === 'verify'} busyLabel="Verifying…" onPress={verify}>
      {forInvite ? 'Verify and continue' : 'Verify code'}
    </Button> : <Button busy={action === 'send'} busyLabel="Sending…" onPress={send}>Send code</Button>;
  return <EditorDialog title={user ? 'Your account' : sentTo ? 'Check your email' : 'Sign in'} close={close} busy={busy}
    actions={auth && submit}>
    {!auth ? <Feedback title="Sign-in unavailable">{authSetup.message}</Feedback> : user ? <>
      <Label kind="value">{user.email}</Label>
      <Label>Shared meetups are available when you sign in with this account. On-device plans stay in this browser or app.</Label>
    </> : sentTo ? <>
      <Label>Enter the code sent to {sentTo}.</Label>
      <Field label="Email code" value={code} onChange={value => { setCode(value); setFieldError(''); }}
        inputMode="numeric" autoComplete="one-time-code" error={fieldError} required disabled={busy} />
      <View style={layout.wrap}>
        <Button secondary disabled={action === 'verify' || (Boolean(resendAt) && action !== 'resend')} busy={action === 'resend'}
          busyLabel="Sending…" onPress={send}>Resend code</Button>
        <Button quiet disabled={busy} onPress={() => { setSentTo(''); setCode(''); setError(''); setFieldError(''); }}>Change email</Button>
      </View>
      {!!resendAt && <Label kind="caption">You can resend a code one minute after it was sent.</Label>}
    </> : <>
      <Label>{forInvite ? 'We’ll email you a sign-in code, then you can enter your meetup invite.' :
        'We’ll email you a sign-in code. The first time you verify it, we’ll create your account.'}</Label>
      <Field label="Email address" value={email} onChange={value => { setEmail(value); setFieldError(''); }}
        inputMode="email" autoComplete="email" error={fieldError} required disabled={busy} />
    </>}
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </EditorDialog>;
}
