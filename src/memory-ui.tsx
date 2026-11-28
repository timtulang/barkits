import { StyleSheet, View } from 'react-native';
import { Kits } from './kits';
import { palette, radius, spacing } from './theme';
import { Chip, Label, layout } from './ui';

export function MemoryHeading({ title, venue, schedule, celebrate }: {
  title: string; venue?: string; schedule?: string; celebrate: boolean;
}) {
  return <View style={styles.banner}>
    <View style={styles.text}>
      <Label kind="section" heading>{title}</Label>
      {!!venue && <Label>{venue}</Label>}
      {!!schedule && <Label kind="detail" color={palette.ink}>{schedule}</Label>}
    </View>
    <Kits celebrate={celebrate} style={styles.art} />
  </View>;
}

export function RatingChoices({ value, disabled, change }: { value?: number; disabled: boolean; change: (value: number) => void }) {
  return <View style={layout.wrap}>{[1, 2, 3, 4, 5].map(stars =>
    <Chip key={stars} icon="star" selected={value === stars} disabled={disabled}
      accessibilityLabel={stars + (stars === 1 ? ' star' : ' stars')} onPress={() => change(stars)}>{stars}</Chip>)}</View>;
}

const styles = StyleSheet.create({
  banner: { backgroundColor: palette.hero, borderRadius: radius.hero, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, minWidth: 0, gap: spacing.xs },
  art: { width: 76, height: 64 },
});
