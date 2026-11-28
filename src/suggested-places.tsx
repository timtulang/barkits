import { FullscreenPlaceMap, PlaceListTray, type MapNavigation } from './fullscreen-place-map';
import { useState, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import type { discover, LocatedFriend } from './discovery';
import { EditorDialog } from './editor-dialog';
import { friendInitials } from './friend-picker';
import { directDistance } from './geo';
import { GoogleMapsLink } from './google-maps-link';
import PlaceMap, { type MapPin } from './place-map';
import type { Venue } from './planner';
import { palette, radius, spacing } from './theme';
import { Button, Chip, Icon, Label, layout } from './ui';
import { VenueDistances } from './venue-summary';

export type PlaceBrowseView = 'map' | 'places' | 'compare' | 'shortlist';
type PlaceBrowser = {
  view: PlaceBrowseView; change: (view: PlaceBrowseView) => void;
  extra: { id: 'compare' | 'shortlist'; label: string; render: (places: Venue[], open: (id: string) => void) => ReactNode };
};

export function SuggestedPlaces({ suggestions, friends, actions, navigation, alternatives = [], filters, browser }: {
  navigation: MapNavigation; suggestions: ReturnType<typeof discover>; friends: LocatedFriend[]; actions: (venue: Venue, close: () => void) => ReactNode;
  alternatives?: Venue[]; filters?: ReactNode; browser?: PlaceBrowser;
}) {
  const [more, setMore] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const { height, width } = useWindowDimensions();
  const wide = !!browser && width >= 940;
  const mapHeight = browser && !wide ? Math.min(460, Math.max(340, Math.round(height * 0.5))) :
    Math.min(560, Math.max(420, Math.round(height * 0.55)));
  const extra = alternatives.filter(place => !suggestions.some(item => item.venue.id === place.id));
  const selected = suggestions.find(({ venue }) => venue.id === selectedId);
  const place = selected?.venue ?? extra.find(venue => venue.id === selectedId);
  const mapPlaces = suggestions.length ? suggestions.map(item => item.venue) : extra.filter(item => item.point).slice(0, 3);
  const pins: MapPin[] = friends.map(friend => ({
    kind: 'origin', point: friend.point, initials: friendInitials(friend.name),
    label: friend.name + (friend.approximate ? ' · Locality center' : ' · Starting point'),
  }));
  mapPlaces.forEach((venue, index) => {
    if (venue.point) pins.push({ kind: 'venue', point: venue.point, venueId: venue.id, number: index + 1,
      label: 'Open place ' + (index + 1) + ': ' + venue.name });
  });
  const close = () => setSelectedId(undefined);
  const select = async (id: string) => setSelectedId(id);

  function placeRow(venue: Venue) {
    const index = mapPlaces.findIndex(item => item.id === venue.id);
    return <Pressable key={venue.id} accessibilityRole="button" accessibilityLabel={'View details for ' + venue.name}
      onPress={() => setSelectedId(venue.id)} style={({ pressed }) => [layout.row, {
        minHeight: 56, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, gap: spacing.md,
        borderBottomWidth: 1, borderColor: palette.line, backgroundColor: pressed ? palette.lavender : 'transparent',
      }]}>
      <View style={{ width: 30, height: 30, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lavender }}>
        {index >= 0 ? <Label kind="label">{index + 1}</Label> : <Icon name="map-pin" size={15} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}><Label kind="value">{venue.name}</Label>
        <Label kind="detail">{[venue.category, venue.area].filter(Boolean).join(' · ')}</Label></View>
      <Icon name="chevron-right" size={17} color={palette.muted} />
    </Pressable>;
  }

  const detail = place && <EditorDialog key={place.id} title={place.name} close={close}>
    <Label kind="detail">{[place.category, selected?.address, place.area].filter(Boolean).join(' · ')}</Label>
    {place.point && friends.length > 0 && <VenueDistances friends={friends}
      distances={selected?.distances ?? friends.map(friend => directDistance(friend.point, place.point!))} />}
    {actions(place, close)}
    {place.point && <GoogleMapsLink point={place.point} />}
  </EditorDialog>;

  if (navigation.expanded) return <FullscreenPlaceMap navigation={navigation} pins={pins} select={select} detail={detail}>
    {(suggestions.length > 0 || extra.length > 0) && <PlaceListTray count={suggestions.length + extra.length}
      places={[...suggestions.map(item => placeRow(item.venue)), ...extra.map(placeRow)]} />}
  </FullscreenPlaceMap>;

  const map = <View style={{ gap: spacing.sm }}>
    <View style={{ borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: palette.line }}>
      <PlaceMap viewportHeight={mapHeight} pins={pins} onSelectVenue={select} onExpand={async () => navigation.setExpanded(true)}
        dom={{ style: { height: mapHeight }, scrollEnabled: false, applicationNameForUserAgent: 'Barkits/0.1' }} />
    </View>
    {friends.length > 0 && <Label kind="caption">Initials show where each friend starts. Numbers mark places.</Label>}
  </View>;
  const list = <View style={{ gap: spacing.sm }}>
    {filters}
    {suggestions.map(item => placeRow(item.venue))}
    {extra.length > 0 && <>
      <Button secondary expanded={more} onPress={() => setMore(!more)}>{more ? 'Fewer places' : 'More places (' + extra.length + ')'}</Button>
      {more && extra.map(placeRow)}
    </>}
  </View>;

  if (!browser) return <View style={{ gap: spacing.sm }}>{map}{list}{detail}</View>;
  const extraVisible = browser.view === browser.extra.id;
  const browseContent = extraVisible ? browser.extra.render([...suggestions.map(item => item.venue), ...extra], setSelectedId) : list;
  return <View style={layout.stack}>
    <View role="navigation" accessibilityLabel="Where views" style={layout.wrap}>
      {!wide && <Chip selected={browser.view === 'map'} onPress={() => browser.change('map')}>Map</Chip>}
      <Chip selected={browser.view === 'places' || (wide && !extraVisible)} onPress={() => browser.change('places')}>Places</Chip>
      <Chip selected={extraVisible} onPress={() => browser.change(browser.extra.id)}>{browser.extra.label}</Chip>
    </View>
    {wide ? <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl }}>
      <View style={{ flex: 1.35, minWidth: 0 }}>{map}</View>
      <View style={{ flex: 1, minWidth: 0 }}>{browseContent}</View>
    </View> : <>
      {browser.view === 'map' && map}
      {browseContent}
    </>}
    {detail}
  </View>;
}
