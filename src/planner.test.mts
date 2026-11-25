import { formatLocalSchedule, formatSharedSchedule, pickerFields, readSchedule, scheduleInstant, scheduleProblem } from './meetup-schedule.ts';
import { railConnection } from './rail-connection.ts';
import { compareRideFares, lrtFare, lrtStations, transitUrl, validFare } from './transport-fares.ts';
import { indexPlace, matchPlaces } from './search-matches.ts';
import { activityCategory, discover, type VenueRow } from './discovery.ts';
import type { Point } from './geo.ts';
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

test('automatic discovery considers every real pin, venue category and transit proximity', () => {
  const friend = { ...example.participants[0], approximate: false, point: [14, 121] as Point };
  const other = { ...friend, id: '2', point: [14.1, 121] as Point };
  const rows: VenueRow[] = [
    ['a', 'North café', 'Local', 'Café', 14, 121, 0],
    ['b', 'Middle café', 'Local', 'Café', 14.05, 121, 0],
    ['c', 'Terminal café', 'Local', 'Café', 14.05, 121, 1],
    ['d', 'Bistro', 'Local', 'Restaurant', 14.05, 121, 0],
  ];
  assert.equal(discover([friend], 'Café', rows)[0].venue.id, 'a');
  const group = discover([friend, other], 'Café', rows);
  assert.deepEqual(group.map(item => item.venue.id), ['c', 'b', 'a']);
  assert.equal(group[0].distances.length, 2);
  assert.equal(discover([friend, other], activityCategory('Group lunch'), rows)[0].venue.id, 'd');
  assert.deepEqual(discover([{ ...friend, point: [10, 123] }], 'All', rows), []);
  assert.deepEqual(discover([], 'All', rows), []);
});

test('place search handles reordered words, branch addresses, aliases and accents', () => {
  const entry = (id: string, name: string, area: string, address: string) => indexPlace({
    id, name, area, address, kind: 'Café', point: [14.5, 121],
  });
  const index = [
    entry('1', 'Café Luna', 'Makati', 'Ayala Avenue'),
    entry('2', 'Café Luna', 'Cebu City', 'Lahug'),
    entry('3', 'SM Mall of Asia', 'Pasay', 'Seaside Boulevard'),
  ];
  assert.deepEqual(matchPlaces(index, 'MAKATI cafe aya').results.map(place => place.id), ['1']);
  assert.deepEqual(matchPlaces(index, 'MOA, Pasay').results.map(place => place.id), ['3']);
  assert.equal(matchPlaces(index, 'Luna', 1).total, 2);
  assert.equal(matchPlaces(index, 'Luna', 1).results.length, 1);
  assert.equal(matchPlaces(index, 'R').total, 0);
  assert.equal(matchPlaces(index, 'Cebu Makati').total, 0);
});

test('LRT-1 single-journey fares cover the published stations in either direction', () => {
  assert.equal(lrtStations.length, 25);
  for (const from of lrtStations) for (const to of lrtStations) {
    const fare = lrtFare(from, to);
    if (from === to) assert.equal(fare, undefined);
    else {
      assert.ok(fare && fare >= 20 && fare <= 55 && fare % 5 === 0);
      assert.equal(fare, lrtFare(to, from));
    }
  }
  assert.equal(lrtFare('Dr. Santos', 'Fernando Poe Jr.'), 55);
  assert.equal(lrtFare('Monumento', 'Baclaran'), 40);
  assert.equal(lrtFare('PITX', 'EDSA'), 25);
  assert.equal(lrtFare('Unknown', 'EDSA'), undefined);
});
test('commute directions keep each selected endpoint intact', () => {
  const url = new URL(transitUrl('Quiapo & Sta. Cruz', '14.55,121.02'));
  assert.equal(url.searchParams.get('origin'), 'Quiapo & Sta. Cruz');
  assert.equal(url.searchParams.get('destination'), '14.55,121.02');
  assert.equal(url.searchParams.get('travelmode'), 'transit');
  assert.equal(new URL(transitUrl('A','B',true)).searchParams.get('travelmode'), 'walking');
  assert.ok(validFare('0.00'));
  assert.ok(!validFare('') && !validFare('-1') && !validFare('25.119'));
});

test('nearby LRT-1 pins suggest a directional rail leg and exclude unsuitable endpoints', () => {
  const south: Point = [14.4853, 120.98956], north: Point = [14.65749, 121.02121];
  const leg = railConnection(south, north);
  assert.equal(leg?.boarding.name, 'Dr. Santos');
  assert.equal(leg?.toward, 'Fernando Poe Jr.');
  assert.equal(leg?.fare, 55);
  assert.equal(railConnection(north, south)?.toward, 'Dr. Santos');
  assert.equal(railConnection(south, south), undefined);
  assert.equal(railConnection(south, [10.3, 123.9]), undefined);
  assert.equal(railConnection(undefined, north), undefined);
});

test('ride fare comparison preserves centavos and leaves missing quotes unknown', () => {
  assert.equal(compareRideFares('90', '80.50'), 'Grab is ₱9.50 lower for this trip.');
  assert.equal(compareRideFares('45', '75'), 'Angkas is ₱30 lower for this trip.');
  assert.equal(compareRideFares('45.00', '45'), 'Both entered fares are equal.');
  assert.equal(compareRideFares('', '0'), undefined);
});

test('keeps optional and legacy schedules while validating complete calendar dates', () => {
  assert.equal(scheduleProblem('', ''), undefined);
  assert.equal(scheduleProblem('', '15:30')?.field, 'date');
  assert.equal(scheduleProblem('2028-02-29', '')?.field, 'time');
  assert.equal(scheduleProblem('2027-02-29', '15:30')?.field, 'date');
  assert.equal(scheduleProblem('2028-02-29', '24:05')?.field, 'time');
  assert.equal(scheduleProblem('2028-02-29', '00:00'), undefined);
  assert.deepEqual(readSchedule('2028-02-29 00:00'), { day: '2028-02-29', time: '00:00', legacy: '' });
  for (const saved of ['Next Saturday', '2027-02-30 19:15']) {
    assert.equal(readSchedule(saved).legacy, saved);
    assert.equal(formatLocalSchedule(saved), saved);
  }
  assert.equal(formatLocalSchedule(null), '');
});

test('uses the same Philippine wall time for the picker, local plans and shared timestamps', () => {
  const instant = new Date(scheduleInstant('2027-01-01', '00:15'));
  assert.equal(instant.toISOString(), '2026-12-31T16:15:00.000Z');
  assert.deepEqual(pickerFields(instant), { day: '2027-01-01', time: '00:15' });
  const display = formatSharedSchedule(instant.toISOString());
  assert.match(display, /2027/);
  assert.match(display, /Philippine time/);
  assert.equal(formatLocalSchedule('2027-01-01 00:15'), display);
});
