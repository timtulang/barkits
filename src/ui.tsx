import Feather from '@expo/vector-icons/Feather';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { font, palette, radius, spacing } from './theme';

export type IconName = ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 19, color = palette.ink }: { name: IconName; size?: number; color?: string }) {
  return <View aria-hidden importantForAccessibility="no-hide-descendants"><Feather name={name} size={size} color={color} /></View>;
}
export function Label({ children, size = 15, weight = 'regular', color = palette.ink, heading = false }: {
  children: ReactNode; size?: number; weight?: keyof typeof font; color?: string; heading?: boolean;
}) {
  return <Text accessibilityRole={heading ? 'header' : undefined} style={{ fontFamily: font[weight], color, fontSize: size, lineHeight: Math.ceil(size * 1.22) }}>{children}</Text>;
}
export function Button({ children, icon, onPress, secondary = false, disabled = false, accessibilityLabel }: {
  children: ReactNode; icon?: IconName; onPress: () => void; secondary?: boolean; disabled?: boolean; accessibilityLabel?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={onPress} style={({ pressed }) => [
    styles.button, secondary && styles.secondary, pressed && { opacity: 0.85 }, disabled && { opacity: 0.45 },
  ]}>
    {icon && <Icon name={icon} size={17} color={secondary ? palette.ink : palette.white} />}
    <Label weight="bold" color={secondary ? palette.ink : palette.white}>{children}</Label>
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
export function Field({ label, value, onChange, placeholder, numeric, inputMode, autoComplete }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; numeric?: boolean; inputMode?: 'numeric' | 'email'; autoComplete?: 'email' | 'one-time-code';
}) {
  return <View style={{ gap: spacing.xs }}>
    <Label size={14} weight="bold">{label}</Label>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={palette.muted}
      inputMode={inputMode ?? (numeric ? 'numeric' : 'text')} autoComplete={autoComplete}
      autoCapitalize={autoComplete ? 'none' : undefined} autoCorrect={autoComplete ? false : undefined} style={styles.input} />
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
  secondary: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line },
  chip: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, minHeight: 44, paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  selected: { backgroundColor: palette.lavender, borderColor: '#DCC8EA' },
  panel: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line, borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  input: { minHeight: 45, borderRadius: radius.control, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, paddingHorizontal: 12, color: palette.ink, fontFamily: font.regular, fontSize: 15 },
});
