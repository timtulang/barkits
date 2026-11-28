import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApi } from './api.mjs';
import { HttpError, readJson } from './http.mjs';
import { rateLimiter } from './rate-limit.mjs';

const origin = 'https://barkits.example';
const signingKey = 'only-a-test-signing-key';
const token = 'a'.repeat(43);

test('trusted IP limits hash addresses and canonicalize IPv6 without trusting other forwarding headers', async () => {
  const calls = [];
  const limits = rateLimiter({ origin, signingKey, vercel: true,
    sql: { query: async (text, params) => { calls.push(params); return [{ retry_after: 0 }]; } } });
  const request = ip => new Request(origin, { headers: { 'x-vercel-forwarded-for': ip } });
  await limits.ip(request('2001:db8::1'), 'auth-start');
  await limits.ip(request('2001:0db8:0000:0000:0000:0000:0000:0001'), 'auth-start');
  assert.deepEqual(calls[0], calls[1]);
  assert.match(calls[0][0], /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(calls).includes('2001'));
  for (const headers of [{ 'x-forwarded-for': '192.0.2.1' }, { 'x-real-ip': '192.0.2.1' },
    { 'x-vercel-forwarded-for': '192.0.2.1, 192.0.2.2' }]) {
    await assert.rejects(limits.ip(new Request(origin, { headers }), 'auth-start'), { status: 503 });
  }
  assert.equal(calls.length, 2);
});

test('quota failure blocks OAuth and shared mutations, including direct entry routing', async () => {
  const calls = [];
  const api = createApi({ origin, signingKey, vercel: true, clientId: 'test',
    googleClient: { generateAuthUrl() { assert.fail('OAuth must not start after throttling'); } },
    sql: { query: async (text, params) => {
      calls.push({ text, params });
      return [{ retry_after: params[1] === 'api' ? 0 : 37 }];
    },
      transaction() { assert.fail('Throttled requests must not mutate records'); } } });
  const start = await api(new Request(origin + '/api/auth/google/start', {
    headers: { 'x-vercel-forwarded-for': '192.0.2.1' },
  }));
  assert.equal(start.status, 429);
  assert.equal(start.headers.get('retry-after'), '37');
  assert.equal(start.headers.get('cache-control'), 'no-store');
  const join = await api(new Request(origin + '/api/entry?__barkits_route=shared/join', {
    method: 'POST', headers: { Origin: origin, Cookie: '__Host-barkits_session=' + token,
      'Content-Type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.1' }, body: JSON.stringify(['invalid-code', 'Friend']),
  }));
  assert.equal(join.status, 429);
  assert.equal(calls.find(call => call.text.includes('consume_account_quota')).params[1], 'join');
});

test('limiter outages fail closed and foreign origins are rejected before quota work', async () => {
  let calls = 0;
  const api = createApi({ origin, signingKey, vercel: true, clientId: 'test', googleClient: {},
    sql: { query: async () => { calls++; throw new Error('Unavailable'); } } });
  const foreign = await api(new Request(origin + '/api/auth/google/start', { headers: { Origin: 'https://evil.example' } }));
  assert.equal(foreign.status, 403);
  assert.equal(calls, 0);
  const request = await api(new Request(origin + '/api/auth/google/start', { headers: { 'x-vercel-forwarded-for': '192.0.2.1' } }));
  assert.equal(request.status, 503);
  assert.equal(calls, 1);
  assert.equal((await api(new Request(origin + '/api/session', { method: 'DELETE' }))).status, 405);
});

test('the general IP budget also limits anonymous session reads', async () => {
  const api = createApi({ origin, signingKey, vercel: true, clientId: 'test', googleClient: {},
    sql: { query: async (text, params) => {
      assert.match(text, /consume_ip_quota/);
      assert.equal(params[1], 'api');
      return [{ retry_after: 12 }];
    } } });
  const response = await api(new Request(origin + '/api/session', {
    headers: { 'x-vercel-forwarded-for': '192.0.2.1' },
  }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '12');
});

test('oversized, malformed, and incomplete JSON bodies are rejected and streams canceled', async () => {
  const headers = { 'Content-Type': 'application/json' };
  await assert.rejects(readJson(new Request(origin, { method: 'POST', headers: {
    ...headers, 'Content-Length': '16385' }, body: '{}' })), { status: 413 });
  let canceled = false;
  const stream = new ReadableStream({ pull(c) { c.enqueue(new Uint8Array(16385)); }, cancel() { canceled = true; } });
  await assert.rejects(readJson(new Request(origin, { method: 'POST', headers, body: stream, duplex: 'half' })), { status: 413 });
  assert.equal(canceled, true);
  await assert.rejects(readJson(new Request(origin, { method: 'POST', headers, body: '{' })), { status: 400 });
  assert.deepEqual(await readJson(new Request(origin, { method: 'POST', headers, body: '["hello",null,1]' })), ['hello', null, 1]);
  canceled = false;
  const stalled = new ReadableStream({ cancel() { canceled = true; } });
  await assert.rejects(readJson(new Request(origin, { method: 'POST', headers, body: stalled, duplex: 'half' })),
    error => error instanceof HttpError && error.status === 408);
  assert.equal(canceled, true);
});
