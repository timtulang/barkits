import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { peopleProgress, type PlanningStage } from './planning-progress';
import { colors, control, radius, spacing } from './theme';
import { Icon, Label } from './ui';

export const planningStages = [
  { id: 'who', label: 'Who', title: 'Who is joining?', icon: 'users' },
  { id: 'when', label: 'When', title: 'When will you meet?', icon: 'calendar' },
  { id: 'where', label: 'Where', title: 'Where should you meet?', icon: 'map' },
  { id: 'review', label: 'Review', title: 'Review your plan', icon: 'flag' },
] as const;

export function PlanningRoute({ current, change, people, mapped, scheduled, destination }: {
  current: PlanningStage; change: (stage: PlanningStage) => void; people: number; mapped: number;
  scheduled: boolean; destination: boolean;
}) {
  const completed = [people > 0 && mapped === people, scheduled, destination, destination];
  const summary = [
    peopleProgress(people, mapped),
    scheduled ? 'Time set' : 'Time optional',
    destination ? 'Destination confirmed' : 'Destination undecided',
    destination ? 'Plan confirmed' : 'Review your plan',
  ];

  return <View accessibilityLabel="Planning stages" role="navigation" style={styles.route}>
    <View pointerEvents="none" aria-hidden style={styles.line} />
    {planningStages.map(({ id, label, title, icon }, index) => {
      const active = id === current;
      const done = completed[index];
      const arrival = id === 'review';
      return <Pressable key={id} accessibilityRole="button"
        accessibilityLabel={`${index + 1}. ${label}. ${summary[index]}. Step ${index + 1} of ${planningStages.length}`}
        accessibilityState={{ selected: active }} accessibilityHint={title}
        {...(Platform.OS === 'web' ? { 'aria-current': active ? 'step' as const : undefined } : {})}
        onPress={() => { if (!active) change(id); }} style={styles.step}>
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
          <>
            <View style={[styles.node, arrival && styles.pin, done && styles.completed, active && styles.current,
              (pressed || hovered) && !done && !active && styles.highlight]}>
              <View style={arrival && styles.pinIcon}>
                <Icon name={done ? 'check' : icon} size={16}
                  color={active ? colors.onProgressCurrent : done ? colors.onPrimary : colors.onSelected} />
              </View>
            </View>
            <View style={[styles.legend, active && styles.currentLegend]}>
              <Label kind="label" color={active || done ? colors.text : colors.textMuted}>{label}</Label>
            </View>
          </>
        )}
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  route: { flexDirection: 'row', position: 'relative' },
  line: { position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 2, backgroundColor: colors.outline },
  step: { flex: 1, minWidth: 0, minHeight: control.minimum, borderRadius: radius.control,
    alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.xs, gap: spacing.xs },
  node: { width: 34, height: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.outline,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pin: { borderBottomLeftRadius: spacing.xs, transform: [{ rotate: '-45deg' }] },
  pinIcon: { transform: [{ rotate: '45deg' }] },
  completed: { backgroundColor: colors.progressComplete, borderColor: colors.progressComplete },
  current: { backgroundColor: colors.progressCurrent, borderWidth: 2, borderColor: colors.text },
  highlight: { backgroundColor: colors.selected, borderColor: colors.focus },
  legend: { borderBottomWidth: 2, borderColor: 'transparent', maxWidth: '100%' },
  currentLegend: { borderColor: colors.focus },
});
