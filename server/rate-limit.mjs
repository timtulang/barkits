import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { HttpError } from './http.mjs';

export function rateLimiter({ sql, signingKey, origin, vercel }) {
  async function consume(query, params) {
    const [row] = await sql.query(query, params);
    if (!Number.isInteger(row?.retry_after) || row.retry_after < 0) {
      throw new Error('Invalid rate limit response.');
    }
    if (row.retry_after > 0) {
      throw new HttpError(429, `Too many requests. Try again in ${row.retry_after} seconds.`, {
        'Retry-After': String(row.retry_after),
      });
    }
  }

  return {
    async ip(request, action) {
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
      const ip = vercel ? request.headers.get('x-vercel-forwarded-for') : local ? '127.0.0.1' : null;
      if (!ip || !isIP(ip)) throw new HttpError(503, 'Barkits cannot verify this connection. Try again later.');
      const normalized = isIP(ip) === 6 ? new URL(`http://[${ip}]`).hostname : ip;
      const subject = createHmac('sha256', signingKey).update('rate-limit:' + normalized).digest('hex');
      await consume('select barkits.consume_ip_quota($1, $2) as retry_after', [subject, action]);
    },
    async account(session, action) {
      if (!session) throw new HttpError(401, 'Sign in again to continue.');
      await consume('select barkits.consume_account_quota($1, $2) as retry_after', [session, action]);
    },
  };
}
