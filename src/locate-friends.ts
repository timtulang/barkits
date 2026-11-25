import type { Participant } from './planner';
import type { LocatedFriend } from './discovery';
import { resolveLocality } from './place-search';
import { resolveLandmark } from './venue-catalog';

export function locateFriends(participants: Participant[]): LocatedFriend[] {
  return participants.flatMap((friend): LocatedFriend[] => {
    const city = resolveLocality(friend.origin);
    if (friend.point) {
      const atAreaCenter = city?.[0] === friend.point[0] && city[1] === friend.point[1];
      return [{ ...friend, point: friend.point, approximate: atAreaCenter }];
    }
    const point = city ?? resolveLandmark(friend.origin);
    return point ? [{ ...friend, point, approximate: Boolean(city) }] : [];
  });
}
