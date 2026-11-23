import { client, result } from './shared-client';

export type Recap = { id: string; author_id: string; title: string | null; caption: string; visibility: 'private' | 'group'; revision: number; created_at: string };
export async function readMemories(id: string) {
  const [recaps, ratings] = await Promise.all([
    result(client().from('meetup_recaps').select('id,author_id,title,caption,visibility,revision,created_at')
      .eq('meetup_id', id).order('created_at', { ascending: false }).returns<Recap[]>()),
    result(client().from('meetup_ratings').select('user_id,stars').eq('meetup_id', id).returns<{user_id: string; stars: number}[]>()),
  ]);
  return { recaps: recaps ?? [], ratings: ratings ?? [] };
}
export async function finishMeetup(id: string, status: 'completed' | 'archived') {
  await result(client().rpc('finish_shared_meetup', { target: id, next_status: status }));
}
export async function writeRecap(target: string, postId: string, revision: number, title: string, caption: string, audience: Recap['visibility'] | 'delete') {
  await result(client().rpc('save_shared_recap', { target, post_id: postId, expected_revision: revision, heading: title, body: caption, audience }));
}
export async function rateMeetup(id: string, stars: number | null) {
  await result(client().rpc('rate_shared_meetup', { target: id, stars_given: stars }));
}
