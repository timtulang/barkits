import { randomUUID } from 'expo-crypto';
import { useId, useRef, useState } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import { FormSection } from './form-controls';
import { newMeetupId } from './meetup-storage';
import { readSchedule, scheduleProblem } from './meetup-schedule';
import type { Meetup } from './planner';
import { ScheduleInput } from './schedule-input';
import { SharedRequestError } from './services/shared-client';
import { colors, spacing } from './theme';
import { Button, Chip, Feedback, Field, Icon, Label, layout } from './ui';

type Props = { meetup?: Meetup; save: (value: Meetup) => void; close: () => void;
  defaultMemberName?: string; share?: (requestId: string, meetup: Meetup, name: string) => Promise<void> };

export function MeetupEditor({ meetup, save, close, share, defaultMemberName }: Props) {
  const [name, setName] = useState(meetup?.name ?? '');
  const [description, setDescription] = useState(meetup?.description ?? '');
  const [activity, setActivity] = useState(meetup?.activity ?? '');
  const [schedule, setSchedule] = useState(() => readSchedule(meetup?.date));
  const [incomplete, setIncomplete] = useState({ date: false, time: false });
  const [pickerVersion, setPickerVersion] = useState(0);
  const [shared, setShared] = useState(false);
  const [showOptional, setShowOptional] = useState(!!meetup);
  const [memberName, setMemberName] = useState(Array.from(defaultMemberName ?? '').slice(0, 80).join(''));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  const request = useRef('');
  const pending = useRef(false);
  const errorId = useId();
  const locked = busy || uncertain;
  const { day, time, legacy } = schedule;
  const issue = incomplete.date ? { field: 'date' as const, message: 'Finish entering the date or clear the schedule.' } :
    incomplete.time ? { field: 'time' as const, message: 'Finish entering the time or clear the schedule.' } : scheduleProblem(day, time);
  function clearSchedule() {
    setSchedule(readSchedule());
    setIncomplete({ date: false, time: false });
    setPickerVersion(value => value + 1);
  }
  const invalidName = !name.trim() || name.trim().length > 160;
  const invalidMember = shared && !memberName.trim();
  const invalidField = invalidName ? 'meetup name' : invalidMember ? 'display name' : issue?.field;

  async function submit(status: Meetup['status']) {
    if (pending.current) return;
    setSubmitted(true);
    if (invalidField) { if (issue) setShowOptional(true); return; }
    pending.current = true;
    const value: Meetup = { ...(meetup ?? { id: newMeetupId(), participants: [], votes: {}, ratings: {} }), status,
      name: name.trim(), activity: activity.trim(), description: description.trim(), date: day ? day + ' ' + time : legacy };
    if (!shared || !share) {
      save(value);
      return;
    }
    setBusy(true);
    setError('');
    try {
      request.current ||= randomUUID();
      await share(request.current, value, memberName.trim());
    } catch (problem) {
      const ambiguous = problem instanceof SharedRequestError &&
        (problem.status === 0 || problem.status === 408 || (problem.status ?? 0) >= 500);
      if (ambiguous || uncertain) {
        setUncertain(true);
        setError('We couldn’t confirm whether the meetup was created. Retry with these same details to open it.');
      } else {
        setError(problem instanceof Error ? problem.message : 'Couldn’t create the shared meetup. Try again.');
      }
    } finally { pending.current = false; setBusy(false); }
  }

  const footer = <View style={{ flex: 1, gap: spacing.sm }}>
    {!!error && <Feedback tone="error">{error}</Feedback>}
    {submitted && !!invalidField && <View accessibilityLiveRegion="polite">
      <Label kind="detail" color={colors.error}>Check the {invalidField} above.</Label>
    </View>}
    <View style={layout.wrap}>
      {meetup ? <Button onPress={() => submit(meetup.status)}>Save changes</Button> : shared ?
        <Button busy={busy} busyLabel="Creating…" onPress={() => submit('Planning')}>
          {error ? 'Retry creation' : 'Create shared meetup'}
        </Button> : <>
          <Button onPress={() => submit('Planning')}>Create meetup & add friends</Button>
          <Button quiet onPress={() => submit('Draft')}>Save draft</Button>
        </>}
    </View>
  </View>;
  return <EditorDialog title={meetup ? 'Edit meetup details' : 'Plan a meetup'} close={close} busy={busy} actions={footer}>
    <Field label="Meetup name" required placeholder="Saturday merienda" value={name} onChange={setName} maxLength={160} disabled={locked}
      error={submitted && invalidName ? 'Enter a meetup name of up to 160 characters.' : undefined} />
    {!share && !meetup && <Label kind="detail">This plan stays on this device.</Label>}
    {share && <View style={{ gap: spacing.sm }}>
      <Label kind="label" color={colors.text}>Who’s planning?</Label>
      <View style={layout.wrap}>
        <Chip disabled={locked} selected={!shared} onPress={() => { setShared(false); setError(''); }}>On this device</Chip>
        <Chip disabled={locked} selected={shared} onPress={() => { setShared(true); setError(''); }}>With friends</Chip>
      </View>
      <Label kind="detail">{shared ? 'Invite friends with a code. Each person adds their own starting point.' :
        'You add everyone’s starting points. This plan stays on this device.'}</Label>
    </View>}
    {shared && <Field label="Your display name" required placeholder="What your friends call you" value={memberName}
      onChange={setMemberName} maxLength={80} disabled={locked}
      error={submitted && invalidMember ? 'Enter the name your friends will see.' : undefined} />}
    {!meetup && <Button quiet expanded={showOptional} disabled={locked} onPress={() => setShowOptional(!showOptional)}>
      {showOptional ? 'Hide optional details' : 'Add activity, notes or time (optional)'}
    </Button>}
    <View style={[layout.stack, { display: showOptional ? 'flex' : 'none' }]}>
    <Field label="Activity (optional)" placeholder="Coffee, dinner, a park…" value={activity} onChange={setActivity} disabled={locked} />
    <Field label="Notes (optional)" placeholder="Anything the group should know?" value={description} onChange={setDescription}
      multiline disabled={locked} />
    <FormSection title="Schedule">
      <Label kind="detail">Optional. Add a date and time together, or decide later.</Label>
      {!!legacy && !(day && time) && <Label kind="value">Saved schedule · {legacy}</Label>}
      <ScheduleInput key={pickerVersion} day={day} time={time} disabled={locked} error={submitted ? issue : undefined} errorId={errorId}
        reportIncomplete={(part, value) => setIncomplete(current => current[part] === value ? current : { ...current, [part]: value })}
        setDay={day => setSchedule(current => ({ ...current, day }))}
        setTime={time => setSchedule(current => ({ ...current, time }))} />
      {submitted && issue && <View nativeID={errorId} accessibilityRole="alert" style={layout.row}>
        <Icon name="alert-circle" size={16} color={colors.error} /><Label kind="detail" color={colors.error}>{issue.message}</Label>
      </View>}
      {!!(day || time || legacy || incomplete.date || incomplete.time) && <Button quiet disabled={locked} onPress={clearSchedule}>Clear schedule</Button>}
    </FormSection>
    </View>
  </EditorDialog>;
}
