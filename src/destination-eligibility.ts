import { demoJourney, recommend, type Meetup, type Venue } from './planner.ts';
import type { Member, SharedEstimate } from './services/shared-meetups';

export function canConfirmLocal(meetup: Meetup, venue: Venue) {
  if (!meetup.participants.length || meetup.status !== 'Planning') return false;
  if (recommend(meetup.participants, 'Balanced', meetup.manualFares, meetup.customVenues, meetup.manualMinutes).some(item => item.venue.id === venue.id)) return true;
  const limited = meetup.participants.some(person => person.budget !== undefined || person.maxMinutes !== undefined);
  return !limited && !!meetup.customVenues?.some(item => item.id === venue.id) && meetup.participants.some(person =>
    meetup.manualMinutes?.[venue.id]?.[person.id] === undefined && !demoJourney(venue, person));
}

export function sharedLimitIssues(member: Member, estimate?: SharedEstimate) {
  const { budget, maxMinutes } = member.trip ?? {};
  const issues = [];
  if (maxMinutes !== undefined && (estimate?.minutes == null || estimate.minutes > maxMinutes)) {
    issues.push(estimate?.minutes == null ? 'needs a travel time' : `${estimate.minutes} min exceeds the ${maxMinutes} min limit`);
  }
  if (budget !== undefined && (estimate?.fare_pesos == null || estimate.fare_pesos > budget)) {
    issues.push(estimate?.fare_pesos == null ? 'needs a fare' : `₱${estimate.fare_pesos} exceeds the ₱${budget} limit`);
  }
  return issues.length ? member.name + ' · ' + issues.join(', ') : undefined;
}
