import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { FriendPicker } from './friend-picker';
import { GoogleMapsLink } from './google-maps-link';
import { LifecycleAction } from './meetup-arrival';
import { formatLocalSchedule } from './meetup-schedule';
import { MemoryHeading, RatingChoices } from './memory-ui';
import { ratingSummary, type Meetup, type Participant, type Venue } from './planner';
import { Button, EmptyState, Feedback, Field, Icon, Label, layout, Panel, StatusLine } from './ui';
import { WorkspaceColumns } from './workspace-layout';

export function LocalMemories({ meetup, venue, voter, selectVoter, save, saved, saveStatus, retrySave, celebrate, map, roster, reportDirty }: {
  meetup: Meetup; venue?: Venue; voter?: Participant; selectVoter: (id: string) => void;
  save: (meetup: Meetup) => void; saved: boolean; saveStatus: string; retrySave?: () => void; celebrate: boolean;
  map: () => void; roster: ReactNode;
  reportDirty: (dirty: boolean) => void;
}) {
  const [caption, setCaption] = useState(meetup.recap ?? '');
  const [removing, setRemoving] = useState(false);
  const [recapNotice, setRecapNotice] = useState('');
  const archived = meetup.status === 'Archived';
  const ratings = ratingSummary(meetup.ratings);
  const dirty = caption !== (meetup.recap ?? '');
  useEffect(() => { reportDirty(dirty); }, [dirty, reportDirty]);

  function rate(stars: number | null) {
    if (!voter) return;
    const next = { ...meetup.ratings };
    if (stars === null) delete next[voter.id];
    else next[voter.id] = stars;
    save({ ...meetup, ratings: next });
  }

  return <View style={layout.stack}>
    <MemoryHeading title={archived ? 'Meetup memories' : 'Save the memory'} venue={venue?.name}
      schedule={formatLocalSchedule(meetup.date)} celebrate={celebrate} />
    <WorkspaceColumns main={<Panel>
      <Label kind="item" heading>Recap</Label>
      <View style={layout.row}><Icon name="lock" size={16} /><Label kind="label">On this device</Label></View>
      {retrySave ? <Feedback tone="error" title="Changes are not saved"
        action={<Button secondary onPress={retrySave}>Try again</Button>}>
        Barkits kept your changes open. Try saving them on this device again.
      </Feedback> : !saved && <StatusLine>{saveStatus}</StatusLine>}
      {archived ? meetup.recap ? <Label>{meetup.recap}</Label> :
        <EmptyState title="No recap saved">This meetup was archived without a recap.</EmptyState> : <>
        <Field label="Recap caption" value={caption} onChange={value => { setCaption(value); setRecapNotice(''); }}
          placeholder="Anong kuwento ng lakad?" multiline disabled={!saved} />
        <View style={layout.wrap}>
          <Button disabled={!saved || !caption.trim() || !dirty} onPress={() => {
            const recap = caption.trim();
            setCaption(recap);
            save({ ...meetup, recap });
            setRecapNotice('Recap saved on this device.');
          }}>Save recap</Button>
          {dirty && <Button quiet disabled={!saved} onPress={() => setCaption(meetup.recap ?? '')}>Reset changes</Button>}
          {!!meetup.recap && !removing && <Button quiet disabled={!saved} onPress={() => setRemoving(true)}>Remove recap</Button>}
        </View>
        {removing && <View style={layout.stack}>
          <Label kind="detail">Remove the saved recap and clear the caption?</Label>
          <View style={layout.wrap}><Button variant="danger" disabled={!saved} onPress={() => {
            setCaption('');
            setRemoving(false);
            save({ ...meetup, recap: undefined });
            setRecapNotice('Recap removed from this device.');
          }}>Confirm removal</Button><Button quiet onPress={() => setRemoving(false)}>Cancel</Button></View>
        </View>}
        {saved && !!recapNotice && <StatusLine tone="success">{recapNotice}</StatusLine>}
      </>}
    </Panel>} side={<>
      <Panel>
        <Label kind="item" heading>Meetup rating</Label>
        {ratings ? <Label kind="value">{ratings.average.toFixed(1)} / 5 · {ratings.count} {ratings.count === 1 ? 'rating' : 'ratings'}</Label> :
          <Label kind="detail">No ratings yet.</Label>}
        {!archived && voter && <>
          <FriendPicker label="Rate as" people={meetup.participants} selected={voter.id} change={selectVoter} />
          <RatingChoices value={meetup.ratings[voter.id]} disabled={!saved} change={rate} />
          {meetup.ratings[voter.id] !== undefined && <Button quiet disabled={!saved} onPress={() => rate(null)}>Remove rating</Button>}
        </>}
      </Panel>
      {!archived && <>
        <LifecycleAction archive busy={!saved || dirty} run={() => { save({ ...meetup, status: 'Archived' }); return true; }} />
        {dirty && <Label kind="detail">Save or reset the recap before archiving.</Label>}
      </>}
      {(meetup.activity || meetup.description || venue?.point) && <Panel>
        <Label kind="item" heading>Meetup details</Label>
        {!!meetup.activity && <Label weight="bold">{meetup.activity}</Label>}
        {!!meetup.description && <Label>{meetup.description}</Label>}
        {venue?.point && <View style={layout.wrap}><Button quiet icon="map" onPress={map}>View venue map</Button>
          <GoogleMapsLink point={venue.point} /></View>}
      </Panel>}
      {roster}
    </>} />
  </View>;
}
