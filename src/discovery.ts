import { directDistance, type Point } from './geo.ts';
import type { Participant, Venue } from './planner';

export type VenueRow = [string, string, string, string, number, number, number, string?];
export type LocatedFriend = Pick<Participant, 'name' | 'mode' | 'id'> & { point: Point; approximate: boolean };
export const categories = ['All', 'Café', 'Restaurant', 'Mall', 'Museum', 'Park'] as const;
export type Category = typeof categories[number];

export function activityCategory(activity = ''): Category {
  const normalized = activity.toLowerCase();
  if (/coffee|café|cafe|kape/.test(normalized)) return 'Café';
  if (/restaurant|lunch|dinner|breakfast|merienda|food|brunch/.test(normalized)) return 'Restaurant';
  if (/mall|shopping/.test(normalized)) return 'Mall';
  if (/museum/.test(normalized)) return 'Museum';
  if (/park|picnic/.test(normalized)) return 'Park';
  return 'All';
}

export function discover(friends: LocatedFriend[], category: Category, catalog: VenueRow[]) {
  if (!friends.length) return [];
  const transitShare = friends.filter(friend => (friend.mode === 'Public transport' || friend.mode === 'Mixed commute')).length / friends.length;
  const candidates = catalog.flatMap(([id, name, area, kind, lat, lng, nearBus, address]) => {
    if (category !== 'All' && kind !== category) return [];
    // latitude alone bounds the minimum possible distance
    if (Math.abs(friends[0].point[0] - lat) > 0.46) return [];
    const point: Point = [lat, lng];
    const distances = friends.map(friend => directDistance(friend.point, point));
    const longest = Math.max(...distances);
    if (longest > 50) return [];
    const mean = distances.reduce((sum, d) => sum + d, 0) / friends.length;
    const score = 0.6 * longest + 0.4 * mean - (nearBus ? 0.5 * transitShare : 0);
    const venue: Venue = { id, name, area, point, category: kind, icon: kind === 'Mall' ? 'shopping-bag' : kind === 'Café' ? 'coffee' : 'sun', color: 'mint' };
    return [{ venue, address, distances, longest, nearBus: Boolean(nearBus), score }];
  });
  candidates.sort((a,b) => a.score - b.score || a.venue.id.localeCompare(b.venue.id));
  const best: typeof candidates = [];
  for (const candidate of candidates) {
    const duplicate = best.some(item => item.venue.name.toLowerCase() === candidate.venue.name.toLowerCase() &&
      directDistance(item.venue.point!, candidate.venue.point!) < 0.3);
    if (!duplicate) best.push(candidate);
    if (best.length === 3) break;
  }
  return best;
}
