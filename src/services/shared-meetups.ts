import type { Meetup, Participant, Venue } from '../planner';
import { client, result } from './shared-client';
import { readMemories } from './shared-memories';

export type SharedSummary = { id: string; owner_id: string; name: string; description: string | null; activity: string | null; starts_at: string | null; status: Lowercase<Meetup['status']> };
export type SharedPlace = { name: string; latitude: number; longitude: number; catalog_key: string | null };
export type SharedEstimate = { user_id: string; minutes: number | null; fare_pesos: number | null };
export type Candidate = { venue_id: string; place: SharedPlace; votes: { user_id: string }[]; estimates: SharedEstimate[] };
type Origin = { user_id: string; label: string; latitude: number | null; longitude: number | null; mode: Participant['mode']; max_fare_pesos: number | null; max_minutes: number | null };
export type Member = { id: string; name: string; trip?: Participant };

const fields = 'id,owner_id,name,description,activity,starts_at,status';
const placeFields = 'name,latitude,longitude,catalog_key';
const decisionFields = fields + ',chosen:venues!meetups_venue_id_fkey(' + placeFields + '),ballot:meetup_candidates(venue_id,place:venues!meetup_candidates_venue_id_fkey(' + placeFields + '),votes:meetup_votes(user_id),estimates:meetup_journeys(user_id,minutes,fare_pesos))';
export async function listShared() {
  return (await result(client().from('meetups').select(fields).order('created_at', { ascending: false }))) as SharedSummary[];
}
export async function getShared(id: string) {
  const [summary, roster] = await Promise.all([
    result(client().from('meetups').select(decisionFields).eq('id', id).single<SharedSummary & { chosen: SharedPlace | null; ballot: Candidate[] }>()),
    result(client().from('meetup_members').select('user_id,display_name').eq('meetup_id', id).order('display_name')),
  ]);
  if (!summary) throw new Error('Couldn’t find this shared meetup.');
  const finished = summary.status === 'completed' || summary.status === 'archived';
  const memories = finished ? await readMemories(id) : undefined;
  const origins = finished ? [] : await result(client().from('meetup_origins').select('user_id,label,latitude,longitude,mode,max_fare_pesos,max_minutes').eq('meetup_id', id));
  const members: Member[] = (roster ?? []).map(({ user_id, display_name }) => {
    const o: Origin | undefined = origins?.find(row => row.user_id === user_id);
    return { id: user_id, name: display_name, trip: o && { id: user_id, name: display_name, origin: o.label,
      point: o.latitude !== null && o.longitude !== null ? [o.latitude, o.longitude] : undefined,
      mode: o.mode, budget: o.max_fare_pesos ?? undefined, maxMinutes: o.max_minutes ?? undefined } };
  });
  return { summary, members, memories };
}
export async function createShared(requestId: string, meetup: Meetup, name: string) {
  return await result(client().rpc('create_shared_meetup', { request_id: requestId, meetup_name: meetup.name, member_name: name,
    meetup_activity: meetup.activity ?? '', meetup_description: meetup.description ?? '',
    meetup_start: meetup.date ? meetup.date.replace(' ', 'T') + ':00+08:00' : null })) as string;
}
export async function joinShared(code: string, name: string) {
  return await result(client().rpc('join_shared_meetup', { invite_code: code, member_name: name.trim() })) as string;
}
export async function issueCode(id: string) {
  return await result(client().rpc('issue_meetup_code', { target: id })) as string;
}
export async function saveOwnTrip(id: string, friend: Participant) {
  await result(client().from('meetup_origins').upsert({ meetup_id: id, user_id: friend.id, label: friend.origin,
    mode: friend.mode, latitude: friend.point?.[0] ?? null, longitude: friend.point?.[1] ?? null,
    max_fare_pesos: friend.budget ?? null, max_minutes: friend.maxMinutes ?? null }));
}

export async function shortlistPlace(id: string, venue: Venue) {
  if (!venue.point) throw new Error('Choose a place with a map pin.');
  await result(client().rpc('shortlist_shared_venue', { target: id, place_key: venue.id, place_name: venue.name, lat: venue.point[0], lng: venue.point[1] }));
}
export async function setSharedVote(id: string, candidate: string | null) {
  await result(client().rpc('set_shared_vote', { target: id, candidate }));
}
export async function saveEstimate(id: string, candidate: string, minutes: number, fare: number | null) {
  await result(client().rpc('save_shared_estimate', { target: id, candidate, trip_minutes: minutes, fare }));
}
export async function finalizeShared(id: string, candidate: string) {
  await result(client().rpc('finalize_shared_venue', { target: id, candidate }));
}
