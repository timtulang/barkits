import assert from 'node:assert/strict';
import { test } from 'node:test';
import { example, recommend, ratingSummary } from './planner.ts';

test('ranks Metro Manila candidates deterministically for four friends', () => {
  assert.equal(recommend(example.participants, 'Balanced')[0].venue.id, 'cub');
  assert.equal(recommend(example.participants, 'Fairest')[0].venue.id, 'cub');
});
test('rejects routes above a hard limit and handles mixed transport', () => {
  const [first, second, third, fourth] = example.participants;
  assert.deepEqual(recommend([{ ...first, mode: 'Private car', budget: 100 }, second, third, fourth], 'Fastest').map(row => row.venue.id), ['cub']);
});
test('unknown motorcycle fares are never treated as verified or affordable', () => {
  const rider = { ...example.participants[0], mode: 'Motorcycle taxi' as const };
  assert.equal(recommend([rider], 'Fastest')[0].cost, null);
  assert.deepEqual(recommend([rider], 'Cheapest'), []);
  assert.deepEqual(recommend([{ ...rider, budget: 100 }], 'Balanced'), []);
  const options = recommend([{ ...rider, budget: 100 }], 'Cheapest', { cub: { [rider.id]: 85 } });
  assert.equal(options.length, 1);
  assert.equal(options[0].venue.id, 'cub');
  assert.equal(options[0].cost, 85);
  assert.equal(options[0].journeys[0].manual, true);
});
test('skipped ratings do not enter the average', () => {
  assert.equal(ratingSummary({}), null);
  assert.deepEqual(ratingSummary({ one: 4, three: 5, five: 5 }), { count: 3, average: 14 / 3 });
});
