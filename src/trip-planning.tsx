import { useState } from 'react';
import { View } from 'react-native';
import { directDistance, parsePoint } from './geo';
import { PlaceInput } from './place-input';
import { demoJourney, Meetup, Participant, Venue, venues } from './planner';
import { Button, Chip, Field, Label, layout, Panel } from './ui';

export function TripPlanning({ meetup, save, participant }: { meetup: Meetup; save: (m: Meetup) => void; participant?: Participant }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(venues[0].id);
  const places = [...venues, ...meetup.customVenues ?? []];
  const venue = places.find(item => item.id === selected)!;
  function add() {
    const point = parsePoint(coordinates);
    if (!place.trim()) return setError('Enter a name for the meeting place.');
    if (coordinates.trim() && !point) return setError('Enter valid latitude and longitude.');
    const spot: Venue = { id: 'place-' + Date.now(), name: place.trim(), area: 'Group suggestion', icon: 'sun', color: 'mint', category: 'Custom', point };
    save({ ...meetup, customVenues: [...meetup.customVenues ?? [], spot] });
    setSelected(spot.id); setPlace(''); setCoordinates(''); setAdding(false); setError(''); setEditing(true);
  }
  return <Panel>
    <View style={layout.wrap}>
      <Button secondary icon="map-pin" onPress={() => setAdding(!adding)}>{adding ? 'Cancel new place' : 'Suggest a meeting place'}</Button>
      {participant && <Button secondary icon="edit-2" onPress={() => setEditing(!editing)}>{editing ? 'Hide trip inputs' : 'Enter trip details'}</Button>}
    </View>
    {adding && <><PlaceInput destination name={place} setName={setPlace} coordinates={coordinates} setCoordinates={setCoordinates} />
      {!!error && <Label>{error}</Label>}<Button onPress={add}>Add meeting place</Button></>}
    {editing && participant && <>
      <Label weight="bold">Trip for {participant.name}</Label>
      <View style={layout.wrap}>{places.map(item => <Chip key={item.id} selected={item.id === selected} onPress={() => setSelected(item.id)}>{item.name}</Chip>)}</View>
      {participant.point && venue.point && <Label>{directDistance(participant.point, venue.point).toFixed(1)} km straight-line distance</Label>}
      <TripFields key={participant.id + ':' + venue.id} participant={participant} meetup={meetup} venue={venue} save={save} />
    </>}
  </Panel>;
}

function TripFields({ participant, meetup, venue, save }: { participant: Participant; meetup: Meetup; venue: Venue; save: (m: Meetup) => void }) {
  const savedTime = meetup.manualMinutes?.[venue.id]?.[participant.id];
  const savedFare = meetup.manualFares?.[venue.id]?.[participant.id];
  const [time, setTime] = useState(savedTime?.toString() ?? '');
  const [fare, setFare] = useState(savedFare?.toString() ?? '');
  const [message, setMessage] = useState('');
  const demo = demoJourney(venue, participant);
  function submit() {
    const minutes = time.trim() ? Number(time) : undefined;
    const cost = fare.trim() ? Number(fare) : undefined;
    if ([minutes, cost].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) {
      return setMessage('Enter a nonnegative number or leave the field blank.');
    }
    const times = { ...meetup.manualMinutes?.[venue.id] };
    const fares = { ...meetup.manualFares?.[venue.id] };
    if (minutes === undefined) delete times[participant.id]; else times[participant.id] = minutes;
    if (cost === undefined) delete fares[participant.id]; else fares[participant.id] = cost;
    save({ ...meetup, manualMinutes: { ...meetup.manualMinutes, [venue.id]: times }, manualFares: { ...meetup.manualFares, [venue.id]: fares } });
    setMessage('Trip details saved.');
  }
  return <View style={layout.stack}>
    <Label>{demo ? 'You can replace this demo trip with your own travel figures.' : 'Enter the expected travel time to include this trip in rankings.'}</Label>
    <Field label="Travel time (minutes)" numeric value={time} onChange={value => { setTime(value); setMessage(''); }} />
    <Field label="Travel fare (₱, optional)" numeric value={fare} onChange={value => { setFare(value); setMessage(''); }} />
    <Button onPress={submit}>Save trip details</Button>{!!message && <Label>{message}</Label>}
  </View>;
}
