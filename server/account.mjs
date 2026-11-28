import { HttpError, json, readJson } from './http.mjs';

export async function account(sql, session, request, path, limits) {
  await limits.account(session, request.method === 'GET' ? 'read' : 'write');
  if (path === '/api/account/dashboard' && request.method === 'GET') {
    const params = new URL(request.url).searchParams;
    const past = params.get('past') ?? 'false';
    const offset = params.get('offset') ?? '0';
    if (![...params.keys()].every(key => ['past','offset'].includes(key)) ||
      !['true','false'].includes(past) || !/^\d+$/.test(offset) || Number(offset)>100000 || Number(offset)%50) {
      throw new HttpError(400, 'Choose a valid dashboard page.');
    }
    const [row] = await sql.query('select barkits.account_dashboard($1,$2,$3) as value', [session,past==='true',Number(offset)]);
    return json(row.value);
  }
  if (path === '/api/account/settings' && request.method === 'GET') {
    const [row] = await sql.query('select barkits.own_account_settings($1) as value', [session]);
    return json(row.value);
  }
  if (path === '/api/account/settings' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body || Array.isArray(body) || !Number.isInteger(body.revision) || body.revision < 0) {
      throw new HttpError(400, 'Reload your settings and try again.');
    }
    const [row] = await sql.query('select barkits.save_account_settings($1,$2,$3::jsonb) as value',
      [session, body.revision, JSON.stringify(body)]);
    return json(row.value);
  }
  if (path === '/api/account/security' && request.method === 'GET') {
    const [row] = await sql.query('select barkits.own_account_security($1) as value', [session]);
    return json(row.value);
  }
  if (path === '/api/account/revoke-others' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body || Array.isArray(body) || Object.keys(body).length !== 0) throw new HttpError(400, 'Send an empty confirmation.');
    await sql.query('select barkits.revoke_other_sessions($1)', [session]);
    return json({ revoked: true });
  }
  if (path === '/api/account/delete' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body || Object.keys(body).length !== 3 || body.confirmation !== 'DELETE' ||
      typeof body.revision !== 'string' || !/^[a-f0-9]{64}$/.test(body.revision) ||
      !body.successors || Array.isArray(body.successors) || typeof body.successors !== 'object') {
      throw new HttpError(400, 'Review account deletion and type DELETE to confirm.');
    }
    await sql.query('select barkits.delete_own_account($1,$2,$3::jsonb)', [session,body.revision,JSON.stringify(body.successors)]);
    return json({ deleted: true },200,{ 'Set-Cookie': (new URL(request.url).protocol === 'https:' ? '__Host-barkits_session' : 'barkits_session') + '=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax' + (new URL(request.url).protocol === 'https:' ? '; Secure' : '') });
  }
  throw new HttpError(404, 'This account action isn’t available.');
}
