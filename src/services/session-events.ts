const listeners = new Set<() => void>();
let generation = 0;
export const sessionGeneration = () => generation;
export function sessionRestored() { generation++; }
export function sessionExpired(expected = generation) {
  if (expected !== generation) return false;
  for (const listener of listeners) listener();
  return true;
}
export function listenForSessionExpiration(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
