import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ChoiceField } from './form-controls';
import { recommend, rankings, type Meetup, type Ranking, type Venue } from './planner';
import { colors, radius, spacing } from './theme';
import { localTripRows, summarizeTrips } from './trip-evidence';
import { Chip, Icon, Label, layout } from './ui';

const descriptions: Record<Ranking, string> = {
  Balanced: 'Weighs group travel time, the gap between trips, and fare.',
  Fairest: 'Smallest gap between the shortest and longest trips.',
  Fastest: 'Lowest combined travel time.',
  Cheapest: 'Lowest combined fare when every friend has a fare estimate.',
};
const options = rankings.map(value => ({ value, label: value }));

export function PlaceRankings({ meetup, places, selected, open, ranking, changeRanking }: {
  meetup: Meetup; places: Venue[]; selected?: string; open: (id: string) => void;
  ranking: Ranking; changeRanking: (value: Ranking) => void;
}) {
  const { width } = useWindowDimensions();
  const ranked = recommend(meetup.participants, ranking, meetup.manualFares, meetup.customVenues, meetup.manualMinutes);
  const rankedIds = new Set(ranked.map(({ venue }) => venue.id));
  const ordered = [...ranked.map(({ venue }) => venue), ...places.filter(venue => !rankedIds.has(venue.id))];

  return <View style={layout.stack}>
    <Label kind="item" heading>Compare places</Label>
    {width <= 350 ? <ChoiceField label="Rank by" value={ranking} options={options} change={changeRanking} /> :
      <View style={layout.wrap}>{rankings.map(mode =>
        <Chip key={mode} selected={ranking === mode} onPress={() => changeRanking(mode)}>{mode}</Chip>)}</View>}
    <View accessibilityLiveRegion="polite" aria-live="polite">
      <Label kind="detail">{descriptions[ranking]} Figures cover one-way trips.</Label>
    </View>
    {!ranked.length && <Label kind="detail">{meetup.participants.length
      ? 'No places qualify yet. Open a place to check its estimates and limits.'
      : 'Add friends to compare their trips.'}</Label>}
    {ordered.map((venue, index) => {
      const rows = localTripRows(meetup, venue);
      const totals = summarizeTrips(rows);
      const notice = totals.blocked ? 'Check travel limits' : totals.time === null ? 'Travel times incomplete' :
        !rankedIds.has(venue.id) ? 'Fares needed for this ranking' : undefined;
      const origin = rows.flatMap(row => [row.timeSource, row.fareSource]).filter(source => source !== 'Not entered');
      const demo = origin.some(source => source.startsWith('Demo'));
      const entered = origin.some(source => source.startsWith('User-entered'));
      const source = demo && entered ? 'Demo and entered estimates' : demo ? 'Demo estimates' : entered ? 'Entered estimates' : undefined;
      const metrics = [
        ['Total time', totals.time === null ? 'Incomplete' : totals.time + ' min'],
        ['Trip gap', totals.gap === null ? 'Incomplete' : totals.gap + ' min'],
        ['Total fare', totals.fare === null ? 'Unavailable' : '₱' + totals.fare.toLocaleString('en-PH')],
      ];
      const top = index === 0 && ranked.length > 0;
      return <Pressable key={venue.id} onPress={() => open(venue.id)} accessibilityRole="button"
        accessibilityLabel={'Compare ' + venue.name}
        accessibilityHint={[top && 'Top match', selected === venue.id && 'Selected for review', ...metrics.map(pair => pair.join(' ')), notice, source].filter(Boolean).join('. ')}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.row, top && styles.top,
          (pressed || hovered) && { backgroundColor: pressed ? colors.pressed : colors.hover }]}>
        <View style={layout.between}>
          <View style={{ flex: 1, minWidth: 0 }}><Label kind="value">{venue.name}</Label>
            <Label kind="detail">{venue.area}</Label></View>
          <Icon name="chevron-right" color={colors.info} />
        </View>
        {top && <Label kind="label">Top match</Label>}
        <View style={layout.wrap}>{metrics.map(([label, value]) =>
          <View key={label} style={styles.metric}>
            <Label kind="caption">{label}</Label><Label kind="value">{value}</Label>
          </View>)}</View>
        {(notice || source || selected === venue.id) && <Label kind="detail" color={notice ? colors.warning : colors.textMuted}>
          {[notice, source, selected === venue.id && 'Selected for review'].filter(Boolean).join(' · ')}
        </Label>}
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  row: { borderTopWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.sm },
  top: { backgroundColor: colors.infoSurface, borderRadius: radius.control, borderTopWidth: 0 },
  metric: { flexGrow: 1, flexBasis: 75, minWidth: 0 },
});
