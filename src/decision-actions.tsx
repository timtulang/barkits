import { View } from 'react-native';
import { colors, spacing } from './theme';
import { Button, Icon, Label, layout } from './ui';

type Props = {
  place: string; count: number; voter?: string; votedHere: boolean; hasVote: boolean;
  vote: () => void; busy?: boolean; blocked?: boolean;
  confirming: boolean; review: (open: boolean) => void; confirm?: () => void;
};

export function DecisionActions({ place, count, voter, votedHere, hasVote, vote, busy, blocked,
  confirming, review, confirm }: Props) {
  const whose = voter ? voter + '’s' : 'my';
  const action = votedHere ? 'Remove ' + whose + ' vote' : hasVote ? 'Move ' + whose + ' vote here' :
    voter ? 'Vote as ' + voter : 'Vote for this place';
  return <View style={{ gap: spacing.sm }}>
    <View accessibilityLiveRegion="polite" style={layout.row}>
      <Icon name={votedHere ? 'check-circle' : 'users'} size={16} color={votedHere ? colors.success : colors.textMuted} />
      <Label kind="detail" color={votedHere ? colors.success : colors.textMuted}>
        {count} {count === 1 ? 'vote' : 'votes'}{votedHere ? (voter ? ' · ' + voter + ' voted here' : ' · includes your vote') : ''}
      </Label>
    </View>
    {confirming && confirm ? <>
      <Label kind="value">Meet at {place}?</Label>
      <Label kind="detail">Confirming sets the group’s destination and closes voting.</Label>
      <View style={layout.wrap}>
        <Button disabled={busy || blocked} onPress={confirm}>Confirm destination</Button>
        <Button quiet disabled={busy} onPress={() => review(false)}>Cancel</Button>
      </View>
    </> : <View style={layout.wrap}>
      <Button secondary={votedHere} disabled={busy} onPress={vote} accessibilityLabel={action + ', ' + place}>{action}</Button>
      {!!confirm && <Button quiet disabled={busy || blocked} onPress={() => review(true)}
        accessibilityLabel={'Choose destination, ' + place}>Choose destination</Button>}
    </View>}
  </View>;
}
