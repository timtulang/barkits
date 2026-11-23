import type { Meetup, Participant } from '../planner';
import { authSetup } from './auth';

export type SharedSummary = { id: string; owner_id: string; name: string; description: string | null; activity: string | null; starts_at: string | null };
type Origin = { user_id: string; label: string; latitude: number | null; longitude: number | null; mode: Participant['mode']; max_fare_pesos: number | null; max_minutes: number | null };
export type Member = { id: string; name: string; trip?: Participant };

function client() {
  if (!authSetup.client) throw new Error('Connect Supabase to use shared meetups.');
  return authSetup.client;
}
async function result<T>(query: PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>) {
  const { data, error } = await query;
  if (error) throw new Error(['PGRST202', 'PGRST205', '42P01'].includes(error.code ?? '') ?
    'Shared meetups need the Barkits database migrations in this Supabase project.' : error.message);
  return data;
}
const fields = 'id,owner_id,name,description,activity,starts_at';
export async function listShared() {
  return (await result(client().from('meetups').select(fields).order('created_at', { ascending: false }))) as SharedSummary[];
}
export async function getShared(id: string) {
  const [summary, roster, origins] = await Promise.all([
    result<SharedSummary>(client().from('meetups').select(fields).eq('id', id).single()),
    result(client().from('meetup_members').select('user_id,display_name').eq('meetup_id', id).order('display_name')),
    result(client().from('meetup_origins').select('user_id,label,latitude,longitude,mode,max_fare_pesos,max_minutes').eq('meetup_id', id)),
  ]);
  const members: Member[] = (roster ?? []).map(({ user_id, display_name }) => {
    const o: Origin | undefined = origins?.find(row => row.user_id === user_id);
    return { id: user_id, name: display_name, trip: o && { id: user_id, name: display_name, origin: o.label,
      point: o.latitude !== null && o.longitude !== null ? [o.latitude, o.longitude] : undefined,
      mode: o.mode, budget: o.max_fare_pesos ?? undefined, maxMinutes: o.max_minutes ?? undefined } };
  });
  if (!summary) throw new Error('Couldn’t find this shared meetup.');
  return { summary, members };
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
