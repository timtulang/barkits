import { ChoiceField } from './form-controls';
import type { PlaceResult } from './search-matches';
import { TripOptions } from './trip-options';
import { validFare, type RideProvider } from './transport-fares';
import { useState } from 'react';
import { View } from 'react-native';
import { directDistance, parsePoint } from './geo';
import { PlaceInput } from './place-input';
import { demoJourney, Meetup, Participant, Venue, venues, retainPlace } from './planner';
import { Button, Field, Label, layout, Panel } from './ui';

export function TripPlanning({ meetup, save, participant, destinationId, selectDestination }: { selectDestination: (id: string) => void; destinationId?: string; meetup: Meetup; save: (m: Meetup) => void; participant?: Participant }) {
  const [match, setMatch] = useState<PlaceResult>();
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [error, setError] = useState('');
  const selected = destinationId ?? venues[0].id;
  const places = [...venues, ...meetup.customVenues ?? []];
  const venue = places.find(item => item.id === selected);
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
    <ChoiceField label="Destination" value={selected} change={selectDestination}
      options={[...places.map(item => ({ value: item.id, label: item.name })), { value: 'new-place', label: 'Search another meeting place…' }]} />
    {selected === 'new-place' && <><PlaceInput destination onSelection={setMatch} name={place} setName={setPlace} coordinates={coordinates} setCoordinates={setCoordinates} />
      {!!error && <Label>{error}</Label>}<Button onPress={add}>Add meeting place</Button></>}
    {!participant && <Label>Add a friend and starting point to enter a trip estimate.</Label>}
    {venue && participant && <>
      <Label kind="item" heading>Trip for {participant.name}</Label>
      {participant.point && venue.point && <Label>{directDistance(participant.point, venue.point).toFixed(1)} km straight-line distance</Label>}
      <TripFields key={JSON.stringify([participant.id, venue.id, participant.origin, participant.point, participant.mode])} participant={participant} meetup={meetup} venue={venue} save={save} />
    </>}
  </Panel>;
}

function TripFields({ participant, meetup, venue, save }: { participant: Participant; meetup: Meetup; venue: Venue; save: (m: Meetup) => void }) {
  const savedTime = meetup.manualMinutes?.[venue.id]?.[participant.id];
  const savedFare = meetup.manualFares?.[venue.id]?.[participant.id];
  const note = meetup.fareNotes?.[venue.id]?.[participant.id];
  const [provider,setProvider] = useState<RideProvider | undefined>(note?.provider);
  const [time, setTime] = useState(savedTime?.toString() ?? '');
  const [fare, setFare] = useState(savedFare?.toString() ?? '');
  const [message, setMessage] = useState('');
  const demo = demoJourney(venue, participant);
  function submit() {
    const minutes = time.trim() ? Number(time) : undefined;
    const cost = fare.trim() ? Number(fare) : undefined;
    if ((fare.trim() && !validFare(fare)) || [minutes, cost].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) {
      return setMessage('Enter a nonnegative time and a peso fare with up to two decimal places.');
    }
    const times = { ...meetup.manualMinutes?.[venue.id] };
    const fares = { ...meetup.manualFares?.[venue.id] };
    if (minutes === undefined) delete times[participant.id]; else times[participant.id] = minutes;
    if (cost === undefined) delete fares[participant.id]; else fares[participant.id] = cost;
    const notes = { ...meetup.fareNotes?.[venue.id] };
    if (provider && cost !== undefined) notes[participant.id] = { provider, savedAt: new Date().toISOString() };
    else delete notes[participant.id];
    save({ ...meetup, fareNotes: { ...meetup.fareNotes, [venue.id]: notes }, manualMinutes: { ...meetup.manualMinutes, [venue.id]: times }, manualFares: { ...meetup.manualFares, [venue.id]: fares } });
    setMessage('Trip details saved.');
  }
  return <View style={layout.stack}>
    <Label kind="detail">{demo ? 'You can replace this demo trip with your own travel figures.' : 'Enter the expected travel time to include this trip in rankings.'}</Label>
    <Field label="Travel time (minutes)" numeric value={time} onChange={value => { setTime(value); setMessage(''); }} />
    <Field label="Travel fare (₱, optional)" inputMode="decimal" value={fare} onChange={value => { setFare(value); setProvider(undefined); setMessage(''); }} />
    <TripOptions origin={participant.point?.join(',') ?? participant.origin} destination={venue.point?.join(',') ?? [venue.name,venue.area].filter(Boolean).join(', ')}
      walking={participant.mode === 'Walking'} currentProvider={provider} currentFare={fare} onUse={(p,f) => { setProvider(p); setFare(f); setMessage(''); }} />
    {note && <Label size={13}>Saved {note.provider} fare · {new Date(note.savedAt).toLocaleString('en-PH')}</Label>}
    <Button onPress={submit}>Save trip details</Button>{!!message && <Label>{message}</Label>}
  </View>;
}
