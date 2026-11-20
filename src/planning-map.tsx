import { useState } from 'react';
import { Meetup, venues } from './planner';
import PlaceMap, { MapPin } from './place-map';
import { Button, Label, Panel } from './ui';

export function PlanningMap({ meetup }: { meetup: Meetup }) {
  const [open, setOpen] = useState(false);
  const pins: MapPin[] = [];
  for (const friend of meetup.participants) {
    if (friend.point) pins.push({ point: friend.point, label: friend.name + ' · Starting point', kind: 'origin' });
  }
  for (const venue of [...venues, ...meetup.customVenues ?? []]) {
    if (venue.point) pins.push({ point: venue.point, label: venue.name + ' · Meeting place', kind: 'venue' });
  }
  return <Panel>
    <Button secondary icon="map" onPress={() => setOpen(!open)}>{open ? 'Hide group map' : 'Show group map'}</Button>
    {open && <><Label size={13}>Coral dots show pinned starting points. Purple squares show meeting places. Select a marker for its name.</Label>
      <PlaceMap pins={pins} dom={{ style: { height: 275 }, applicationNameForUserAgent: 'Barkits/0.1' }} />
    </>}
  </Panel>;
}
