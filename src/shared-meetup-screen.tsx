import type { RenderWorkspace } from './app-shell';
import { ConfirmedPlaceMap } from './confirmed-place-map';
import { sharedLimitIssues } from './destination-eligibility';
import { DestinationReview, PlanningVotes } from './destination-review';
import { activityCategory, categories, type Category, discover } from './discovery';
import { ParticipantEditor } from './editor';
import { ChoiceField, IconAction } from './form-controls';
import { InviteFriend } from './invite-friend';
import { locateFriends } from './locate-friends';
import { LifecycleAction, MeetupArrival } from './meetup-arrival';
import { formatSharedSchedule } from './meetup-schedule';
import { useNewMilestone } from './motion-feedback';
import { ParticipantRoster } from './participant-roster';
import { PlanningJourney, PlanningReview, PlanningStepActions } from './planning-journey';
import { initialPlanningStage, type PlanningStage } from './planning-progress';
import { finalizeShared, getShared, saveOwnTrip, shortlistPlace } from './services/shared-meetups';
import { finishMeetup } from './services/shared-memories';
import { SharedBallot } from './shared-ballot';
import { SharedMemories } from './shared-memories';
import { SuggestedPlaces, type PlaceBrowseView } from './suggested-places';
import { spacing } from './theme';
import { TripComparison } from './trip-comparison';
import { sharedTripRows } from './trip-evidence';
import { Button, Feedback, Label, layout, LoadingState, Panel } from './ui';
import { useSharedData } from './use-shared-data';
import { catalog } from './venue-catalog';
import { StatusMark, WorkspaceColumns } from './workspace-layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';

export function SharedMeetupScreen({ id, userId, back, scrollToTop, frame }: {
  id: string; userId: string; back: () => void; scrollToTop: () => void; frame: RenderWorkspace;
}) {
  const load = useCallback(() => getShared(id), [id]);
  const { data, loading, error, refresh } = useSharedData(load);
  const [editing, setEditing] = useState(false);
  const [estimateId, setEstimateId] = useState<string>();
  const [view, setView] = useState<PlaceBrowseView>('map');
  const [filter, setFilter] = useState<Category>();
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [fullMap, setFullMap] = useState(false);
  const [selectedStage, setStage] = useState<PlanningStage>();
  const [proposedId, setProposedId] = useState<string>();
  const pending = useRef(false);

  const summary = data?.summary;
  const celebrate = useNewMilestone(summary ? summary.status === 'completed' : undefined);
  const members = data?.members;
  const mine = members?.find(member => member.id === userId);
  const owner = summary?.owner_id === userId;
  const planning = summary?.status === 'planning';
  const chosen = summary?.chosen;
  const proposed = summary?.ballot.find(candidate => candidate.venue_id === proposedId);
  const category = filter ?? activityCategory(summary?.activity ?? '');
  const origins = useMemo(() => locateFriends(members?.flatMap(member => member.trip ? [member.trip] : []) ?? []), [members]);
  const allLocated = Boolean(origins.length && origins.length === members?.length);
  const suggestions = useMemo(() => planning && allLocated ? discover(origins, category, catalog) : [], [planning, allLocated, category, origins]);
  const stage = selectedStage ?? (summary ? initialPlanningStage(summary.status, members?.length ?? 0, origins.length) : 'who');

  useEffect(() => {
    if (summary && selectedStage === undefined) setStage(initialPlanningStage(summary.status, members?.length ?? 0, origins.length));
  }, [summary, selectedStage, members?.length, origins.length]);
  useEffect(() => {
    if (summary?.status === 'decided') { setStage('review'); setFullMap(false); }
    if (summary && ['decided', 'completed', 'archived'].includes(summary.status)) requestAnimationFrame(scrollToTop);
  }, [summary?.status]);

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

  function changeStage(next: PlanningStage) {
    Keyboard.dismiss();
    setStage(next);
    setFullMap(false);
    requestAnimationFrame(scrollToTop);
  }

  function openShortlist() {
    setView('shortlist');
    changeStage('where');
  }

  const busy = acting || loading || !!error;
  const refreshError = !!error && <Feedback tone="error" title="Couldn’t refresh the group"
    action={<Button secondary onPress={refresh}>Try again</Button>}>{error}</Feedback>;
  if (!data || !summary) return frame(<>
    <Button quiet onPress={back} icon="arrow-left">Back to meetups</Button>
    {loading && <LoadingState label="Loading group…" />}
    {refreshError}
  </>);

  const schedule = summary.starts_at ? formatSharedSchedule(summary.starts_at) : undefined;
  const navigation = { title: summary.name, expanded: fullMap, setExpanded: setFullMap, back };
  const proposalIssues = proposed ? data.members.map(member => sharedLimitIssues(member, proposed.estimates.find(estimate => estimate.user_id === member.id))).filter(Boolean) : [];
  const actionFeedback = !!actionError && <Feedback tone="error">{actionError}</Feedback>;
  const reviewingProposal = stage === 'review' && planning && proposed && owner;
  const blocked = error ? 'Refresh the group before confirming.' : proposalIssues.length ? proposalIssues.join('. ') : undefined;
  const confirm = stage === 'review' && planning && proposed && owner ? async () => {
    if (!busy && !proposalIssues.length && await run(() => finalizeShared(id, proposed.venue_id))) setProposedId(undefined);
  } : undefined;
  const footer = !data.memories && <PlanningStepActions stage={stage} change={changeStage}
    selection={stage === 'where' ? proposed?.place.name : undefined}
    onNext={confirm} disabled={!!confirm && !!blocked} busy={!!confirm && (acting || loading)} />;

  const roster = <ParticipantRoster members={data.members} located={origins} myId={userId} ownerId={summary.owner_id}
    action={planning && mine && <Button secondary={!!mine.trip} disabled={busy} onPress={() => setEditing(true)} icon="map-pin">
      {mine.trip ? 'Edit my start' : 'Add my start'}
    </Button>} />;
  const arrival = chosen && <MeetupArrival name={chosen.name} point={[chosen.latitude, chosen.longitude]} onMap={() => setFullMap(true)}>
    {owner && summary.status === 'decided'
      ? <LifecycleAction shared busy={busy} run={() => run(() => finishMeetup(id, 'completed'))} />
      : <Label kind="detail">Voting is closed. The organizer can mark the meetup complete afterward.</Label>}
  </MeetupArrival>;
  const review = arrival || (planning && proposed && owner ?
    <DestinationReview name={proposed.place.name} prominent blocked={blocked}>
      {actionFeedback}
      <TripComparison rows={sharedTripRows(data.members, proposed.estimates)} editableIds={mine?.trip && !busy ? [userId] : []}
        edit={() => { setEstimateId(proposed.venue_id); openShortlist(); }} />
      <Button quiet icon="arrow-left" onPress={openShortlist}>Change place</Button>
    </DestinationReview> : <Panel>
      <Label kind="item" heading>{owner ? 'Choose a place to review' : 'The organizer confirms the place'}</Label>
      {!owner && <Label kind="detail">You can check trip estimates and change your vote in the shortlist.</Label>}
      <Button secondary onPress={openShortlist}>View shortlist</Button>
    </Panel>);

  return frame(<>
    <View style={layout.between}><Button quiet onPress={back} icon="arrow-left">Back to meetups</Button>
      <IconAction disabled={loading} onPress={refresh} name="refresh-cw" label="Refresh group" /></View>
    <View style={{ gap: spacing.sm }}>
      <View style={layout.wrap}><View style={{ flexGrow: 1, flexBasis: 144, minWidth: 0 }}>
        <Label kind="item" heading>{summary.name}</Label>
      </View><StatusMark status={summary.status} /></View>
      <Label kind="detail">Shared meetup · {owner ? 'You’re the organizer' : 'You’re a group member'}</Label>
    </View>
    {refreshError}
    {!reviewingProposal && actionFeedback}
    {!data.memories && <PlanningJourney current={stage} change={changeStage} people={data.members.length} mapped={origins.length}
      scheduled={!!schedule} destination={!!chosen} saveTone={error ? 'warning' : 'info'} saved={acting ? 'Saving changes to the group…' : loading ? 'Refreshing group…' :
        error ? 'Group data may be out of date.' : undefined}>
      <View style={{ display: stage === 'who' ? 'flex' : 'none' }}>
        {planning && owner ? <WorkspaceColumns main={roster} side={<InviteFriend id={id} />} sideFirst={!!mine?.trip} /> : roster}
      </View>
      {stage === 'when' && <Panel>
        <Label kind="value">{schedule || 'Date and time undecided'}</Label>
        {!schedule && <Label kind="detail">A shared meetup can continue without a set time.</Label>}
      </Panel>}
      {stage === 'review' && <WorkspaceColumns main={review} side={<>
        <PlanningReview heading="Meetup details" people={data.members.length} mapped={origins.length} schedule={schedule}
          activity={summary.activity} description={summary.description} change={changeStage} canEdit={planning} />
        <PlanningVotes people={data.members} choices={summary.ballot.map(candidate => ({
          id: candidate.venue_id, name: candidate.place.name, voters: candidate.votes.map(vote => vote.user_id),
        }))} />
      </>} />}
      {stage === 'where' && (planning ? <SuggestedPlaces navigation={navigation} suggestions={suggestions} friends={origins}
        browser={{ view, change: setView, extra: { id: 'shortlist', label: 'Shortlist (' + summary.ballot.length + ')',
          render: () => <SharedBallot id={id} ballot={summary.ballot} members={data.members} userId={userId}
            owner={owner} busy={busy} run={run} refresh={refresh} browse={() => setView('places')}
            editStartingPoint={() => { changeStage('who'); setEditing(true); }}
            estimateId={estimateId} editEstimate={setEstimateId} selected={proposedId}
            selectCandidate={candidate => { if (owner) setProposedId(candidate.venue_id); }} /> } }}
        filters={<View style={layout.stack}>
          {!allLocated && <Label kind="detail">Suggestions appear once everyone adds a start.</Label>}
          {allLocated && !suggestions.length && <Label kind="detail">No nearby matches. Try a different type of place.</Label>}
          <ChoiceField label="Type of place" value={category} options={categories.map(value => ({ value, label: value }))} change={setFilter} />
        </View>}
        actions={(venue, close) => <>
          {summary.ballot.some(candidate => candidate.place.catalog_key === venue.id) ?
            <Button onPress={() => { close(); openShortlist(); }}>View shortlist</Button> :
            <Button disabled={busy} onPress={async () => {
              if (await run(() => shortlistPlace(id, venue))) { close(); openShortlist(); }
            }}>Shortlist place</Button>}
          {!!actionError && <Feedback tone="error">{actionError}</Feedback>}
          {refreshError}
        </>} /> : arrival)}
      {planning && editing && mine && <ParticipantEditor member={mine} participant={mine.trip} close={() => setEditing(false)}
        saveTrip={async trip => { await saveOwnTrip(id, trip); setEditing(false); refresh(); }} />}
    </PlanningJourney>}
    {data.memories && <SharedMemories id={id} userId={userId} venue={chosen?.name} schedule={schedule}
      activity={summary.activity} description={summary.description} celebrate={celebrate}
      point={chosen ? [chosen.latitude, chosen.longitude] : undefined} members={data.members} archived={summary.status === 'archived'}
      data={data.memories} refresh={refresh} run={run} busy={busy}
      archiveAction={summary.status === 'completed' && owner ? <LifecycleAction archive shared busy={busy}
        run={() => run(() => finishMeetup(id, 'archived'))} /> : undefined} />}
    {fullMap && !planning && chosen && <ConfirmedPlaceMap name={chosen.name} point={[chosen.latitude, chosen.longitude]}
      schedule={schedule} navigation={navigation} />}
  </>, footer);
}
