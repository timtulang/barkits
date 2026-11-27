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
import { GoogleMapsLink } from './google-maps-link';
import { Kits } from './kits';
import { Meetup, Participant, type Ranking, ratingSummary, venues, retainPlace } from './planner';
import { colors, palette, spacing } from './theme';
import { Button, Chip, Field, Icon, Label, layout, Panel } from './ui';

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
    if (meetup.status === 'Decided') { setStage('review'); setFullMap(false); requestAnimationFrame(scrollToTop); }
  }, [meetup.status]);
  const scheduleEditor = useRef<{ advance: () => void }>(null);
  const [tripEditorOpen, setTripEditorOpen] = useState(false);
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [tripDirty, setTripDirty] = useState(false);
  useEffect(() => reportDirty(scheduleDirty || tripDirty), [scheduleDirty, tripDirty, reportDirty]);
  useEffect(() => () => reportDirty(false), [reportDirty]);
  const [voter, setVoter] = useState('');
  const [caption, setCaption] = useState(meetup.recap ?? '');
  const currentVoter = meetup.participants.find(friend => friend.id === voter) ?? meetup.participants[0];
  const canEdit = meetup.status === 'Planning' || meetup.status === 'Draft';
  const canRate = meetup.status === 'Completed';
  const ratings = ratingSummary(meetup.ratings);
  function openTrip(id: string, person?: string) {
    setTripTarget(id);
    setTripEditorOpen(true);
    if (person) setVoter(person);
    changeStage('where');
  }
  function rate(value: number | null) {
    if (!currentVoter) return;
    const next = { ...meetup.ratings };
    if (value === null) delete next[currentVoter.id];
    else next[currentVoter.id] = value;
    save({ ...meetup, ratings: next });
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
  const confirmedPlace = meetup.status === 'Decided' && venue && <Panel>
    <Label kind="section" heading>Meet at {venue.name}</Label>
    <View style={layout.row} accessibilityLiveRegion="polite" aria-live="polite">
      <Icon name={saveReady ? 'check-circle' : 'clock'} color={saveReady ? colors.success : colors.warning} />
      <Label kind="label" color={saveReady ? colors.success : colors.warning}>
        {saveReady ? 'Destination confirmed' : 'Confirmation pending save'}
      </Label>
    </View>
    {!!venue.area && <Label>{venue.area}</Label>}
    <View style={layout.wrap}>
      {venue.point && <><GoogleMapsLink point={venue.point} directions />
        <Button secondary onPress={() => setFullMap(true)} icon="map">View venue map</Button></>}
      <Button variant={venue.point ? 'quiet' : 'primary'} disabled={!saveReady}
        onPress={() => save({ ...meetup, status: 'Completed' })} icon="check">Mark completed</Button>
    </View>
    {!venue.point && <Label kind="detail">Directions are unavailable because this place has no saved map pin.</Label>}
  </Panel>;
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
      <View style={layout.wrap}><View style={{ flexGrow: 1, flexBasis: 144, minWidth: 0 }}><Label kind={canEdit || meetup.status === 'Decided' ? 'item' : 'page'} heading>{meetup.name}</Label></View><StatusMark status={meetup.status} /></View>
      {!canEdit && meetup.status !== 'Decided' && <Label kind="detail">{formatLocalSchedule(meetup.date) || 'Date and time undecided (optional)'} · On this device</Label>}
      {!!meetup.activity && (canRate || meetup.status === 'Archived') && <Label weight="bold">Activity · {meetup.activity}</Label>}
      {!!meetup.description && (canRate || meetup.status === 'Archived') && <Label>{meetup.description}</Label>}
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
    <WorkspaceColumns side={meetup.status === 'Completed' || meetup.status === 'Archived' ? <ParticipantRoster
      members={meetup.participants.map(trip => ({ id: trip.id, name: trip.name, trip }))} located={located} /> : null} main={<>
    {!!venue && (meetup.status === 'Completed' || meetup.status === 'Archived') && <Panel><Label kind="item" heading>Meet at {venue.name}</Label><Label>{venue.area}</Label>
      <View style={layout.wrap}>
        {venue.point && <><Button secondary onPress={() => setFullMap(true)} icon="map">View venue map</Button>
          <GoogleMapsLink point={venue.point} /></>}
      </View>
    </Panel>}
    {meetup.status === 'Archived' && <Panel>
      <Label kind="section" heading>Meetup memories</Label>
      {!!meetup.recap && <Label>{meetup.recap}</Label>}
      {ratings && <Label>{ratings.average.toFixed(1)} ★ · {ratings.count} participant {ratings.count === 1 ? 'rating' : 'ratings'}</Label>}
      {!meetup.recap && !ratings && <Label color={palette.muted}>No recap or ratings were saved.</Label>}
    </Panel>}
    {canRate && <Panel>
      <View style={layout.row}><Kits celebrate style={{ width: 85, height: 58, borderRadius: 10 }} /><Label kind="section" heading>Save the memory</Label></View>
      <Label color={palette.muted}>Recaps and ratings are optional. This demo saves them only on this device.</Label>
      <Field label="Recap caption" value={caption} onChange={setCaption} placeholder="Anong kuwento ng lakad?" />
      <View style={layout.wrap}><Button disabled={!caption.trim()} onPress={() => save({ ...meetup, recap: caption.trim() })}>Save recap</Button>
        {!!meetup.recap && <Button secondary onPress={() => { setCaption(''); save({ ...meetup, recap: undefined }); }}>Remove recap</Button>}</View>
      {currentVoter && <>
        <Label weight="bold">Rate as</Label>
        <View style={layout.wrap}>{meetup.participants.map(friend => <Chip key={friend.id} selected={currentVoter.id === friend.id} onPress={() => setVoter(friend.id)}>{friend.name}</Chip>)}</View>
        <View style={layout.wrap}>{[1, 2, 3, 4, 5].map(value => <Chip key={value} icon="star" selected={meetup.ratings[currentVoter.id] === value} onPress={() => rate(value)}>{value}</Chip>)}
          {meetup.ratings[currentVoter.id] !== undefined && <Chip onPress={() => rate(null)}>Remove rating</Chip>}</View>
      </>}
      {ratings && <Label weight="bold">{ratings.average.toFixed(1)} ★ · {ratings.count} participant {ratings.count === 1 ? 'rating' : 'ratings'}</Label>}
      <Button secondary onPress={() => save({ ...meetup, status: 'Archived' })}>Archive meetup</Button>
    </Panel>}
    </>} />
    {fullMap && venue?.point && <ConfirmedPlaceMap name={venue.name} location={venue.area} point={venue.point} schedule={formatLocalSchedule(meetup.date)}
      navigation={{ title: meetup.name, expanded: true, setExpanded: setFullMap, back }} />}
  </>, footer);
}
