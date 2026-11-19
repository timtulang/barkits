import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Meetup, modes, origins, Participant } from './planner';
import { Button, Chip, Field, Label, layout, Panel } from './ui';
import { palette } from './theme';

export function Editor({ kind, meetup, participant, close, save }: {
  kind: 'new' | 'participant'; meetup: Meetup; participant?: Participant; close: () => void; save: (meetup: Meetup) => void;
}) {
  const [name, setName] = useState(participant?.name ?? '');
  const [date, setDate] = useState('');
  const [origin, setOrigin] = useState<Participant['origin']>(participant?.origin ?? origins[0]);
  const [mode, setMode] = useState<Participant['mode']>(participant?.mode ?? modes[0]);
  const [budget, setBudget] = useState(participant?.budget?.toString() ?? '');
  const [duration, setDuration] = useState(participant?.maxMinutes?.toString() ?? '');
  const [error, setError] = useState('');
  function submit() {
    if (!name.trim()) return setError('Enter a name to continue.');
    if (kind === 'new') {
      if (date.trim() && !Number.isFinite(Date.parse(date.trim()))) return setError('Use a date and time such as 2026-12-05 15:00.');
      return save({ name: name.trim(), date: date.trim(), participants: [], status: 'Planning', votes: {}, ratings: {} });
    }
    const limits = [budget, duration].map(value => value.trim() ? Number(value) : undefined);
    if (limits.some(value => value !== undefined && (!Number.isFinite(value) || value < 0)) || limits[1] === 0) {
      return setError('Enter a nonnegative fare and a positive travel time, or leave the fields blank.');
    }
    const friend = {
      id: participant?.id ?? String(Date.now()), name: name.trim(), origin, mode, budget: limits[0], maxMinutes: limits[1],
    };
    const manualFares = { ...meetup.manualFares };
    if (participant && (participant.mode !== mode || participant.origin !== origin)) {
      for (const venueId of Object.keys(manualFares)) {
        const fares = { ...manualFares[venueId] };
        delete fares[participant.id];
        manualFares[venueId] = fares;
      }
    }
    const participants = participant ? meetup.participants.map(item => item.id === participant.id ? friend : item) :
      [...meetup.participants, friend];
    save({ ...meetup, participants, manualFares });
  }
  return <Modal transparent animationType="none" visible onRequestClose={close}>
    <View style={{ flex: 1, backgroundColor: '#291D3277', justifyContent: 'center', padding: 18 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Panel style={{ width: '100%', maxWidth: 490, alignSelf: 'center' }}>
          <Label size={27} weight="title">{kind === 'new' ? 'Plan a meetup' : participant ? 'Edit friend' : 'Add a friend'}</Label>
          <Field label={kind === 'new' ? 'Meetup name' : 'Name'} value={name} onChange={setName} />
          {kind === 'new' ? <Field label="Date and time (optional)" placeholder="YYYY-MM-DD HH:MM" value={date} onChange={setDate} /> : <>
            <Label weight="bold">Starting city</Label>
            <View style={layout.wrap}>{origins.map(item => <Chip key={item} onPress={() => setOrigin(item)} selected={item === origin}>{item}</Chip>)}</View>
            <Label weight="bold">Transportation</Label>
            <View style={layout.wrap}>{modes.map(item => <Chip key={item} onPress={() => setMode(item)} selected={item === mode}>{item}</Chip>)}</View>
            <Field label="Maximum fare in ₱ (optional)" numeric value={budget} onChange={setBudget} />
            <Field label="Maximum minutes (optional)" numeric value={duration} onChange={setDuration} />
          </>}
          {!!error && <Label color={palette.plum}>{error}</Label>}
          <View style={layout.wrap}><Button onPress={submit}>Save</Button><Button secondary onPress={close}>Cancel</Button></View>
        </Panel>
      </ScrollView>
    </View>
  </Modal>;
}
