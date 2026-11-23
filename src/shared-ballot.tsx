import { useState } from 'react';
import { View } from 'react-native';
import { TripOptions } from './trip-options';
import { rideProviders, validFare as validPesoAmount, type RideProvider } from './transport-fares';
import type { Participant } from './planner';
import { EditorDialog } from './editor-dialog';
import { GoogleMapsLink } from './google-maps-link';
import { finalizeShared, saveEstimate, setSharedVote, type Candidate, type Member, type SharedEstimate } from './services/shared-meetups';
import { Button, Field, Label, layout, Panel } from './ui';

type Props = { id: string; ballot: Candidate[]; members: Member[]; userId: string; owner: boolean;
  busy: boolean; run: (action: () => Promise<void>) => Promise<boolean> };

function EstimateEditor({ candidate, current, trip, save, close }: {
  candidate: Candidate; current?: SharedEstimate; trip: Participant; close: () => void; save: (minutes: number, fare: number | null, provider?: RideProvider) => Promise<void>;
}) {
  const [minutes, setMinutes] = useState(current?.minutes?.toString() ?? '');
  const [fare, setFare] = useState(current?.fare_pesos?.toString() ?? '');
  const [provider,setProvider] = useState<RideProvider | undefined>(() => rideProviders.find(p => current?.source === 'User-entered ' + p));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const validTime = /^\d+$/.test(minutes.trim()) && Number(minutes) <= 2147483647;
  const validFare = !fare.trim() || validPesoAmount(fare);
  async function submit() {
    setSubmitted(true);
    if (busy || !validTime || !validFare) return;
    setBusy(true);
    setError('');
    try { await save(Number(minutes), fare.trim() ? Number(fare) : null,provider); close(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t save this estimate. Try again.'); }
    finally { setBusy(false); }
  }
  return <EditorDialog title="Your trip estimate" close={close} busy={busy}>
    <Label>{candidate.place.name} · visible to this group</Label>
    <Field label="Travel time (minutes)" numeric value={minutes} onChange={setMinutes}
      error={submitted && !validTime ? 'Enter a whole number of minutes, including zero.' : undefined} />
    <Field label="One-way fare (₱, optional)" inputMode="decimal" value={fare} onChange={text => { setFare(text); setProvider(undefined); }}
      error={submitted && !validFare ? 'Enter a fare in pesos with up to two decimal places.' : undefined} />
    <TripOptions origin={trip.point?.join(',') ?? trip.origin} destination={[candidate.place.latitude,candidate.place.longitude].join(',')}
      walking={trip.mode === 'Walking'} currentProvider={provider} currentFare={fare} onUse={(p,f) => { setProvider(p); setFare(f); }} />
    {!!error && <View accessibilityRole="alert"><Label>{error}</Label></View>}
    <View style={layout.wrap}><Button disabled={busy} onPress={submit}>Save estimate</Button></View>
  </EditorDialog>;
}

function unmetLimit(member: Member, estimate?: SharedEstimate) {
  const trip = member.trip;
  if (trip?.maxMinutes !== undefined && (estimate?.minutes == null || estimate.minutes > trip.maxMinutes)) return true;
  return trip?.budget !== undefined && (estimate?.fare_pesos == null || estimate.fare_pesos > trip.budget);
}

export function SharedBallot({ id, ballot, members, userId, owner, busy, run, refresh }: Props & { refresh: () => void }) {
  const [confirm, setConfirm] = useState('');
  const [editing, setEditing] = useState<Candidate>();
  const myTrip = members.find(m => m.id === userId)?.trip;
  const sorted = [...ballot].sort((a,b) => b.votes.length - a.votes.length || a.place.name.localeCompare(b.place.name) || a.venue_id.localeCompare(b.venue_id));
  return <Panel><Label kind="section" heading>Group shortlist</Label>
    <Label kind="detail">{ballot.length ? 'Each friend has one vote. You can change yours until the organizer confirms a place.' : 'Add a nearby place for the group to vote on.'}</Label>
    {sorted.map(c => {
      const voted = c.votes.some(v => v.user_id === userId);
      const blockers = members.filter(m => unmetLimit(m, c.estimates.find(e => e.user_id === m.id)));
      return <View key={c.venue_id} style={layout.stack}>
        <Label kind="item" heading>{c.place.name}</Label>
        <Label kind="label">{c.votes.length} {c.votes.length === 1 ? 'vote' : 'votes'}{voted ? ' · includes your vote' : ''}</Label>
        {c.estimates.map(e => <Label key={e.user_id}>{members.find(m => m.id === e.user_id)?.name} · Estimated {e.minutes ?? '—'} min · {e.fare_pesos === null ? 'Fare unknown' : '₱' + e.fare_pesos}{e.source.startsWith('User-entered ') ? ' · ' + e.source + ' · ' + new Date(e.calculated_at).toLocaleString('en-PH') : ''}</Label>)}
        {!!blockers.length && <Label>Needs an estimate within the travel limits for {blockers.map(m => m.name).join(', ')}.</Label>}
        <View style={layout.wrap}>
          <Button disabled={busy} secondary={voted} onPress={() => run(() => setSharedVote(id, voted ? null : c.venue_id))}>{voted ? 'Remove my vote' : 'Vote for this place'}</Button>
          {myTrip && <Button secondary disabled={busy} onPress={() => setEditing(c)}>My trip estimate</Button>}
          <GoogleMapsLink point={[c.place.latitude,c.place.longitude]} />
          {owner && <Button secondary disabled={busy || !!blockers.length} onPress={() => setConfirm(c.venue_id)}>Choose this spot</Button>}
        </View>
        {owner && confirm === c.venue_id && <><Label weight="bold">Meet at {c.place.name}? Confirming closes voting for everyone.</Label>
          <View style={layout.wrap}><Button disabled={busy || !!blockers.length} onPress={async () => { if (await run(() => finalizeShared(id, c.venue_id))) setConfirm(''); }}>Finalize location</Button>
            <Button secondary disabled={busy} onPress={() => setConfirm('')}>Cancel</Button></View></>}
      </View>;
    })}
    {editing && myTrip && <EstimateEditor trip={myTrip} candidate={editing} current={editing.estimates.find(e => e.user_id === userId)}
      close={() => setEditing(undefined)} save={async (minutes,fare,provider) => { await saveEstimate(id, editing.venue_id, minutes, fare, provider); refresh(); }} />}
  </Panel>;
}
