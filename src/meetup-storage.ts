import { example, type Meetup } from './planner.ts';

export const meetupStorageKey = 'barkits.meetups.v1';

export function newMeetupId() {
  // local identifiers do not grant access and also need to work without web crypto.
  return globalThis.crypto?.randomUUID?.() ??
    `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function readMeetups(stored: string | null): { meetups: Meetup[]; upgraded: boolean } {
  if (stored === null) return { meetups: [example], upgraded: false };
  const records: unknown = JSON.parse(stored);
  if (!Array.isArray(records)) throw new Error('Expected a list of saved meetups.');

  const ids = new Set<string>();
  let upgraded = false;
  const meetups = records.map((record: Omit<Meetup, 'id'> & { id?: unknown }, index): Meetup => {
    if (!record || typeof record.name !== 'string' || typeof record.date !== 'string' ||
      !Array.isArray(record.participants) || !record.votes || !record.ratings) {
      throw new Error('Invalid saved meetup.');
    }
    const id = record.id === undefined ? (index === 0 ? example.id : newMeetupId()) : record.id;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) {
      throw new Error('Invalid or duplicate saved meetup ID.');
    }
    ids.add(id);
    upgraded ||= record.id === undefined;
    return { ...record, id };
  });
  return { meetups, upgraded };
}
