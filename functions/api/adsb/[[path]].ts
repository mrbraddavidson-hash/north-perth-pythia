// ADS-B proxy (adsb.lol). Every visitor polls every ~20 s, and adsb.lol rate-limits (HTTP 429) Cloudflare's
// shared egress addresses hard, so:
//  - share one upstream response per path for FRESH_S seconds (Cloudflare Cache API = shared per data centre,
//    plus this isolate's memory as a first layer), and
//  - when upstream refuses or fails, serve the last good response for up to STALE_S seconds
//    instead of an empty sky.
const FRESH_S = 10;
const STALE_S = 120;

interface CachedBody {
  body: string;
  at: number;
}
const memory = new Map<string, CachedBody>(); // per isolate

const jsonHeaders = (extra: Record<string, string> = {}) => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  ...extra,
});

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/api\/adsb/, '');
  const targetUrl = `https://api.adsb.lol/v2${targetPath}${url.search}`;
  const key = `${targetPath}${url.search}`;
  const now = Date.now();

  // Cache API keys must be URLs; keep them under this site's own origin
  const freshKey = new Request(`${url.origin}/__adsb-cache/fresh${key}`);
  const staleKey = new Request(`${url.origin}/__adsb-cache/stale${key}`);
  const cache = (globalThis as any).caches?.default as Cache | undefined;

  const reply = (body: string, cacheState: string, extra: Record<string, string> = {}) =>
    new Response(body, { status: 200, headers: jsonHeaders({ 'Cache-Control': 'public, max-age=5', 'X-Proxy-Cache': cacheState, ...extra }) });

  // 1. Fresh copy (memory, then shared cache)
  const mem = memory.get(key);
  if (mem && now - mem.at < FRESH_S * 1000) return reply(mem.body, 'HIT-MEMORY');
  const shared = cache ? await cache.match(freshKey).catch(() => undefined) : undefined;
  if (shared) {
    const body = await shared.text();
    memory.set(key, { body, at: now });
    return reply(body, 'HIT');
  }

  const serveStale = async (reason: string): Promise<Response | null> => {
    if (mem && now - mem.at < STALE_S * 1000) return reply(mem.body, 'STALE', { 'X-Upstream-Status': reason });
    const old = cache ? await cache.match(staleKey).catch(() => undefined) : undefined;
    return old ? reply(await old.text(), 'STALE', { 'X-Upstream-Status': reason }) : null;
  };

  // 2. Upstream
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'curl/8.4.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.text();

    if (response.ok) {
      memory.set(key, { body: data, at: now });
      if (cache) {
        const store = (req: Request, ttl: number) =>
          cache.put(req, new Response(data, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` } }));
        context.waitUntil(Promise.all([store(freshKey, FRESH_S), store(staleKey, STALE_S)]).catch(() => undefined));
      }
      return reply(data, 'MISS');
    }

    // 3. Rate-limited or upstream error: prefer recent good data over an empty map
    return (await serveStale(String(response.status))) ?? new Response(data, { status: response.status, headers: jsonHeaders() });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return (
      (await serveStale('fetch-error')) ??
      new Response(JSON.stringify({ error: err.message, ac: [] }), { status: 502, headers: jsonHeaders() })
    );
  }
};
