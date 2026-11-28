export function localReturnPath(value: string | null) {
  return value && /^\/meetups\/[a-zA-Z0-9_-]+$/.test(value) ? value : null;
}
export function sharedReturnId(value: string | null | undefined) {
  return value && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value) ? value : undefined;
}
