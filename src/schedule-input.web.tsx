import { View } from 'react-native';
import { Label, layout } from './ui';
import { palette, radius } from './theme';

type Props = { day: string; time: string; setDay: (value: string) => void; setTime: (value: string) => void };
export function ScheduleInput({ day, time, setDay, setTime }: Props) {
  return <View style={layout.wrap}>{(['date', 'time'] as const).map(kind =>
    <label key={kind} style={{ display: 'grid', gap: 4 }}>
      <Label weight="bold" size={14}>{kind === 'date' ? 'Date' : 'Time (Philippines)'}</Label>
      <input type={kind} aria-label={kind === 'date' ? 'Date' : 'Time (Philippines)'} value={kind === 'date' ? day : time}
        onChange={e => (kind === 'date' ? setDay : setTime)(e.target.value)}
        style={{ minHeight: 44, font: 'inherit', padding: '0 10px', borderRadius: radius.control, border: '1px solid ' + palette.line, background: palette.white, color: palette.ink }} />
    </label>)}</View>;
}
