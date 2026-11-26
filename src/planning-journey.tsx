import { Platform, Pressable, View } from 'react-native';
import type { PlanningStage } from './planning-progress';
import { colors, control, radius, spacing } from './theme';
import { Button, Label, layout, Panel } from './ui';

const stages = [
  { id: 'who', label: 'Who', title: 'Who is joining?', purpose: 'Add friends and the starting points used to find places.' },
  { id: 'when', label: 'When', title: 'When will you meet?', purpose: 'Optional: set a time now or decide later.' },
  { id: 'where', label: 'Where', title: 'Where should you meet?', purpose: 'Explore places, compare trips and choose a destination.' },
  { id: 'review', label: 'Review', title: 'Review your plan', purpose: 'Check what’s decided and return to anything unfinished.' },
] as const;

export function PlanningJourney({ current, change, people, scheduled, destination, saved }: {
  current: PlanningStage; change: (stage: PlanningStage) => void; people: string;
  scheduled: boolean; destination: boolean; saved: string;
}) {
  const index = stages.findIndex(stage => stage.id === current);
  const summary = [people, scheduled ? 'Time set' : 'Time optional', destination ? 'Confirmed' : 'Not chosen', destination ? 'Destination set' : 'Plan pending'];
  return <View style={{ gap: spacing.md }}>
    <View accessibilityLabel="Planning stages" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {stages.map((stage, i) => <Pressable key={stage.id} accessibilityRole="button"
        accessibilityLabel={`${i + 1}. ${stage.label}. ${summary[i]}`} accessibilityState={{ selected: current === stage.id }}
        {...(Platform.OS === 'web' ? { 'aria-current': current === stage.id ? 'step' as const : undefined } : {})}
        onPress={() => change(stage.id)} style={({ pressed }) => ({ flexGrow: 1, flexBasis: 64, minWidth: 0,
          minHeight: control.minimum, padding: spacing.sm, justifyContent: 'center', borderRadius: radius.control,
          backgroundColor: current === stage.id ? colors.primary : pressed ? colors.pressed : colors.hover })}>
        <Label kind="label" color={current === stage.id ? colors.onPrimary : colors.text}>{i + 1}. {stage.label}</Label>
      </Pressable>)}
    </View>
    <View accessibilityLiveRegion="polite" style={{ gap: spacing.xs }}>
      <Label kind="caption">{people} · {summary[1]} · {destination ? 'Destination confirmed' : 'Destination undecided'}</Label>
      <Label kind="caption">{saved}</Label>
    </View>
    <View style={{ gap: spacing.xs }}>
      <Label kind="item" heading>{stages[index].title}</Label>
      <Label kind="detail">Step {index + 1} of 4 · {stages[index].purpose}</Label>
    </View>
  </View>;
}

export function PlanningReview({ people, mapped, schedule, destination, change, canEdit = true }: {
  people: number; mapped: number; schedule?: string; destination?: string;
  change: (stage: PlanningStage) => void; canEdit?: boolean;
}) {
  return <Panel>
    <Label kind="item" heading>{destination ? 'Destination confirmed' : 'Destination still to decide'}</Label>
    <Label>{people} {people === 1 ? 'friend' : 'friends'} · {mapped} starting {mapped === 1 ? 'point' : 'points'} on the map</Label>
    {mapped < people && <Label kind="detail">{people - mapped} starting {people - mapped === 1 ? 'point still needs' : 'points still need'} attention before nearby places can be found for everyone.</Label>}
    <Label>{schedule || 'Date and time undecided (optional)'}</Label>
    <Label>{destination ? 'Meet at ' + destination : 'No destination confirmed. Votes and suggestions do not confirm a place.'}</Label>
    {canEdit && <View style={layout.wrap}>
      <Button onPress={() => change('where')}>{destination ? 'View meeting place' : 'Choose a meeting place'}</Button>
      <Button quiet onPress={() => change('who')}>Change friends or starting points</Button>
      <Button quiet onPress={() => change('when')}>Review meetup time</Button>
    </View>}
  </Panel>;
}
