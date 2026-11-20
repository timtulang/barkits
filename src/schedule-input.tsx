import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, layout } from './ui';

const pad = (value: number) => String(value).padStart(2, '0');
type Props = { day: string; time: string; setDay: (value: string) => void; setTime: (value: string) => void };
export function ScheduleInput({ day, time, setDay, setTime }: Props) {
  const [mode, setMode] = useState<'date' | 'time'>();
  const [pickerValue, setPickerValue] = useState(new Date());
  function open(kind: 'date' | 'time') {
    const now = new Date();
    const value = day ? new Date(day + 'T12:00:00') : now;
    const [hours, minutes] = time.split(':').map(Number);
    if (time) value.setHours(hours, minutes);
    setPickerValue(value);
    setMode(kind);
  }
  function choose(date: Date) {
    if (mode === 'date') setDay([date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-'));
    else setTime(pad(date.getHours()) + ':' + pad(date.getMinutes()));
    setMode(undefined);
  }
  return <View style={layout.stack}><View style={layout.wrap}>
    <Button secondary icon="calendar" onPress={() => open('date')}>{day || 'Choose date'}</Button>
    <Button secondary icon="clock" onPress={() => open('time')}>{time ? time + ' (Philippines)' : 'Choose time (Philippines)'}</Button>
  </View>
    {mode && <DateTimePicker mode={mode} value={pickerValue} display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event, value) => {
        if (event.type === 'dismissed' || !value) setMode(undefined);
        else if (Platform.OS === 'ios') setPickerValue(value);
        else choose(value);
      }} />}
    {mode && Platform.OS === 'ios' && <Button onPress={() => choose(pickerValue)}>Done</Button>}
  </View>;
}
