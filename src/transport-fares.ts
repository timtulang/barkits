import { stations } from './lrt-stations.ts';
export const rideProviders = ['Angkas', 'Grab'] as const;
export type RideProvider = typeof rideProviders[number];
export type FareNote = { provider: RideProvider; savedAt: string };
export const lrtStations = stations.map(station => station.name);
export const lrtFareSource = 'https://lrmc.ph/our-business-featured/fare-matrix/';
// regular single-journey tickets, effective april 2, 2025, ordered south to north
const fares = [
  [],
  [20],
  [20, 20],
  [25, 20, 20],
  [25, 25, 20, 20],
  [30, 25, 25, 20, 20],
  [30, 25, 25, 20, 20, 20],
  [30, 30, 25, 25, 25, 20, 20],
  [30, 30, 25, 25, 25, 20, 20, 20],
  [35, 30, 30, 25, 25, 25, 20, 20, 20],
  [35, 30, 30, 30, 25, 25, 25, 20, 20, 20],
  [35, 35, 30, 30, 30, 25, 25, 25, 20, 20, 20],
  [35, 35, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20],
  [40, 35, 35, 30, 30, 30, 30, 25, 25, 25, 20, 20, 20],
  [40, 35, 35, 35, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20],
  [40, 40, 35, 35, 35, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20],
  [40, 40, 35, 35, 35, 30, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20],
  [40, 40, 40, 35, 35, 30, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20, 20],
  [45, 40, 40, 35, 35, 35, 35, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20, 20],
  [45, 40, 40, 40, 35, 35, 35, 30, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20, 20],
  [45, 45, 40, 40, 40, 35, 35, 35, 30, 30, 30, 30, 25, 25, 25, 25, 20, 20, 20, 20],
  [45, 45, 40, 40, 40, 35, 35, 35, 35, 30, 30, 30, 30, 25, 25, 25, 25, 25, 20, 20, 20],
  [50, 45, 45, 40, 40, 40, 40, 35, 35, 35, 35, 30, 30, 30, 25, 25, 25, 25, 25, 20, 20, 20],
  [50, 50, 45, 45, 45, 40, 40, 40, 40, 35, 35, 35, 35, 30, 30, 30, 30, 30, 25, 25, 25, 25, 20],
  [55, 50, 50, 50, 45, 45, 45, 40, 40, 40, 40, 35, 35, 35, 35, 30, 30, 30, 30, 30, 25, 25, 25, 20],
];
export function lrtFare(from: string, to: string) {
  const a = lrtStations.indexOf(from), b = lrtStations.indexOf(to);
  if (a < 0 || b < 0 || a === b) return undefined;
  return fares[Math.max(a,b)][Math.min(a,b)];
}
export function validFare(text: string) {
  return /^\d+(?:\.\d{1,2})?$/.test(text.trim()) && Number(text) <= 9999999.99;
}
export function compareRideFares(angkas: string, grab: string) {
  if (!validFare(angkas) || !validFare(grab)) return;
  const difference = Math.round(Number(grab) * 100) - Math.round(Number(angkas) * 100);
  if (difference === 0) return 'Both entered fares are equal.';
  const amount = (Math.abs(difference) / 100).toLocaleString('en-PH', {
    minimumFractionDigits: difference % 100 === 0 ? 0 : 2,
  });
  return (difference > 0 ? 'Angkas' : 'Grab') + ' is ₱' + amount + ' lower for this trip.';
}
export function transitUrl(origin: string, destination: string, walking = false) {
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(origin) +
    '&destination=' + encodeURIComponent(destination) + '&travelmode=' + (walking ? 'walking' : 'transit');
}
