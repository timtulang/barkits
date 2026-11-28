import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

const host = process.env.PGHOST;
if (!host || (!['localhost', '127.0.0.1', '::1'].includes(host) && !host.startsWith('/tmp/')) || !process.env.PGDATABASE) {
  throw new Error('Set PGHOST and PGDATABASE for a disposable local migrated database.');
}
const token = randomBytes(32).toString('hex');
const subject = 'concurrency-' + token;
const args = ['-X', '-At', '--set=ON_ERROR_STOP=1', '-c'];
function execute(sql) {
  const result = spawnSync('psql', [...args, sql], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'psql failed.');
  return result.stdout.trim();
}

let actor;
try {
  execute(`select barkits.start_google_session('${subject}', 'Concurrency test', '${token}', null)`);
  actor = execute(`select id from barkits.session_user('${token}')`);
  assert.match(actor, /^[0-9a-f-]{36}$/);
  assert.equal(execute(`select barkits.consume_account_quota('${token}', 'create')`), '0');
  execute(`update barkits.rate_limit_buckets set expires_at = now() + interval '1 hour' where subject = 'user:${actor}'`);
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => new Promise((resolve, reject) => {
    const child = spawn('psql', [...args, `select barkits.consume_account_quota('${token}', 'create')`]);
    let output = '';
    let errors = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errors += chunk; });
    child.on('error', reject);
    child.on('close', code => code ? reject(new Error(errors)) : resolve(Number(output.trim())));
  })));
  assert.ok(results.every(result => result.status === 'fulfilled'), 'a concurrent query failed');
  assert.equal(results.filter(result => result.value === 0).length, 9);
  assert.equal(results.filter(result => result.value > 0).length, 11);
  console.log('Concurrent quota check passed: 9 allowed, 11 throttled across 20 connections.');
} finally {
  if (actor) execute(`delete from barkits.rate_limit_buckets where subject = 'user:${actor}'`);
  execute(`delete from barkits.users where id in (select user_id from barkits.external_identities where provider_subject = '${subject}')`);
}
