import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as http from 'node:http';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];
const commands = ['migrate', 'check', 'shell', 'backup', 'restore'];
const checkOverHttps = command === 'check' && process.argv.length === 4 && process.argv[3] === '--https';
if (!commands.includes(command) || (process.argv.length !== 3 && !checkOverHttps)) {
  console.error('Usage: node db/cli.mjs <migrate|check|shell|backup|restore> or node db/cli.mjs check --https');
  process.exit(1);
}

const source = command === 'check' ? 'DATABASE_URL' : 'DIRECT_DATABASE_URL';
const path = name => fileURLToPath(new URL(name, import.meta.url));

function connectionEnvironment(value) {
  let url;
  let user;
  let password;
  let database;
  try {
    url = new URL(value);
    user = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
    database = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error(`Set ${source} to a PostgreSQL connection URL.`);
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !host || !user || !database || url.hash ||
    [host, user, password, database].some(value => value.includes('\0'))) {
    throw new Error(`${source} must name a PostgreSQL host, login and database.`);
  }
  if ([...url.searchParams.keys()].some(name => !['sslmode', 'channel_binding'].includes(name))) {
    throw new Error(`${source} supports only sslmode and channel_binding connection options.`);
  }

  const loopback = ['localhost', '127.0.0.1', '::1'].includes(host);
  const neon = host.endsWith('.neon.tech');
  const pooled = host.split('.')[0].endsWith('-pooler');
  if (neon && pooled !== (command === 'check')) {
    const endpoint = command === 'check' ? 'pooled' : 'direct';
    throw new Error(`Use the ${endpoint} Neon endpoint for ${source}.`);
  }

  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !name.startsWith('PG') && name !== 'DIRECT_DATABASE_URL' && name !== 'DATABASE_URL'));
  return {
    ...env,
    PGHOST: host,
    PGPORT: url.port || '5432',
    PGDATABASE: database,
    PGUSER: user,
    PGPASSWORD: password,
    PGCONNECT_TIMEOUT: '15',
    PGSSLMODE: loopback ? url.searchParams.get('sslmode') ?? 'prefer' : 'verify-full',
    ...(!loopback && { PGSSLROOTCERT: 'system' }),
    PGCHANNELBINDING: neon ? 'require' : url.searchParams.get('channel_binding') ?? 'prefer',
  };
}

async function checkNeonOverHttps(url, host) {
  if (!host.endsWith('.neon.tech')) throw new Error('The HTTPS runtime check requires a pooled Neon URL.');
  http.setGlobalProxyFromEnv?.();
  const query = readFileSync(path('runtime-check.sql'), 'utf8');
  let response;
  try {
    response = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': url },
      body: JSON.stringify({ query, params: [] }),
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error('Could not reach the Neon SQL endpoint over HTTPS.');
  }
  const result = await response.json().catch(() => null);
  if (result?.code === '28P01') throw new Error('Neon rejected the runtime login credentials.');
  if (result?.code === 'P0001') throw new Error('The Neon login did not pass the Phase 2 runtime permissions check.');
  if (!response.ok || result?.command !== 'DO') {
    throw new Error(`The Neon HTTPS runtime check failed (HTTP ${response.status}).`);
  }
  console.log('Neon HTTPS runtime permissions check passed.');
}

try {
  const url = process.env[source];
  const env = connectionEnvironment(url);
  const psql = ['-X', '--no-password', '--set=ON_ERROR_STOP=1'];
  const invocations = {
    migrate: ['psql', [...psql, '--single-transaction', '--file', path('migrate.sql')]],
    check: ['psql', [...psql, '--single-transaction', '--file', path('runtime-check.sql'),
      '--command', 'select current_database() as database, current_user as verified_runtime;']],
    shell: ['psql', psql],
    backup: ['pg_dump', ['--no-password', '--format=custom', '--schema=barkits', '--schema=barkits_meta', '--no-owner']],
    restore: ['pg_restore', ['--no-password', '--dbname', '', '--single-transaction', '--exit-on-error', '--no-owner']],
  };
  if (checkOverHttps) {
    await checkNeonOverHttps(url, env.PGHOST);
  } else {
    const [program, args] = invocations[command];
    const result = spawnSync(program, args, { env, stdio: 'inherit' });
    if (result.error) throw new Error(`Could not run ${program}. Install the PostgreSQL client tools and check PATH.`);
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
