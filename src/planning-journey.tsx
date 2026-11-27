import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { shellStyles } from './app-shell';
import { useMotionAllowed } from './motion-feedback';
import type { PlanningStage } from './planning-progress';
import { PlanningRoute, planningStages } from './planning-route';
import { colors, motion, spacing } from './theme';
import { Button, Icon, Label, layout, Panel, StatusLine } from './ui';

export function PlanningJourney({ current, change, people, mapped, scheduled, destination, saved, saveTone, children }: {
  current: PlanningStage; change: (stage: PlanningStage) => void; people: number; mapped: number;
  scheduled: boolean; destination: boolean; saved?: string; saveTone?: 'info' | 'warning' | 'success'; children: ReactNode;
}) {
  const index = planningStages.findIndex(stage => stage.id === current);
  const previous = useRef(current);
  const [offset] = useState(() => new Animated.Value(0));
  const allowed = useMotionAllowed();

  useLayoutEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    if (!allowed) return;
    offset.setValue(3);
    const reveal = Animated.timing(offset, {
      toValue: 0, duration: motion.stage.duration, easing: Easing.bezier(...motion.stage.curve),
      useNativeDriver: Platform.OS !== 'web',
    });
    reveal.start();
    return () => { reveal.stop(); offset.setValue(0); };
  }, [current, offset, allowed]);

  return <View style={layout.stack}>
    <PlanningRoute current={current} change={change} people={people} mapped={mapped} scheduled={scheduled} destination={destination} />
    <View style={layout.stack}>
      <View style={styles.heading}>
        <Animated.View accessibilityLiveRegion="polite" aria-live="polite"
          style={[styles.title, { transform: [{ translateY: offset }] }]}>
          <Label kind="section" heading>{planningStages[index].title}</Label>
        </Animated.View>
        {!!saved && <StatusLine tone={saveTone}>{saved}</StatusLine>}
      </View>
      {children}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.xs, justifyContent: 'space-between' },
  title: { flexShrink: 1, minWidth: 0 },
});

export function PlanningStepActions({ stage, change, onNext, disabled, busy, selection }: {
  stage: PlanningStage; change: (stage: PlanningStage) => void; onNext?: () => void; disabled?: boolean; busy?: boolean;
  selection?: string;
}) {
  const index = planningStages.findIndex(item => item.id === stage);
  const previous = planningStages[index - 1];
  const next = planningStages[index + 1];
  const label = stage === 'where' ? 'Review' : stage === 'review' ? 'Confirm' : 'Next';
  return <View role="navigation" accessibilityLabel="Planning navigation"
    style={{ borderTopWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
    <View style={[shellStyles.container, { paddingVertical: spacing.sm, gap: spacing.xs }]}>
      {selection && <View accessibilityLiveRegion="polite" aria-live="polite" style={layout.row}>
        <Icon name="map-pin" size={16} color={colors.info} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Label kind="detail" numberOfLines={1}>Selected · {selection}</Label>
        </View>
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

export function PlanningReview({ people, mapped, schedule, destination, change, canEdit = true, pending, activity, description, heading }: {
  people: number; mapped: number; schedule?: string; destination?: string; activity?: string | null; description?: string | null;
  change: (stage: PlanningStage) => void; canEdit?: boolean; pending?: string; heading?: string;
}) {
  return <Panel>
    <Label kind="item" heading>{heading ?? (destination ? 'Destination confirmed' : pending ? 'Meetup details' : 'Pick a place')}</Label>
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
