import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { pickerFields, scheduleInstant, scheduleZone, type ScheduleInputProps } from './meetup-schedule';
import { Button, layout } from './ui';

export function ScheduleInput({ day, time, setDay, setTime, disabled }: ScheduleInputProps) {
  const [mode, setMode] = useState<'date' | 'time'>();
  const [pickerValue, setPickerValue] = useState(new Date());
  function open(kind: 'date' | 'time') {
    const now = pickerFields(new Date());
    setPickerValue(new Date(scheduleInstant(day || now.day, time || now.time)));
    setMode(kind);
  }
  function choose(value: Date) {
    const fields = pickerFields(value);
    if (mode === 'date') setDay(fields.day);
    else setTime(fields.time);
    setMode(undefined);
  }
  return <View style={layout.stack}><View style={layout.wrap}>
    <Button secondary disabled={disabled} icon="calendar" onPress={() => open('date')}
      accessibilityLabel={day ? 'Change date, ' + day : 'Choose date'}>{day || 'Choose date'}</Button>
    <Button secondary disabled={disabled} icon="clock" onPress={() => open('time')}
      accessibilityLabel={time ? 'Change time (Philippines), ' + time : 'Choose time (Philippines)'}>{time ? time + ' (Philippines)' : 'Choose time (Philippines)'}</Button>
  </View>
    {mode && !disabled && <DateTimePicker mode={mode} value={pickerValue} timeZoneName={scheduleZone}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, value) => {
        if (event.type === 'dismissed' || !value) setMode(undefined);
        else if (Platform.OS === 'ios') setPickerValue(value);
        else choose(value);
      }} />}
    {mode && !disabled && Platform.OS === 'ios' && <View style={layout.wrap}>
      <Button onPress={() => choose(pickerValue)}>Done</Button><Button quiet onPress={() => setMode(undefined)}>Cancel</Button>
    </View>}
  </View>;
}
