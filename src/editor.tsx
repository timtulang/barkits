import { EditorDialog } from './editor-dialog';
import { parsePoint } from './geo';
import { PlaceInput } from './place-input';
import { useState } from 'react';
import { View } from 'react-native';
import { Meetup, modes, Participant } from './planner';
import { Button, Chip, Field, Label, layout } from './ui';
import { palette } from './theme';

export function ParticipantEditor({ meetup, participant, close, save }: {
  meetup: Meetup; participant?: Participant; close: () => void; save: (meetup: Meetup) => void;
}) {
  const [name, setName] = useState(participant?.name ?? '');
  const [origin, setOrigin] = useState<Participant['origin']>(participant?.origin ?? '');
  const [coordinates, setCoordinates] = useState(participant?.point?.join(', ') ?? '');
  const [mode, setMode] = useState<Participant['mode']>(participant?.mode ?? modes[0]);
  const [budget, setBudget] = useState(participant?.budget?.toString() ?? '');
  const [duration, setDuration] = useState(participant?.maxMinutes?.toString() ?? '');
  const [error, setError] = useState('');
  function submit() {
    if (!name.trim()) return setError('Enter a name to continue.');
    const point = parsePoint(coordinates);
    if (coordinates.trim() && !point) return setError('Enter valid latitude and longitude separated by a comma.');
    if (!origin.trim() && !point) return setError('Enter a starting place, use your location, or choose a map pin.');
    const limits = [budget, duration].map(value => value.trim() ? Number(value) : undefined);
    if (limits.some(value => value !== undefined && (!Number.isFinite(value) || value < 0)) || limits[1] === 0) {
      return setError('Enter a nonnegative fare and a positive travel time, or leave the fields blank.');
    }
    const friend = {
      id: participant?.id ?? String(Date.now()), name: name.trim(), origin: origin.trim() || 'Pinned location', point, mode, budget: limits[0], maxMinutes: limits[1],
    };
    const manualFares = { ...meetup.manualFares };
    const manualMinutes = { ...meetup.manualMinutes };
    if (participant && (participant.mode !== mode || participant.origin !== friend.origin || participant.point?.join() !== point?.join())) {
      for (const venueId of Object.keys(manualMinutes)) {
        manualMinutes[venueId] = { ...manualMinutes[venueId] };
        delete manualMinutes[venueId][participant.id];
      }
      for (const venueId of Object.keys(manualFares)) {
        const fares = { ...manualFares[venueId] };
        delete fares[participant.id];
        manualFares[venueId] = fares;
      }
    }
    const participants = participant ? meetup.participants.map(item => item.id === participant.id ? friend : item) :
      [...meetup.participants, friend];
    save({ ...meetup, participants, manualFares, manualMinutes });
  }
  return <EditorDialog title={participant ? 'Edit friend' : 'Add a friend'} close={close}>
    <Field label="Name" value={name} onChange={setName} />
    <PlaceInput name={origin} setName={setOrigin} coordinates={coordinates} setCoordinates={setCoordinates} />
    <Label weight="bold">Transportation</Label>
    <View style={layout.wrap}>{modes.map(item => <Chip key={item} onPress={() => setMode(item)} selected={item === mode}>{item}</Chip>)}</View>
    <Field label="Maximum fare in ₱ (optional)" numeric value={budget} onChange={setBudget} />
    <Field label="Maximum minutes (optional)" numeric value={duration} onChange={setDuration} />
    {!!error && <Label color={palette.plum}>{error}</Label>}
    <View style={layout.wrap}><Button onPress={submit}>Save</Button><Button secondary onPress={close}>Cancel</Button></View>
  </EditorDialog>;
}
