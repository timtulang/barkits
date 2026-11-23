import * as Clipboard from 'expo-clipboard';
import { useState, useRef } from 'react';
import { Text, View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import { issueCode, joinShared, listShared } from './services/shared-meetups';
import { Button, Field, Label, layout, Panel } from './ui';
import { useSharedData } from './use-shared-data';
import { font, palette } from './theme';

export function SharedList({ open, join, past }: { past: boolean; open: (id: string) => void; join: () => void }) {
  const { data, loading, refresh, error } = useSharedData(listShared);
  const groups = data?.filter(g => ['completed','archived'].includes(g.status) === past);
  return <View style={layout.stack}><Label weight="title" size={22} heading>Shared meetups</Label>
    <View style={layout.wrap}><Button secondary icon="users" onPress={join}>Join with code</Button>
      <Button secondary disabled={loading} onPress={refresh} icon="refresh-cw">Refresh list</Button></View>
    {loading && <Label>Loading shared meetups…</Label>}
    {!!error && <Label>{error}</Label>}
    {groups?.map(group => <Button key={group.id} secondary icon="users" onPress={() => open(group.id)}>{group.name}</Button>)}
    {!loading && !error && !groups?.length && <Label>{past ? 'No past shared meetups yet.' : 'Choose “With friends” when you plan a meetup to invite your group.'}</Label>}
  </View>;
}

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
  return <EditorDialog title="Join a meetup" close={() => { if (!busy) close(); }}>
    <Field label="Invite code" placeholder="Paste the organizer’s code" value={code} onChange={setCode}
      error={submitted && !validCode ? 'Enter the 16-character code. Spaces and hyphens are OK.' : undefined} />
    <Field label="Your display name" placeholder="What your friends call you" value={name} onChange={setName} maxLength={80}
      error={submitted && !name.trim() ? 'Enter the name your friends will see.' : undefined} />
    {!!error && <View accessibilityRole="alert"><Label>{error}</Label></View>}
    <View style={layout.wrap}><Button disabled={busy} onPress={join}>{busy ? 'Joining…' : 'Join meetup'}</Button><Button secondary disabled={busy} onPress={close}>Cancel</Button></View>
  </EditorDialog>;
}

export function InviteFriend({ id }: { id: string }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  async function generate() {
    if (pending.current) return;
    pending.current = true;
    setCode('');
    setBusy(true);
    setMessage('');
    try { setCode((await issueCode(id)).match(/.{4}/g)!.join('-')); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Couldn’t create the code. Try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  async function copy() {
    try { setMessage(await Clipboard.setStringAsync(code) ? 'Code copied.' : 'Select the code to copy it.'); }
    catch { setMessage('Select the code to copy it.'); }
  }
  return <Panel><Label size={19} weight="title">Invite a friend</Label>
    <Label>Each code lets one friend join within 24 hours. A new code replaces the previous unused code.</Label>
    {!!code && <Text selectable style={{ fontFamily: font.bold, color: palette.ink, fontSize: 19 }}>{code}</Text>}
    <View style={layout.wrap}>{!!code && <Button icon="copy" onPress={copy}>Copy code</Button>}
      <Button secondary disabled={busy} onPress={generate}>{busy ? 'Creating…' : code ? 'Replace code' : 'Create invite code'}</Button></View>
    {!!message && <Label>{message}</Label>}
  </Panel>;
}
