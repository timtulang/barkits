import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import type { Point } from './geo';
import { GoogleMapsLink } from './google-maps-link';
import { colors } from './theme';
import { Button, Icon, Label, layout, Panel } from './ui';

export function MeetupArrival({ name, area, point, saved = true, onMap, children }: {
  name: string; area?: string; point?: Point; saved?: boolean; onMap: () => void; children?: ReactNode;
}) {
  return <Panel>
    <Label kind="section" heading>Meet at {name}</Label>
    <View style={layout.row} accessibilityLiveRegion="polite" aria-live="polite">
      <Icon name={saved ? 'check-circle' : 'clock'} color={saved ? colors.success : colors.warning} />
      <Label kind="label" color={saved ? colors.success : colors.warning}>
        {saved ? 'Destination confirmed' : 'Confirmation pending save'}
      </Label>
    </View>
    {!!area && <Label>{area}</Label>}
    {point ? <View style={layout.wrap}><GoogleMapsLink point={point} directions />
      <Button secondary onPress={onMap} icon="map">View venue map</Button>
    </View> : <Label kind="detail">Directions are unavailable because this place has no saved map pin.</Label>}
    {children}
  </Panel>;
}

export function LifecycleAction({ archive, shared, busy, run }: {
  archive?: boolean; shared?: boolean; busy: boolean; run: () => boolean | Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const action = archive ? 'Archive meetup' : 'Mark completed';
  if (!confirming) return <Button quiet icon={archive ? 'archive' : 'check'} disabled={busy} onPress={() => setConfirming(true)}>{action}</Button>;
  return <View style={layout.stack}>
    <Label kind="detail">{archive
      ? shared ? 'The group can still read shared recaps after you archive this meetup.' : 'You can still open the recap and ratings in Past meetups.'
      : shared ? 'Members can write a recap or leave a rating after you complete the meetup.' : 'You can add a recap and ratings once the meetup is complete.'}</Label>
    <View style={layout.wrap}>
      <Button disabled={busy && !saving} busy={saving} busyLabel="Saving…" onPress={async () => {
        setSaving(true);
        try { if (await run()) setConfirming(false); }
        finally { setSaving(false); }
      }}>
        {archive ? 'Confirm archive' : 'Confirm completion'}
      </Button>
      <Button quiet disabled={saving} onPress={() => setConfirming(false)}>Cancel</Button>
    </View>
  </View>;
}
