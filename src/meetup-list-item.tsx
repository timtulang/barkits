import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from './theme';
import { Icon, Label, layout } from './ui';
import { StatusMark } from './workspace-layout';

export function MeetupListItem({ name, status, date, detail, venue, demo, onPress }: {
  name: string; status: string; date: string; detail?: string; venue?: string; demo?: boolean; onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + name}
    accessibilityHint={[status, date, detail, venue, demo ? 'Demo meetup' : ''].filter(Boolean).join('. ')}
    onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onPress}
    style={({ pressed }) => [styles.row, hovered && styles.hover, pressed && styles.pressed]}>
    <View style={styles.content}>
      <View style={layout.wrap}><StatusMark status={status} />{demo && <Label kind="detail">Demo</Label>}</View>
      <Label kind="item">{name}</Label>
      <View style={styles.metadata}><Icon name="calendar" size={16} color={colors.textMuted} /><Label kind="detail">{date}</Label></View>
      {!!detail && <Label kind="detail">{detail}</Label>}
      {!!venue && <View style={styles.metadata}><Icon name="map-pin" size={16} color={colors.info} /><Label weight="bold">{venue}</Label></View>}
    </View>
    <Icon name="arrow-right" color={colors.info} />
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.card },
  content: { flex: 1, minWidth: 0, gap: spacing.sm },
  metadata: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hover: { backgroundColor: colors.hover, borderColor: colors.outline },
  pressed: { backgroundColor: colors.pressed, borderColor: colors.focus },
});
