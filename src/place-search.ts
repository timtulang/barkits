import places from '../assets/data/ph-places.json';
import type { Point } from './geo';

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export const localities = (places as [string, string, number, number][]).map(([name, province, lat, lng]) => ({
  name, province, point: [lat, lng] as Point, search: normalize(name + ', ' + province),
}));

function localityKey(name: string) {
  return normalize(name).replace(/^city of /, '').replace(/ city$/, '');
}

export function resolveLocality(label: string): Point | undefined {
  const [name, ...region] = label.split(',');
  const key = localityKey(name);
  if (!key) return;
  const province = normalize(region.join(','));
  const matches = localities.filter(place =>
    localityKey(place.name) === key && (!province || normalize(place.province) === province));
  const exact = matches.filter(place => normalize(place.name) === normalize(name));
  const result = exact.length ? exact : matches;
  if (result.length === 1) return result[0].point;
}
