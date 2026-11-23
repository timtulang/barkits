import { EditorDialog } from './editor-dialog';
import { parsePoint } from './geo';
import { PlaceInput } from './place-input';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Meetup, modes, Participant } from './planner';
import { Button, Chip, Field, Label, layout } from './ui';
import { palette } from './theme';

type Props = { participant?: Participant; close: () => void } & (
  { meetup: Meetup; save: (meetup: Meetup) => void } |
  { member: { id: string; name: string }; saveTrip: (friend: Participant) => Promise<void> }
);
export function ParticipantEditor(props: Props) {
  const { participant, close } = props;
  const member = 'member' in props ? props.member : undefined;
  const [name, setName] = useState(member?.name ?? participant?.name ?? '');
  const [origin, setOrigin] = useState<Participant['origin']>(participant?.origin ?? '');
  const [coordinates, setCoordinates] = useState(participant?.point?.join(', ') ?? '');
  const [mode, setMode] = useState<Participant['mode']>(participant?.mode ?? modes[0]);
  const [budget, setBudget] = useState(participant?.budget?.toString() ?? '');
  const [duration, setDuration] = useState(participant?.maxMinutes?.toString() ?? '');
  const [error, setError] = useState('');
  const [limitsOpen, setLimitsOpen] = useState(Boolean(budget || duration));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const invalidFare = Boolean(budget.trim()) && (!/^\d+(?:\.\d{1,2})?$/.test(budget.trim()) || Number(budget) > 9999999.99);
  const invalidTime = Boolean(duration.trim()) && (!/^\d+$/.test(duration.trim()) || Number(duration) < 1 || Number(duration) > 2147483647);
  async function submit() {
    setSubmitted(true);
    setError('');
    if (pending.current || !name.trim()) return;
    if (invalidFare || invalidTime) { setLimitsOpen(true); return; }
    const point = parsePoint(coordinates);
    if (coordinates.trim() && !point) return setError('Enter valid latitude and longitude separated by a comma.');
    if (!origin.trim() && !point) return setError('Enter a starting place, use your location, or choose a map pin.');
    const limits = [budget, duration].map(value => value.trim() ? Number(value) : undefined);
    const friend = {
      id: member?.id ?? participant?.id ?? String(Date.now()), name: name.trim(), origin: origin.trim() || 'Pinned location', point, mode, budget: limits[0], maxMinutes: limits[1],
    };
    if ('saveTrip' in props) {
      pending.current = true;
      setSaving(true);
      try { await props.saveTrip(friend); }
      catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t save your starting point. Try again.'); }
      finally { pending.current = false; setSaving(false); }
      return;
    }
    const { meetup, save } = props;
    const fareNotes = { ...meetup.fareNotes };
    const manualFares = { ...meetup.manualFares };
    const manualMinutes = { ...meetup.manualMinutes };
    if (participant && (participant.mode !== mode || participant.origin !== friend.origin || participant.point?.join() !== point?.join())) {
      for (const venueId of Object.keys(fareNotes)) {
        fareNotes[venueId] = { ...fareNotes[venueId] };
        delete fareNotes[venueId][participant.id];
      }
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
    save({ ...meetup, participants, fareNotes, manualFares, manualMinutes });
  }
  return <EditorDialog title={member ? 'Your starting point' : participant ? 'Edit friend' : 'Add a friend'} close={() => { if (!saving) close(); }}>
    {member ? <Label>Your starting point and travel preferences are visible to members of this meetup.</Label> :
      <Field label="Name" placeholder="Your friend’s name" value={name} onChange={setName}
        error={submitted && !name.trim() ? 'Enter a name to continue.' : undefined} />}
    <PlaceInput name={origin} setName={setOrigin} coordinates={coordinates} setCoordinates={setCoordinates} />
    <Label weight="bold">Transportation</Label>
    <View style={layout.wrap}>{modes.map(item => <Chip key={item} onPress={() => setMode(item)} selected={item === mode}>{item}</Chip>)}</View>
    <Button secondary icon={limitsOpen ? 'chevron-up' : 'chevron-down'} onPress={() => setLimitsOpen(!limitsOpen)}>{limitsOpen ? 'Hide travel limits' : 'Add travel limits'}</Button>
    {limitsOpen && <>
      <Field label="Maximum fare in ₱ (optional)" placeholder="e.g. 100" inputMode="decimal" value={budget} onChange={setBudget}
        error={submitted && invalidFare ? 'Enter a fare from ₱0 to ₱9,999,999.99 with up to two decimal places.' : undefined} />
      <Field label="Maximum minutes (optional)" placeholder="e.g. 45" numeric value={duration} onChange={setDuration}
        error={submitted && invalidTime ? 'Enter a positive whole number of minutes.' : undefined} />
    </>}
    {!!error && <View accessibilityRole="alert"><Label color={palette.plum}>{error}</Label></View>}
    <View style={layout.wrap}><Button disabled={saving} onPress={submit}>{saving ? 'Saving…' : 'Save'}</Button><Button secondary disabled={saving} onPress={close}>Cancel</Button></View>
  </EditorDialog>;
}
