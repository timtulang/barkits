import { useCallback, useState } from 'react';
import { useAccountSettings } from './account-settings-context';
import { readDashboard } from './services/account';
import { formatSharedSchedule } from './meetup-schedule';
import { View } from 'react-native';
import { IconAction } from './form-controls';
import { MeetupListItem } from './meetup-list-item';
import { type SharedSummary } from './services/shared-meetups';
import { colors, spacing } from './theme';
import { Button, EmptyState, Feedback, Label, layout, LoadingState } from './ui';
import { useSharedData } from './use-shared-data';

type Props = { past: boolean; open: (id: string) => void };

export function SharedList(props: Props) {
  const [page,setPage] = useState({past:props.past,offset:0});
  const offset = page.past===props.past ? page.offset : 0;
  return <DashboardPage key={`${props.past}:${offset}`} {...props} offset={offset} change={offset=>setPage({past:props.past,offset})} />;
}

function DashboardPage({offset,change,...props}: Props & {offset:number;change:(offset:number)=>void}) {
  const load = useCallback(()=>readDashboard(props.past,offset),[props.past,offset]);
  const {data,loading,error,refresh} = useSharedData(load);
  const preferences=useAccountSettings();
  return <View style={{gap:spacing.md}}>
    <SharedListContent {...props} data={data?.plans} loading={loading} error={error} refresh={refresh} reminders={preferences.data?.reminders} />
    {!!data?.total && <View style={{gap:spacing.sm}}>
      <Label kind="detail">Showing {data.offset+1}–{Math.min(data.offset+data.plans.length,data.total)} of {data.total} shared meetups</Label>
      <View style={layout.wrap}>
        {offset>0 && <Button secondary disabled={loading} onPress={()=>change(offset-50)}>Previous plans</Button>}
        {data.next_offset!==null && <Button secondary disabled={loading} onPress={()=>change(data.next_offset!)}>More plans</Button>}
      </View>
    </View>}
  </View>;
}

export function SharedListContent({ open, past, data, loading, error, refresh, reminders }: Props & {
  data: (SharedSummary & {next_action?:string|null})[] | undefined; reminders?:boolean; loading: boolean; error: string; refresh: () => void;
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
      detail={[group.activity, reminders && group.next_action ? 'Next: ' + group.next_action : null].filter(Boolean).join(' · ') || undefined} onPress={() => open(group.id)} />)}
    {!loading && !error && !groups?.length && <EmptyState title={past ? 'No past shared meetups yet' : 'Bring everyone into the plan'}>
      {past ? 'Completed and archived shared plans will appear here.' : 'Join with an invite code, or choose “With friends” when you plan a meetup.'}
    </EmptyState>}
  </View>;
}
