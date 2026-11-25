import { ParticipantRoster } from './participant-roster';
import { SuggestedPlaces } from './suggested-places';
import { IconAction, ChoiceField } from './form-controls';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { activityCategory, categories, type Category, discover } from './discovery';
import { ParticipantEditor } from './editor';
import { GoogleMapsLink } from './google-maps-link';
import { locateFriends } from './locate-friends';
import { PlanningMap } from './planning-map';
import { getShared, saveOwnTrip, shortlistPlace } from './services/shared-meetups';
import { SharedMemories } from './shared-memories';
import { finishMeetup } from './services/shared-memories';
import { WorkspaceColumns, StatusMark } from './workspace-layout';
import { SharedBallot } from './shared-ballot';
import { ConfirmedPlaceMap } from './confirmed-place-map';
import { InviteFriend } from './invite-friend';
import { Button, Label, layout, Panel } from './ui';
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
  const planning = data?.summary.status === 'planning';
  const [confirmEnd,setConfirmEnd] = useState(false);
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
  const [fullMap, setFullMap] = useState<boolean>();
  const openMapOnEntry = suggestions.length > 0 || (data?.summary.status === 'decided' && !!chosen);
  useEffect(() => {
    if (data && fullMap === undefined) setFullMap(openMapOnEntry);
  }, [data, fullMap, openMapOnEntry]);
  const startTime = data?.summary.starts_at;
  const schedule = startTime ? new Date(startTime).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) + ' · Philippine time' : undefined;
  const limited = data?.members.some(m => m.trip?.budget !== undefined || m.trip?.maxMinutes !== undefined);
  const archiving = data?.summary.status === 'completed';
  const lifecycle = <View style={layout.stack}>
    {confirmEnd ? <><Label>{archiving ? 'Archive this meetup? Members can still read the recaps.' : 'Mark this meetup completed? Members can then write a recap or leave a rating.'}</Label>
      <View style={layout.wrap}><Button disabled={acting || loading} onPress={async () => {
        if (await run(() => finishMeetup(id,archiving ? 'archived' : 'completed'))) setConfirmEnd(false);
      }}>{archiving ? 'Confirm archive' : 'Confirm completion'}</Button><Button secondary onPress={() => setConfirmEnd(false)}>Cancel</Button></View></> :
      <Button secondary={archiving} icon={archiving ? 'archive' : 'check'} onPress={() => setConfirmEnd(true)}>{archiving ? 'Archive meetup' : 'Mark completed'}</Button>}
  </View>;
  return <>
    <View style={layout.wrap}><Button quiet onPress={back} icon="arrow-left">Back to meetups</Button>
      <IconAction disabled={loading} onPress={refresh} name="refresh-cw" label="Refresh group" /></View>
    {loading && <Label>Loading group…</Label>}{!!error && <Label>{error}</Label>}
    {!!actionError && <View accessibilityRole="alert"><Label>{actionError}</Label></View>}
    {data && <>
      <View style={layout.stack}><Label kind="page" heading>{data.summary.name}</Label><StatusMark status={data.summary.status} /></View>
      {!!data.summary.activity && <Label>{data.summary.activity}</Label>}
      {!!schedule && <Label>{schedule}</Label>}
      {!!data.summary.description && <Label>{data.summary.description}</Label>}
      {chosen && !data.memories && <Panel><Label kind="item" heading>Meet at {chosen.name}</Label>
        <Label>Confirmed by the organizer · voting closed</Label>
        <View style={layout.wrap}><GoogleMapsLink point={[chosen.latitude, chosen.longitude]} />
          <Button secondary onPress={() => setFullMap(true)}>View venue map</Button></View>
        {data.summary.owner_id === userId && data.summary.status === 'decided' && lifecycle}
        {(fullMap ?? openMapOnEntry) && <ConfirmedPlaceMap name={chosen.name} point={[chosen.latitude, chosen.longitude]} schedule={schedule}
          navigation={{ title: data.summary.name, expanded: true, setExpanded: setFullMap, back }} />}
      </Panel>}
      {!data.memories && <WorkspaceColumns sideFirst={planning && !origins.some(friend => friend.id === userId)} side={<>
      <ParticipantRoster members={data.members} located={origins} myId={userId} ownerId={data.summary.owner_id}
        action={planning && mine && <Button secondary={!!mine.trip && origins.some(friend => friend.id === userId)}
          onPress={() => setEditing(true)} icon="map-pin">{mine.trip ? 'Edit my starting point' : 'Add my starting point'}</Button>} />
      {planning && data.summary.owner_id === userId && <InviteFriend id={id} />}
      </>} main={<>{planning && <>
      <Panel><Label kind="section" heading>Nearby places</Label>
        {allLocated ? <>
          <ChoiceField label="Type of place" value={category} options={categories.map(value => ({ value, label: value }))} change={setFilter} />
          {!suggestions.length && <Label>No matching venues within 50 km of everyone. Try another category.</Label>}
          <SuggestedPlaces navigation={{ title: data.summary.name, expanded: fullMap ?? true, setExpanded: setFullMap, back }} suggestions={suggestions} friends={origins} actions={venue =>
            data.summary.ballot.some(c => c.place.catalog_key === venue.id) ? <Label>On the group shortlist</Label> :
              <Button disabled={acting || loading} onPress={() => run(() => shortlistPlace(id, venue))}>Add to shortlist</Button>
          } />
          <Label kind="detail">Ranked by straight-line distance from the group’s starting points.{limited ? ' Travel time and fare limits still need a route estimate.' : ''}</Label>
          {!!suggestions.length && <Label size={13}>Venue data © OpenStreetMap contributors</Label>}
        </> : <Label>Nearby suggestions appear once each member has a starting point on the map.</Label>}
      </Panel>
      <SharedBallot id={id} ballot={data.summary.ballot} members={data.members} userId={userId} owner={data.summary.owner_id === userId}
        busy={acting || loading} run={run} refresh={refresh} />
      {!!origins.length && !suggestions.length && <PlanningMap origins={origins} places={suggestions.map(s => s.venue)} />}
      {editing && mine && <ParticipantEditor member={mine} participant={mine.trip} close={() => setEditing(false)}
        saveTrip={async trip => { await saveOwnTrip(id, trip); setEditing(false); refresh(); }} />}
      </>}{!planning && chosen && <Label>The venue is confirmed. After the meetup, the organizer can mark it completed.</Label>}</>} />}
      {data.memories && <SharedMemories id={id} userId={userId} venue={chosen?.name ?? data.summary.name} point={chosen ? [chosen.latitude,chosen.longitude] : undefined} members={data.members}
        archived={data.summary.status === 'archived'} data={data.memories} refresh={refresh} run={run} busy={acting || loading}
        archiveAction={data.summary.status === 'completed' && data.summary.owner_id === userId ? lifecycle : undefined} />}
    </>}
  </>;
}
