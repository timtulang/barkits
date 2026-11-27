import { type KeyboardEvent, type ReactNode, useId, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { findPlaces } from './search-directory';
import type { PlaceResult } from './search-matches';
import { colors, control, font, palette, radius, spacing } from './theme';
import { Button, Icon, Label, layout } from './ui';

export function PlaceSearchField({ label, value, change, select }: {
  label: string; value: string; change: (text: string) => void; select: (place: PlaceResult) => void;
}) {
  const field = useRef<TextInput>(null);
  const dismissedResults = useRef(false);
  const listId = useId() + '-places';
  const web = Platform.OS === 'web';
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [limit, setLimit] = useState(5);
  const query = open ? value.trim() : '';
  const { results, total } = useMemo(() => findPlaces(query, limit), [query, limit]);
  const expanded = open && results.length > 0;
  function update(text: string) {
    change(text);
    setLimit(5);
    setActive(-1);
    setOpen(true);
  }
  function pick(place: PlaceResult) {
    Keyboard.dismiss();
    select(place);
    setOpen(false);
    setActive(-1);
  }

  return <View style={{ gap: spacing.sm }}>
    <Label kind="label" color={colors.text}>{label}</Label>
    <View style={[styles.input, focused && { borderColor: colors.focus }]}>
      <Icon name="search" color={palette.muted} size={18} />
      <TextInput ref={field} accessibilityLabel={label} placeholder="Search by name, city, or barangay" placeholderTextColor={palette.muted}
        returnKeyType="search" autoCorrect={false} underlineColorAndroid="transparent" selectionColor={colors.focus}
        value={value} onFocus={() => { setFocused(true); setOpen(true); }} onBlur={() => setFocused(false)} onChangeText={update}
        accessibilityHint="Search the Philippine catalog. Choose a result to set its pin."
        {...(web ? { role: 'combobox' as const, 'aria-autocomplete': 'list' as const,
          onKeyUp: (event: KeyboardEvent) => {
            if (event.key === 'Escape' && dismissedResults.current) {
              event.stopPropagation();
              dismissedResults.current = false;
            }
          },
          'aria-expanded': expanded, 'aria-controls': expanded ? listId : undefined,
          'aria-activedescendant': open && results[active] ? listId + '-' + active : undefined } : {})}
        onKeyPress={event => {
          if (!web) return;
          const key = event.nativeEvent.key;
          if (key === 'Escape' && expanded) {
            dismissedResults.current = true;
            event.preventDefault(); setOpen(false); setActive(-1);
          } else if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault();
            if (!open) { setOpen(true); return; }
            if (!results.length) return;
            const next = key === 'ArrowDown' ? Math.min(active + 1, results.length - 1) : Math.max(0, active - 1);
            setActive(next);
            document.getElementById(listId + '-' + next)?.scrollIntoView({ block: 'nearest' });
          }
        }}
        onSubmitEditing={() => { if (results[active]) pick(results[active]); else if (total === 1) pick(results[0]); else setOpen(true); }}
        style={styles.text} />
      {!!value && <Pressable accessibilityRole="button" accessibilityLabel={'Clear ' + label.toLowerCase()} onPress={() => { update(''); field.current?.focus(); }} style={styles.clear}>
        <Icon name="x" size={16} />
      </Pressable>}
    </View>
    {query.length < 2 && <Label kind="detail">Search Philippine places by name or area, then choose a result to set its pin.</Label>}
    {query.length >= 2 && <View accessibilityLiveRegion="polite"><Label kind="detail">
      {total ? `${total} ${total === 1 ? 'match' : 'matches'}. Check the area before choosing.${total > limit ? ` Showing ${results.length}.` : ''}` : 'No catalog matches. Try a nearby landmark or city, or choose a pin below.'}
    </Label></View>}
    {query.length >= 2 && results.length > 0 && <View style={styles.list}>
      <ResultList id={listId}>
      {results.map((place, i) => <Pressable key={place.id} nativeID={listId + '-' + i} accessibilityRole={web ? undefined : 'button'}
        {...(web ? { role: 'option' as const, 'aria-selected': i === active } : {})}
        accessibilityLabel={[place.name, place.address, place.area, place.kind].filter(Boolean).join(', ')}
        onPress={() => pick(place)} style={({ pressed }) => [styles.row, (pressed || active === i) && { backgroundColor: palette.lavender }]}>
        <Icon name={place.kind === 'Locality' ? 'map' : 'map-pin'} size={17} color={palette.plum} />
        <View style={{ flex: 1, gap: 2 }}><Label weight="bold">{place.name}</Label>
          <Label kind="caption">{[place.kind === 'Locality' ? 'Approximate area center' : place.kind, place.address, place.area].filter(Boolean).join(' · ')}</Label></View>
      </Pressable>)}
      </ResultList>
      {total > limit && <Button secondary onPress={() => setLimit(limit + 5)}>Show more results</Button>}
      <View style={layout.row}><Label size={12} color={palette.muted}>GeoNames · © OpenStreetMap contributors</Label></View>
    </View>}
  </View>;
}

function ResultList({ id, children }: { id: string; children: ReactNode }) {
  if (Platform.OS === 'web') return <div role="listbox" aria-label="Place results" id={id}>{children}</div>;
  return <View>{children}</View>;
}

const styles = StyleSheet.create({
  input: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 12, paddingRight: 2,
    borderWidth: 1, borderColor: colors.outline, backgroundColor: palette.white, borderRadius: radius.control, minWidth: 0 },
  text: { flex: 1, minWidth: 0, minHeight: control.minimum, paddingVertical: spacing.sm, textAlignVertical: 'center',
    fontFamily: font.regular, color: palette.ink, fontSize: 16 },
  clear: { width: control.minimum, height: control.minimum, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 10, gap: 5, borderColor: palette.line, borderWidth: 1, borderRadius: radius.control, backgroundColor: palette.paper },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 6 },
});
