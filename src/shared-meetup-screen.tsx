import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { activityCategory, categories, type Category, discover } from './discovery';
import { ParticipantEditor } from './editor';
import { GoogleMapsLink } from './google-maps-link';
import { locateFriends } from './locate-friends';
import { PlanningMap } from './planning-map';
import { getShared, saveOwnTrip, shortlistPlace } from './services/shared-meetups';
import { SharedBallot } from './shared-ballot';
import PlaceMap from './place-map';
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
  const [acting, setActing] = useState(false);
  const pending = useRef(false);
  const [actionError, setActionError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const planning = data?.summary.status === 'planning';
  const chosen = data?.summary.chosen;
  async function run(action: () => Promise<void>) {
    if (pending.current) return false;
    pending.current = true;
    setActing(true);
    setActionError('');
    try { await action(); refresh(); return true; }
    catch (problem) {
      setActionError(problem instanceof Error ? problem.message : 'Couldn’t update the group. Try again.');
      refresh();
      return false;
    } finally { pending.current = false; setActing(false); }
  }
  const category = filter ?? activityCategory(data?.summary.activity ?? '');
  const origins = useMemo(() => locateFriends(data?.members.flatMap(m => m.trip ? [m.trip] : []) ?? []), [data]);
  const allLocated = Boolean(origins.length && origins.length === data?.members.length);
  const suggestions = useMemo(() => planning && allLocated ? discover(origins, category, catalog) : [], [planning, allLocated, category, origins]);
  const limited = data?.members.some(m => m.trip?.budget !== undefined || m.trip?.maxMinutes !== undefined);
  return <>
    <View style={layout.wrap}><Button secondary onPress={back} icon="arrow-left">Back to meetups</Button>
      <Button secondary disabled={loading} onPress={refresh} icon="refresh-cw">Refresh group</Button></View>
    {loading && <Label>Loading group…</Label>}{!!error && <Label>{error}</Label>}
    {!!actionError && <View accessibilityRole="alert"><Label>{actionError}</Label></View>}
    {data && <>
      <Label size={30} weight="title" heading>{data.summary.name}</Label>
      {!!data.summary.activity && <Label>{data.summary.activity}</Label>}
      {!!data.summary.starts_at && <Label>{new Date(data.summary.starts_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })} · Philippine time</Label>}
      {!!data.summary.description && <Label>{data.summary.description}</Label>}
      {chosen && <Panel><Label size={22} weight="title" heading>Meet at {chosen.name}</Label>
        <Label>Confirmed by the organizer · voting closed</Label>
        <View style={layout.wrap}><GoogleMapsLink point={[chosen.latitude, chosen.longitude]} />
          <Button secondary onPress={() => setMapOpen(!mapOpen)}>{mapOpen ? 'Hide venue map' : 'View venue map'}</Button></View>
        {mapOpen && <PlaceMap point={[chosen.latitude, chosen.longitude]} dom={{ style: { height: 275 }, applicationNameForUserAgent: 'Barkits/0.1' }} />}
      </Panel>}
      <Panel><Label size={20} weight="title">Friends ({data.members.length})</Label>
        {data.members.map(m => <View key={m.id}><Label weight="bold">{m.name}{m.id === userId ? ' (you)' : ''}{m.id === data.summary.owner_id ? ' · Organizer' : ''}</Label>
          <Label>{m.trip ? m.trip.origin + ' · ' + m.trip.mode : 'Starting point pending'}</Label></View>)}
        {planning && mine && <Button onPress={() => setEditing(true)} icon="map-pin">{mine.trip ? 'Edit my starting point' : 'Add my starting point'}</Button>}
      </Panel>
      {planning && <>
      {data.summary.owner_id === userId && <InviteFriend id={id} />}
      <SharedBallot id={id} ballot={data.summary.ballot} members={data.members} userId={userId} owner={data.summary.owner_id === userId}
        busy={acting || loading} run={run} refresh={refresh} />
      <Panel><Label size={20} weight="title">Nearby places</Label>
        {allLocated ? <>
          <View style={layout.wrap}>{categories.map(c => <Chip key={c} selected={c === category} onPress={() => setFilter(c)}>{c}</Chip>)}</View>
          <Label>Ranked by straight-line distance from the group’s starting points.{limited ? ' Travel time and fare limits still need a route estimate.' : ''}</Label>
          {!suggestions.length && <Label>No matching venues within 50 km of everyone. Try another category.</Label>}
          {suggestions.map(({ venue, distances }) => <View key={venue.id} style={layout.stack}>
            <Label weight="bold">{venue.name} · {venue.area}</Label>
            {origins.map((o, i) => <Label key={o.id}>{o.name} · {distances[i].toFixed(1)} km{o.approximate ? ' from locality center' : ''}</Label>)}
            {data.summary.ballot.some(c => c.place.catalog_key === venue.id) ? <Label>On the group shortlist</Label> :
              <Button secondary disabled={acting || loading} onPress={() => run(() => shortlistPlace(id, venue))}>Add to shortlist</Button>}
            {venue.point && <GoogleMapsLink point={venue.point} />}
          </View>)}
          {!!suggestions.length && <Label size={13}>Venue data © OpenStreetMap contributors</Label>}
        </> : <Label>Choose a place from search or drop a pin for everyone to get suggestions. {origins.length} of {data.members.length} starting points ready.</Label>}
      </Panel>
      {!!origins.length && <PlanningMap origins={origins} places={suggestions.map(s => s.venue)} />}
      {editing && mine && <ParticipantEditor member={mine} participant={mine.trip} close={() => setEditing(false)}
        saveTrip={async trip => { await saveOwnTrip(id, trip); setEditing(false); refresh(); }} />}
      </>}
    </>}
  </>;
}
