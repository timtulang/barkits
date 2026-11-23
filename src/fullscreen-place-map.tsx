import { useState, type ReactNode } from 'react';
import { Modal, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconAction } from './form-controls';
import PlaceMap, { type MapPin } from './place-map';
import { palette, radius, spacing } from './theme';
import { Button, Label, layout } from './ui';

export type MapNavigation = { title: string; expanded: boolean; setExpanded: (value: boolean) => void; back: () => void };

export function FullscreenPlaceMap({ navigation, pins, select, children, detail, mapLabel }: {
  navigation: MapNavigation; pins: MapPin[]; select: (id: string) => Promise<void>;
  children: ReactNode; detail: ReactNode; mapLabel?: string;
}) {
  const [mapHeight, setMapHeight] = useState(0);
  return <Modal visible animationType="none" onRequestClose={() => navigation.setExpanded(false)}>
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
      <View style={{ flex: 1, minHeight: 0 }} onLayout={event => setMapHeight(Math.round(event.nativeEvent.layout.height))}>
        {mapHeight > 0 && <PlaceMap mapLabel={mapLabel} viewportHeight={mapHeight} pins={pins} onSelectVenue={select}
          dom={{ style: { height: mapHeight }, scrollEnabled: false, applicationNameForUserAgent: 'Barkits/0.1' }} />}
        <View style={[layout.row, { position: 'absolute', zIndex: 1, top: spacing.sm, left: spacing.sm, right: spacing.sm,
          padding: spacing.xs, borderRadius: radius.card, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper }]}>
          <IconAction name="arrow-left" label="Back to meetups" onPress={navigation.back} />
          <View style={{ flex: 1, minWidth: 0 }}><Label kind="value" heading numberOfLines={1}>{navigation.title}</Label></View>
          <Button quiet onPress={() => navigation.setExpanded(false)}>Meetup details</Button>
        </View>
      </View>
      {children}
      {detail}
    </SafeAreaView>
  </Modal>;
}

export function PlaceListTray({ count, places, originControl }: { count: number; places: ReactNode; originControl: ReactNode }) {
  const [listOpen, setListOpen] = useState(false);
  const { height } = useWindowDimensions();
  return <>
    <View style={[layout.wrap, { justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.xs }]}>
      <Button quiet expanded={listOpen} icon={listOpen ? 'chevron-down' : 'list'} onPress={() => setListOpen(!listOpen)}>
        {listOpen ? 'Hide places' : 'View places'} ({count})
      </Button>
      {originControl}
    </View>
    {listOpen && <ScrollView style={{ maxHeight: height * 0.33, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
      {places}
    </ScrollView>}
  </>;
}
