import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createApi } from './api.mjs';

const origin = 'https://barkits.example';
const genuineToken = 'a'.repeat(43);
const sessionDigest = createHash('sha256').update(genuineToken).digest('hex');
const member = { id: '11111111-1111-4111-8111-111111111111', display_name: 'Kits' };
const request = (path, init) => new Request(origin + path, init);

function fixture() {
  let oauth;
  let nextNonce;
  let exchanges = 0;
  const queries = [];
  const transactions = [];
  const googleClient = {
    generateAuthUrl(options) {
      oauth = options;
      return 'https://accounts.google.com/o/oauth2/v2/auth?state=' + options.state;
    },
    async getToken({ code, codeVerifier, redirect_uri: callbackUrl }) {
      exchanges++;
      assert.equal(code, 'verified-code');
      assert.equal(callbackUrl, origin + '/api/auth/google/callback');
      assert.equal(createHash('sha256').update(codeVerifier).digest('base64url'), oauth.code_challenge);
      return { tokens: { id_token: 'google-token' } };
    },
    async verifyIdToken(options) {
      assert.deepEqual(options, { idToken: 'google-token', audience: 'configured-client-id' });
      return { getPayload: () => ({ sub: 'stable-google-subject', name: 'Kits', nonce: nextNonce ?? oauth.nonce }) };
    },
  };
  const sql = {
    query(text, params) {
      const query = { text, params };
      queries.push(query);
      if (text.includes('session_user')) return Promise.resolve(params[0] === sessionDigest ? [member] : []);
      if (text.includes('claim_native_session')) return Promise.resolve([{ claimed: true }]);
      return query;
    },
    async transaction(batch) {
      transactions.push(batch);
      if (batch[0].params[0] !== sessionDigest) throw Object.assign(new Error('Unauthenticated'), { code: '28000' });
      return [[], [{ value: ['authorized-result'] }]];
    },
  };
  const handle = createApi({ origin, signingKey: 'secret-only-used-in-test', clientId: 'configured-client-id', sql, googleClient });
  async function start(query = '') {
    const response = await handle(request('/api/auth/google/start' + query));
    assert.equal(response.status, 303);
    assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax; Secure/);
    assert.equal(oauth.code_challenge_method, 'S256');
    return response.headers.get('set-cookie').split(';')[0];
  }
  function callback(cookie, state = oauth.state) {
    return handle(request('/api/auth/google/callback?code=verified-code&state=' + state, { headers: { Cookie: cookie } }));
  }
  return { start, callback, handle, queries, transactions, exchanges: () => exchanges, rejectNonce: () => { nextNonce = 'different'; } };
}

test('Google callback checks state and nonce before issuing a durable app session', async () => {
  const f = fixture();
  const cookie = await f.start();
  const invalid = await f.callback(cookie, 'wrong-state');
  assert.equal(invalid.headers.get('location'), origin + '/?signin=failed');
  assert.equal(f.exchanges(), 0);
  assert.equal(f.queries.length, 0);

  const result = await f.callback(cookie);
  assert.equal(result.headers.get('location'), origin + '/');
  const sessionCookie = result.headers.getSetCookie().find(value => value.startsWith('__Host-barkits_session='));
  assert.match(sessionCookie, /HttpOnly; SameSite=Lax; Secure/);
  const secret = sessionCookie.split(';')[0].split('=')[1];
  assert.deepEqual(f.queries[0].params, [
    'stable-google-subject', 'Kits', createHash('sha256').update(secret).digest('hex'), null,
  ]);
  f.rejectNonce();
  const next = await f.start();
  assert.equal((await f.callback(next)).headers.get('location'), origin + '/?signin=failed');
  assert.equal(f.queries.length, 1);
});

test('native Google return carries a one-time code and claim requires app proof', async () => {
  const f = fixture();
  const verifier = '1'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('hex');
  const cookie = await f.start('?native_challenge=' + challenge);
  const callback = await f.callback(cookie);
  assert.equal(callback.headers.getSetCookie().length, 1);
  assert.equal(callback.status, 200);
  const href = new URL(/href="([^"]+)"/.exec(await callback.text())[1]);
  assert.equal(href.protocol, 'barkits:');
  const code = href.searchParams.get('handoff');
  assert.equal(f.queries[0].params[3], challenge);
  assert.ok(code && !href.searchParams.has('token'));
  const claim = body => f.handle(request('/api/auth/native/claim', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  assert.equal((await claim({ code })).status, 400);
  const result = await claim({ code, verifier });
  assert.equal(result.status, 200);
  const session = (await result.json()).token;
  assert.notEqual(session, code);
  assert.deepEqual(f.queries[1].params.slice(0, 2), [createHash('sha256').update(code).digest('hex'), challenge]);
});

test('shared requests bind the session inside the transaction and reject foreign origins', async () => {
  const f = fixture();
  assert.equal((await f.handle(request('/api/shared'))).status, 401);
  const headers = { Cookie: '__Host-barkits_session=' + genuineToken };
  const session = await f.handle(request('/api/session', { headers }));
  assert.deepEqual(await session.json(), { user: member });
  const shared = await f.handle(request('/api/shared', { headers }));
  assert.deepEqual(await shared.json(), ['authorized-result']);
  assert.deepEqual(f.transactions[0][0], { text: 'select barkits.authorize_session($1)', params: [sessionDigest] });
  assert.equal((await f.handle(request('/api/entry?__barkits_route=session', { headers }))).status, 200);

  const vote = async header => f.handle(request('/api/shared/vote', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...header },
    body: JSON.stringify([member.id, null]),
  }));
  assert.equal((await vote({ ...headers, Origin: 'https://another.example' })).status, 403);
  assert.equal((await vote(headers)).status, 403);
  assert.equal((await vote({ ...headers, Origin: origin })).status, 200);
  assert.deepEqual(f.transactions[1][1], { text: 'select barkits.set_shared_vote($1, $2) as value', params: [member.id, null] });
  assert.equal((await vote({ Authorization: 'Bearer ' + 'x'.repeat(43) })).status, 401);
});
