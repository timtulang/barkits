import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { createApi } from './api.mjs';

const origin = 'https://barkits.example';
const token = 'a'.repeat(43);
const digest = createHash('sha256').update(token).digest('hex');
const account = { id: '11111111-1111-4111-8111-111111111111', display_name: 'Kits' };

function fixture({ quota = 0, failure } = {}) {
  const writes = [];
  const handle = createApi({ origin, signingKey: 'test-only-secret', vercel: true, clientId: 'test', googleClient: {},
    sql: { async query(query, params) {
      if (query.includes('consume_ip_quota')) return [{ retry_after: 0 }];
      if (query.includes('consume_account_quota')) {
        assert.equal(params[1], 'write');
        if (params[0] !== digest) throw Object.assign(new Error('Expired session'), { code: '28000' });
        return [{ retry_after: quota }];
      }
      assert.equal(query, 'select * from barkits.save_own_profile($1, $2)');
      writes.push(params);
      if (failure) throw failure;
      return [{ ...account, display_name: params[1] }];
    } },
  });
  const request = (body, headers = {}, path = '/api/account/profile') => handle(new Request(origin + path, {
    method: 'POST', headers: { Origin: origin, Cookie: '__Host-barkits_session=' + token,
      'Content-Type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.10', ...headers },
    body: JSON.stringify(body),
  }));
  return { request, writes };
}

test('profile writes bind the authenticated session, trim names, and support cookie and native requests', async () => {
  const f = fixture();
  const response = await f.request({ display_name: '  María 🥭  ' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { user: { ...account, display_name: 'María 🥭' } });
  assert.deepEqual(f.writes, [[digest, 'María 🥭']]);
  const native = await f.request({ display_name: 'New name' }, { Origin: '', Cookie: '', Authorization: 'Bearer ' + token },
    '/api/entry?__barkits_route=account/profile');
  assert.equal(native.status, 200);
  assert.equal((await f.request({ display_name: 'New name' })).status, 200);
  assert.equal((await f.request({ display_name: '🥭'.repeat(160) })).status, 200);
});

test('profile writes reject invalid payloads and never accept a target user ID', async () => {
  const f = fixture();
  for (const body of [null, [], {}, { display_name: null }, { display_name: 123 }, { display_name: '  ' },
    { display_name: 'a'.repeat(161) }, { display_name: '🥭'.repeat(161) }, { display_name: 'A\nB' },
    { display_name: 'A\u0000B' }, { display_name: 'A\u007fB' }, { display_name: 'Name', id: account.id }]) {
    assert.equal((await f.request(body)).status, 400, JSON.stringify(body));
  }
  assert.equal(f.writes.length, 0);
});

test('profile writes enforce sessions, browser origins, and the existing write quota', async () => {
  const f = fixture();
  assert.equal((await f.request({ display_name: 'Name' }, { Cookie: '' })).status, 401);
  assert.equal((await f.request({ display_name: 'Name' }, { Cookie: '__Host-barkits_session=' + 'b'.repeat(43) })).status, 401);
  assert.equal((await f.request({ display_name: 'Name' }, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.request({ display_name: 'Name' }, { Origin: '' })).status, 403);
  assert.equal(f.writes.length, 0);
  const limited = fixture({ quota: 32 });
  const response = await limited.request({ display_name: 'Name' });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '32');
  assert.equal(limited.writes.length, 0);
});

test('failed profile persistence returns an error rather than a saved account', async () => {
  for (const failure of [new Error('Database unavailable'), Object.assign(new Error('Session revoked'), { code: '28000' })]) {
    const f = fixture({ failure });
    const response = await f.request({ display_name: 'Name' });
    assert.equal(response.status, failure.code === '28000' ? 401 : 503);
    assert.ok((await response.json()).error);
  }
});
