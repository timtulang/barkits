import type { Participant } from './planner';
import type { LocatedFriend } from './discovery';
import { resolveLocality } from './place-search';
import { resolveLandmark } from './venue-catalog';

export function locateFriends(participants: Participant[]): LocatedFriend[] {
  return participants.flatMap((friend): LocatedFriend[] => {
    if (friend.point) return [{ ...friend, point: friend.point, approximate: false }];
    const city = resolveLocality(friend.origin);
    const point = city ?? resolveLandmark(friend.origin);
    return point ? [{ ...friend, point, approximate: Boolean(city) }] : [];
  });
}
