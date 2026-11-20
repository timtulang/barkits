import { useState } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import type { Meetup } from './planner';
import { palette } from './theme';
import { Button, Field, Label, layout } from './ui';

export function MeetupEditor({ meetup, save, close }: { meetup?: Meetup; save: (value: Meetup) => void; close: () => void }) {
  const [name, setName] = useState(meetup?.name ?? '');
  const [description, setDescription] = useState(meetup?.description ?? '');
  const [activity, setActivity] = useState(meetup?.activity ?? '');
  const [date, setDate] = useState(meetup?.date ?? '');
  const [error, setError] = useState('');

  function submit(status: Meetup['status']) {
    if (!name.trim()) return setError('Enter a meetup name.');
    const when = date.trim();
    if (when && when !== meetup?.date) {
      const iso = when.replace(' ', 'T') + ':00Z';
      const timestamp = Date.parse(iso);
      if (!/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(when) || !Number.isFinite(timestamp) ||
        new Date(timestamp).toISOString().slice(0, 16) !== iso.slice(0, 16)) {
        return setError('Enter a valid date and time in YYYY-MM-DD HH:MM format.');
      }
    }
    const session = meetup ?? { participants: [], votes: {}, ratings: {} };
    save({ ...session, status, name: name.trim(), description: description.trim(), activity: activity.trim(), date: when });
  }

  return <EditorDialog title={meetup ? 'Edit meetup details' : 'Plan a meetup'} close={close}>
    <Field label="Meetup name" value={name} onChange={setName} />
    <Field label="Activity or destination category (optional)" placeholder="Coffee, dinner, a park…" value={activity} onChange={setActivity} />
    <Field label="Description (optional)" value={description} onChange={setDescription} />
    <Field label="Date and time (optional)" placeholder="YYYY-MM-DD HH:MM" value={date} onChange={setDate} />
    {!!error && <Label color={palette.plum}>{error}</Label>}
    <View style={layout.wrap}>
      {meetup ? <Button onPress={() => submit(meetup.status)}>Save changes</Button> : <>
        <Button onPress={() => submit('Planning')}>Start planning</Button>
        <Button secondary onPress={() => submit('Draft')}>Save draft</Button>
      </>}
      <Button secondary onPress={close}>Cancel</Button>
    </View>
  </EditorDialog>;
}
