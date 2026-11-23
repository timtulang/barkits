import { View } from 'react-native';
import type { LocatedFriend } from './discovery';
import { palette, spacing } from './theme';
import { Label, layout } from './ui';

export function VenueSummary({ name, location, friends, distances }: {
  name: string; location: string; friends: LocatedFriend[]; distances: number[];
}) {
  const allApproximate = friends.length > 0 && friends.every(friend => friend.approximate);
  return <View style={{ gap: spacing.lg }}>
    <View style={{ gap: spacing.xs }}>
      <Label kind="item" heading>{name}</Label>
      {!!location && <Label kind="detail">{location}</Label>}
    </View>
    <View style={{ gap: spacing.xs }}>
      <Label kind="label">Straight-line distance</Label>
      {friends.map((friend, index) => <View key={friend.id} style={[layout.between, { borderTopWidth: 1, borderColor: palette.line, paddingVertical: spacing.xs }]}>
        <View style={{ flex: 1 }}><Label>{friend.name}</Label>
          {!allApproximate && friend.approximate && <Label kind="detail">From locality center</Label>}
        </View>
        <Label kind="value">{distances[index].toFixed(1)} km</Label>
      </View>)}
      {allApproximate && <Label kind="detail">Measured from each friend’s locality center.</Label>}
    </View>
  </View>;
}

export function RankingFigures({ time, spread, cost }: { time: number; spread: number; cost: number | null }) {
  const figures = [
    { label: 'Total travel time', value: time + ' min' },
    { label: 'Trip time gap', value: spread + ' min' },
    { label: 'Combined fare', value: cost === null ? 'Unknown' : '₱' + cost },
  ];
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
    {figures.map(figure => <View key={figure.label} style={{ flexGrow: 1, flexBasis: 90, gap: spacing.xs }}>
      <Label kind="detail">{figure.label}</Label><Label kind="value" size={20}>{figure.value}</Label>
    </View>)}
  </View>;
}
