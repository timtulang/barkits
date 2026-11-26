import { useId, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { colors, spacing } from './theme';
import { surfaces } from './ui-styles';
import { Icon, Label } from './ui-text';

export function Field({ label, value, onChange, placeholder, numeric, inputMode, autoComplete, error, maxLength,
  multiline, hint, required = false, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; numeric?: boolean;
  error?: string; required?: boolean; maxLength?: number; multiline?: boolean; inputMode?: 'numeric' | 'decimal' | 'email';
  autoComplete?: 'email' | 'one-time-code'; hint?: string; disabled?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const description = error || hint;
  return <View style={{ gap: spacing.sm, minWidth: 0 }}>
    <Label kind="label" color={colors.text}>{label}{required ? ' (required)' : ''}</Label>
    <TextInput accessibilityLabel={label} accessibilityHint={[required && 'Required.', description].filter(Boolean).join(' ') || undefined} accessibilityState={{ disabled }} aria-disabled={disabled}
      {...(Platform.OS === 'web' ? { 'aria-invalid': !!error, 'aria-required': required || undefined, 'aria-describedby': description ? id : undefined } : {})}
      value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted}
      editable={!disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      maxLength={maxLength} multiline={multiline} inputMode={inputMode ?? (numeric ? 'numeric' : 'text')}
      autoComplete={autoComplete} autoCapitalize={autoComplete ? 'none' : undefined} autoCorrect={autoComplete ? false : undefined}
      selectionColor={colors.focus} style={[surfaces.input, multiline && { minHeight: 112, textAlignVertical: 'top' },
        focused && surfaces.focused, !!error && { borderColor: colors.error }, disabled && surfaces.disabled]} />
    {!!description && <View nativeID={id} accessibilityRole={error ? 'alert' : undefined}
      accessibilityLiveRegion={error ? 'polite' : undefined} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
      {!!error && <Icon name="alert-circle" size={18} color={colors.error} />}
      <Label kind="detail" color={error ? colors.error : colors.textMuted}>{description}</Label>
    </View>}
  </View>;
}
