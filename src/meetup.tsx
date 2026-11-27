import type { RenderWorkspace } from './app-shell';
import { FriendPicker } from './friend-picker';
import { formatLocalSchedule } from './meetup-schedule';
import { ParticipantRoster } from './participant-roster';
import { canConfirmLocal } from './destination-eligibility';
import { DestinationReview, PlanningVotes } from './destination-review';
import { localTripRows } from './trip-evidence';
import { TripComparison } from './trip-comparison';
import { ChoiceField, IconAction } from './form-controls';
import { PlanningJourney, PlanningReview, PlanningStepActions } from './planning-journey';
import { PlanningSchedule } from './planning-schedule';
import { initialPlanningStage, type PlanningStage } from './planning-progress';
import { WorkspaceColumns, StatusMark } from './workspace-layout';
import { activityCategory, categories, Category, discover } from './discovery';
import { catalog } from './venue-catalog';
import { locateFriends } from './locate-friends';
import { NearbyPlaces } from './nearby-places';
import type { PlaceBrowseView } from './suggested-places';
import { TripPlanning } from './trip-planning';
import { ConfirmedPlaceMap } from './confirmed-place-map';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { LocalMemories } from './local-memories';
import { LifecycleAction, MeetupArrival } from './meetup-arrival';
import { Meetup, Participant, type Ranking, venues, retainPlace } from './planner';
import { spacing } from './theme';
import { Button, Label, layout, Panel } from './ui';

export function MeetupScreen({ meetup, save, editDetails, editFriend, back, scrollToTop, saveStatus, saveReady, reportDirty, frame }: {
  frame: RenderWorkspace;
  saveStatus: string; saveReady: boolean; reportDirty: (dirty: boolean) => void;
  scrollToTop: () => void; meetup: Meetup; save: (meetup: Meetup) => void; editDetails: () => void; editFriend: (friend?: Participant) => void; back: () => void;
}) {
  const [filter, setFilter] = useState<{ activity?: string; category: Category }>();
  const [tripTarget, setTripTarget] = useState<string>();
  const [placeView, setPlaceView] = useState<PlaceBrowseView>('map');
  const [ranking, setRanking] = useState<Ranking>('Balanced');
  const category = filter && filter.activity === meetup.activity ? filter.category : activityCategory(meetup.activity);
  const located = useMemo(() => locateFriends(meetup.participants), [meetup.participants]);
  const suggestions = useMemo(() => meetup.status === 'Planning' && located.length === meetup.participants.length ?
    discover(located, category, catalog) : [], [located, category, meetup.status, meetup.participants.length]);
  const venue = [...venues, ...meetup.customVenues ?? []].find(item => item.id === meetup.venue);
  const [proposedId, setProposedId] = useState<string>();
  const proposed = [...venues, ...meetup.customVenues ?? []].find(item => item.id === proposedId);
  function selectDestination(place: typeof venues[number]) {
    const updated = retainPlace(meetup, place);
    if (updated !== meetup) save(updated);
    setProposedId(place.id);
    setFullMap(false);
  }
  const [fullMap, setFullMap] = useState(false);
  const [stage, setStage] = useState<PlanningStage>(() => initialPlanningStage(meetup.status, meetup.participants.length, located.length));
  function changeStage(next: PlanningStage) {
    Keyboard.dismiss();
    if (next !== 'where') setTripEditorOpen(false);
    setStage(next); setFullMap(false); requestAnimationFrame(scrollToTop);
  }
  useEffect(() => {
    if (meetup.status === 'Decided') { setStage('review'); setFullMap(false); }
    if (['Decided', 'Completed', 'Archived'].includes(meetup.status)) requestAnimationFrame(scrollToTop);
  }, [meetup.status]);
  const scheduleEditor = useRef<{ advance: () => void }>(null);
  const [tripEditorOpen, setTripEditorOpen] = useState(false);
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [tripDirty, setTripDirty] = useState(false);
  const [recapDirty, setRecapDirty] = useState(false);
  useEffect(() => reportDirty(scheduleDirty || tripDirty || recapDirty), [scheduleDirty, tripDirty, recapDirty, reportDirty]);
  useEffect(() => () => reportDirty(false), [reportDirty]);
  const [voter, setVoter] = useState('');
  const currentVoter = meetup.participants.find(friend => friend.id === voter) ?? meetup.participants[0];
  const canEdit = meetup.status === 'Planning' || meetup.status === 'Draft';
  const finished = meetup.status === 'Completed' || meetup.status === 'Archived';
  function openTrip(id: string, person?: string) {
    setTripTarget(id);
    setTripEditorOpen(true);
    if (person) setVoter(person);
    changeStage('where');
  }
  const blocked = proposed && (scheduleDirty ? 'Save or clear your time edits.' :
    tripDirty ? 'Save or clear your trip edits.' :
    !saveReady ? 'Wait for the plan to save.' :
    !canConfirmLocal(meetup, proposed) ? 'Check the group’s trip estimates and limits.' : undefined);
  const confirm = stage === 'review' && proposed && meetup.status === 'Planning' ? () => {
    if (!blocked) save({ ...meetup, venue: proposed.id, status: 'Decided' });
  } : undefined;
  const footer = (canEdit || meetup.status === 'Decided') && <PlanningStepActions stage={stage} change={changeStage}
    selection={stage === 'where' && canEdit ? proposed?.name : undefined}
    onNext={stage === 'when' && canEdit ? () => scheduleEditor.current?.advance() : confirm}
    disabled={stage === 'who' && canEdit && !meetup.participants.length || stage === 'review' && !!blocked} />;
  const confirmedPlace = meetup.status === 'Decided' && venue &&
    <MeetupArrival name={venue.name} area={venue.area} point={venue.point} saved={saveReady} onMap={() => setFullMap(true)}>
      <LifecycleAction busy={!saveReady} run={() => { save({ ...meetup, status: 'Completed' }); return true; }} />
    </MeetupArrival>;
  const proposedPlace = proposed && meetup.status === 'Planning' && <DestinationReview name={proposed.name} area={proposed.area} prominent blocked={blocked}>
    <TripComparison rows={localTripRows(meetup, proposed)} editableIds={meetup.participants.map(person => person.id)}
      edit={person => openTrip(proposed.id, person)} changeTransport={id => editFriend(meetup.participants.find(person => person.id === id))} />
    <Button quiet icon="arrow-left" onPress={() => changeStage('where')}>Change place</Button>
  </DestinationReview>;
  return frame(<>
    <View style={{ gap: 6 }}>
      <View style={layout.between}>
        <Button quiet onPress={back} icon="arrow-left">Back to meetups</Button>
        {canEdit && <IconAction name="edit-2" label="Edit meetup details" onPress={editDetails} />}
      </View>
      <View style={layout.wrap}><View style={{ flexGrow: 1, flexBasis: 144, minWidth: 0 }}><Label kind="item" heading>{meetup.name}</Label></View>
        <StatusMark status={meetup.status} /></View>
    </View>
    {(canEdit || meetup.status === 'Decided') && <PlanningJourney current={stage} change={changeStage}
      people={meetup.participants.length} mapped={located.length} scheduled={!!meetup.date}
      destination={!!venue && saveReady} saved={saveStatus}>
    {stage === 'who' && <>
      {!canEdit && <Label>The destination is confirmed. The roster is read-only.</Label>}
      <ParticipantRoster
      members={meetup.participants.map(trip => ({ id: trip.id, name: trip.name, trip }))} located={located}
      edit={canEdit ? editFriend : undefined}
      action={canEdit && <Button secondary={meetup.participants.length > 0} icon="user-plus" onPress={() => editFriend()}>Add friend</Button>} />
    </>}
    <View style={{ display: stage === 'when' ? 'flex' : 'none' }}>
      {canEdit ? <PlanningSchedule ref={scheduleEditor} key={meetup.date} date={meetup.date} reportDirty={setScheduleDirty} save={date => save({ ...meetup, date })}
        continuePlanning={() => changeStage('where')} /> : <Panel><Label>{formatLocalSchedule(meetup.date) || 'Time undecided'}</Label></Panel>}
    </View>
    {stage === 'review' && <WorkspaceColumns main={confirmedPlace || proposedPlace || <Panel>
      <Label kind="item" heading>Choose a place to review</Label>
      <Button icon="map-pin" onPress={() => changeStage('where')}>Browse places</Button>
    </Panel>} side={<>
      <PlanningReview heading="Meetup details" people={meetup.participants.length} mapped={located.length}
        schedule={formatLocalSchedule(meetup.date)} activity={meetup.activity} description={meetup.description} change={changeStage} canEdit={canEdit} />
      <PlanningVotes people={meetup.participants} choices={[...venues, ...meetup.customVenues ?? []].map(place => ({
        id: place.id, name: place.name, voters: Object.entries(meetup.votes).filter(([, vote]) => vote === place.id).map(([person]) => person),
      }))} />
    </>} />}
    {meetup.status === 'Draft' && stage === 'where' && <Panel>
      <Label kind="item" heading>Find a meeting place</Label>
      <Button onPress={() => save({ ...meetup, status: 'Planning' })}>Start planning</Button>
    </Panel>}
    {meetup.status === 'Planning' && <>
      {stage === 'where' && !tripEditorOpen && <NearbyPlaces navigation={{ title: meetup.name, expanded: fullMap, setExpanded: setFullMap, back }}
        meetup={meetup} friends={located} voter={currentVoter} suggestions={suggestions} selectVoter={setVoter}
        editFriend={editFriend} editTrip={(spot, person) => { save(retainPlace(meetup, spot)); openTrip(spot.id, person); }}
        save={save} selected={proposedId} select={selectDestination} view={placeView}
        changeView={setPlaceView} ranking={ranking} changeRanking={setRanking}
        filters={<View style={layout.stack}>
          {(!meetup.participants.length || located.length < meetup.participants.length) && <View style={{ gap: spacing.xs }}>
            <Label kind="detail">Add everyone’s starting point to get suggestions.</Label>
            <Button quiet icon="users" onPress={() => changeStage('who')}>Go to friends</Button>
          </View>}
          {located.length > 0 && located.length === meetup.participants.length && !suggestions.length &&
            <Label kind="detail">No nearby matches. Try a different type of place.</Label>}
          <View style={layout.wrap}>
            <View style={{ flexGrow: 1, flexBasis: 140, minWidth: 0 }}>
              <ChoiceField label="Type of place" value={category} options={categories.map(value => ({ value, label: value }))}
                change={category => setFilter({ activity: meetup.activity, category })} />
            </View>
            <View style={{ alignSelf: 'flex-end' }}><Button secondary icon="plus" onPress={() => openTrip('new-place')}>Add place</Button></View>
          </View>
          {tripDirty && <Button quiet onPress={() => setTripEditorOpen(true)}>Resume trip edits</Button>}
        </View>} />}
      <View style={{ display: stage === 'where' && tripEditorOpen ? 'flex' : 'none', gap: 12 }}>
        <Button secondary icon="arrow-left" onPress={() => { setTripEditorOpen(false); requestAnimationFrame(scrollToTop); }}>
          {placeView === 'compare' ? 'Back to comparison' : placeView === 'places' ? 'Back to places' : 'Map'}
        </Button>
        <FriendPicker label="Trip for" people={meetup.participants} selected={currentVoter?.id} change={setVoter} />
        <TripPlanning destinationId={tripTarget} meetup={meetup} save={save} participant={currentVoter}
          selectDestination={setTripTarget} selectParticipant={setVoter} reportDirty={setTripDirty} />
      </View>
    </>}
    {stage === 'where' && meetup.status === 'Decided' && confirmedPlace}
    </PlanningJourney>}
    {finished && <LocalMemories meetup={meetup} venue={venue} voter={currentVoter} selectVoter={setVoter}
      save={save} saved={saveReady} saveStatus={saveStatus} map={() => setFullMap(true)} reportDirty={setRecapDirty}
      roster={<ParticipantRoster members={meetup.participants.map(trip => ({ id: trip.id, name: trip.name, trip }))} located={located} />} />}
    {fullMap && venue?.point && <ConfirmedPlaceMap name={venue.name} location={venue.area} point={venue.point} schedule={formatLocalSchedule(meetup.date)}
      navigation={{ title: meetup.name, expanded: true, setExpanded: setFullMap, back }} />}
  </>, footer);
}
