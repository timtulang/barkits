import { HttpError, json, readJson } from './http.mjs';

const mutations = new Map([
  ['create', ['create_shared_meetup', 6]],
  ['join', ['join_shared_meetup', 2]],
  ['invite', ['issue_meetup_code', 1]],
  ['trip', ['save_own_trip', 7]],
  ['shortlist', ['shortlist_shared_venue', 5]],
  ['vote', ['set_shared_vote', 2]],
  ['estimate', ['save_shared_fare_estimate', 5]],
  ['finalize', ['finalize_shared_venue', 2]],
  ['finish', ['finish_shared_meetup', 2]],
  ['recap', ['save_shared_recap', 6]],
  ['rating', ['rate_shared_meetup', 2]],
]);

async function forSession(sql, session, query, params = []) {
  if (!session) throw new HttpError(401, 'Sign in again to continue.');
  const [, rows] = await sql.transaction([
    sql.query('select barkits.authorize_session($1)', [session]),
    sql.query(query, params),
  ]);
  return rows[0]?.value ?? null;
}

export async function shared(sql, session, request, parts) {
  if (request.method === 'GET' && parts.length === 0) {
    return json(await forSession(sql, session, 'select barkits.list_shared_meetups() as value'));
  }
  if (request.method === 'GET' && parts.length === 1) {
    const data = await forSession(sql, session, 'select barkits.get_shared_meetup($1) as value', parts);
    if (!data) throw new HttpError(404, 'Couldn’t find this shared meetup.');
    return json(data);
  }
  const action = request.method === 'POST' && parts.length === 1 ? mutations.get(parts[0]) : undefined;
  if (!action) throw new HttpError(404, 'This action isn’t available.');
  if (!session) throw new HttpError(401, 'Sign in again to continue.');
  const params = await readJson(request);
  const [name, count] = action;
  if (!Array.isArray(params) || params.length !== count ||
      params.some(value => value !== null && typeof value !== 'string' && typeof value !== 'number')) {
    throw new HttpError(400, 'Check the information you entered.');
  }
  const placeholders = Array.from({ length: count }, (_, i) => '$' + (i + 1)).join(', ');
  return json(await forSession(sql, session, `select barkits.${name}(${placeholders}) as value`, params));
}
