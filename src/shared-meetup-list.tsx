import { formatSharedSchedule } from './meetup-schedule';
import { View } from 'react-native';
import { IconAction } from './form-controls';
import { MeetupListItem } from './meetup-list-item';
import { listShared, type SharedSummary } from './services/shared-meetups';
import { colors, spacing } from './theme';
import { Button, EmptyState, Feedback, Label, layout, LoadingState } from './ui';
import { useSharedData } from './use-shared-data';

type Props = { past: boolean; open: (id: string) => void };

export function SharedList(props: Props) {
  const state = useSharedData(listShared);
  return <SharedListContent {...props} {...state} />;
}

export function SharedListContent({ open, past, data, loading, error, refresh }: Props & {
  data: SharedSummary[] | undefined; loading: boolean; error: string; refresh: () => void;
}) {
  const groups = data?.filter(group => ['completed', 'archived'].includes(group.status) === past);
  return <View style={{ gap: spacing.md }}>
    <View style={[layout.between, { paddingBottom: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider }]}>
      <View style={{ flex: 1 }}><Label kind="item" heading>With friends</Label>
        <Label kind="detail">Plans available to the people in each meetup.</Label></View>
      <IconAction disabled={loading} onPress={refresh} name="refresh-cw" label="Refresh shared meetups" />
    </View>
    {loading && <LoadingState label="Loading shared meetups…" />}
    {!!error && <Feedback tone="error" title="Couldn’t refresh shared meetups"
      action={<Button secondary onPress={refresh}>Try again</Button>}>{error}{data ? ' Previously loaded plans are shown below.' : ''}</Feedback>}
    {groups?.map(group => <MeetupListItem key={group.id} name={group.name} status={group.status}
      date={group.starts_at ? formatSharedSchedule(group.starts_at) : 'Date to be decided'}
      detail={group.activity ?? undefined} onPress={() => open(group.id)} />)}
    {!loading && !error && !groups?.length && <EmptyState title={past ? 'No past shared meetups yet' : 'Bring everyone into the plan'}>
      {past ? 'Completed and archived shared plans will appear here.' : 'Join with an invite code, or choose “With friends” when you plan a meetup.'}
    </EmptyState>}
  </View>;
}
