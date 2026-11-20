import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import type { Meetup } from './planner';
import { ScheduleInput } from './schedule-input';
import { Button, Chip, Field, Label, layout } from './ui';

type Props = { meetup?: Meetup; save: (value: Meetup) => void; close: () => void;
  share?: (requestId: string, meetup: Meetup, name: string) => Promise<void> };

export function MeetupEditor({ meetup, save, close, share }: Props) {
  const [name, setName] = useState(meetup?.name ?? '');
  const [description, setDescription] = useState(meetup?.description ?? '');
  const [activity, setActivity] = useState(meetup?.activity ?? '');
  const previous = meetup?.date ?? '';
  const standard = /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(previous);
  const [day, setDay] = useState(standard ? previous.slice(0, 10) : '');
  const [time, setTime] = useState(standard ? previous.slice(11) : '');
  const [legacyDate, setLegacyDate] = useState(standard ? '' : previous);
  const [details, setDetails] = useState(Boolean(description || previous));
  const [shared, setShared] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef('');
  const pending = useRef(false);
  const invalidName = !name.trim() || name.trim().length > 160;
  const partialDate = Boolean(day) !== Boolean(time);
  async function submit(status: Meetup['status']) {
    setSubmitted(true);
    if (invalidName || partialDate || (shared && !memberName.trim()) || pending.current) {
      if (partialDate) setDetails(true);
      return;
    }
    const value: Meetup = { ...(meetup ?? { participants: [], votes: {}, ratings: {} }), status,
      name: name.trim(), activity: activity.trim(), description: description.trim(), date: day ? day + ' ' + time : legacyDate };
    if (!shared || !share) return save(value);
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      request.current ||= randomUUID();
      await share(request.current, value, memberName.trim());
    } catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t create the shared meetup. Try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <EditorDialog title={meetup ? 'Edit meetup details' : 'Plan a meetup'} close={busy ? () => {} : close}>
    {share && <><Label weight="bold">Who’s planning?</Label><View style={layout.wrap}>
      <Chip selected={!shared} onPress={() => setShared(false)}>On this device</Chip>
      <Chip selected={shared} onPress={() => setShared(true)}>With friends</Chip>
    </View></>}
    <Field label="Meetup name" placeholder="Saturday catch-up" value={name} onChange={setName} maxLength={160}
      error={submitted && invalidName ? 'Enter a meetup name of up to 160 characters.' : undefined} />
    {shared && <Field label="Your display name" placeholder="What your friends call you" value={memberName} onChange={setMemberName} maxLength={80}
      error={submitted && !memberName.trim() ? 'Enter the name your friends will see.' : undefined} />}
    <Field label="Activity (optional)" placeholder="Coffee, dinner, a park…" value={activity} onChange={setActivity} />
    <Button secondary icon={details ? 'chevron-up' : 'chevron-down'} onPress={() => setDetails(!details)}>{details ? 'Hide schedule and notes' : 'Add schedule or notes'}</Button>
    {details && <>
      {legacyDate && <Label>{legacyDate}</Label>}
      <ScheduleInput day={day} time={time} setDay={setDay} setTime={setTime} />
      {(day || time || legacyDate) ? <Chip onPress={() => { setDay(''); setTime(''); setLegacyDate(''); }}>Clear schedule</Chip> : null}
      {submitted && partialDate && <View accessibilityRole="alert"><Label>Choose both a date and a time, or clear the schedule.</Label></View>}
      <Field label="Notes (optional)" placeholder="Anything your friends should know?" value={description} onChange={setDescription} multiline />
    </>}
    {!!error && <View accessibilityRole="alert"><Label>{error}</Label></View>}
    <View style={layout.wrap}>
      {meetup ? <Button onPress={() => submit(meetup.status)}>Save changes</Button> : shared ?
        <Button disabled={busy} onPress={() => submit('Planning')}>{busy ? 'Creating…' : 'Create shared meetup'}</Button> : <>
          <Button onPress={() => submit('Planning')}>Start planning</Button>
          <Button secondary onPress={() => submit('Draft')}>Save draft</Button>
        </>}
      <Button secondary disabled={busy} onPress={close}>Cancel</Button>
    </View>
  </EditorDialog>;
}
