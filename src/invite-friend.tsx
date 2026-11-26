import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import { issueCode } from './services/shared-meetups';
import { colors, font, radius, spacing } from './theme';
import { Button, Feedback, Label, Panel, layout } from './ui';

const lifetime = 24 * 60 * 60 * 1000;
type Invite = { code: string; hideAt: number };

export function InviteFriend({ id }: { id: string }) {
  const [invite, setInvite] = useState<Invite>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  const pending = useRef(false);

  function endSharingWindow() {
    request.current++;
    setInvite(undefined);
    setNotice('The 24-hour sharing window has ended. Create a fresh code.');
  }

  useEffect(() => {
    if (!invite) return;
    function expire() {
      if (!invite || Date.now() < invite.hideAt) return;
      endSharingWindow();
    }
    const timer = setTimeout(expire, Math.max(0, invite.hideAt - Date.now()));
    const listener = AppState.addEventListener('change', state => { if (state === 'active') expire(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, [invite]);

  async function generate() {
    if (pending.current) return;
    pending.current = true;
    request.current++;
    setBusy(true);
    setError('');
    setNotice('');
    setInvite(undefined);
    const hideAt = Date.now() + lifetime;
    try {
      const raw = await issueCode(id);
      setInvite({ code: raw.replace(/(.{4})(?=.)/g, '$1-'), hideAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t create an invite code. Try again.');
    } finally { pending.current = false; setBusy(false); }
  }

  async function copy() {
    if (!invite || pending.current) return;
    if (Date.now() >= invite.hideAt) {
      endSharingWindow();
      return;
    }
    const current = request.current;
    let copied = false;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(invite.code);
        copied = true;
      } else {
        copied = await Clipboard.setStringAsync(invite.code);
      }
    } catch { copied = false; }
    if (current === request.current) setNotice(copied ? 'Code copied.' : 'Select the code and copy it manually.');
  }

  return <Panel>
    <Label kind="item" heading>Invite a friend</Label>
    <Label kind="detail">{invite ? 'Send this code to one friend. It expires after 24 hours or when used.' :
      'One friend can join per code. Each code lasts 24 hours and replaces the previous unused code.'}</Label>
    {invite && <View style={{ padding: spacing.md, borderRadius: radius.control, backgroundColor: colors.infoSurface }}>
      <Text selectable style={{ color: colors.info, fontFamily: font.bold, fontSize: 19, fontVariant: ['tabular-nums'] }}>{invite.code}</Text>
    </View>}
    <View style={layout.wrap}>
      {invite && <Button icon="copy" onPress={copy}>Copy code</Button>}
      <Button variant={invite ? 'quiet' : 'secondary'} busy={busy} busyLabel="Creating…" onPress={generate}>
        {invite ? 'Replace code' : 'Create invite code'}
      </Button>
    </View>
    {invite && <Label kind="caption">Replacing the code stops the previous one from working.</Label>}
    {!!notice && <View accessibilityLiveRegion="polite"><Label kind="value">{notice}</Label></View>}
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </Panel>;
}
