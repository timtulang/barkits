import { directDistance, type Point } from './geo.ts';
import { stations } from './lrt-stations.ts';
import { lrtFare } from './transport-fares.ts';

function nearestStation(point: Point) {
  const nearby = stations.map(({ name, point: station }, index) => ({
    index, name, distance: directDistance(point, station),
  }));
  return nearby.reduce((closest, station) => station.distance < closest.distance ? station : closest);
}

export function railConnection(origin?: Point, destination?: Point) {
  if (!origin || !destination) return;
  const boarding = nearestStation(origin);
  const exit = nearestStation(destination);
  if (boarding.index === exit.index || boarding.distance > 1 || exit.distance > 1) return;
  if (boarding.distance + exit.distance >= directDistance(origin, destination)) return;
  return {
    boarding, exit,
    toward: stations[boarding.index < exit.index ? stations.length - 1 : 0].name,
    fare: lrtFare(boarding.name, exit.name),
  };
}
