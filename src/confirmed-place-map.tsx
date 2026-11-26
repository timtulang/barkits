import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import { FullscreenPlaceMap, type MapNavigation } from './fullscreen-place-map';
import type { Point } from './geo';
import { GoogleMapsLink } from './google-maps-link';
import { spacing } from './theme';
import { Icon, Label, layout } from './ui';

export function ConfirmedPlaceMap({ navigation, name, point, location, schedule }: {
  navigation: MapNavigation; name: string; point: Point; location?: string; schedule?: string;
}) {
  const [details, setDetails] = useState(false);
  const open = async () => setDetails(true);
  const pins = [{ kind: 'venue' as const, venueId: 'confirmed', point, label: 'Confirmed meeting place: ' + name }];
  return <FullscreenPlaceMap navigation={navigation} mapLabel="Confirmed meeting place map" pins={pins} select={open}
    detail={details && <EditorDialog title={name} close={() => setDetails(false)}>
      <Label kind="label">Confirmed meeting place</Label>
      {!!location && <Label>{location}</Label>}
      {!!schedule && <Label>{schedule}</Label>}
      <Label kind="detail">Get directions opens Google Maps. Choose your starting point there.</Label>
      <GoogleMapsLink point={point} directions />
    </EditorDialog>}>
    <View style={[layout.wrap, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Place details for ' + name} onPress={open}
        style={[layout.row, { flexGrow: 1, flexBasis: 130, minHeight: 44, minWidth: 0 }]}>
        <View style={{ flex: 1 }}>
          <Label kind="detail">Confirmed meeting place</Label>
          <Label kind="value" numberOfLines={2}>{name}</Label>
        </View>
        <Icon name="chevron-up" size={16} />
      </Pressable>
      <GoogleMapsLink point={point} directions />
    </View>
  </FullscreenPlaceMap>;
}
