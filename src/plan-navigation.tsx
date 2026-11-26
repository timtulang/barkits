import { Platform, Pressable, View } from 'react-native';
import { colors, control, radius, spacing } from './theme';
import { Label } from './ui';

export const localSections = [
  { id: 'nearby', label: 'Explore places' },
  { id: 'trips', label: 'Compare places & vote' },
] as const;
export type PlanSection = typeof localSections[number]['id'];

export function PlanNavigation<T extends string>({ sections, current, change }: {
  sections: readonly { id: T; label: string }[]; current: T; change: (id: T) => void;
}) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, padding: spacing.xs,
    backgroundColor: colors.hover, borderRadius: radius.control }}>
    {sections.map(({ id, label }) => {
      const selected = current === id;
      return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected }}
        {...(Platform.OS === 'web' ? { 'aria-pressed': selected } : {})} onPress={() => change(id)}
        style={({ pressed }) => ({ flexGrow: 1, flexBasis: 80, minHeight: control.minimum, alignItems: 'center',
          justifyContent: 'center', padding: spacing.xs, borderRadius: radius.control,
          backgroundColor: selected ? colors.primary : pressed ? colors.pressed : 'transparent' })}>
        <Label kind="label" color={selected ? colors.onPrimary : colors.textMuted}>{label}</Label>
      </Pressable>;
    })}
  </View>;
}
