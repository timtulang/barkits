import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LocatedFriend } from './discovery';
import { IconAction } from './form-controls';
import { Kits } from './kits';
import type { Participant } from './planner';
import { colors, spacing } from './theme';
import { Icon, Label, Panel, StatusLine } from './ui';

type Member = { id: string; name: string; trip?: Participant };

export function ParticipantRoster({ members, located, myId, ownerId, edit, action }: {
  members: Member[]; located: LocatedFriend[]; myId?: string; ownerId?: string;
  edit?: (friend: Participant) => void; action?: ReactNode;
}) {
  const mapped = new Map(located.map(friend => [friend.id, friend]));
  const ready = mapped.size === members.length;
  return <Panel>
    <View style={styles.intro}>
      <Label kind="item" heading>Your barkada</Label>
      {members.length > 0 && <StatusLine tone={ready ? 'success' : 'info'} icon={ready ? 'check-circle' : 'map-pin'}>
        {mapped.size} of {members.length} starting {members.length === 1 ? 'point' : 'points'} on the map
        {ready && action ? ' · Ready to find a place' : ''}
      </StatusLine>}
    </View>
    {!members.length && <View style={styles.empty}>
      <Kits style={{ width: 72, height: 54 }} />
      <Label>{action ? 'Add a friend and their starting point so Barkits can look for places nearby.' : 'No friends were added to this meetup.'}</Label>
    </View>}
    {action}
    {members.length > 0 && <View>{members.map(({ id, name, trip }) => {
      const location = mapped.get(id);
      const role = [id === myId && 'You', id === ownerId && 'Organizer'].filter(Boolean).join(' · ');
      const limits = [
        trip?.budget !== undefined && '₱' + trip.budget.toLocaleString('en-PH') + ' max',
        trip?.maxMinutes !== undefined && trip.maxMinutes.toLocaleString('en-PH') + ' min max',
      ].filter(Boolean);
      return <View key={id} style={styles.row}>
        <View style={styles.identity}>
          <Label kind="value">{name}</Label>
          {!!role && <Label kind="label">{role}</Label>}
          {trip && <Label>{trip.origin}</Label>}
          {(!location || location.approximate) && <View style={styles.summary}>
            <Icon name={location ? 'map' : 'map-pin'} size={14} color={location ? colors.textMuted : colors.warning} />
            <Label kind="detail" color={location ? colors.textMuted : colors.warning}>
              {location ? 'Approximate area center' : trip ? 'Needs a map pin' : 'Starting point pending'}
            </Label>
          </View>}
          {trip && <Label kind="detail">{[trip.mode, ...limits].join(' · ')}</Label>}
        </View>
        {edit && trip && <IconAction name="edit-2" label={'Edit ' + name} onPress={() => edit(trip)} />}
      </View>;
    })}</View>}
  </Panel>;
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs },
  empty: { gap: spacing.sm, alignItems: 'flex-start' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderTopWidth: 1,
    borderColor: colors.divider, paddingVertical: spacing.md },
  identity: { flex: 1, minWidth: 0, gap: spacing.xs },
});
