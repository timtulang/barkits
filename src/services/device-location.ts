import * as Location from 'expo-location';
import type { Point } from '../geo';

export async function detectPoint(): Promise<Point> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Location permission was declined. Enter your starting place or pick a pin.');
  const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return [result.coords.latitude, result.coords.longitude];
}
