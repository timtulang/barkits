export type Point = [number, number];

export function parsePoint(text: string): Point | undefined {
  const pair = text.trim().split(',');
  if (pair.length !== 2 || pair.some(part => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part.trim()))) return;
  const [lat, lng] = pair.map(Number);
  if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return [lat, lng];
}

export function directDistance(a: Point, b: Point) {
  const radians = Math.PI / 180;
  const h = Math.sin((b[0] - a[0]) * radians / 2) ** 2 +
    Math.cos(a[0] * radians) * Math.cos(b[0] * radians) * Math.sin((b[1] - a[1]) * radians / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
}
