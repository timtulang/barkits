import { Pressable, StyleSheet, View } from 'react-native';
import { colors, palette, radius, spacing } from './theme';
import { Label } from './ui';

export function friendInitials(name: string) {
  const words = name.trim().split(/\s+/);
  const initials = words.length > 1 ? words.slice(0, 2).map(word => Array.from(word)[0]) : Array.from(words[0]).slice(0, 2);
  return initials.join('').toLocaleUpperCase();
}

export function FriendPicker({ label, people, selected, change }: {
  label: string; people: { id: string; name: string }[]; selected?: string; change: (id: string) => void;
}) {
  if (!people.length) return null;
  return <View style={styles.group}>
    <Label kind="label">{label}</Label>
    <View style={styles.people}>{people.map(person => {
      const active = person.id === selected;
      return <Pressable key={person.id} accessibilityRole="button" accessibilityLabel={label + ' ' + person.name}
        accessibilityState={{ selected: active }} aria-pressed={active} onPress={() => change(person.id)}
        style={({ pressed }) => [styles.person, active && styles.selected, pressed && { backgroundColor: colors.pressed }]}>
        <View style={[styles.ring, active && styles.activeRing]} aria-hidden>
          <View style={styles.avatar}><Label kind="label" size={13}>{friendInitials(person.name)}</Label></View>
        </View>
        <Label kind="label" numberOfLines={1} color={active ? colors.onSelected : colors.textMuted}>{person.name}</Label>
      </Pressable>;
    })}</View>
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  person: { width: 72, minHeight: 72, alignItems: 'center', padding: spacing.xs, gap: spacing.xs, borderRadius: radius.control },
  selected: { backgroundColor: colors.selected },
  ring: { padding: 2, borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent' },
  activeRing: { borderColor: colors.onSelected },
  avatar: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: palette.coral,
    borderWidth: 1, borderColor: colors.onSelected, alignItems: 'center', justifyContent: 'center' },
});
