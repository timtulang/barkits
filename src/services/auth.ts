import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import { Linking, Platform } from 'react-native';
import { apiRequest, authSetup, sessionKey } from './shared-client';
import { sessionStorage } from './session-storage';

export { authSetup };
export type Account = { id: string; display_name: string | null };
const verifierKey = 'barkits.google-verifier';
const joinKey = 'barkits.join-after-login';
const subscribers = new Set<(account: Account | null) => void>();

export function listenForAccountChange(subscriber: (account: Account | null) => void) {
  subscribers.add(subscriber);
  return () => { subscribers.delete(subscriber); };
}

export async function readAccount() {
  return (await apiRequest<{ user: Account | null }>('/session')).user;
}

export async function saveDisplayName(displayName: string) {
  const { user } = await apiRequest<{ user: Account }>('/account/profile', { display_name: displayName });
  if (!user?.id || typeof user.display_name !== 'string') throw new Error('Barkits returned an invalid profile. Try again.');
  for (const listener of subscribers) listener(user);
  return { ...user, display_name: user.display_name };
}

export async function startSignIn(joining: boolean) {
  await readAccount();
  if (joining) await sessionStorage.setItem(joinKey, 'yes');
  else await sessionStorage.removeItem(joinKey);
  const url = authSetup.origin + '/api/auth/google/start';
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return;
  }
  const verifier = Array.from(await getRandomBytesAsync(32), value => value.toString(16).padStart(2, '0')).join('');
  await sessionStorage.setItem(verifierKey, verifier);
  const challenge = await digestStringAsync(CryptoDigestAlgorithm.SHA256, verifier);
  await Linking.openURL(url + '?native_challenge=' + challenge);
}

export async function finishNativeSignIn(href: string) {
  const link = new URL(href);
  if (link.protocol !== 'barkits:' || link.hostname || link.pathname !== '/') return;
  if (link.searchParams.get('signin') === 'failed') throw new Error('Google sign-in couldn’t finish. Try again.');
  const code = link.searchParams.get('handoff');
  if (!code) return;
  const verifier = await sessionStorage.getItem(verifierKey);
  if (!verifier) return;
  const { token } = await apiRequest<{ token: string }>('/auth/native/claim', { code, verifier });
  await sessionStorage.setItem(sessionKey, token);
  await sessionStorage.removeItem(verifierKey);
}

export async function takeJoinIntent() {
  const join = await sessionStorage.getItem(joinKey);
  if (join !== null) await sessionStorage.removeItem(joinKey);
  return join === 'yes';
}

export async function signOut() {
  if (Platform.OS === 'web' || await sessionStorage.getItem(sessionKey)) await apiRequest('/session/logout', {});
  if (Platform.OS !== 'web') await sessionStorage.removeItem(sessionKey);
  for (const listener of subscribers) listener(null);
}
