import type { LocatedFriend } from './discovery';
import { useState } from 'react';
import { Meetup, Venue } from './planner';
import PlaceMap, { MapPin } from './place-map';
import { Button, Label, Panel } from './ui';

export function PlanningMap({ meetup, origins, places }: { meetup?: Pick<Meetup, 'customVenues'>; origins: LocatedFriend[]; places: Venue[] }) {
  const [open, setOpen] = useState(false);
  const pins: MapPin[] = [];
  for (const friend of origins) {
    if (friend.point) pins.push({ point: friend.point, label: friend.name + (friend.approximate ? ' · Locality center' : ' · Starting point'), kind: 'origin' });
  }
  const shown = new Map([...places, ...meetup?.customVenues ?? []].map(venue => [venue.id, venue]));
  for (const venue of shown.values()) {
    if (venue.point) pins.push({ point: venue.point, label: venue.name + ' · Meeting place', kind: 'venue' });
  }
  return <Panel>
    <Button secondary icon="map" onPress={() => setOpen(!open)}>{open ? 'Hide group map' : 'Show group map'}</Button>
    {open && <><Label size={13}>Coral dots show starting points. Purple pins show meeting places. Select a marker for its name.</Label>
      <PlaceMap pins={pins} dom={{ style: { height: 275 }, applicationNameForUserAgent: 'Barkits/0.1' }} />
    </>}
  </Panel>;
}
