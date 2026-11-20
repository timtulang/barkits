import { catalog } from './venue-catalog';
import { localities } from './place-search';
import { indexPlace, matchPlaces, type IndexedPlace } from './search-matches';

let directory: IndexedPlace[] | undefined;

export function findPlaces(query: string, limit: number) {
  if (query.trim().length < 2) return { results: [], total: 0 };
  if (!directory) {
    directory = localities.map(place => indexPlace({
      id: 'locality-' + place.name + '-' + place.point.join(), name: place.name, area: place.province,
      kind: 'Locality', address: '', point: place.point,
    }));
    for (const [id, name, area, kind, lat, lng, , address] of catalog) {
      directory.push(indexPlace({ id, name, area, kind, address: address ?? '', point: [lat, lng] }));
    }
  }
  return matchPlaces(directory, query, limit);
}
