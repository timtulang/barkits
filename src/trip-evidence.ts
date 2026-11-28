import { demoJourney, type Meetup, type Participant, type Venue } from './planner.ts';
import type { Member, SharedEstimate } from './services/shared-meetups';

export type TripEvidence = {
  person: Participant | Pick<Participant, 'id' | 'name'>; origin?: string; mode?: string;
  minutes: number | null; fare: number | null; timeSource: string; fareSource: string; issues: string[];
};

function issues(person: Pick<Participant, 'budget' | 'maxMinutes'>, minutes: number | null, fare: number | null) {
  const result: string[] = [];
  if (person.maxMinutes !== undefined && (minutes === null || minutes > person.maxMinutes)) {
    result.push(minutes === null ? `Time needed for ${person.maxMinutes} min limit` : `${minutes} min exceeds ${person.maxMinutes} min limit`);
  }
  if (person.budget !== undefined && (fare === null || fare > person.budget)) {
    result.push(fare === null ? `Fare needed for ₱${person.budget} limit` : `₱${fare} exceeds ₱${person.budget} limit`);
  }
  return result;
}

export function localTripRows(meetup: Meetup, venue: Venue): TripEvidence[] {
  return meetup.participants.map(person => {
    const demo = demoJourney(venue, person);
    const enteredTime = meetup.manualMinutes?.[venue.id]?.[person.id];
    const enteredFare = meetup.manualFares?.[venue.id]?.[person.id];
    const minutes = enteredTime ?? demo?.minutes ?? null;
    const fare = enteredFare ?? demo?.fare ?? null;
    const note = meetup.fareNotes?.[venue.id]?.[person.id];
    return { person, origin: person.origin, mode: person.mode, minutes, fare,
      timeSource: enteredTime !== undefined ? 'User-entered estimate' : demo ? 'Demo time' : 'Not entered',
      fareSource: enteredFare !== undefined ? note ? `User-entered ${note.provider} · ${new Date(note.savedAt).toLocaleString('en-PH')}` : 'User-entered estimate' :
        demo?.fare != null ? 'Demo fare' : 'Not entered', issues: issues(person, minutes, fare) };
  });
}

export function sharedTripRows(members: Member[], estimates: SharedEstimate[]): TripEvidence[] {
  return members.map(member => {
    const estimate = estimates.find(item => item.user_id === member.id);
    const minutes = estimate?.minutes ?? null;
    const fare = estimate?.fare_pesos ?? null;
    const source = estimate ? `${estimate.source} · ${new Date(estimate.calculated_at).toLocaleString('en-PH')}` : 'Not entered';
    return { person: { id: member.id, name: member.name }, origin: member.trip?.origin, mode: member.trip?.mode,
      minutes, fare, timeSource: source, fareSource: source, issues: issues(member.trip ?? {}, minutes, fare) };
  });
}

export function summarizeTrips(rows: TripEvidence[]) {
  const timed = rows.filter(row => row.minutes !== null);
  return {
    ready: timed.length, count: rows.length,
    time: rows.length > 0 && timed.length === rows.length ? timed.reduce((sum, row) => sum + row.minutes!, 0) : null,
    longest: rows.length > 0 && timed.length === rows.length ? Math.max(...timed.map(row => row.minutes!)) : null,
    gap: rows.length > 0 && timed.length === rows.length ? Math.max(...timed.map(row => row.minutes!)) - Math.min(...timed.map(row => row.minutes!)) : null,
    fare: rows.length > 0 && rows.every(row => row.fare !== null) ? rows.reduce((sum, row) => sum + row.fare!, 0) : null,
    blocked: rows.some(row => row.issues.length > 0),
  };
}
