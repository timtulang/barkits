import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Kits } from './kits';
import { Meetup, venues } from './planner';
import { palette, radius, spacing } from './theme';
import { Button, Chip, Icon, Label, layout } from './ui';
import { StatusMark } from './workspace-layout';

export function Home({ wide, meetups, create, open, shared, signedIn }: {
  shared?: (past: boolean) => ReactNode; signedIn?: boolean; wide: boolean; meetups: Meetup[]; create: () => void; open: (index: number) => void;
}) {
  const [past, setPast] = useState(false);
  const rows = meetups.map((item,index) => ({ item,index })).filter(({ item }) => ['Completed','Archived'].includes(item.status) === past);
  return <View style={[styles.board, wide && styles.columns]}>
    <View style={[styles.welcome, wide && styles.welcomeWide]}>
      <View style={[styles.intro, wide && { padding: 32 }]}>
        <Label size={wide ? 48 : 31} weight="title" heading>Tara, kita-kits!</Label>
        <Label size={16}>Find a meeting place that works for the whole barkada.</Label>
        <Button icon="plus" onPress={create}>Plan a meetup</Button>
      </View>
      <Kits style={wide ? styles.artWide : styles.artSmall} />
    </View>
    <View style={[styles.plans,wide && { flex: 1.7 }]}>
      <Label size={wide ? 38 : 29} weight="title" heading>Your meetups</Label>
      <View style={layout.row}><Chip selected={!past} onPress={() => setPast(false)}>Active plans</Chip>
        <Chip selected={past} onPress={() => setPast(true)}>Past meetups</Chip></View>
      <View style={styles.entries}>
        {signedIn && <Label size={19} weight="title">On this device</Label>}
        {rows.map(({ item, index }) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={'Open ' + item.name} onPress={() => open(index)}
          style={({pressed}) => [styles.entry, pressed && { backgroundColor: palette.softMango }]}>
          <View style={{ flex:1, gap:8 }}><StatusMark status={item.status} /><Label size={23} weight="title">{item.name}</Label>
            <Label size={14} color={palette.muted}>{item.date || 'Date to be decided'} · {item.participants.length} {item.participants.length === 1 ? 'friend' : 'friends'}{index === 0 ? ' · Demo' : ''}</Label>
            {!!item.venue && <Label weight="bold">{[...venues,...item.customVenues ?? []].find(v => v.id === item.venue)?.name}</Label>}
          </View><Icon name="arrow-right" /></Pressable>)}
        {!rows.length && <Label color={palette.muted}>{past ? 'Completed meetups and their memories appear here.' : 'Plan a meetup to get started.'}</Label>}
      </View>
      {shared?.(past)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  board: { gap: spacing.section },
  columns: { flexDirection:'row', alignItems:'flex-start', gap:40 },
  welcome: { backgroundColor:palette.hero,borderRadius:radius.hero,overflow:'hidden',flexDirection:'row',alignItems:'center' },
  welcomeWide: { flex:1,flexDirection:'column',alignItems:'stretch',paddingBottom:12 },
  intro: { flex:1,gap:12,padding:20 },
  artWide: { width:'100%',height:218 },
  artSmall: { width:'29%',height:115 },
  plans: { minWidth:0,gap:18 },
  entries: { gap:12,borderTopWidth:1,borderColor:palette.line,paddingTop:16 },
  entry: { backgroundColor:palette.paper,borderRadius:radius.card,padding:20,borderWidth:1,borderColor:palette.line,flexDirection:'row',alignItems:'center',gap:12 },
});
