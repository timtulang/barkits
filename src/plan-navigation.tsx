import { Pressable, View } from 'react-native';
import { Label } from './ui';
import { palette, spacing } from './theme';

const sections = [
  { id: 'nearby', label: 'Nearby places' },
  { id: 'trips', label: 'Travel rankings' },
  { id: 'details', label: 'Trip details' },
] as const;
export type PlanSection = typeof sections[number]['id'];

export function PlanNavigation({ current, change }: { current: PlanSection; change: (id: PlanSection) => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderColor: palette.line }}>
    {sections.map(({ id, label }) => <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: current === id }}
      onPress={() => change(id)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
        paddingVertical: spacing.xs, borderBottomWidth: 3, borderColor: current === id ? palette.plum : 'transparent' }}>
      <Label weight="bold" size={14} color={current === id ? palette.plum : palette.muted}>{label}</Label>
    </Pressable>)}
  </View>;
}
