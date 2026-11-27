import { useEffect, useId, useImperativeHandle, useState, type Ref } from 'react';
import { View } from 'react-native';
import { readSchedule, scheduleProblem } from './meetup-schedule';
import { ScheduleInput } from './schedule-input';
import { Button, Feedback, Label, Panel } from './ui';

export function PlanningSchedule({ date, save, continuePlanning, reportDirty, ref }: {
  date: string; save: (date: string) => void; continuePlanning: () => void; reportDirty: (dirty: boolean) => void;
  ref: Ref<{ advance: () => void }>;
}) {
  const [schedule, setSchedule] = useState(() => readSchedule(date));
  const [incomplete, setIncomplete] = useState({ date: false, time: false });
  const [version, setVersion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const errorId = useId();
  const { day, time, legacy } = schedule;
  const issue = incomplete.date ? { field: 'date' as const, message: 'Finish the date or clear the schedule.' } :
    incomplete.time ? { field: 'time' as const, message: 'Finish the time or clear the schedule.' } : scheduleProblem(day, time);
  const value = day ? day + ' ' + time : legacy;
  const dirty = value !== date || incomplete.date || incomplete.time;
  useEffect(() => reportDirty(dirty), [dirty, reportDirty]);
  function advance() {
    setSubmitted(true);
    if (issue) return;
    if (dirty) save(value);
    continuePlanning();
  }
  useImperativeHandle(ref, () => ({ advance }));
  return <Panel>
    <Label kind="detail">Add a date and time, or decide later.</Label>
    {!!legacy && !(day && time) && <Label>Saved schedule · {legacy}</Label>}
    <ScheduleInput key={version} day={day} time={time} disabled={false} error={submitted ? issue : undefined} errorId={errorId}
      reportIncomplete={(part, value) => setIncomplete(current => current[part] === value ? current : { ...current, [part]: value })}
      setDay={day => setSchedule(current => ({ ...current, day }))} setTime={time => setSchedule(current => ({ ...current, time }))} />
    {submitted && issue && <View nativeID={errorId}><Feedback tone="error">{issue.message}</Feedback></View>}
    {!!(day || time || legacy || incomplete.date || incomplete.time) && <Button quiet onPress={() => {
      setSchedule(readSchedule()); setIncomplete({ date: false, time: false }); setVersion(value => value + 1);
    }}>Clear schedule</Button>}
    {dirty && <Label kind="detail">Schedule changes are not saved yet. They stay here while you visit other planning stages.</Label>}
  </Panel>;
}
