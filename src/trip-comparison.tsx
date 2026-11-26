import { useState } from 'react';
import { View } from 'react-native';
import { summarizeTrips, type TripEvidence } from './trip-evidence';
import { colors, spacing } from './theme';
import { Button, Label, layout } from './ui';

export function TripComparison({ rows, edit, editableIds, changeTransport }: {
  rows: TripEvidence[]; edit: (personId: string) => void; editableIds: string[]; changeTransport?: (personId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totals = summarizeTrips(rows);
  const figures = [
    ['Group travel time', totals.time === null ? 'Time incomplete' : totals.time + ' min'],
    ['Longest one-way trip', totals.longest === null ? 'Time incomplete' : totals.longest + ' min'],
    ['Longest–shortest trip gap', totals.gap === null ? 'Time incomplete' : totals.gap + ' min'],
    ['Group one-way fare', totals.fare === null ? 'Fare unavailable' : '₱' + totals.fare.toLocaleString('en-PH')],
  ];
  return <View style={{ gap: spacing.md }}>
    <View style={layout.wrap}>{figures.map(([label, value]) => <View key={label} style={{ flexGrow: 1, flexBasis: 130, gap: spacing.xs }}>
      <Label kind="detail">{label}</Label><Label kind="value">{value}</Label>
    </View>)}</View>
    <Label kind="detail">{totals.ready} of {totals.count} travel times available. {totals.blocked ? 'Travel limits need attention.' : 'Compare estimates before choosing.'}</Label>
    <Button secondary expanded={expanded} onPress={() => setExpanded(!expanded)}>{expanded ? 'Hide participant trips' : 'See each person’s trip'}</Button>
    {expanded && rows.map(row => <View key={row.person.id} style={{ borderTopWidth: 1, borderColor: colors.divider, paddingTop: spacing.md, gap: spacing.sm }}>
      <Label kind="value">{row.person.name}</Label>
      <Label kind="detail">{row.origin || 'Starting point pending'}{row.mode ? ' · ' + row.mode : ''}</Label>
      <View style={layout.wrap}>
        <View style={{ flex: 1, minWidth: 130 }}><Label kind="label">One-way time</Label>
          <Label>{row.minutes === null ? 'Time unavailable' : row.minutes + ' min'}</Label><Label kind="caption">{row.timeSource}</Label></View>
        <View style={{ flex: 1, minWidth: 130 }}><Label kind="label">One-way fare</Label>
          <Label>{row.fare === null ? 'Fare unavailable' : '₱' + row.fare.toLocaleString('en-PH')}</Label><Label kind="caption">{row.fareSource}</Label></View>
      </View>
      {row.issues.map(issue => <Label key={issue} kind="detail" color={colors.warning}>{issue}</Label>)}
      {editableIds.includes(row.person.id) && <View style={layout.wrap}>
        <Button secondary accessibilityLabel={'Edit trip for ' + row.person.name} onPress={() => edit(row.person.id)}>Edit trip estimate</Button>
        {changeTransport && <Button quiet onPress={() => changeTransport(row.person.id)}>Change {row.person.name}’s transport or start</Button>}
      </View>}
    </View>)}
  </View>;
}
