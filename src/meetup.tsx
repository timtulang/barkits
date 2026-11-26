import { formatLocalSchedule } from './meetup-schedule';
import { ParticipantRoster } from './participant-roster';
import { LocalPlaceComparison } from './local-place-comparison';
import { canConfirmLocal } from './destination-eligibility';
import { DestinationReview, PlanningVotes } from './destination-review';
import { localTripRows } from './trip-evidence';
import { TripComparison } from './trip-comparison';
import { ChoiceField, IconAction } from './form-controls';
import { PlanNavigation, localSections, type PlanSection } from './plan-navigation';
import { PlanningJourney, PlanningReview } from './planning-journey';
import { PlanningSchedule } from './planning-schedule';
import { initialPlanningStage, peopleProgress, type PlanningStage } from './planning-progress';
import { WorkspaceColumns, StatusMark } from './workspace-layout';
import { activityCategory, categories, Category, discover } from './discovery';
import { catalog } from './venue-catalog';
import { locateFriends } from './locate-friends';
import { NearbyPlaces } from './nearby-places';
import { VenueDecision } from './venue-decision';
import { PlanningMap } from './planning-map';
import { TripPlanning } from './trip-planning';
import { ConfirmedPlaceMap } from './confirmed-place-map';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { GoogleMapsLink } from './google-maps-link';
import { Kits } from './kits';
import { Meetup, Participant, Ranking, ratingSummary, venues, retainPlace } from './planner';
import { palette } from './theme';
import { Button, Chip, Field, Label, layout, Panel } from './ui';

export function MeetupScreen({ meetup, save, editDetails, editFriend, back, scrollToTop, saveStatus, saveReady }: {
  saveStatus: string; saveReady: boolean;
  scrollToTop: () => void; meetup: Meetup; save: (meetup: Meetup) => void; editDetails: () => void; editFriend: (friend?: Participant) => void; back: () => void;
}) {
  const [tab, setTab] = useState<PlanSection>('nearby');
  const [filter, setFilter] = useState<{ activity?: string; category: Category }>();
  const [tripTarget, setTripTarget] = useState<string>();
  const category = filter && filter.activity === meetup.activity ? filter.category : activityCategory(meetup.activity);
  const located = useMemo(() => locateFriends(meetup.participants), [meetup.participants]);
  const suggestions = useMemo(() => meetup.status === 'Planning' && located.length === meetup.participants.length ?
    discover(located, category, catalog) : [], [located, category, meetup.status, meetup.participants.length]);
  const venue = [...venues, ...meetup.customVenues ?? []].find(item => item.id === meetup.venue);
  const [proposedId, setProposedId] = useState<string>();
  const proposed = [...venues, ...meetup.customVenues ?? []].find(item => item.id === proposedId);
  function reviewDestination(place: typeof venues[number]) {
    save(retainPlace(meetup, place)); setProposedId(place.id); changeStage('review');
  }
  const [fullMap, setFullMap] = useState(false);
  const [stage, setStage] = useState<PlanningStage>(() => initialPlanningStage(meetup.status, meetup.participants.length, located.length));
  function changeStage(next: PlanningStage) {
    setStage(next); setFullMap(false); requestAnimationFrame(scrollToTop);
  }
  useEffect(() => {
    if (meetup.status === 'Decided') { setStage('review'); setFullMap(false); requestAnimationFrame(scrollToTop); }
  }, [meetup.status]);
  const [ranking, setRanking] = useState<Ranking>('Balanced');
  const [tripEditorOpen, setTripEditorOpen] = useState(false);
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [tripDirty, setTripDirty] = useState(false);
  const [voter, setVoter] = useState('');
  const [caption, setCaption] = useState(meetup.recap ?? '');
  const currentVoter = meetup.participants.find(friend => friend.id === voter) ?? meetup.participants[0];
  const canEdit = meetup.status === 'Planning' || meetup.status === 'Draft';
  const canRate = meetup.status === 'Completed';
  const ratings = ratingSummary(meetup.ratings);
  function openTrip(id: string, person?: string) {
    setFullMap(false);
    setTripTarget(id);
    setTab('trips');
    setTripEditorOpen(true);
    if (person) setVoter(person);
    setStage('where');
    requestAnimationFrame(scrollToTop);
  }
  function rate(value: number | null) {
    if (!currentVoter) return;
    const next = { ...meetup.ratings };
    if (value === null) delete next[currentVoter.id];
    else next[currentVoter.id] = value;
    save({ ...meetup, ratings: next });
  }
  return <>
    <View style={{ gap: 6 }}>
      <View style={layout.between}>
        <Button quiet onPress={back} icon="arrow-left">Back to meetups</Button>
        {canEdit && <IconAction name="edit-2" label="Edit meetup details" onPress={editDetails} />}
      </View>
      <View style={layout.wrap}><View style={{ flexGrow: 1, flexBasis: 180 }}><Label kind={canEdit || meetup.status === 'Decided' ? 'item' : 'page'} heading>{meetup.name}</Label></View><StatusMark status={meetup.status} /></View>
      {(!canEdit || stage === 'review') && <Label kind="detail">{formatLocalSchedule(meetup.date) || 'Date and time undecided (optional)'} · On this device</Label>}
      {!!meetup.activity && stage === 'review' && <Label weight="bold">Activity · {meetup.activity}</Label>}
      {!!meetup.description && stage === 'review' && <Label>{meetup.description}</Label>}
    </View>
    {(canEdit || meetup.status === 'Decided') && <>
    <PlanningJourney current={stage} change={changeStage} people={peopleProgress(meetup.participants.length, located.length)}
      scheduled={!!meetup.date} destination={!!venue} saved={saveStatus} />
    {stage === 'who' && <>
      <Label kind="detail">Required for suggestions: at least one friend with a mapped starting point. Each friend can choose transport; fare and time limits are optional.</Label>
      {!canEdit && <Label>The destination is confirmed. The roster is read-only.</Label>}
      <ParticipantRoster
      members={meetup.participants.map(trip => ({ id: trip.id, name: trip.name, trip }))} located={located}
      edit={canEdit ? editFriend : undefined} action={canEdit && <View style={layout.wrap}>
        {!!meetup.participants.length && <Button onPress={() => changeStage('when')}>Review meetup time</Button>}
        <Button secondary={!!meetup.participants.length} icon="user-plus" onPress={() => editFriend()}>Add friend</Button></View>} />
      {!!meetup.participants.length && <Label kind="detail">Changing a starting point or transport clears only that friend’s saved trip estimates. Existing votes and suggested places stay.</Label>}
    </>}
    <View style={{ display: stage === 'when' ? 'flex' : 'none' }}>
      {canEdit ? <PlanningSchedule key={meetup.date} date={meetup.date} reportDirty={setScheduleDirty} save={date => save({ ...meetup, date })}
        continuePlanning={() => changeStage('where')} /> : <Panel><Label>{formatLocalSchedule(meetup.date) || 'Date and time undecided'}</Label>
          <Label kind="detail">The confirmed plan is read-only.</Label><Button onPress={() => changeStage('review')}>Review confirmed plan</Button></Panel>}
    </View>
    {stage === 'review' && <>
      <PlanningReview people={meetup.participants.length} mapped={located.length} pending={canEdit ? proposed?.name : undefined}
        schedule={formatLocalSchedule(meetup.date)} destination={venue?.name} change={changeStage} canEdit={canEdit} />
      {proposed && meetup.status === 'Planning' && <DestinationReview name={proposed.name}
        blocked={scheduleDirty ? 'Schedule edits are not saved. Return to When to save or clear them before confirming.' :
          tripDirty ? 'Trip edits are not saved. Return to Where and resume each draft to save or clear it before confirming.' :
          !saveReady ? 'Wait for the plan to save before confirming. If saving failed, use Try again above.' :
          !canConfirmLocal(meetup, proposed) ? 'The group or its limits changed. Check every trip in Where before confirming this place.' : undefined}
        cancel={() => { setProposedId(undefined); changeStage('where'); }} confirm={() => {
          if (saveReady && !scheduleDirty && !tripDirty && canConfirmLocal(meetup, proposed)) save({ ...meetup, venue: proposed.id, status: 'Decided' });
        }}>
        <TripComparison rows={localTripRows(meetup, proposed)} editableIds={meetup.participants.map(person => person.id)}
          edit={person => openTrip(proposed.id, person)} changeTransport={id => editFriend(meetup.participants.find(person => person.id === id))} />
      </DestinationReview>}
      <PlanningVotes people={meetup.participants} choices={[...venues, ...meetup.customVenues ?? []].map(place => ({
        id: place.id, name: place.name, voters: Object.entries(meetup.votes).filter(([, vote]) => vote === place.id).map(([person]) => person),
      }))} />
    </>}
    {meetup.status === 'Draft' && stage === 'where' && <Panel>
      <Label kind="item" heading>Ready to compare places?</Label><Label>This is a draft. Open place suggestions and voting when you’re ready. You can still change friends and time.</Label>
      <Button onPress={() => save({ ...meetup, status: 'Planning' })}>Find meeting places</Button>
    </Panel>}
    <View style={{ display: stage === 'where' ? 'flex' : 'none', gap: 16 }}>
    {meetup.status === 'Planning' && <>
      {located.length < meetup.participants.length || !meetup.participants.length ? <Panel>
        <Label>Add a mapped starting point for every friend to find nearby places.</Label>
        <Button onPress={() => changeStage('who')}>Complete starting points</Button>
      </Panel> : null}
      <View style={layout.stack}>
        <PlanNavigation sections={localSections} current={tab} change={setTab} />
        <View style={layout.between}>
          <View style={{ flex: 1 }}><Label kind="item" heading>{tab === 'nearby' ? 'Explore meeting places' : 'Compare trips & vote'}</Label></View>
          <Button quiet onPress={() => openTrip('new-place')}>Add a meeting place</Button>
        </View>
        {!!currentVoter && <View style={layout.wrap}>
          <View style={{ flexGrow: 1, flexBasis: 145, minWidth: 0 }}>
            <ChoiceField label="Plan and vote as" value={currentVoter.id} change={value => value === 'add-friend' ? editFriend() : setVoter(value)}
              options={[...meetup.participants.map(friend => ({ value: friend.id, label: friend.name })), { value: 'add-friend', label: 'Add a friend…' }]} />
          </View>
          {tab === 'nearby' && <View style={{ flexGrow: 1, flexBasis: 145, minWidth: 0 }}>
            <ChoiceField label="Type of place" value={category} options={categories.map(value => ({ value, label: value }))}
              change={category => setFilter({ activity: meetup.activity, category })} />
          </View>}
        </View>}
      </View>
      <View style={{ display: tab === 'trips' && tripEditorOpen ? 'flex' : 'none', gap: 12 }}>
        <Button secondary onPress={() => setTripEditorOpen(false)}>Back to place comparisons</Button><TripPlanning destinationId={tripTarget} meetup={meetup} save={save} participant={currentVoter}
        selectDestination={setTripTarget} selectParticipant={setVoter} reportDirty={setTripDirty} /></View>
      {tab === 'nearby' && <NearbyPlaces navigation={{ title: meetup.name, expanded: fullMap, setExpanded: setFullMap, back }} meetup={meetup} friends={located} voter={currentVoter} suggestions={suggestions}
        category={category} edit={editFriend} selectVoter={setVoter} save={save} review={reviewDestination}
        compare={spot => { save(retainPlace(meetup, spot)); setTripTarget(spot.id); setTab('trips'); setFullMap(false); requestAnimationFrame(scrollToTop); }} />}
      {tab === 'trips' && !tripEditorOpen && <LocalPlaceComparison meetup={meetup} ranking={ranking} setRanking={setRanking}
        voter={currentVoter} selected={tripTarget} editTrip={openTrip} editPerson={editFriend} save={save} review={reviewDestination} />}
      {tab === 'nearby' && !suggestions.length && <PlanningMap meetup={meetup} origins={located} places={[]} />}
      <Button secondary onPress={() => changeStage('review')}>Review plan & what’s missing</Button>
    </>}
    </View>
    </>}
    <WorkspaceColumns side={meetup.status === 'Completed' || meetup.status === 'Archived' ? <ParticipantRoster
      members={meetup.participants.map(trip => ({ id: trip.id, name: trip.name, trip }))} located={located} /> : null} main={<>
    {!!venue && (!canEdit && meetup.status !== 'Decided' || stage === 'review' || stage === 'where') && <Panel><Label kind="item" heading>Meet at {venue.name}</Label><Label>{venue.area}</Label>
      <View style={layout.wrap}>
        {venue.point && <><Button secondary onPress={() => setFullMap(true)} icon="map">View venue map</Button>
          <GoogleMapsLink point={venue.point} /></>}
        {meetup.status === 'Decided' && <Button onPress={() => save({ ...meetup, status: 'Completed' })} icon="check">Mark completed</Button>}
      </View>
      {fullMap && venue.point && <ConfirmedPlaceMap name={venue.name} location={venue.area} point={venue.point} schedule={formatLocalSchedule(meetup.date)}
        navigation={{ title: meetup.name, expanded: true, setExpanded: setFullMap, back }} />}
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
  </>;
}
