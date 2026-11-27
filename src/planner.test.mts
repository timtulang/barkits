import assert from 'node:assert/strict';
import { test } from 'node:test';
import { example, recommend, ratingSummary } from './planner.ts';
import { readMeetups } from './meetup-storage.ts';

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

test('adds stable IDs to preexisting meetups without changing planner data', () => {
  const { id: demoId, ...demo } = example;
  const personal = {
    ...demo,
    name: 'After work',
    status: 'Archived',
    venue: 'cub',
    votes: { '1': 'cub' },
    manualFares: { cub: { '1': 85 } },
    recap: 'Great evening',
    ratings: { '1': 5 },
  };
  const upgraded = readMeetups(JSON.stringify([demo, personal]));
  assert.equal(upgraded.upgraded, true);
  assert.deepEqual(upgraded.meetups, [
    { ...demo, id: demoId },
    { ...personal, id: upgraded.meetups[1].id },
  ]);
  assert.notEqual(upgraded.meetups[1].id, demoId);
  assert.deepEqual(readMeetups(JSON.stringify(upgraded.meetups)), {
    meetups: upgraded.meetups, upgraded: false,
  });
});

test('rejects damaged storage rather than substituting demo meetups', () => {
  assert.throws(() => readMeetups('{'));
  assert.throws(() => readMeetups('null'));
  assert.throws(() => readMeetups(JSON.stringify([example, example])), /duplicate/);
});
