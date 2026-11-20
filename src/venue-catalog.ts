import type { VenueRow } from './discovery';
import { venues } from './planner';

const osm: VenueRow[] = require('../assets/data/ph-venues.json');
const landmarks: VenueRow[] = venues.flatMap(venue => venue.point ?
  [[venue.id, venue.name, venue.area, venue.category, ...venue.point, 0] as VenueRow] : []);
export const catalog = [...landmarks, ...osm];
