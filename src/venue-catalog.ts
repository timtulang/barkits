import type { VenueRow } from './discovery';
import { venues } from './planner';

const osm: VenueRow[] = require('../assets/data/ph-venues.json');
const landmarks: VenueRow[] = venues.flatMap(venue => venue.point ?
  [[venue.id, venue.name, venue.area, venue.category, ...venue.point, 0] as VenueRow] : []);
export const catalog = [...landmarks, ...osm];

function key(text: string) {
  return text.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const byName = osm.map(row => ({ row, name: key(row[1]), full: key(row[1] + ', ' + row[2]) }));
export function resolveLandmark(label: string) {
  const query = key(label);
  if (!query) return;
  const matches = byName.filter(place => place.name === query || place.full === query);
  if (matches.length === 1) {
    const row = matches[0].row;
    return [row[4], row[5]] as [number, number];
  }
}
