import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { HttpError, json, readCookie, readJson, redirect } from './http.mjs';

const lifetime = 30 * 24 * 60 * 60;
const flowLifetime = 10 * 60;
const token = () => randomBytes(32).toString('base64url');
const validToken = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(value);
const validDigest = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const digest = value => createHash('sha256').update(value).digest('hex');

function nativeReturn(cookie, code) {
  const href = 'barkits:///?' + (code ? 'handoff=' + code : 'signin=failed');
  const title = code ? 'Sign-in complete' : 'Google sign-in couldn’t finish';
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
    <main><h1>${title}</h1><a href="${href}">Open Barkits</a></main></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': cookie,
      'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'" },
  });
}

export function identity({ origin, signingKey, clientId, clientSecret, sql, googleClient }) {
  const callbackUrl = origin + '/api/auth/google/callback';
  const google = googleClient ?? new OAuth2Client(clientId, clientSecret, callbackUrl);
  const secure = origin.startsWith('https:');
  const sessionName = secure ? '__Host-barkits_session' : 'barkits_session';
  const flowName = secure ? '__Host-barkits_login' : 'barkits_login';
  const cookie = (name, value, maxAge) => `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
  const seal = value => createHmac('sha256', signingKey).update(value).digest();

  function flowCookie(flow) {
    const payload = Buffer.from(JSON.stringify(flow)).toString('base64url');
    return cookie(flowName, payload + '.' + seal(payload).toString('base64url'), flowLifetime);
  }

  function readFlow(request, state) {
    const [payload, signature] = (readCookie(request, flowName) ?? '').split('.');
    if (!payload || payload.length > 1024 || !validToken(signature)) return null;
    if (!timingSafeEqual(seal(payload), Buffer.from(signature, 'base64url'))) return null;
    const flow = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return flow.state === state && flow.expires > Date.now() ? flow : null;
  }

  function getSession(request) {
    const header = request.headers.get('authorization');
    const value = header === null ? readCookie(request, sessionName) : /^Bearer ([a-zA-Z0-9_-]+)$/.exec(header)?.[1];
    return validToken(value) ? digest(value) : null;
  }

  function start(url) {
    const challenge = url.searchParams.get('native_challenge');
    if (challenge !== null && !validDigest(challenge)) throw new HttpError(400, 'Start sign-in again from the app.');
    const flow = { state: token(), nonce: token(), verifier: token(), challenge, expires: Date.now() + flowLifetime * 1000 };
    const href = google.generateAuthUrl({
      scope: ['openid', 'profile'],
      state: flow.state,
      nonce: flow.nonce,
      code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: 'select_account',
    });
    return redirect(href, [flowCookie(flow)]);
  }

  async function callback(request, url) {
    const clearFlow = cookie(flowName, '', 0);
    const flow = readFlow(request, url.searchParams.get('state'));
    const native = Boolean(flow?.challenge);
    const failed = () => native ? nativeReturn(clearFlow) : redirect(origin + '/?signin=failed', [clearFlow]);
    const code = url.searchParams.get('code');
    if (!flow || !code || code.length > 4096 || url.searchParams.has('error')) return failed();
    let profile;
    try {
      const { tokens } = await google.getToken({ code, codeVerifier: flow.verifier, redirect_uri: callbackUrl });
      if (!tokens.id_token) return failed();
      profile = (await google.verifyIdToken({ idToken: tokens.id_token, audience: clientId })).getPayload();
    } catch {
      return failed();
    }
    if (profile?.nonce !== flow.nonce || typeof profile.sub !== 'string' || !profile.sub.length || profile.sub.length > 255) return failed();
    const secret = token();
    try {
      await sql.query('select barkits.start_google_session($1, $2, $3, $4)', [
        profile.sub, typeof profile.name === 'string' ? profile.name : null, digest(secret), flow.challenge,
      ]);
    } catch {
      return failed();
    }
    return native
      ? nativeReturn(clearFlow, secret)
      : redirect(origin + '/', [clearFlow, cookie(sessionName, secret, lifetime)]);
  }

  async function claim(request) {
    const body = await readJson(request);
    if (!validToken(body?.code) || !validDigest(body?.verifier)) throw new HttpError(400, 'Start sign-in again from the app.');
    const secret = token();
    const [{ claimed }] = await sql.query('select barkits.claim_native_session($1, $2, $3) as claimed', [
      digest(body.code), digest(body.verifier), digest(secret),
    ]);
    if (!claimed) throw new HttpError(401, 'This sign-in link expired or belongs to another device.');
    return json({ token: secret });
  }

  async function session(request) {
    const secret = getSession(request);
    const user = secret ? (await sql.query('select * from barkits.session_user($1)', [secret]))[0] : undefined;
    return json({ user: user ?? null });
  }

  async function logout(request) {
    const secret = getSession(request);
    if (secret) await sql.query('select barkits.end_session($1)', [secret]);
    return json({ user: null }, 200, { 'Set-Cookie': cookie(sessionName, '', 0) });
  }

  return { getSession, start, callback, claim, session, logout };
}
