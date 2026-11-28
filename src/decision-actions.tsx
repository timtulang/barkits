import { View } from 'react-native';
import { colors, spacing } from './theme';
import { Button, Icon, Label, layout } from './ui';

type Props = {
  place: string; count: number; voter?: string; votedHere: boolean; hasVote: boolean;
  vote: () => void; busy?: boolean; blocked?: boolean; voteDisabled?: boolean;
  select?: () => void; selected?: boolean;
};

export function DecisionActions({ place, count, voter, votedHere, hasVote, vote, busy, blocked, voteDisabled, select, selected }: Props) {
  const whose = voter ? voter + '’s' : 'my';
  const action = votedHere ? 'Remove ' + whose + ' vote' : hasVote ? 'Move ' + whose + ' vote here' :
    voter ? 'Vote as ' + voter : 'Vote for this place';
  return <View style={{ gap: spacing.sm }}>
    <View accessibilityLiveRegion="polite" aria-live="polite" style={layout.row}>
      <Icon name={votedHere ? 'check-circle' : 'users'} size={16} color={votedHere ? colors.success : colors.textMuted} />
      <Label kind="detail" color={votedHere ? colors.success : colors.textMuted}>
        {count} {count === 1 ? 'vote' : 'votes'}{votedHere ? (voter ? ' · ' + voter + ' voted here' : ' · includes your vote') : ''}
      </Label>
    </View>
    <View style={layout.wrap}>
      <View style={{ flex: 1 }}><Button secondary stretch disabled={busy || voteDisabled} onPress={vote}
        accessibilityLabel={action + ', ' + place}>{votedHere ? 'Unvote' : hasVote ? 'Move vote' : 'Vote'}</Button></View>
      {select && <View style={{ flex: 1 }}><Button stretch disabled={busy || blocked} onPress={select}
        accessibilityLabel={'Select destination, ' + place}>{selected ? 'Selected' : 'Select'}</Button></View>}
    </View>
  </View>;
}
