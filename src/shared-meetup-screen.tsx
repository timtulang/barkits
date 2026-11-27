import type { RenderWorkspace } from './app-shell';
import { DestinationReview, PlanningVotes } from './destination-review';
import { sharedLimitIssues } from './destination-eligibility';
import { TripComparison } from './trip-comparison';
import { sharedTripRows } from './trip-evidence';
import { PlanningJourney, PlanningReview, PlanningStepActions } from './planning-journey';
import { initialPlanningStage, peopleProgress, type PlanningStage } from './planning-progress';
import { formatSharedSchedule } from './meetup-schedule';
import { ParticipantRoster } from './participant-roster';
import { SuggestedPlaces } from './suggested-places';
import { IconAction, ChoiceField } from './form-controls';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { activityCategory, categories, type Category, discover } from './discovery';
import { ParticipantEditor } from './editor';
import { GoogleMapsLink } from './google-maps-link';
import { locateFriends } from './locate-friends';
import { finalizeShared, getShared, saveOwnTrip, shortlistPlace } from './services/shared-meetups';
import { SharedMemories } from './shared-memories';
import { finishMeetup } from './services/shared-memories';
import { StatusMark } from './workspace-layout';
import { SharedBallot } from './shared-ballot';
import { ConfirmedPlaceMap } from './confirmed-place-map';
import { InviteFriend } from './invite-friend';
import { Button, Feedback, Label, layout, Panel } from './ui';
import { useSharedData } from './use-shared-data';
import { catalog } from './venue-catalog';

export function SharedMeetupScreen({ id, userId, back, scrollToTop, frame }: { frame: RenderWorkspace; id: string; userId: string; back: () => void; scrollToTop: () => void }) {
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
  const [proposedId, setProposedId] = useState<string>();
  const proposed = data?.summary.ballot.find(candidate => candidate.venue_id === proposedId);
  const proposalIssues = proposed ? data!.members.map(member => sharedLimitIssues(member, proposed.estimates.find(estimate => estimate.user_id === member.id))).filter(Boolean) : [];
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
  function changeStage(next: PlanningStage) {
    Keyboard.dismiss();
    setStage(next); setFullMap(false); requestAnimationFrame(scrollToTop);
  }
  useEffect(() => {
    if (data?.summary.status === 'decided') { setStage('review'); setFullMap(false); }
  }, [data?.summary.status]);
  function openShortlist() {
    setSection('shortlist');
    changeStage('where');
  }
  const plannerBusy = acting || loading || !!error;
  const refreshError = !!error && <Feedback tone="error" title="Couldn’t refresh the group"
    action={<Button secondary onPress={refresh}>Try again</Button>}>{error}</Feedback>;
  const startTime = data?.summary.starts_at;
  const schedule = startTime ? formatSharedSchedule(startTime) : undefined;
  const archiving = data?.summary.status === 'completed';
  const lifecycle = <View style={layout.stack}>
    {confirmEnd ? <><Label>{archiving ? 'Archive this meetup? Members can still read the recaps.' : 'Mark this meetup completed? Members can then write a recap or leave a rating.'}</Label>
      <View style={layout.wrap}><Button disabled={acting || loading} onPress={async () => {
        if (await run(() => finishMeetup(id,archiving ? 'archived' : 'completed'))) setConfirmEnd(false);
      }}>{archiving ? 'Confirm archive' : 'Confirm completion'}</Button><Button secondary onPress={() => setConfirmEnd(false)}>Cancel</Button></View></> :
      <Button secondary={archiving} icon={archiving ? 'archive' : 'check'} onPress={() => setConfirmEnd(true)}>{archiving ? 'Archive meetup' : 'Mark completed'}</Button>}
  </View>;
  const blocked = error ? 'Refresh the group before confirming.' : proposalIssues.length ? proposalIssues.join('. ') : undefined;
  const confirm = stage === 'review' && planning && proposed && data?.summary.owner_id === userId ? async () => {
    if (!plannerBusy && !proposalIssues.length && await run(() => finalizeShared(id, proposed.venue_id))) setProposedId(undefined);
  } : undefined;
  const footer = data && !data.memories && <PlanningStepActions stage={stage} change={changeStage}
    selection={stage === 'where' ? proposed?.place.name : undefined}
    onNext={confirm} disabled={!!confirm && !!blocked} busy={!!confirm && (acting || loading)} />;
  return frame(<>
    <View style={layout.wrap}><Button quiet onPress={back} icon="arrow-left">Back to meetups</Button>
      <IconAction disabled={loading} onPress={refresh} name="refresh-cw" label="Refresh group" /></View>
    {loading && <Label>Loading group…</Label>}{refreshError}
    {!!actionError && <View accessibilityRole="alert"><Label>{actionError}</Label></View>}
    {data && <>
      <View style={layout.wrap}><View style={{ flexGrow: 1, flexBasis: 144, minWidth: 0 }}><Label kind={data.memories ? 'page' : 'item'} heading>{data.summary.name}</Label></View><StatusMark status={data.summary.status} /></View>
      {!!data.summary.activity && !!data.memories && <Label>{data.summary.activity}</Label>}
      {!!schedule && !!data.memories && <Label>{schedule}</Label>}
      {!!data.summary.description && !!data.memories && <Label>{data.summary.description}</Label>}
      {!data.memories && <PlanningJourney current={stage} change={changeStage} people={peopleProgress(data.members.length, origins.length)}
        scheduled={!!schedule} destination={!!chosen} saved={acting ? 'Saving changes to the group…' : loading ? 'Refreshing group…' :
          error ? 'Group data may be out of date. Refresh before continuing.' : undefined}>
      <View style={{ display: stage === 'who' ? 'flex' : 'none', gap: 16 }}>
      <ParticipantRoster members={data.members} located={origins} myId={userId} ownerId={data.summary.owner_id}
        action={planning && mine && <Button secondary onPress={() => setEditing(true)} icon="map-pin">{mine.trip ? 'Edit my start' : 'Add my start'}</Button>} />
      {planning && data.summary.owner_id === userId && <InviteFriend id={id} />}
      </View>
      {stage === 'when' && <Panel>
        <Label kind="value">{schedule || 'Date and time undecided'}</Label>
        <Label kind="detail">The organizer can set a time when creating the meetup.</Label>
      </Panel>}
      {stage === 'review' && <>
        <PlanningReview people={data.members.length} mapped={origins.length} schedule={schedule}
          activity={data.summary.activity} description={data.summary.description}
          pending={planning ? proposed?.place.name : undefined} destination={chosen?.name} change={changeStage} canEdit={planning} />
        {planning && proposed && data.summary.owner_id === userId && <DestinationReview name={proposed.place.name} blocked={blocked}>
          <TripComparison rows={sharedTripRows(data.members, proposed.estimates)} editableIds={mine?.trip ? [userId] : []}
            edit={() => { changeStage('where'); setSection('shortlist'); }} />
        </DestinationReview>}
        {planning && data.summary.owner_id !== userId && <Label kind="detail">The organizer confirms the place.</Label>}
        <PlanningVotes people={data.members} choices={data.summary.ballot.map(candidate => ({
          id: candidate.venue_id, name: candidate.place.name, voters: candidate.votes.map(vote => vote.user_id),
        }))} />
      </>}
      {chosen && !data.memories && (stage === 'review' || stage === 'where') && <Panel><Label kind="item" heading>Meet at {chosen.name}</Label>
        <Label>Confirmed by the organizer · voting closed</Label>
        <View style={layout.wrap}><GoogleMapsLink point={[chosen.latitude, chosen.longitude]} />
          <Button secondary onPress={() => setFullMap(true)}>View venue map</Button></View>
        {data.summary.owner_id === userId && data.summary.status === 'decided' && lifecycle}
        {fullMap && <ConfirmedPlaceMap name={chosen.name} point={[chosen.latitude, chosen.longitude]} schedule={schedule}
          navigation={{ title: data.summary.name, expanded: true, setExpanded: setFullMap, back }} />}
      </Panel>}
      <View style={{ display: stage === 'where' ? 'flex' : 'none', gap: 16 }}>{planning && <>
      {stage === 'where' && section === 'nearby' && <SuggestedPlaces
        navigation={{ title: data.summary.name, expanded: fullMap, setExpanded: setFullMap, back }}
        suggestions={suggestions} friends={origins}
        filters={<View style={layout.stack}>
          {!allLocated && <Label kind="detail">Suggestions appear once everyone adds a start.</Label>}
          {allLocated && !suggestions.length && <Label kind="detail">No nearby matches. Try a different type of place.</Label>}
          <View style={layout.wrap}>
            <View style={{ flexGrow: 1, flexBasis: 140, minWidth: 0 }}>
              <ChoiceField label="Type of place" value={category} options={categories.map(value => ({ value, label: value }))} change={setFilter} />
            </View>
            <View style={{ alignSelf: 'flex-end' }}><Button secondary onPress={openShortlist}>Shortlist ({data.summary.ballot.length})</Button></View>
          </View>
        </View>}
        actions={(venue, close) => <>
          {data.summary.ballot.some(c => c.place.catalog_key === venue.id) ?
            <Button onPress={() => { close(); openShortlist(); }}>Shortlist</Button> :
            <Button disabled={plannerBusy} onPress={() => run(() => shortlistPlace(id, venue))}>Shortlist place</Button>}
          {!!actionError && <Feedback tone="error">{actionError}</Feedback>}
          {refreshError}
        </>} />}
      <View style={{ display: section === 'shortlist' ? 'flex' : 'none', gap: 16 }}>
        <Button secondary icon="map" onPress={() => { setSection('nearby'); changeStage('where'); }}>Map</Button>
        <SharedBallot id={id} ballot={data.summary.ballot} members={data.members} userId={userId}
          owner={data.summary.owner_id === userId} busy={plannerBusy} run={run} refresh={refresh} browse={() => setSection('nearby')}
          editStartingPoint={() => { changeStage('who'); setEditing(true); }}
          selected={proposedId} selectCandidate={candidate => { if (data.summary.owner_id === userId) setProposedId(candidate.venue_id); }} />
      </View>
      </>}{!planning && chosen && <Label>The venue is confirmed. After the meetup, the organizer can mark it completed.</Label>}</View>
      {planning && editing && mine && <ParticipantEditor member={mine} participant={mine.trip} close={() => setEditing(false)}
        saveTrip={async trip => { await saveOwnTrip(id, trip); setEditing(false); refresh(); }} />}
      </PlanningJourney>}
      {data.memories && <SharedMemories id={id} userId={userId} venue={chosen?.name ?? data.summary.name} point={chosen ? [chosen.latitude,chosen.longitude] : undefined} members={data.members}
        archived={data.summary.status === 'archived'} data={data.memories} refresh={refresh} run={run} busy={acting || loading}
        archiveAction={data.summary.status === 'completed' && data.summary.owner_id === userId ? lifecycle : undefined} />}
    </>}
  </>, footer);
}
