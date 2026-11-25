// Proxy for Huron-Perth Student Transportation Services (BusPlanner Web) public alerts.
// The page methods are POST-only and send no CORS headers, so the browser can't call them directly.
// Only the two read-only alert methods are forwarded; responses are cached per isolate for 60 s
// so many visitors don't multiply load on the consortium's server.

const ORIGIN = 'https://hpsts.mybusplanner.ca';
const ALLOWED_PATHS = new Set(['/Alerts.aspx/GetBusNotifications', '/Alerts.aspx/GetSchoolNotifications']);
const FRESH_MS = 60_000;
const MAX_BODY_BYTES = 4096;

const cache = new Map<string, { at: number; body: string }>();

const json = (body: string, status: number, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', ...extra },
  });

export const onRequest: PagesFunction = async ({ request }) => {
  const path = new URL(request.url).pathname.replace(/^\/api\/hpsts/, '');
  if (request.method !== 'POST' || !ALLOWED_PATHS.has(path)) {
    return json(JSON.stringify({ error: 'Not allowed' }), 405);
  }

  const reqBody = await request.text();
  if (reqBody.length > MAX_BODY_BYTES) return json(JSON.stringify({ error: 'Body too large' }), 413);

  const key = `${path}|${reqBody}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < FRESH_MS) return json(hit.body, 200, { 'X-Proxy-Cache': 'HIT' });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
      body: reqBody,
      signal: controller.signal,
    });
    const body = await upstream.text();
    if (upstream.ok) cache.set(key, { at: Date.now(), body });
    return json(body, upstream.status, { 'X-Proxy-Cache': 'MISS' });
  } catch (err: any) {
    // Serve the last good copy rather than nothing if the upstream is slow or down
    if (hit) return json(hit.body, 200, { 'X-Proxy-Cache': 'STALE' });
    return json(JSON.stringify({ error: err?.message ?? 'Upstream error' }), 502);
  } finally {
    clearTimeout(timeoutId);
  }
};
