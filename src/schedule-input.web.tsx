import { View } from 'react-native';
import type { ScheduleInputProps } from './meetup-schedule';
import { colors, control, font, radius, spacing } from './theme';
import { Label } from './ui';

export function ScheduleInput({ day, time, setDay, setTime, reportIncomplete, disabled, error, errorId }: ScheduleInputProps) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
    {(['date', 'time'] as const).map(kind => {
      const isDate = kind === 'date';
      const label = isDate ? 'Date' : 'Time (Philippines)';
      const invalid = error?.field === kind;
      return <label key={kind} style={{ display: 'grid', flex: '1 1 145px', minWidth: 0, gap: spacing.xs }}>
        <Label kind="label" color={colors.text}>{label}</Label>
        <input type={kind} aria-label={label} value={isDate ? day : time} disabled={disabled}
          aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined}
          onInput={event => reportIncomplete(kind, event.currentTarget.validity.badInput)}
          onKeyUp={event => reportIncomplete(kind, event.currentTarget.validity.badInput)}
          onBlur={event => reportIncomplete(kind, event.currentTarget.validity.badInput)}
          onChange={event => (isDate ? setDay : setTime)(event.target.value)}
          style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', minHeight: control.minimum,
            fontFamily: font.regular, fontSize: 16, padding: '0 12px', borderRadius: radius.control,
            border: '1px solid ' + (invalid ? colors.error : colors.outline),
            color: disabled ? colors.onDisabled : colors.text, background: disabled ? colors.disabled : colors.input }} />
      </label>;
    })}
  </View>;
}
