export const scheduleZone = 'Asia/Manila';

type ScheduleIssue = { field: 'date' | 'time'; message: string };

export function scheduleProblem(day: string, time: string): ScheduleIssue | undefined {
  if (day) {
    const date = new Date(day + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day.startsWith('0000') ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) return { field: 'date', message: 'Choose a valid calendar date.' };
  }
  if (time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return { field: 'time', message: 'Choose a valid time.' };
  if (day && !time) return { field: 'time', message: 'Choose a time or clear the schedule.' };
  if (time && !day) return { field: 'date', message: 'Choose a date or clear the schedule.' };
}

export function readSchedule(value?: string | null) {
  if (!value) return { day: '', time: '', legacy: '' };
  const [day, time] = value.split(' ');
  if (day && time && value === day + ' ' + time && !scheduleProblem(day, time)) return { day, time, legacy: '' };
  return { day: '', time: '', legacy: value };
}

export function scheduleInstant(day: string, time: string) {
  return day + 'T' + time + ':00+08:00';
}

export function pickerFields(instant: Date) {
  const manila = new Date(instant.getTime() + 8 * 60 * 60 * 1000).toISOString();
  return { day: manila.slice(0, 10), time: manila.slice(11, 16) };
}

const display = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: scheduleZone });

export function formatSharedSchedule(instant: string) {
  return display.format(new Date(instant)) + ' · Philippine time';
}

export function formatLocalSchedule(value?: string | null) {
  const { day, time, legacy } = readSchedule(value);
  return day ? formatSharedSchedule(scheduleInstant(day, time)) : legacy;
}

export type ScheduleInputProps = {
  day: string; time: string; setDay: (day: string) => void; setTime: (time: string) => void;
  reportIncomplete: (part: 'date' | 'time', incomplete: boolean) => void;
  disabled: boolean; error?: ScheduleIssue; errorId: string;
};
