import { FullscreenPlaceMap, type MapNavigation } from './fullscreen-place-map';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { discover, LocatedFriend } from './discovery';
import { EditorDialog } from './editor-dialog';
import { GoogleMapsLink } from './google-maps-link';
import PlaceMap, { type MapPin } from './place-map';
import type { Venue } from './planner';
import { palette, radius, spacing } from './theme';
import { Button, Icon, Label, layout } from './ui';
import { VenueDistances } from './venue-summary';

export function SuggestedPlaces({ suggestions, friends, actions, navigation }: {
  navigation: MapNavigation; suggestions: ReturnType<typeof discover>; friends: LocatedFriend[]; actions: (venue: Venue) => ReactNode;
}) {
  const [showOrigins, setShowOrigins] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const selected = suggestions.find(({ venue }) => venue.id === selectedId);
  if (!suggestions.length) return null;
  const pins: MapPin[] = suggestions.flatMap(({ venue }, index) => venue.point ? [{
    kind: 'venue', point: venue.point, venueId: venue.id, number: index + 1,
    label: 'Open place ' + (index + 1) + ': ' + venue.name,
  }] : []);
  if (showOrigins) {
    for (const friend of friends) pins.push({ kind: 'origin', point: friend.point,
      label: friend.name + (friend.approximate ? ' · Locality center' : ' · Starting point') });
  }
  const select = async (id: string) => setSelectedId(id);
  const originLabel = showOrigins ? 'Hide starting points' : 'Show starting points';
  const originControl = <Button quiet expanded={showOrigins} accessibilityLabel={originLabel} icon={showOrigins ? 'check-circle' : 'users'} onPress={() => setShowOrigins(!showOrigins)}>
    {navigation.expanded ? 'Starting points' : originLabel}
  </Button>;
  const places = suggestions.map(({ venue }, index) => <Pressable key={venue.id} accessibilityRole="button" accessibilityLabel={'View details for ' + venue.name}
      onPress={() => setSelectedId(venue.id)} style={({ pressed }) => [layout.row, {
        minHeight: 56, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, gap: spacing.md,
        borderBottomWidth: 1, borderColor: palette.line, backgroundColor: pressed ? palette.lavender : 'transparent',
      }]}>
      <View style={{ minWidth: 30, height: 30, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lavender }}>
        <Label kind="label">{index + 1}</Label>
      </View>
      <View style={{ flex: 1 }}><Label kind="value">{venue.name}</Label>
        <Label kind="detail">{[venue.category, venue.area].filter(Boolean).join(' · ')}</Label></View>
      <Icon name="chevron-right" size={17} color={palette.muted} />
    </Pressable>);
  const detail = selected && <EditorDialog key={selected.venue.id} title={selected.venue.name} close={() => setSelectedId(undefined)}>
      <Label kind="detail">{[selected.venue.category, selected.address, selected.venue.area].filter(Boolean).join(' · ')}</Label>
      <VenueDistances friends={friends} distances={selected.distances} />
      {selected.nearBus && <Label kind="detail">Within 800 m of a mapped bus terminal.</Label>}
      {actions(selected.venue)}
      {selected.venue.point && <GoogleMapsLink point={selected.venue.point} />}
    </EditorDialog>;
  if (navigation.expanded) return <FullscreenPlaceMap navigation={navigation} pins={pins} select={select}
    count={suggestions.length} places={places} originControl={originControl} detail={detail} />;
  return <View style={{ gap: spacing.sm }}>
    <Button secondary icon="maximize-2" onPress={() => navigation.setExpanded(true)}>Open full-screen map</Button>
    <PlaceMap pins={pins} onSelectVenue={select} dom={{ style: { height: 348 }, scrollEnabled: false, applicationNameForUserAgent: 'Barkits/0.1' }} />
    <View style={layout.wrap}>
      <View style={{ flexGrow: 1, flexBasis: 160 }}><Label kind="detail">Select a pin or place for details.{showOrigins ? ' Coral dots show starting points.' : ''}</Label></View>
      {originControl}
    </View>
    {places}
    {detail}
  </View>;
}
