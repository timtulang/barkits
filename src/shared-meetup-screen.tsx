import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { activityCategory, categories, type Category, discover } from './discovery';
import { ParticipantEditor } from './editor';
import { GoogleMapsLink } from './google-maps-link';
import { locateFriends } from './locate-friends';
import { PlanningMap } from './planning-map';
import { getShared, saveOwnTrip } from './services/shared-meetups';
import { InviteFriend } from './shared-membership';
import { Button, Chip, Label, layout, Panel } from './ui';
import { useSharedData } from './use-shared-data';
import { catalog } from './venue-catalog';

export function SharedMeetupScreen({ id, userId, back }: { id: string; userId: string; back: () => void }) {
  const load = useCallback(() => getShared(id), [id]);
  const { data, loading, error, refresh } = useSharedData(load);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Category>();
  const mine = data?.members.find(m => m.id === userId);
  const category = filter ?? activityCategory(data?.summary.activity ?? '');
  const origins = useMemo(() => locateFriends(data?.members.flatMap(m => m.trip ? [m.trip] : []) ?? []), [data]);
  const allLocated = Boolean(origins.length && origins.length === data?.members.length);
  const suggestions = useMemo(() => allLocated ? discover(origins, category, catalog) : [], [allLocated, category, origins]);
  const limited = data?.members.some(m => m.trip?.budget !== undefined || m.trip?.maxMinutes !== undefined);
  return <>
    <View style={layout.wrap}><Button secondary onPress={back} icon="arrow-left">Back to meetups</Button>
      <Button secondary disabled={loading} onPress={refresh} icon="refresh-cw">Refresh group</Button></View>
    {loading && <Label>Loading group…</Label>}{!!error && <Label>{error}</Label>}
    {data && <>
      <Label size={30} weight="title" heading>{data.summary.name}</Label>
      {!!data.summary.activity && <Label>{data.summary.activity}</Label>}
      {!!data.summary.starts_at && <Label>{new Date(data.summary.starts_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })} · Philippine time</Label>}
      {!!data.summary.description && <Label>{data.summary.description}</Label>}
      <Panel><Label size={20} weight="title">Friends ({data.members.length})</Label>
        {data.members.map(m => <View key={m.id}><Label weight="bold">{m.name}{m.id === userId ? ' (you)' : ''}{m.id === data.summary.owner_id ? ' · Organizer' : ''}</Label>
          <Label>{m.trip ? m.trip.origin + ' · ' + m.trip.mode : 'Starting point pending'}</Label></View>)}
        {mine && <Button onPress={() => setEditing(true)} icon="map-pin">{mine.trip ? 'Edit my starting point' : 'Add my starting point'}</Button>}
      </Panel>
      {data.summary.owner_id === userId && <InviteFriend id={id} />}
      <Panel><Label size={20} weight="title">Nearby places</Label>
        {allLocated ? <>
          <View style={layout.wrap}>{categories.map(c => <Chip key={c} selected={c === category} onPress={() => setFilter(c)}>{c}</Chip>)}</View>
          <Label>Ranked by straight-line distance from the group’s starting points.{limited ? ' Travel time and fare limits still need a route estimate.' : ''}</Label>
          {!suggestions.length && <Label>No matching venues within 50 km of everyone. Try another category.</Label>}
          {suggestions.map(({ venue, distances }) => <View key={venue.id} style={layout.stack}>
            <Label weight="bold">{venue.name} · {venue.area}</Label>
            {origins.map((o, i) => <Label key={o.id}>{o.name} · {distances[i].toFixed(1)} km{o.approximate ? ' from locality center' : ''}</Label>)}
            {venue.point && <GoogleMapsLink point={venue.point} />}
          </View>)}
          {!!suggestions.length && <Label size={13}>Venue data © OpenStreetMap contributors</Label>}
        </> : <Label>Choose a place from search or drop a pin for everyone to get suggestions. {origins.length} of {data.members.length} starting points ready.</Label>}
      </Panel>
      {!!origins.length && <PlanningMap origins={origins} places={suggestions.map(s => s.venue)} />}
      {editing && mine && <ParticipantEditor member={mine} participant={mine.trip} close={() => setEditing(false)}
        saveTrip={async trip => { await saveOwnTrip(id, trip); setEditing(false); refresh(); }} />}
    </>}
  </>;
}
