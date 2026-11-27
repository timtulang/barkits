export const origins = ['Caloocan', 'Quezon City', 'Makati', 'Pasig'] as const;
export const modes = ['Public transport', 'Private car', 'Motorcycle taxi'] as const;
export const rankings = ['Balanced', 'Fairest', 'Fastest', 'Cheapest'] as const;
export type Mode = typeof modes[number];
export type Ranking = typeof rankings[number];
export type Participant = { id: string; name: string; origin: typeof origins[number]; mode: Mode; budget?: number; maxMinutes?: number };
export type Journey = { minutes: number; fare: number | null; manual?: boolean };
export type ManualFares = Record<string, Record<string, number>>;
export type Venue = { id: string; name: string; area: string; category: string; icon: 'shopping-bag' | 'coffee' | 'sun'; color: 'mango' | 'lavender' | 'mint'; point: [number, number] };
export const venues: Venue[] = [
  { id: 'meg', name: 'SM Megamall', area: 'Ortigas Center, Mandaluyong', category: 'Mall', icon: 'shopping-bag', color: 'mango', point: [14.585, 121.057] },
  { id: 'cub', name: 'Gateway Mall', area: 'Araneta City, Quezon City', category: 'Mall', icon: 'coffee', color: 'lavender', point: [14.622, 121.053] },
  { id: 'ayl', name: 'Ayala Triangle Gardens', area: 'Makati Central Business District', category: 'Park', icon: 'sun', color: 'mint', point: [14.557, 121.024] },
];
const transit = [
  [[52, 64], [35, 43], [24, 38], [17, 24]],
  [[38, 46], [19, 26], [43, 54], [34, 44]],
  [[62, 72], [49, 58], [14, 18], [28, 36]],
];
export function demoJourney(venue: Venue, participant: Participant): Journey {
  const [minutes, fare] = transit[venues.indexOf(venue)][origins.indexOf(participant.origin)];
  switch (participant.mode) {
    case 'Private car': return { minutes: Math.round(minutes * 0.85), fare: Math.round(fare * 1.7) };
    case 'Motorcycle taxi': return { minutes: Math.round(minutes * 0.68), fare: null };
    default: return { minutes, fare };
  }
}
export function recommend(participants: Participant[], ranking: Ranking, manualFares: ManualFares = {}) {
  if (!participants.length) return [];
  const candidates = venues.flatMap(venue => {
    const journeys = participants.map(participant => {
      const demo = demoJourney(venue, participant);
      const manualFare = manualFares[venue.id]?.[participant.id];
      return { participant, ...demo, fare: manualFare ?? demo.fare, manual: manualFare !== undefined };
    });
    const exceedsLimits = journeys.some(({ participant, minutes, fare }) =>
      (participant.maxMinutes !== undefined && minutes > participant.maxMinutes) ||
      (participant.budget !== undefined && (fare === null || fare > participant.budget)));
    if (exceedsLimits) return [];
    const times = journeys.map(journey => journey.minutes);
    const time = times.reduce((sum, value) => sum + value, 0);
    const spread = Math.max(...times) - Math.min(...times);
    const cost = journeys.some(journey => journey.fare === null) ? null :
      journeys.reduce((sum, journey) => sum + (journey.fare ?? 0), 0);
    if (ranking === 'Cheapest' && cost === null) return [];
    const scores = {
      Balanced: 0.5 * time / (60 * journeys.length) + 0.3 * spread / 60 + 0.2 * (cost === null ? 1.1 : Math.min(1, cost / (100 * journeys.length))),
      Fairest: spread,
      Fastest: time,
      Cheapest: cost ?? Infinity,
    };
    return [{ venue, journeys, time, spread, cost, score: scores[ranking] }];
  });
  return candidates.sort((a, b) => a.score - b.score || a.venue.id.localeCompare(b.venue.id));
}
export type Meetup = {
  id: string;
  name: string;
  date: string;
  participants: Participant[];
  status: 'Planning' | 'Decided' | 'Completed' | 'Archived';
  votes: Record<string, string>;
  manualFares?: ManualFares;
  venue?: string;
  recap?: string;
  ratings: Record<string, number>;
};
export const example: Meetup = {
  id: 'demo',
  name: 'Saturday catch-up',
  date: '',
  participants: [
    { id: '1', name: 'Mika', origin: 'Caloocan', mode: 'Public transport' },
    { id: '2', name: 'Sam', origin: 'Quezon City', mode: 'Public transport' },
    { id: '3', name: 'Jo', origin: 'Makati', mode: 'Public transport' },
    { id: '4', name: 'Pao', origin: 'Pasig', mode: 'Public transport' },
  ],
  status: 'Planning', votes: {}, ratings: {},
};
export function ratingSummary(ratings: Meetup['ratings']) {
  const values = Object.values(ratings);
  return values.length ? { count: values.length, average: values.reduce((sum, value) => sum + value, 0) / values.length } : null;
}
