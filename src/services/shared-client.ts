import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { sessionStorage } from './session-storage';

const rawOrigin = process.env.EXPO_PUBLIC_BARKITS_API_URL?.trim();
export const sessionKey = 'barkits.google-session';

function configureBackend() {
  if (!rawOrigin) return { enabled: false, message: 'This deployment supports on-device planning. Google sign-in needs the Barkits API.' };
  try {
    const url = new URL(rawOrigin);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.origin !== rawOrigin || (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
        (Platform.OS === 'web' && typeof window !== 'undefined' && url.origin !== window.location.origin)) {
      throw new Error('Invalid Barkits API origin.');
    }
    return { enabled: true, origin: url.origin };
  } catch {
    return { enabled: false, message: 'Account setup requires the Barkits HTTPS origin.' };
  }
}
export const authSetup = configureBackend();

export class SharedRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function apiRequest<T>(path: string, payload?: unknown): Promise<T> {
  if (!authSetup.enabled) throw new SharedRequestError(authSetup.message ?? 'Google sign-in is unavailable.', 503);
  const native = Platform.OS !== 'web';
  const token = native ? await sessionStorage.getItem(sessionKey) : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (payload !== undefined) headers['Content-Type'] = 'application/json';
  let response: Response;
  try {
    response = await fetch(authSetup.origin + '/api' + path, {
      method: payload === undefined ? 'GET' : 'POST',
      credentials: native ? 'omit' : 'same-origin',
      headers,
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  } catch {
    throw new SharedRequestError('Couldn’t reach Barkits. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 429 ? 'Too many requests. Wait a minute, then try again.' : 'Barkits couldn’t complete the request.';
    throw new SharedRequestError(typeof data?.error === 'string' ? data.error : message, response.status);
  }
  if (data === null && payload === undefined) throw new SharedRequestError('Barkits returned an invalid response.', 502);
  return data as T;
}
