import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { findPlaces } from './search-directory';
import type { PlaceResult } from './search-matches';
import { font, palette, radius, spacing } from './theme';
import { Button, Icon, Label, layout } from './ui';

export function PlaceSearchField({ label, value, change, select }: {
  label: string; value: string; change: (text: string) => void; select: (place: PlaceResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(5);
  const query = open ? value.trim() : '';
  const { results, total } = useMemo(() => findPlaces(query, limit), [query, limit]);
  function update(text: string) {
    change(text);
    setLimit(5);
    setOpen(true);
  }
  function pick(place: PlaceResult) {
    select(place);
    setOpen(false);
  }

  return <View style={{ gap: 6 }}>
    <Label size={14} weight="bold">{label}</Label>
    <View style={styles.input}>
      <Icon name="search" color={palette.muted} size={18} />
      <TextInput accessibilityLabel={label} placeholder="Search by name, city, or barangay" placeholderTextColor={palette.muted}
        returnKeyType="search" autoCorrect={false} value={value} onFocus={() => setOpen(true)} onChangeText={update}
        onSubmitEditing={() => { if (total === 1) pick(results[0]); else setOpen(true); }}
        style={{ flex: 1, minWidth: 0, height: 44, fontFamily: font.regular, color: palette.ink, fontSize: 15 }} />
      {!!value && <Pressable accessibilityRole="button" accessibilityLabel={'Clear ' + label.toLowerCase()} onPress={() => update('')} style={styles.clear}>
        <Icon name="x" size={16} />
      </Pressable>}
    </View>
    {query.length >= 2 && (results.length > 0 ? <View style={styles.list}>
      {results.map(place => <Pressable key={place.id} accessibilityRole="button"
        accessibilityLabel={[place.name, place.address, place.area, place.kind].filter(Boolean).join(', ')}
        onPress={() => pick(place)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.lavender }]}>
        <Icon name={place.kind === 'Locality' ? 'map' : 'map-pin'} size={17} color={palette.plum} />
        <View style={{ flex: 1, gap: 2 }}><Label weight="bold">{place.name}</Label>
          <Label size={13} color={palette.muted}>{[place.kind, place.address, place.area].filter(Boolean).join(' · ')}</Label></View>
      </Pressable>)}
      {total > limit && <Button secondary onPress={() => setLimit(limit + 5)}>Show more results</Button>}
      <View style={layout.row}><Label size={12} color={palette.muted}>GeoNames · © OpenStreetMap contributors</Label></View>
    </View> : <Label size={13} color={palette.muted}>No matches in the Philippine catalog. Try a city or landmark, keep your entry, or choose a map pin.</Label>)}
  </View>;
}

const styles = StyleSheet.create({
  input: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 12, paddingRight: 2,
    borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, borderRadius: radius.control },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 10, gap: 5, borderColor: palette.line, borderWidth: 1, borderRadius: radius.control, backgroundColor: palette.paper },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 6 },
});
