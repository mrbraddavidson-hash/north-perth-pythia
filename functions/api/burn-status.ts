// North Perth open-air fire ban status, read from the Municipality of North Perth's news RSS feed.
// Perth County bans and lifts are posted there ("Open Air Fire Ban in Perth County" / "... Lifted ...").
// The newest ban-related notice decides the status. The feed has no CORS headers, so this runs server side,
// and the result is cached per isolate for 15 minutes.

const FEED_URL = 'https://www.northperth.ca/news/rss';
const FRESH_MS = 15 * 60_000;
const BAN_TITLE = /\b(fire|burn(ing)?)\s+ban\b/i;
const LIFTED_TITLE = /\b(lift|lifted|rescind|rescinded|cancel|cancelled|ended)\b/i;

let cached: { at: number; body: string } | null = null;

const json = (body: string, status: number, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
      ...extra,
    },
  });

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

const tag = (item: string, name: string) => {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
};

export const onRequestGet: PagesFunction = async () => {
  if (cached && Date.now() - cached.at < FRESH_MS) return json(cached.body, 200, { 'X-Proxy-Cache': 'HIT' });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(FEED_URL, { headers: { Accept: 'application/rss+xml, application/xml' }, signal: controller.signal });
    if (!res.ok) throw new Error(`North Perth feed HTTP ${res.status}`);
    const xml = await res.text();

    const notices = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map(([, item]) => ({ title: tag(item, 'title'), link: tag(item, 'link'), date: new Date(tag(item, 'pubDate')) }))
      .filter((n) => BAN_TITLE.test(n.title) && !Number.isNaN(n.date.getTime()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const latest = notices[0];
    const body = JSON.stringify({
      status: !latest ? 'NO_NOTICE' : LIFTED_TITLE.test(latest.title) ? 'NO_BAN' : 'BAN',
      notice: latest ? { title: latest.title, link: latest.link, date: latest.date.toISOString() } : null,
      checkedAt: new Date().toISOString(),
    });
    cached = { at: Date.now(), body };
    return json(body, 200, { 'X-Proxy-Cache': 'MISS' });
  } catch (err: any) {
    if (cached) return json(cached.body, 200, { 'X-Proxy-Cache': 'STALE' });
    return json(JSON.stringify({ error: err?.message ?? 'Upstream error' }), 502);
  } finally {
    clearTimeout(timeoutId);
  }
};
