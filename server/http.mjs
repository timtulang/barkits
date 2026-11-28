export class HttpError extends Error {
  constructor(status, message, headers) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

export function json(body, status = 200, headers) {
  return Response.json(body, {
    status,
    headers: { ...headers, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

export async function readJson(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, 'Send a JSON request.');
  }
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > 16384)) {
    throw new HttpError(413, 'This request is too large.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Send a request body.');
  const chunks = [];
  let size = 0;
  let complete = false;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new HttpError(408, 'This request took too long. Try again.')), 5000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) { complete = true; break; }
      size += value.length;
      if (size > 16384) throw new HttpError(413, 'This request is too large.');
      chunks.push(value);
    }
  } finally {
    clearTimeout(timer);
    if (!complete) void reader.cancel().catch(() => console.error('Request body cancellation failed.'));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Send a valid JSON request.');
  }
}

export function readCookie(request, name) {
  return request.headers.get('cookie')?.split(';').map(value => value.trim())
    .find(value => value.startsWith(name + '='))?.slice(name.length + 1);
}
