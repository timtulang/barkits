import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, control, radius, spacing } from './theme';
import { Icon, Label, type IconName } from './ui-text';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
const variants = {
  primary: { background: colors.primary, foreground: colors.onPrimary, hover: colors.primaryHover, pressed: colors.primaryPressed, border: colors.primary },
  secondary: { background: colors.surface, foreground: colors.text, hover: colors.hover, pressed: colors.pressed, border: colors.outline },
  quiet: { background: 'transparent', foreground: colors.onSelected, hover: colors.selected, pressed: colors.pressed, border: 'transparent' },
  danger: { background: colors.error, foreground: colors.onPrimary, hover: colors.errorHover, pressed: colors.errorPressed, border: colors.error },
} satisfies Record<ButtonVariant, { background: string; foreground: string; hover: string; pressed: string; border: string }>;

export function Button({ children, icon, onPress, secondary = false, quiet = false, disabled = false,
  accessibilityLabel, expanded, variant, busy = false, busyLabel }: {
  children: ReactNode; icon?: IconName; onPress: () => void; secondary?: boolean; quiet?: boolean;
  expanded?: boolean; disabled?: boolean; accessibilityLabel?: string; variant?: ButtonVariant;
  busy?: boolean; busyLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const state = variants[variant ?? (quiet ? 'quiet' : secondary ? 'secondary' : 'primary')];
  const inactive = disabled || busy;
  const foreground = disabled ? colors.onDisabled : state.foreground;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    accessibilityState={{ expanded, disabled: inactive, busy }} aria-busy={busy} aria-expanded={expanded}
    disabled={inactive} onPress={onPress}
    onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
    style={({ pressed }) => [styles.button, { borderColor: disabled ? colors.disabled : state.border,
      backgroundColor: disabled ? colors.disabled : !inactive && pressed ? state.pressed : !inactive && hovered ? state.hover : state.background }]}>
    {busy ? <ActivityIndicator size="small" color={foreground} aria-hidden importantForAccessibility="no-hide-descendants" /> :
      icon && <Icon name={icon} size={control.icon} color={foreground} />}
    <View style={styles.text}><Label weight="bold" color={foreground}>{busy && busyLabel ? busyLabel : children}</Label></View>
  </Pressable>;
}

export function Chip({ children, selected = false, onPress, icon, disabled = false }: {
  children: ReactNode; selected?: boolean; onPress?: () => void; icon?: IconName; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const foreground = disabled ? colors.onDisabled : selected ? colors.onSelected : colors.textMuted;
  const content = <>
    {(selected || icon) && <Icon name={selected ? 'check' : icon!} size={16} color={foreground} />}
    <View style={styles.text}><Label kind="label" color={foreground}>{children}</Label></View>
  </>;
  const base = [styles.chip, { borderColor: selected ? colors.onSelected : colors.outline,
    backgroundColor: selected ? colors.selected : colors.surface }, disabled && { backgroundColor: colors.disabled, borderColor: colors.disabled }];
  return onPress ? <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled}
    {...(Platform.OS === 'web' ? { 'aria-pressed': selected } : {})}
    onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
    style={({ pressed }) => [base, !disabled && (pressed || hovered) && { backgroundColor: pressed ? colors.pressed : colors.hover }]}>
    {content}
  </Pressable> : <View style={base}>{content}</View>;
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
    minHeight: control.minimum, maxWidth: '100%', minWidth: control.minimum, borderWidth: control.border,
    borderRadius: radius.control, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  text: { flexShrink: 1, minWidth: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    minHeight: control.minimum, maxWidth: '100%', borderWidth: control.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
});
