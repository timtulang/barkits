import Feather from '@expo/vector-icons/Feather';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { font, palette, radius, spacing, typography } from './theme';

export type IconName = ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 19, color = palette.ink }: { name: IconName; size?: number; color?: string }) {
  return <View aria-hidden importantForAccessibility="no-hide-descendants"><Feather name={name} size={size} color={color} /></View>;
}
export function Label({ children, kind = 'body', size = typography[kind].size, weight = typography[kind].weight, color = typography[kind].color, heading = false, numberOfLines }: {
  children: ReactNode; kind?: keyof typeof typography; size?: number; weight?: keyof typeof font; color?: string; heading?: boolean; numberOfLines?: number;
}) {
  return <Text numberOfLines={numberOfLines} accessibilityRole={heading ? 'header' : undefined} style={{ fontFamily: font[weight], color, fontSize: size, letterSpacing: weight === 'title' ? -size * 0.028 : 0, lineHeight: Math.ceil(size * (weight === 'title' ? 1.13 : 1.4)), fontVariant: kind === 'value' ? ['tabular-nums'] : undefined }}>{children}</Text>;
}
export function Button({ children, icon, onPress, secondary = false, quiet = false, disabled = false, accessibilityLabel, expanded }: {
  children: ReactNode; icon?: IconName; onPress: () => void; secondary?: boolean; quiet?: boolean; expanded?: boolean; disabled?: boolean; accessibilityLabel?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ expanded, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [
    styles.button, secondary && styles.secondary, quiet && styles.quiet, pressed && { opacity: 0.85 }, disabled && { opacity: 0.45 },
  ]}>
    {icon && <Icon name={icon} size={17} color={quiet ? palette.plum : secondary ? palette.ink : palette.white} />}
    <Label weight="bold" color={quiet ? palette.plum : secondary ? palette.ink : palette.white}>{children}</Label>
  </Pressable>;
}
export function Chip({ children, selected, onPress, icon }: {
  children: ReactNode; selected?: boolean; onPress?: () => void; icon?: IconName;
}) {
  const content = <>{icon && <Icon name={icon} size={15} color={selected ? palette.plum : palette.muted} />}
    <Label size={13} weight="bold" color={selected ? palette.plum : palette.muted}>{children}</Label></>;
  const style = [styles.chip, selected && styles.selected];
  return onPress ? <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={style}>{content}</Pressable>
    : <View style={style}>{content}</View>;
}
export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
export function Field({ label, value, onChange, placeholder, numeric, inputMode, autoComplete, error, maxLength, multiline }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; numeric?: boolean; error?: string; maxLength?: number; multiline?: boolean; inputMode?: 'numeric' | 'decimal' | 'email'; autoComplete?: 'email' | 'one-time-code';
}) {
  return <View style={{ gap: spacing.xs }}>
    <Label kind="label">{label}</Label>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={palette.muted}
      maxLength={maxLength} multiline={multiline} inputMode={inputMode ?? (numeric ? 'numeric' : 'text')} autoComplete={autoComplete}
      autoCapitalize={autoComplete ? 'none' : undefined} autoCorrect={autoComplete ? false : undefined} style={[styles.input, multiline && { minHeight: 78, paddingVertical: 10, textAlignVertical: 'top' }, !!error && { borderColor: palette.plum }]} />
    {!!error && <View accessibilityRole="alert"><Label size={14} color={palette.plum}>{error}</Label></View>}
  </View>;
}
export const layout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  stack: { gap: spacing.md },
});
const styles = StyleSheet.create({
  button: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', minHeight: 44, borderRadius: radius.control, paddingHorizontal: 17, paddingVertical: 10, backgroundColor: palette.ink },
  quiet: { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 4 },
  secondary: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line },
  chip: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, minHeight: 44, paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  selected: { backgroundColor: palette.lavender, borderColor: '#DCC8EA' },
  panel: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line, borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  input: { minHeight: 45, borderRadius: radius.control, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, paddingHorizontal: 12, color: palette.ink, fontFamily: font.regular, fontSize: 16 },
});
