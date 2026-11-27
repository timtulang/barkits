import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { shellStyles } from './app-shell';
import type { PlanningStage } from './planning-progress';
import { colors, control, palette, radius, spacing } from './theme';
import { Button, Label, layout, Panel } from './ui';

const stages = [
  { id: 'who', label: 'Who', title: 'Who is joining?' },
  { id: 'when', label: 'When', title: 'When will you meet?' },
  { id: 'where', label: 'Where', title: 'Where should you meet?' },
  { id: 'review', label: 'Review', title: 'Review your plan' },
] as const;

export function PlanningJourney({ current, change, people, scheduled, destination, saved, children }: {
  current: PlanningStage; change: (stage: PlanningStage) => void; people: string;
  scheduled: boolean; destination: boolean; saved?: string; children: ReactNode;
}) {
  const index = stages.findIndex(stage => stage.id === current);
  const summary = [people, scheduled ? 'Time set' : 'Time optional', destination ? 'Destination confirmed' : 'Destination undecided', 'Review your plan'];
  const previous = useRef(current);
  const [opacity] = useState(() => new Animated.Value(1));

  useLayoutEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    let active = true;
    const motion = Animated.timing(opacity, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active) return;
      opacity.setValue(reduced ? 1 : 0.65);
      if (!reduced) motion.start();
    }, () => { if (active) opacity.setValue(1); });
    return () => { active = false; motion.stop(); };
  }, [current, opacity]);

  return <View style={layout.stack}>
    <View accessibilityLabel="Planning stages" style={styles.progress}>
      {stages.map(({ id, label, title }, i) => {
        const active = current === id;
        return <Pressable key={id} accessibilityRole="button"
          accessibilityLabel={`${i + 1}. ${label}. ${summary[i]}. Step ${i + 1} of ${stages.length}`}
          accessibilityState={{ selected: active }} accessibilityHint={title}
          {...(Platform.OS === 'web' ? { 'aria-current': active ? 'step' as const : undefined } : {})}
          onPress={() => { if (!active) change(id); }} style={styles.segment}>
          {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => <View style={[styles.track, i < index && styles.past,
            (pressed || hovered) && styles.highlight, active && styles.active]} />}
        </Pressable>;
      })}
    </View>
    <Animated.View style={[layout.stack, { opacity }]}>
      <View style={styles.heading}>
        <View accessibilityLiveRegion="polite" aria-live="polite" style={styles.title}>
          <Label kind="section" heading>{stages[index].title}</Label>
        </View>
        {!!saved && <View accessibilityLiveRegion="polite" aria-live="polite"><Label kind="caption">{saved}</Label></View>}
      </View>
      {children}
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: spacing.sm, marginVertical: -spacing.sm },
  segment: { flex: 1, minHeight: control.minimum, justifyContent: 'center', borderRadius: radius.control },
  track: { height: 5, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.pill, backgroundColor: colors.hover },
  past: { borderColor: colors.info, backgroundColor: colors.info },
  highlight: { backgroundColor: palette.coral, borderColor: colors.info },
  active: { height: 9, borderColor: colors.info, backgroundColor: palette.mango },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.xs, justifyContent: 'space-between' },
  title: { flexShrink: 1, minWidth: 0 },
});

export function PlanningStepActions({ stage, change, onNext, disabled, busy, selection }: {
  stage: PlanningStage; change: (stage: PlanningStage) => void; onNext?: () => void; disabled?: boolean; busy?: boolean;
  selection?: string;
}) {
  const index = stages.findIndex(item => item.id === stage);
  const previous = stages[index - 1];
  const next = stages[index + 1];
  const label = stage === 'where' ? 'Review' : stage === 'review' ? 'Confirm' : 'Next';
  return <View role="navigation" accessibilityLabel="Planning navigation"
    style={{ borderTopWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
    <View style={[shellStyles.container, { paddingVertical: spacing.sm, gap: spacing.xs }]}>
      {selection && <View accessibilityLiveRegion="polite" aria-live="polite">
        <Label kind="detail" numberOfLines={1}>Selected · {selection}</Label>
      </View>}
      <View style={layout.between}>
        <View style={{ width: 112 }}>{previous && <Button secondary stretch icon="chevron-left" disabled={busy}
          accessibilityLabel={'Back to ' + previous.label} onPress={() => change(previous.id)}>Back</Button>}</View>
        {(next || onNext) && <View style={{ width: 112 }}><Button stretch disabled={disabled} busy={busy} busyLabel="Saving…"
          accessibilityLabel={stage === 'review' ? 'Confirm destination' : undefined}
          onPress={() => { if (onNext) onNext(); else if (next) change(next.id); }}>{label}</Button></View>}
      </View>
    </View>
  </View>;
}

export function PlanningReview({ people, mapped, schedule, destination, change, canEdit = true, pending, activity, description }: {
  people: number; mapped: number; schedule?: string; destination?: string; activity?: string | null; description?: string | null;
  change: (stage: PlanningStage) => void; canEdit?: boolean; pending?: string;
}) {
  return <Panel>
    <Label kind="item" heading>{destination ? 'Destination confirmed' : pending ? 'Meetup details' : 'Pick a place'}</Label>
    <Label>{people} {people === 1 ? 'friend' : 'friends'}{mapped < people ? ' · ' + (people - mapped) + ' missing a start' : ''}</Label>
    <Label>{schedule || 'Time undecided'}</Label>
    {!!activity && <Label>Activity · {activity}</Label>}
    {!!description && <Label>{description}</Label>}
    {canEdit && <View style={[layout.wrap, { width: '100%', maxWidth: 288 }]}>
      <View style={{ flex: 1 }}><Button secondary stretch onPress={() => change('who')}>Friends</Button></View>
      <View style={{ flex: 1 }}><Button secondary stretch onPress={() => change('when')}>Time</Button></View>
    </View>}
  </Panel>;
}
