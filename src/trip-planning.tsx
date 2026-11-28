import { ChoiceField } from './form-controls';
import type { PlaceResult } from './search-matches';
import { TripOptions } from './trip-options';
import { validFare, type RideProvider } from './transport-fares';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { directDistance, parsePoint } from './geo';
import { PlaceInput } from './place-input';
import { demoJourney, Meetup, Participant, Venue, venues, retainPlace } from './planner';
import { Button, Feedback, Field, Label, layout, Panel, StatusLine } from './ui';

export function TripPlanning({ meetup, save, saveReady, retrySave, participant, destinationId, selectDestination, selectParticipant, reportDirty }: {
  selectDestination: (id: string) => void; selectParticipant: (id: string) => void; reportDirty: (dirty: boolean) => void;
  destinationId?: string; meetup: Meetup; save: (m: Meetup) => void; participant?: Participant;
  saveReady: boolean; retrySave?: () => void;
}) {
  const [match, setMatch] = useState<PlaceResult>();
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [error, setError] = useState('');
  const selected = destinationId ?? '';
  const places = [...venues, ...meetup.customVenues ?? []];
  const venue = places.find(item => item.id === selected);
  const [visited, setVisited] = useState<{ venue: string; person: string }[]>([]);
  const [dirtyTrips, setDirtyTrips] = useState<Record<string, boolean>>({});
  const hasDrafts = Object.values(dirtyTrips).some(Boolean);
  useEffect(() => reportDirty(hasDrafts), [hasDrafts, reportDirty]);
  useEffect(() => {
    if (venue && participant) setVisited(current => current.some(item => item.venue === venue.id && item.person === participant.id) ? current :
      [...current, { venue: venue.id, person: participant.id }]);
  }, [venue?.id, participant?.id]);
  function add() {
    const point = parsePoint(coordinates);
    if (!place.trim()) return setError('Enter a name for the meeting place.');
    if (coordinates.trim() && !point) return setError('Enter valid latitude and longitude.');
    const spot: Venue = match ? {
      id: match.id, name: match.name, area: [match.address, match.area].filter(Boolean).join(', '),
      category: match.kind, point: match.point, icon: match.kind === 'Café' ? 'coffee' : match.kind === 'Mall' ? 'shopping-bag' : 'sun', color: 'mint',
    } : { id: 'place-' + Date.now(), name: place.trim(), area: 'Group suggestion', icon: 'sun', color: 'mint', category: 'Custom', point };
    save(retainPlace(meetup, spot));
    setMatch(undefined);
    selectDestination(spot.id); setPlace(''); setCoordinates(''); setError('');
  }
  return <Panel>
    {hasDrafts && <><Label kind="detail">Unsaved trip edits — save or clear them before confirming a destination.</Label>
      {visited.filter(item => dirtyTrips[JSON.stringify(item)]).map(item => <Button quiet key={JSON.stringify(item)} onPress={() => {
        selectDestination(item.venue); selectParticipant(item.person);
      }}>Resume draft: {meetup.participants.find(person => person.id === item.person)?.name} → {places.find(place => place.id === item.venue)?.name}</Button>)}
    </>}
    <ChoiceField label="Destination" value={selected} change={selectDestination}
      options={[{ value: '', label: 'Choose a meeting place' }, ...places.map(item => ({ value: item.id, label: item.name })), { value: 'new-place', label: 'Search another meeting place…' }]} />
    {selected === 'new-place' && <><PlaceInput destination onSelection={setMatch} name={place} setName={setPlace} coordinates={coordinates} setCoordinates={setCoordinates} />
      {!!error && <Feedback tone="error">{error}</Feedback>}<Button onPress={add}>Add meeting place</Button></>}
    {!participant && <Label>Add a friend and starting point to enter a trip estimate.</Label>}
    {venue && participant && <>
      <Label kind="item" heading>{participant.name} → {venue.name}</Label>
      <Label kind="detail">From {participant.origin} · {participant.mode}. Choose another friend above to enter their trip.</Label>
      {participant.point && venue.point && <Label>{directDistance(participant.point, venue.point).toFixed(1)} km straight-line distance</Label>}
    </>}
    {visited.map(item => {
      const person = meetup.participants.find(person => person.id === item.person);
      const place = places.find(place => place.id === item.venue);
      return person && place && <View key={JSON.stringify([person.id, place.id, person.origin, person.point, person.mode])}
        style={{ display: person.id === participant?.id && place.id === selected ? 'flex' : 'none' }}>
        <TripFields participant={person} meetup={meetup} venue={place} save={save} saveReady={saveReady} retrySave={retrySave} reportDirty={dirty => {
          const key = JSON.stringify(item);
          setDirtyTrips(current => current[key] === dirty ? current : { ...current, [key]: dirty });
        }} />
      </View>;
    })}
  </Panel>;
}

function TripFields({ participant, meetup, venue, save, saveReady, retrySave, reportDirty }: {
  participant: Participant; meetup: Meetup; venue: Venue; save: (m: Meetup) => void; reportDirty: (dirty: boolean) => void;
  saveReady: boolean; retrySave?: () => void;
}) {
  const savedTime = meetup.manualMinutes?.[venue.id]?.[participant.id];
  const savedFare = meetup.manualFares?.[venue.id]?.[participant.id];
  const note = meetup.fareNotes?.[venue.id]?.[participant.id];
  const [provider,setProvider] = useState<RideProvider | undefined>(note?.provider);
  const [time, setTime] = useState(savedTime?.toString() ?? '');
  const [fare, setFare] = useState(savedFare?.toString() ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const demo = demoJourney(venue, participant);
  const minutes = time.trim() ? Number(time) : undefined;
  const cost = fare.trim() ? Number(fare) : undefined;
  const invalidTime = minutes !== undefined && (!Number.isFinite(minutes) || minutes < 0);
  const invalidFare = cost !== undefined && (!validFare(fare) || !Number.isFinite(cost) || cost < 0);
  const dirty = minutes !== savedTime || cost !== savedFare || provider !== note?.provider;
  useEffect(() => reportDirty(dirty), [dirty, reportDirty]);
  useEffect(() => () => reportDirty(false), []);
  function submit() {
    setSubmitted(true);
    if (invalidTime || invalidFare) return;
    const times = { ...meetup.manualMinutes?.[venue.id] };
    const fares = { ...meetup.manualFares?.[venue.id] };
    if (minutes === undefined) delete times[participant.id]; else times[participant.id] = minutes;
    if (cost === undefined) delete fares[participant.id]; else fares[participant.id] = cost;
    const notes = { ...meetup.fareNotes?.[venue.id] };
    if (provider && cost !== undefined) notes[participant.id] = { provider, savedAt: new Date().toISOString() };
    else delete notes[participant.id];
    save({ ...meetup, fareNotes: { ...meetup.fareNotes, [venue.id]: notes }, manualMinutes: { ...meetup.manualMinutes, [venue.id]: times }, manualFares: { ...meetup.manualFares, [venue.id]: fares } });
    setSubmitted(false);
    setShowSaveStatus(true);
  }
  return <View style={layout.stack}>
    <Label kind="detail">{demo ? 'You can replace this demo trip with your own travel figures.' : 'Enter the expected travel time to include this trip in rankings.'}</Label>
    <Field label="One-way travel time (minutes)" numeric value={time} onChange={value => { setTime(value); setShowSaveStatus(false); }}
      error={submitted && invalidTime ? 'Enter zero or more minutes.' : undefined} />
    <Field label="Travel fare (₱, optional)" inputMode="decimal" value={fare}
      onChange={value => { setFare(value); setProvider(undefined); setShowSaveStatus(false); }}
      error={submitted && invalidFare ? 'Enter a peso fare with up to two decimal places.' : undefined} />
    <Label kind="detail">Include the whole one-way trip. Fares are optional unless needed for a fare limit or the Cheapest comparison. Nothing here is a live quote.</Label>
    <TripOptions origin={participant.point?.join(',') ?? participant.origin} destination={venue.point?.join(',') ?? [venue.name,venue.area].filter(Boolean).join(', ')}
      walking={participant.mode === 'Walking'} currentProvider={provider} currentFare={fare} onUse={(p,f) => { setProvider(p); setFare(f); setShowSaveStatus(false); }} />
    {note && <Label size={13}>Saved {note.provider} fare · {new Date(note.savedAt).toLocaleString('en-PH')}</Label>}
    <Button onPress={submit}>Save trip details</Button>
    {showSaveStatus && (retrySave ? <View style={layout.stack}>
      <StatusLine tone="warning">The trip changes are still open.</StatusLine>
      <Button secondary onPress={retrySave}>Try saving the trip again</Button>
    </View> : <StatusLine tone={saveReady ? 'success' : 'info'}>
      {saveReady ? 'Trip saved on this device.' : 'Saving the trip on this device…'}
    </StatusLine>)}
  </View>;
}
