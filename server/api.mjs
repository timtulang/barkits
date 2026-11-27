import * as http from 'node:http';
import { neon } from '@neondatabase/serverless';
import { HttpError, json } from './http.mjs';
import { identity } from './identity.mjs';
import { shared } from './shared.mjs';

const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export function createApi(config) {
  const auth = identity(config);
  return async request => {
    const url = new URL(request.url);
    const route = url.pathname === '/api/entry' ? url.searchParams.get('__barkits_route') : null;
    const pathname = route ? '/api/' + route : url.pathname;
    const { method } = request;
    try {
      const requestOrigin = request.headers.get('origin');
      if ((requestOrigin && requestOrigin !== config.origin) ||
          (method === 'POST' && !requestOrigin && !request.headers.has('authorization') && pathname !== '/api/auth/native/claim')) {
        throw new HttpError(403, 'Open this action from Barkits.');
      }
      if (method === 'GET' && pathname === '/api/auth/google/start') return auth.start(url);
      if (method === 'GET' && pathname === '/api/auth/google/callback') return await auth.callback(request, url);
      if (method === 'POST' && pathname === '/api/auth/native/claim') return await auth.claim(request);
      if (method === 'GET' && pathname === '/api/session') return await auth.session(request);
      if (method === 'POST' && pathname === '/api/session/logout') return await auth.logout(request);
      if (pathname === '/api/shared' || pathname.startsWith('/api/shared/')) {
        const parts = pathname.split('/').slice(3);
        if (method === 'GET' && parts.length && !uuid.test(parts[0])) throw new HttpError(404, 'Couldn’t find this shared meetup.');
        return await shared(config.sql, auth.getSession(request), request, parts);
      }
      throw new HttpError(404, 'This action isn’t available.');
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      if (error?.code === '28000') return json({ error: 'Sign in again to continue.' }, 401);
      if (error?.code === 'P0001') return json({ error: error.message }, 409);
      if (/^(22|23)/.test(error?.code ?? '')) return json({ error: 'Check the information you entered and refresh the group.' }, 400);
      return json({ error: 'Barkits couldn’t complete this request. Try again.' }, 503);
    }
  };
}

let handler;
export function apiConfig(env = process.env) {
  const origin = new URL(env.BARKITS_ORIGIN);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if ((origin.protocol !== 'https:' && !(local && origin.protocol === 'http:')) || origin.origin !== env.BARKITS_ORIGIN) {
    throw new Error('Set BARKITS_ORIGIN to the app’s HTTPS origin.');
  }
  const db = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(db.protocol) || !db.hostname.endsWith('.neon.tech') ||
      !db.hostname.split('.')[0].endsWith('-pooler') || !db.username || !db.password || db.pathname.length <= 1) {
    throw new Error('Set DATABASE_URL to the pooled Neon runtime URL.');
  }
  const { GOOGLE_OAUTH_CLIENT_ID: clientId, GOOGLE_OAUTH_CLIENT_SECRET: clientSecret, BARKITS_AUTH_SECRET: signingKey } = env;
  if (!clientId || !clientSecret || !signingKey || signingKey.length < 32) {
    throw new Error('Configure the Google OAuth client and a Barkits auth secret.');
  }
  http.setGlobalProxyFromEnv?.();
  return { origin: origin.origin, clientId, clientSecret, signingKey, sql: neon(db.href, {
    fetchOptions: { redirect: 'error' },
  }) };
}

export async function handleRequest(request) {
  if (!handler) {
    try {
      handler = createApi(apiConfig());
    } catch {
      return json({ error: 'Google sign-in and shared planning aren’t configured for this deployment.' }, 503);
    }
  }
  return handler(request);
}
