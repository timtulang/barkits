import type { Point } from './geo';

export type PlaceResult = { id: string; name: string; area: string; address: string; kind: string; point: Point };
export type IndexedPlace = { result: PlaceResult; name: string; words: string[] };

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function indexPlace(result: PlaceResult): IndexedPlace {
  const name = normalize(result.name);
  const area = normalize(result.area);
  const words = normalize([name, area, result.address, result.kind].join(' ')).split(' ');
  return { result, name, words };
}

export function matchPlaces(index: IndexedPlace[], query: string, limit = 5) {
  const phrase = normalize(query).replace(/\bqc\b/g, 'quezon city').replace(/\bmoa\b/g, 'mall of asia')
    .replace(/\bup diliman\b/g, 'university of the philippines diliman');
  if (phrase.length < 2) return { results: [], total: 0 };
  const tokens = phrase.split(' ');
  const matches: { result: PlaceResult; rank: number }[] = [];
  for (const entry of index) {
    if (!tokens.every(token => entry.words.some(word => word.startsWith(token)))) continue;
    const nameWords = entry.name.split(' ');
    let rank = 0;
    for (const token of tokens) {
      if (nameWords.includes(token)) rank += 12;
      else if (nameWords.some(word => word.startsWith(token))) rank += 8;
    }
    if (entry.name === phrase) rank += 100;
    else if (entry.name.startsWith(phrase)) rank += 45;
    else if (entry.name.includes(phrase)) rank += 30;
    if (entry.result.kind === 'Locality' && entry.name.startsWith(phrase)) rank += 12;
    matches.push({ result: entry.result, rank });
  }
  matches.sort((a, b) => b.rank - a.rank || a.result.name.length - b.result.name.length ||
    a.result.name.localeCompare(b.result.name) || a.result.area.localeCompare(b.result.area) ||
    a.result.address.localeCompare(b.result.address) || a.result.id.localeCompare(b.result.id));
  return { results: matches.slice(0, limit).map(match => match.result), total: matches.length };
}
