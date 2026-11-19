import type { Point } from '../geo';

export async function detectPoint(): Promise<Point> {
  if (!window.isSecureContext || !navigator.geolocation) throw new Error('Location needs HTTPS and a browser with location access.');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve([coords.latitude, coords.longitude]),
      error => reject(new Error(error.code === 1 ? 'Location permission was declined. Enter your starting place or pick a pin.' :
        'Your device could not find a location. Try again or enter it manually.')),
      { maximumAge: 30000, timeout: 15000 },
    );
  });
}
