import { formatLocalSchedule } from './meetup-schedule';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Kits } from './kits';
import { MeetupListItem } from './meetup-list-item';
import { Meetup, venues } from './planner';
import { colors, palette, radius, spacing } from './theme';
import { Button, Chip, EmptyState, Label, layout } from './ui';

export function Home({ wide, meetups, create, open, shared, signedIn, past, setPast }: {
  shared?: ReactNode; signedIn: boolean; wide: boolean; meetups: Meetup[]; create: () => void;
  open: (index: number) => void; past: boolean; setPast: (past: boolean) => void;
}) {
  const rows = meetups.map((item, index) => ({ item, index }))
    .filter(({ item }) => ['Completed', 'Archived'].includes(item.status) === past)
    .sort((a, b) => b.index - a.index);
  const returning = meetups.length > 1;
  return <View style={styles.board}>
    {!returning && <View style={[styles.welcome, wide && styles.welcomeWide]}>
      <View style={styles.intro}>
        <View style={layout.row}><Label kind={wide ? 'page' : 'section'} heading>Tara, kita-kits!</Label>
          {!wide && <Kits style={styles.artSmall} />}</View>
        <Label>Round up the barkada and find a spot everyone can get to.</Label>
        <View style={layout.wrap}><Button icon="plus" onPress={create}>Plan a meetup</Button></View>
      </View>
      {wide && <Kits style={styles.artWide} />}
    </View>}
    <View style={styles.plans}>
      <View style={[styles.listHeader, wide && styles.listHeaderWide]}>
        <View style={[layout.wrap, { justifyContent: 'space-between' }]}>
          <Label kind={returning && wide ? 'page' : 'section'} heading>Your meetups</Label>
          {returning && <Button icon="plus" onPress={create}>Plan a meetup</Button>}
        </View>
        <View style={layout.wrap}>
          <Chip selected={!past} onPress={() => setPast(false)}>Active plans</Chip>
          <Chip selected={past} onPress={() => setPast(true)}>Past meetups</Chip>
        </View>
      </View>
      <View style={[styles.groups, wide && !!shared && styles.columns]}>
        <View style={[styles.group, wide && !!shared && { flex: 1 }]}>
          <View style={styles.groupIntro}><Label kind="item" heading>On this device</Label>
            <Label kind="detail">{signedIn ? 'Kept on this device for your account. Not shared with friends.' : 'Kept in this browser or app. Not shared with friends.'}</Label>
          </View>
          {rows.map(({ item, index }) => <MeetupListItem key={index} name={item.name} status={item.status}
            date={formatLocalSchedule(item.date) || 'Date to be decided'} detail={`${item.participants.length} ${item.participants.length === 1 ? 'friend' : 'friends'}`}
            demo={index === 0}
            venue={item.venue ? [...venues, ...item.customVenues ?? []].find(venue => venue.id === item.venue)?.name : undefined}
            onPress={() => open(index)} />)}
          {!rows.length && <EmptyState title={past ? 'No past meetups yet' : 'No active meetups'}>
            {past ? 'Completed and archived plans will appear here, along with their memories.' : 'Start a new plan to bring your barkada together.'}
          </EmptyState>}
        </View>
        {!!shared && <View style={[styles.group, wide && !!shared && { flex: 1 }]}>{shared}</View>}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  board: { gap: spacing.section },
  welcome: { backgroundColor: palette.hero, borderRadius: radius.hero, flexDirection: 'row', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  welcomeWide: { paddingHorizontal: spacing.section },
  intro: { flex: 1, minWidth: 0, gap: spacing.md, maxWidth: 620 },
  artWide: { flex: 1, height: 180, maxWidth: 300 },
  artSmall: { width: 64, height: 64 },
  plans: { gap: spacing.xl },
  listHeader: { gap: spacing.lg },
  listHeaderWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groups: { gap: spacing.section },
  columns: { flexDirection: 'row', alignItems: 'flex-start' },
  group: { minWidth: 0, gap: spacing.md },
  groupIntro: { gap: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
});
