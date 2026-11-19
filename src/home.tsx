import { Pressable, StyleSheet, View } from 'react-native';
import { Kits } from './kits';
import { Meetup, venues } from './planner';
import { palette, radius, spacing } from './theme';
import { Button, Chip, Icon, Label, layout, Panel } from './ui';

const steps = [
  { icon: 'users', color: 'lavender', title: 'Bring the barkada', text: 'Add your friends and where everyone is coming from.' },
  { icon: 'map-pin', color: 'softMango', title: 'Find your spot', text: 'Compare travel times and costs for the whole group.' },
  { icon: 'heart', color: 'mint', title: 'Make it happen', text: 'Vote on a place, meet up, and save the memories.' },
] as const;

export function Home({ wide, titleSize, meetups, create, open }: {
  wide: boolean; titleSize: number; meetups: Meetup[]; create: () => void; open: (index: number) => void;
}) {
  return <>
    <View style={[styles.hero, wide && styles.heroWide]}>
      <View style={[styles.heroCopy, wide && { flex: 1.12, padding: 40 }]}>
        <View style={[layout.row, styles.kitsTag]}><Icon name="sun" size={15} /><Label size={13} weight="bold">Kita-kits, barkada!</Label></View>
        <Label size={titleSize} weight="title" heading>Good plans.{'\n'}Better hangouts.</Label>
        <Label size={17}>Find a meetup spot that works for everyone, wherever your barkada is coming from.</Label>
        <Button icon="plus" onPress={create}>Plan a meetup</Button>
      </View>
      <Kits style={wide ? styles.imageWide : styles.image} />
    </View>

    <View style={styles.section}>
      <View style={layout.between}>
        <View style={{ gap: 5 }}><Label size={29} weight="title" heading>Your meetups</Label><Label color={palette.muted}>Pick up where you left off.</Label></View>
        {wide && <Button onPress={create} icon="plus" secondary>New meetup</Button>}
      </View>
      {meetups.map((meetup, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Open ${meetup.name}`} onPress={() => open(index)}>
        <Panel style={styles.meetup}>
          <View style={[styles.iconTile, { backgroundColor: palette.lavender }]}><Icon name="calendar" size={23} color={palette.plum} /></View>
          <View style={{ flex: 1, gap: 5 }}>
            <Label size={19} weight="title">{meetup.name}</Label>
            <Label size={13} color={palette.muted}>{meetup.date || 'Date to be decided'} · {meetup.participants.length} {meetup.participants.length === 1 ? 'friend' : 'friends'}{index === 0 ? ' · Demo' : ''}</Label>
            {!!meetup.venue && <Label size={13} weight="bold">{venues.find(venue => venue.id === meetup.venue)?.name}</Label>}
          </View>
          <Chip selected>{meetup.status}</Chip><Icon name="chevron-right" color={palette.muted} />
        </Panel>
      </Pressable>)}
    </View>

    <View style={styles.section}>
      <Label size={29} weight="title" heading>How it works</Label>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14 }}>
        {steps.map(step => <Panel key={step.title} style={{ flex: 1, gap: 9, padding: 19 }}>
          <View style={[styles.iconTile, { backgroundColor: palette[step.color], width: 40, height: 40 }]}><Icon name={step.icon} size={19} /></View>
          <Label size={18} weight="title">{step.title}</Label><Label size={14} color={palette.muted}>{step.text}</Label>
        </Panel>)}
      </View>
    </View>
  </>;
}
const styles = StyleSheet.create({
  hero: { backgroundColor: palette.hero, borderRadius: radius.hero, overflow: 'hidden' },
  heroWide: { flexDirection: 'row', alignItems: 'center', height: 368 },
  heroCopy: { padding: spacing.xl, alignItems: 'flex-start', justifyContent: 'center', gap: 16 },
  kitsTag: { backgroundColor: palette.softMango, paddingVertical: 7, paddingHorizontal: 11, borderRadius: radius.pill },
  imageWide: { flex: 1, width: 0, height: 320 },
  image: { width: '100%', height: 210 },
  section: { gap: 15, marginTop: 5 },
  meetup: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconTile: { width: 51, height: 51, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
