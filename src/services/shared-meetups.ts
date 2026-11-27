import type { RideProvider } from '../transport-fares';
import type { Meetup, Participant, Venue } from '../planner';
import { apiRequest } from './shared-client';
import type { Memories } from './shared-memories';

export type SharedSummary = { id: string; owner_id: string; name: string; description: string | null; activity: string | null; starts_at: string | null; status: Lowercase<Meetup['status']> };
export type SharedPlace = { name: string; latitude: number; longitude: number; catalog_key: string | null };
export type SharedEstimate = { source: string; calculated_at: string; user_id: string; minutes: number | null; fare_pesos: number | null };
export type Candidate = { venue_id: string; place: SharedPlace; votes: { user_id: string }[]; estimates: SharedEstimate[] };
type Origin = { user_id: string; label: string; latitude: number | null; longitude: number | null; mode: Participant['mode']; max_fare_pesos: number | null; max_minutes: number | null };
export type Member = { id: string; name: string; trip?: Participant };

type MeetupDetails = {
  summary: SharedSummary & { chosen: SharedPlace | null; ballot: Candidate[] };
  roster: { user_id: string; display_name: string }[];
  origins: Origin[];
  memories: Memories | null;
};

export function listShared() {
  return apiRequest<SharedSummary[]>('/shared');
}
export async function getShared(id: string) {
  const { summary, roster, origins, memories } = await apiRequest<MeetupDetails>('/shared/' + encodeURIComponent(id));
  const members: Member[] = roster.map(({ user_id, display_name }) => {
    const o = origins.find(row => row.user_id === user_id);
    return { id: user_id, name: display_name, trip: o && { id: user_id, name: display_name, origin: o.label,
      point: o.latitude !== null && o.longitude !== null ? [o.latitude, o.longitude] : undefined,
      mode: o.mode, budget: o.max_fare_pesos ?? undefined, maxMinutes: o.max_minutes ?? undefined } };
  });
  return { summary, members, memories: memories ?? undefined };
}
export function createShared(requestId: string, meetup: Meetup, name: string) {
  return apiRequest<string>('/shared/create', [requestId, meetup.name, name, meetup.activity ?? '', meetup.description ?? '',
    meetup.date ? meetup.date.replace(' ', 'T') + ':00+08:00' : null]);
}
export function joinShared(code: string, name: string) {
  return apiRequest<string>('/shared/join', [code, name.trim()]);
}
export function issueCode(id: string) {
  return apiRequest<string>('/shared/invite', [id]);
}
export async function saveOwnTrip(id: string, friend: Participant) {
  await apiRequest('/shared/trip', [id, friend.origin, friend.mode, friend.point?.[0] ?? null, friend.point?.[1] ?? null,
    friend.budget ?? null, friend.maxMinutes ?? null]);
}
export async function shortlistPlace(id: string, venue: Venue) {
  if (!venue.point) throw new Error('Choose a place with a map pin.');
  await apiRequest('/shared/shortlist', [id, venue.id, venue.name, ...venue.point]);
}
export async function setSharedVote(id: string, candidate: string | null) {
  await apiRequest('/shared/vote', [id, candidate]);
}
export async function saveEstimate(id: string, candidate: string, minutes: number, fare: number | null, provider?: RideProvider) {
  await apiRequest('/shared/estimate', [id, candidate, minutes, fare, provider ?? null]);
}
export async function finalizeShared(id: string, candidate: string) {
  await apiRequest('/shared/finalize', [id, candidate]);
}
