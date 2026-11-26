import { useState, useRef } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import { joinShared } from './services/shared-meetups';
import { Button, Field, Label, layout } from './ui';

export { SharedList } from './shared-meetup-list';

export function JoinDialog({ open, close }: { open: (id: string) => void; close: () => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const normalized = code.replace(/[\s-]/g, '').toUpperCase();
  const validCode = /^[A-F0-9]{16}$/.test(normalized);
  async function join() {
    setSubmitted(true);
    if (!validCode || !name.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try { open(await joinShared(normalized, name)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t join this meetup. Try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <EditorDialog title="Join a meetup" close={close} busy={busy}>
    <Field label="Invite code" placeholder="Paste the organizer’s code" value={code} onChange={setCode}
      error={submitted && !validCode ? 'Enter the 16-character code. Spaces and hyphens are OK.' : undefined} />
    <Field label="Your display name" placeholder="What your friends call you" value={name} onChange={setName} maxLength={80}
      error={submitted && !name.trim() ? 'Enter the name your friends will see.' : undefined} />
    {!!error && <View accessibilityRole="alert"><Label>{error}</Label></View>}
    <View style={layout.wrap}><Button disabled={busy} onPress={join}>{busy ? 'Joining…' : 'Join meetup'}</Button></View>
  </EditorDialog>;
}
