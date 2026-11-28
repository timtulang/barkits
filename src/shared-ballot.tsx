import { sharedLimitIssues } from './destination-eligibility';
import { DecisionActions } from './decision-actions';
import { colors, spacing } from './theme';
import { useState } from 'react';
import { View } from 'react-native';
import { TripOptions } from './trip-options';
import { TripComparison } from './trip-comparison';
import { sharedTripRows } from './trip-evidence';
import { rideProviders, validFare as validPesoAmount, type RideProvider } from './transport-fares';
import type { Participant } from './planner';
import { EditorDialog } from './editor-dialog';
import { GoogleMapsLink } from './google-maps-link';
import { saveEstimate, setSharedVote, type Candidate, type Member, type SharedEstimate } from './services/shared-meetups';
import { Button, Feedback, Field, Label, layout } from './ui';

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
  return <EditorDialog title="Your trip estimate" close={close} busy={busy}
    actions={<Button busy={busy} busyLabel="Saving…" onPress={submit}>Save estimate</Button>}>
    <Label>{candidate.place.name} · visible to this group</Label>
    <Field label="Travel time (minutes)" numeric value={minutes} disabled={busy} onChange={setMinutes}
      error={submitted && !validTime ? 'Enter a whole number of minutes, including zero.' : undefined} />
    <Field label="One-way fare (₱, optional)" inputMode="decimal" value={fare} disabled={busy} onChange={text => { setFare(text); setProvider(undefined); }}
      error={submitted && !validFare ? 'Enter a fare in pesos with up to two decimal places.' : undefined} />
    <TripOptions origin={trip.point?.join(',') ?? trip.origin} destination={[candidate.place.latitude,candidate.place.longitude].join(',')}
      walking={trip.mode === 'Walking'} currentProvider={provider} currentFare={fare} onUse={(p,f) => { setProvider(p); setFare(f); }} />
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </EditorDialog>;
}

export function SharedBallot({ id, ballot, members, userId, owner, busy, run, refresh, browse, editStartingPoint, selected, selectCandidate, estimateId, editEstimate }: Props & {
  refresh: () => void; browse: () => void; editStartingPoint: () => void; selected?: string; selectCandidate: (candidate: Candidate) => void;
  estimateId?: string; editEstimate: (id?: string) => void;
}) {
  const editing = ballot.find(candidate => candidate.venue_id === estimateId);
  const myTrip = members.find(m => m.id === userId)?.trip;
  const myChoice = ballot.find(c => c.votes.some(v => v.user_id === userId));
  const sorted = [...ballot].sort((a,b) => b.votes.length - a.votes.length || a.place.name.localeCompare(b.place.name) || a.venue_id.localeCompare(b.venue_id));
  return <View style={layout.stack}>
    <View style={{ gap: spacing.xs }}>
      <Label kind="item" heading>Group shortlist</Label>
      <Label kind="detail">{ballot.length ?
        (owner ? 'Each member has one vote. As organizer, you confirm the destination.' : 'You have one vote. The organizer confirms the destination.') :
        'Choose a nearby place and add it here so the group can vote.'}</Label>
    </View>
    {!ballot.length && <Button secondary icon="map" onPress={browse}>Browse nearby places</Button>}
    {myChoice && <Label kind="value">Your vote · {myChoice.place.name}</Label>}
    {sorted.map(c => {
      const voted = c.venue_id === myChoice?.venue_id;
      const blockers = members.map(m => sharedLimitIssues(m, c.estimates.find(e => e.user_id === m.id))).filter(Boolean);
      return <View key={c.venue_id} style={{ gap: spacing.md, paddingTop: spacing.lg, borderTopWidth: 1, borderColor: colors.divider }}>
        <Label kind="item" heading>{c.place.name}</Label>
        {selected === c.venue_id && <Label kind="label">Selected for review</Label>}
        <TripComparison rows={sharedTripRows(members, c.estimates)} editableIds={myTrip && !busy ? [userId] : []}
          edit={() => editEstimate(c.venue_id)} changeTransport={editStartingPoint} />
        {!!blockers.length && <View style={{ gap: spacing.xs }}>
          <Label kind="label" color={colors.warning}>Travel limits to resolve</Label>
          {blockers.map((reason, index) => <Label key={index} kind="detail">{reason}</Label>)}
        </View>}
        <DecisionActions place={c.place.name} count={c.votes.length} votedHere={voted} hasVote={!!myChoice}
          vote={() => run(() => setSharedVote(id, voted ? null : c.venue_id))} busy={busy} blocked={!!blockers.length}
          selected={selected === c.venue_id} select={owner ? () => selectCandidate(c) : undefined} />
        <View style={layout.wrap}>
          {myTrip && <Button quiet disabled={busy} accessibilityLabel={'Edit my trip for ' + c.place.name}
            onPress={() => editEstimate(c.venue_id)}>Edit my trip</Button>}
          {!myTrip && <Button secondary disabled={busy} onPress={editStartingPoint}>Add my start</Button>}
          <GoogleMapsLink point={[c.place.latitude,c.place.longitude]} />
        </View>
      </View>;
    })}
    {editing && myTrip && <EstimateEditor key={editing.venue_id} trip={myTrip} candidate={editing} current={editing.estimates.find(e => e.user_id === userId)}
      close={() => editEstimate()} save={async (minutes,fare,provider) => { await saveEstimate(id, editing.venue_id, minutes, fare, provider); refresh(); }} />}
  </View>;
}
