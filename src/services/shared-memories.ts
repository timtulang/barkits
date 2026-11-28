import { apiRequest } from './shared-client';

export type Recap = { id: string; author_id: string; title: string | null; caption: string; visibility: 'private' | 'group'; revision: number; created_at: string };
export type Memories = { recaps: Recap[]; ratings: { user_id: string; stars: number }[] };

export async function readMemories(id: string) {
  const { memories } = await apiRequest<{ memories: Memories | null }>('/shared/' + encodeURIComponent(id));
  if (!memories) throw new Error('Memories open after the meetup is complete.');
  return memories;
}

export async function finishMeetup(id: string, status: 'completed' | 'archived') {
  await apiRequest('/shared/finish', [id, status]);
}
export async function writeRecap(target: string, postId: string, revision: number, title: string, caption: string, audience: Recap['visibility'] | 'delete') {
  await apiRequest('/shared/recap', [target, postId, revision, title, caption, audience]);
}
export async function rateMeetup(id: string, stars: number | null) {
  await apiRequest('/shared/rating', [id, stars]);
}
