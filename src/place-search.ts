import places from '../assets/data/ph-places.json';
import type { Point } from './geo';

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const index = (places as [string, string, number, number][]).map(([name, province, lat, lng]) => ({
  name, province, point: [lat, lng] as Point, search: normalize(name + ', ' + province),
}));

export function searchPlaces(query: string) {
  const text = normalize(query);
  if (text.length < 2) return [];
  return index.filter(place => place.search.startsWith(text)).slice(0, 5);
}
