import type { Mode } from './planner';
import type { Category } from './discovery';

export const avatars = ['map-pin', 'coffee', 'sun', 'smile', 'heart', 'user'] as const;
export type AccountSettings = {
  username: string | null; biography: string; avatar: typeof avatars[number]; mode: Mode | null;
  budget: number | null; max_minutes: number | null; category: Category;
  recap_audience: 'private' | 'group'; reminders: boolean; revision: number;
};
export function settingsProblem(settings: AccountSettings): string | undefined {
  if (settings.username !== null && !/^[a-z][a-z0-9_]{2,23}$/.test(settings.username)) {
    return 'Use 3–24 lowercase letters, numbers or underscores, starting with a letter.';
  }
  if ([...settings.biography].length > 500 || /\p{Cc}/u.test(settings.biography)) return 'Keep your biography to 500 characters without line breaks.';
  if (settings.budget !== null && (!Number.isFinite(settings.budget) || settings.budget < 0 || settings.budget > 9999999.99 ||
    Math.abs(Math.round(settings.budget * 100) - settings.budget * 100) > 0.000001)) return 'Enter a fare limit from ₱0 to ₱9,999,999.99, with up to two decimal places.';
  if (settings.max_minutes !== null && (!Number.isInteger(settings.max_minutes) || settings.max_minutes < 1 || settings.max_minutes > 1440)) return 'Enter a travel time from 1 to 1,440 minutes.';
}
