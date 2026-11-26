import { PlanNavigation } from './plan-navigation';
import { PlanningJourney, PlanningReview } from './planning-journey';
import { initialPlanningStage, peopleProgress, type PlanningStage } from './planning-progress';
import { formatSharedSchedule } from './meetup-schedule';
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
import { StatusMark } from './workspace-layout';
import { SharedBallot } from './shared-ballot';
import { ConfirmedPlaceMap } from './confirmed-place-map';
import { InviteFriend } from './invite-friend';
import { Button, Feedback, Label, layout, Panel } from './ui';
import { useSharedData } from './use-shared-data';
import { catalog } from './venue-catalog';

export function SharedMeetupScreen({ id, userId, back, scrollToTop }: { id: string; userId: string; back: () => void; scrollToTop: () => void }) {
  const load = useCallback(() => getShared(id), [id]);
  const { data, loading, error, refresh } = useSharedData(load);
  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState<'nearby' | 'shortlist'>('nearby');
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
  const [fullMap, setFullMap] = useState(false);
  const [selectedStage, setStage] = useState<PlanningStage>();
  const stage = selectedStage ?? (data ? initialPlanningStage(data.summary.status, data.members.length, origins.length) : 'who');
  useEffect(() => {
    if (data && selectedStage === undefined) setStage(initialPlanningStage(data.summary.status, data.members.length, origins.length));
  }, [data, selectedStage, origins.length]);
  function changeStage(next: PlanningStage) { setStage(next); setFullMap(false); requestAnimationFrame(scrollToTop); }
  useEffect(() => {
    if (data?.summary.status === 'decided') { setStage('review'); setFullMap(false); }
  }, [data?.summary.status]);
  function openShortlist() {
    setFullMap(false);
    setSection('shortlist');
    setStage('where');
    requestAnimationFrame(scrollToTop);
  }
  const plannerBusy = acting || loading || !!error;
  const refreshError = !!error && <Feedback tone="error" title="Couldn’t refresh the group"
    action={<Button secondary onPress={refresh}>Try again</Button>}>{error}</Feedback>;
  const startTime = data?.summary.starts_at;
  const schedule = startTime ? formatSharedSchedule(startTime) : undefined;
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
    {loading && <Label>Loading group…</Label>}{refreshError}
    {!!actionError && <View accessibilityRole="alert"><Label>{actionError}</Label></View>}
    {data && <>
      <View style={layout.wrap}><View style={{ flexGrow: 1, flexBasis: 180 }}><Label kind={data.memories ? 'page' : 'item'} heading>{data.summary.name}</Label></View><StatusMark status={data.summary.status} /></View>
      {!!data.summary.activity && (stage === 'review' || !!data.memories) && <Label>{data.summary.activity}</Label>}
      {!!schedule && !!data.memories && <Label>{schedule}</Label>}
      {!!data.summary.description && (stage === 'review' || !!data.memories) && <Label>{data.summary.description}</Label>}
      {chosen && !data.memories && (stage === 'review' || stage === 'where') && <Panel><Label kind="item" heading>Meet at {chosen.name}</Label>
        <Label>Confirmed by the organizer · voting closed</Label>
        <View style={layout.wrap}><GoogleMapsLink point={[chosen.latitude, chosen.longitude]} />
          <Button secondary onPress={() => setFullMap(true)}>View venue map</Button></View>
        {data.summary.owner_id === userId && data.summary.status === 'decided' && lifecycle}
        {fullMap && <ConfirmedPlaceMap name={chosen.name} point={[chosen.latitude, chosen.longitude]} schedule={schedule}
          navigation={{ title: data.summary.name, expanded: true, setExpanded: setFullMap, back }} />}
      </Panel>}
      {!data.memories && <>
      <PlanningJourney current={stage} change={changeStage} people={peopleProgress(data.members.length, origins.length)}
        scheduled={!!schedule} destination={!!chosen} saved={acting ? 'Saving changes to the group…' : loading ? 'Refreshing group…' :
          error ? 'Group data may be out of date. Refresh before continuing.' : actionError ? 'The last change failed. See the error above.' :
          'Group loaded. Changes take effect after saving; use Refresh group for updates.'} />
      <View style={{ display: stage === 'who' ? 'flex' : 'none', gap: 16 }}>
      <Label kind="detail">Each member needs a mapped starting point for nearby suggestions. Members edit their own starting points, transport and optional limits.</Label>
      <ParticipantRoster members={data.members} located={origins} myId={userId} ownerId={data.summary.owner_id}
        action={<View style={layout.wrap}>{planning && mine && <Button secondary={!!mine.trip && origins.some(friend => friend.id === userId)}
          onPress={() => setEditing(true)} icon="map-pin">{mine.trip ? 'Edit my starting point' : 'Add my starting point'}</Button>}
          <Button secondary={!mine?.trip} onPress={() => changeStage('when')}>Review meetup time</Button></View>} />
      {planning && data.summary.owner_id === userId && <InviteFriend id={id} />}
      </View>
      {stage === 'when' && <Panel><Label kind="item" heading>Meetup time (optional)</Label>
        <Label>{schedule || 'Date and time undecided'}</Label>
        <Label kind="detail">The organizer sets the time when creating a shared meetup. Editing a shared schedule is not supported yet; you can still compare places.</Label>
        <Button onPress={() => changeStage(planning ? 'where' : 'review')}>{planning ? 'Choose meeting places' : 'Review confirmed plan'}</Button>
      </Panel>}
      {stage === 'review' && <PlanningReview people={data.members.length} mapped={origins.length} schedule={schedule}
        destination={chosen?.name} change={changeStage} canEdit={planning} />}
      <View style={{ display: stage === 'where' ? 'flex' : 'none', gap: 16 }}>{planning && <>
      <PlanNavigation current={section} change={setSection} sections={[
        { id: 'nearby', label: 'Explore places' }, { id: 'shortlist', label: 'Shortlist & vote (' + data.summary.ballot.length + ')' },
      ]} />
      {section === 'nearby' && <><Panel><Label kind="section" heading>Nearby places</Label>
        {allLocated ? <>
          <ChoiceField label="Type of place" value={category} options={categories.map(value => ({ value, label: value }))} change={setFilter} />
          {!suggestions.length && <Label>No matching venues within 50 km of everyone. Try another category.</Label>}
          <SuggestedPlaces navigation={{ title: data.summary.name, expanded: fullMap, setExpanded: setFullMap, back }} suggestions={suggestions} friends={origins} actions={venue => <>
            {data.summary.ballot.some(c => c.place.catalog_key === venue.id) ? <>
              <View accessibilityLiveRegion="polite"><Label kind="value">On the group shortlist</Label></View>
              <Button onPress={openShortlist}>View shortlist</Button>
            </> : <Button disabled={plannerBusy} onPress={() => run(() => shortlistPlace(id, venue))}>Add to shortlist</Button>}
            {!!actionError && <Feedback tone="error">{actionError}</Feedback>}
            {refreshError}
          </>} />
          <Label kind="detail">Ranked by straight-line distance from the group’s starting points.{limited ? ' Travel time and fare limits still need a route estimate.' : ''}</Label>
          {!!suggestions.length && <Label size={13}>Venue data © OpenStreetMap contributors</Label>}
        </> : <Label>Nearby suggestions appear once each member has a starting point on the map.</Label>}
      </Panel>
      {!!origins.length && !suggestions.length && <PlanningMap origins={origins} places={[]} />}
      </>}
      <View style={{ display: section === 'shortlist' ? 'flex' : 'none' }}><SharedBallot id={id} ballot={data.summary.ballot} members={data.members} userId={userId}
        owner={data.summary.owner_id === userId} busy={plannerBusy} run={run} refresh={refresh} browse={() => setSection('nearby')} /></View>
      <Button secondary onPress={() => changeStage('review')}>Review plan & what’s missing</Button>
      </>}{!planning && chosen && <Label>The venue is confirmed. After the meetup, the organizer can mark it completed.</Label>}</View>
      {planning && editing && mine && <ParticipantEditor member={mine} participant={mine.trip} close={() => setEditing(false)}
        saveTrip={async trip => { await saveOwnTrip(id, trip); setEditing(false); refresh(); }} />}
      </>}
      {data.memories && <SharedMemories id={id} userId={userId} venue={chosen?.name ?? data.summary.name} point={chosen ? [chosen.latitude,chosen.longitude] : undefined} members={data.members}
        archived={data.summary.status === 'archived'} data={data.memories} refresh={refresh} run={run} busy={acting || loading}
        archiveAction={data.summary.status === 'completed' && data.summary.owner_id === userId ? lifecycle : undefined} />}
    </>}
  </>;
}
