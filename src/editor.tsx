import { useAccountSettings } from './account-settings-context';
import { ChoiceField, FormSection } from './form-controls';
import { EditorDialog } from './editor-dialog';
import { parsePoint } from './geo';
import { PlaceInput } from './place-input';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Meetup, modes, Participant } from './planner';
import { Button, Feedback, Field, Icon, Label, layout } from './ui';
import { colors, spacing } from './theme';

type Props = { participant?: Participant; close: () => void } & (
  { meetup: Meetup; save: (meetup: Meetup) => void } |
  { member: { id: string; name: string }; saveTrip: (friend: Participant) => Promise<void> }
);
export function ParticipantEditor(props: Props) {
  const { participant, close } = props;
  const settings = useAccountSettings();
  const defaults = 'member' in props && !participant ? settings.data : undefined;
  const member = 'member' in props ? props.member : undefined;
  const [name, setName] = useState(member?.name ?? participant?.name ?? '');
  const [origin, setOrigin] = useState<Participant['origin']>(participant?.origin ?? '');
  const [coordinates, setCoordinates] = useState(participant?.point?.join(', ') ?? '');
  const [mode, setMode] = useState<Participant['mode']>(participant?.mode ?? defaults?.mode ?? modes[0]);
  const [budget, setBudget] = useState(participant?.budget?.toString() ?? defaults?.budget?.toString() ?? '');
  const [duration, setDuration] = useState(participant?.maxMinutes?.toString() ?? defaults?.max_minutes?.toString() ?? '');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const invalidFare = Boolean(budget.trim()) && (!/^\d+(?:\.\d{1,2})?$/.test(budget.trim()) || Number(budget) > 9999999.99);
  const invalidTime = Boolean(duration.trim()) && (!/^\d+$/.test(duration.trim()) || Number(duration) < 1 || Number(duration) > 2147483647);
  const point = parsePoint(coordinates);
  const locationError = coordinates.trim() && !point ? 'Enter valid latitude and longitude separated by a comma.' :
    !origin.trim() && !point ? 'Search for a starting place, use your location, or choose a pin.' : undefined;
  const originLabel = origin.trim() || 'Pinned location';
  const tripChanged = participant && (participant.mode !== mode || participant.origin !== originLabel ||
    participant.point?.join() !== point?.join());
  const invalidField = !name.trim() ? 'name' : locationError ? 'starting place' : invalidFare ? 'maximum fare' : invalidTime ? 'maximum travel time' : '';
  async function submit() {
    setSubmitted(true);
    setError('');
    if (pending.current || invalidField) return;
    const limits = [budget, duration].map(value => value.trim() ? Number(value) : undefined);
    const friend = {
      id: member?.id ?? participant?.id ?? String(Date.now()), name: name.trim(), origin: originLabel, point, mode, budget: limits[0], maxMinutes: limits[1],
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
    if (participant && tripChanged) {
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
  const title = member ? 'Your starting point' : participant ? 'Edit friend' : 'Add a friend';
  const saveLabel = member ? 'Save starting point' : participant ? 'Save changes' : 'Add friend';
  const footer = <View style={{ gap: spacing.sm, flex: 1 }}>
    {!!error && <Feedback tone="error">{error}</Feedback>}
    {submitted && !!invalidField && <View accessibilityLiveRegion="polite">
      <Label kind="detail" color={colors.error}>Check the {invalidField} above.</Label>
    </View>}
    <Button busy={saving} busyLabel="Saving…" onPress={submit}>{saveLabel}</Button>
  </View>;
  return <EditorDialog title={title} close={close} busy={saving} actions={footer}>
    {member && !participant && !!settings.error && <Feedback tone="warning">Saved planning defaults could not be loaded. Enter your preferences below.</Feedback>}
    {member ? <View style={[layout.row, { alignItems: 'flex-start' }]}>
      <Icon name="users" size={18} color={colors.info} />
      <Label kind="detail">Members of this meetup can see your starting place, map pin, and travel preferences. A nearby landmark works too.</Label>
    </View> : <Field label="Name" placeholder="Your friend’s name" value={name} onChange={setName}
      error={submitted && !name.trim() ? 'Enter a name to continue.' : undefined} />}
    <PlaceInput name={origin} setName={setOrigin} coordinates={coordinates} setCoordinates={setCoordinates} />
    {submitted && !!locationError && <View accessibilityRole="alert"><Label kind="detail" color={colors.error}>{locationError}</Label></View>}
    <ChoiceField label="Transportation" value={mode} options={modes.map(value => ({ value, label: value }))} change={setMode} />
    {!!tripChanged && <Label kind="detail" color={colors.warning}>Saving this change clears previously entered times and fares for this person.</Label>}
    <FormSection title="Travel limits">
      <Label kind="detail">Optional, for one-way travel. Leave either field blank for no limit.</Label>
      <View style={[layout.wrap, { alignItems: 'flex-start', gap: spacing.lg }]}>
        <View style={{ flexGrow: 1, flexBasis: 140, minWidth: 0 }}>
          <Field label="Maximum fare (₱)" placeholder="e.g. 100" inputMode="decimal" value={budget} onChange={setBudget}
            error={submitted && invalidFare ? 'Use ₱0 to ₱9,999,999.99 with up to two decimal places.' : undefined} />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 140, minWidth: 0 }}>
          <Field label="Maximum time (min)" placeholder="e.g. 45" numeric value={duration} onChange={setDuration}
            error={submitted && invalidTime ? 'Use 1 to 2,147,483,647 whole minutes.' : undefined} />
        </View>
      </View>
    </FormSection>
  </EditorDialog>;
}
