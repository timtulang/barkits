import { parsePoint, directDistance } from './geo.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { example, recommend, ratingSummary, venues } from './planner.ts';

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

test('custom places require trip evidence for every friend and respect spending limits', () => {
  const friend = { ...example.participants[0], origin: 'Cebu IT Park', budget: 80 };
  const venue = { ...venues[0], id: 'cebu', name: 'Cebu café' };
  assert.deepEqual(recommend([friend], 'Balanced'), []);
  const minutes = { cebu: { [friend.id]: 25 } };
  assert.deepEqual(recommend([friend], 'Balanced', {}, [venue], minutes), []);
  assert.deepEqual(recommend([friend], 'Balanced', { cebu: { [friend.id]: 81 } }, [venue], minutes), []);
  const rows = recommend([friend], 'Cheapest', { cebu: { [friend.id]: 80 } }, [venue], minutes);
  assert.deepEqual(rows.map(row => [row.venue.id, row.time, row.cost]), [['cebu', 25, 80]]);
  assert.equal(rows[0].journeys[0].timeEntered, true);
  assert.deepEqual(recommend([friend, example.participants[1]], 'Balanced', {}, [venue], minutes), []);
});

test('a specific pin never inherits the demo route for a city with the same label', () => {
  assert.deepEqual(recommend([{ ...example.participants[0], point: [10, 123] }], 'Fastest'), []);
});

test('coordinates support global locations and reject incomplete or out-of-range pairs', () => {
  assert.deepEqual(parsePoint(' -33.86, 151.21 '), [-33.86, 151.21]);
  assert.deepEqual(parsePoint('0,0'), [0, 0]);
  for (const input of ['', '1,', ',0', '91,0', '1,-181', '0x01,4']) assert.equal(parsePoint(input), undefined);
  assert.ok(Math.abs(directDistance([0, 0], [0, 1]) - 111.195) < 0.01);
});
