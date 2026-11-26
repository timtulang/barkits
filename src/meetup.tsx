import { formatLocalSchedule } from './meetup-schedule';
import { ParticipantRoster } from './participant-roster';
import { RankingFigures } from './venue-summary';
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
import { Meetup, Participant, Ranking, rankings, ratingSummary, recommend, demoJourney, venues, retainPlace } from './planner';
import { palette } from './theme';
import { Button, Chip, Field, Icon, Label, layout, Panel } from './ui';

const rankingDescriptions: Record<Ranking, string> = {
  Balanced: 'Balances group travel time, similar trip lengths, and fare.',
  Fairest: 'Prioritizes similar trip lengths across the group.',
  Fastest: 'Prioritizes the lowest combined travel time.',
  Cheapest: 'Prioritizes the lowest combined fare when all fares are available.',
};

export function MeetupScreen({ meetup, save, editDetails, editFriend, back, scrollToTop, saveStatus }: {
  saveStatus: string;
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
  const [fullMap, setFullMap] = useState(false);
  const [stage, setStage] = useState<PlanningStage>(() => initialPlanningStage(meetup.status, meetup.participants.length, located.length));
  function changeStage(next: PlanningStage) {
    setStage(next); setFullMap(false); requestAnimationFrame(scrollToTop);
  }
  useEffect(() => {
    if (meetup.status === 'Decided') { setStage('review'); setFullMap(false); requestAnimationFrame(scrollToTop); }
  }, [meetup.status]);
  const [ranking, setRanking] = useState<Ranking>('Balanced');
  const [expanded, setExpanded] = useState('');
  const [voter, setVoter] = useState('');
  const [caption, setCaption] = useState(meetup.recap ?? '');
  const currentVoter = meetup.participants.find(friend => friend.id === voter) ?? meetup.participants[0];
  const canEdit = meetup.status === 'Planning' || meetup.status === 'Draft';
  const canRate = meetup.status === 'Completed';
  const ratings = ratingSummary(meetup.ratings);
  const candidates = recommend(meetup.participants, ranking, meetup.manualFares, meetup.customVenues, meetup.manualMinutes);
  const hasLimits = meetup.participants.some(friend => friend.budget !== undefined || friend.maxMinutes !== undefined);
  const unranked = hasLimits ? [] : (meetup.customVenues ?? []).filter(spot =>
    meetup.participants.some(friend => meetup.manualMinutes?.[spot.id]?.[friend.id] === undefined && !demoJourney(spot, friend)));
  function openTrip(id: string) {
    setFullMap(false);
    setTripTarget(id);
    setTab('details');
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
      {canEdit ? <PlanningSchedule key={meetup.date} date={meetup.date} save={date => save({ ...meetup, date })}
        continuePlanning={() => changeStage('where')} /> : <Panel><Label>{formatLocalSchedule(meetup.date) || 'Date and time undecided'}</Label>
          <Label kind="detail">The confirmed plan is read-only.</Label><Button onPress={() => changeStage('review')}>Review confirmed plan</Button></Panel>}
    </View>
    {stage === 'review' && <PlanningReview people={meetup.participants.length} mapped={located.length}
      schedule={formatLocalSchedule(meetup.date)} destination={venue?.name} change={changeStage} canEdit={canEdit} />}
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
          <View style={{ flex: 1 }}><Label kind="item" heading>{tab === 'nearby' ? 'Explore meeting places' : tab === 'trips' ? 'Compare trips & vote' : 'Enter trip estimates'}</Label></View>
          {tab === 'nearby' && <IconAction name="search" label="Search another meeting place" onPress={() => openTrip('new-place')} />}
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
      <View style={{ display: tab === 'details' ? 'flex' : 'none' }}><TripPlanning destinationId={tripTarget} meetup={meetup} save={save} participant={currentVoter}
        selectDestination={setTripTarget} /></View>
      {tab === 'nearby' && <NearbyPlaces navigation={{ title: meetup.name, expanded: fullMap, setExpanded: setFullMap, back }} meetup={meetup} friends={located} voter={currentVoter} suggestions={suggestions}
        category={category} edit={editFriend} selectVoter={setVoter} save={save}
        compare={spot => { save(retainPlace(meetup, spot)); openTrip(spot.id); }} />}
      {tab === 'trips' && <>
        <Label kind="detail">Rankings use demo trips or travel figures you enter. Live routes and fares are unavailable.</Label>
        <View style={layout.wrap}>{rankings.map(item => <Chip key={item} selected={ranking === item} onPress={() => setRanking(item)}>{item}</Chip>)}</View>
      {!!meetup.participants.length && !candidates.length && <Panel><Label>No places qualify yet. Enter travel times for every friend to the same place. Add fares for budget limits or the Cheapest ranking.</Label><Button secondary onPress={() => setTab('details')}>Enter trip estimates</Button></Panel>}
      {candidates.map(({ venue: item, journeys, time, spread, cost }, index) => {
        return <Panel key={item.id}>
          <View style={layout.between}><View style={[layout.row, { flex: 1 }]}><View style={{ backgroundColor: palette[item.color], padding: 10, borderRadius: 12 }}><Icon name={item.icon} /></View>
            <View style={{ flexShrink: 1 }}><Label kind="item" heading>{item.name}</Label><Label size={13} color={palette.muted}>{item.area}</Label></View></View>
            {index === 0 && <Chip selected>Top match</Chip>}</View>
          {index === 0 && <Label kind="detail">{rankingDescriptions[ranking]}</Label>}
          <RankingFigures time={time} spread={spread} cost={cost} />
          <Label kind="detail">{journeys.every(trip => trip.timeEntered) ? 'User-entered time' : journeys.some(trip => trip.timeEntered) ? 'Demo and user-entered times' : 'Demo time'}{cost !== null && (journeys.some(journey => journey.manual) ? ' · includes user-entered fares' : ' · demo fares')}</Label>
          {expanded === item.id && journeys.map(({ participant, minutes, fare, manual, timeEntered }) => <Label key={participant.id}>{participant.name} · {participant.mode} · {minutes} min ({timeEntered ? 'user-entered' : 'demo'}) · {fare === null ? 'Fare unavailable' : `₱${fare} ${manual ? 'user-entered ' + (meetup.fareNotes?.[item.id]?.[participant.id]?.provider ?? 'fare') : 'demo fare'}`}</Label>)}
          <View style={layout.wrap}>
            <Button secondary onPress={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'Hide trips' : 'View trips'}</Button>
          </View>
          {currentVoter && <VenueDecision meetup={meetup} venue={item} voter={currentVoter} save={save} />}
        </Panel>;
      })}
      {currentVoter && unranked.map(spot => <Panel key={spot.id}>
        <Label size={20} weight="title">{spot.name}</Label>
        <Label>Group suggestion · Unranked. Some friends still need travel times.</Label>
        <VenueDecision meetup={meetup} venue={spot} voter={currentVoter} save={save} />
      </Panel>)}
      </>}
      {(tab === 'trips' || (tab === 'nearby' && !suggestions.length)) && <PlanningMap meetup={meetup} origins={located} places={tab === 'nearby' ? suggestions.map(item => item.venue) : candidates.map(item => item.venue)} />}
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
