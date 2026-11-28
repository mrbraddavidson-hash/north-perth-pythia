// Shared helpers for Pages Functions that read RSS feeds which send no CORS headers.

export interface FeedItem {
  title: string;
  link: string;
  date: Date;
  description: string;
  content: string; // <content:encoded> as plain text, '' if the feed has none
}

export const decodeEntities = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

const plainText = (html: string) =>
  decodeEntities(decodeEntities(html).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const tag = (item: string, name: string) => {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1] : '';
};

// Items with a valid date, newest first
export async function fetchFeed(url: string, signal: AbortSignal): Promise<FeedItem[]> {
  const res = await fetch(url, { headers: { Accept: 'application/rss+xml, application/xml' }, signal });
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => ({
      title: decodeEntities(tag(item, 'title')),
      link: decodeEntities(tag(item, 'link')),
      date: new Date(decodeEntities(tag(item, 'pubDate'))),
      description: plainText(tag(item, 'description')),
      content: plainText(tag(item, 'content:encoded')),
    }))
    .filter((i) => !Number.isNaN(i.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const jsonResponse = (body: string, status: number, maxAge: number, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${maxAge}`,
      ...extra,
    },
  });

// One cached JSON body per isolate; serves the stale copy if the upstream fails.
export function cachedHandler(freshMs: number, maxAge: number, build: (signal: AbortSignal) => Promise<object>) {
  let cached: { at: number; body: string } | null = null;
  return async () => {
    if (cached && Date.now() - cached.at < freshMs) return jsonResponse(cached.body, 200, maxAge, { 'X-Proxy-Cache': 'HIT' });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const body = JSON.stringify({ ...(await build(controller.signal)), checkedAt: new Date().toISOString() });
      cached = { at: Date.now(), body };
      return jsonResponse(body, 200, maxAge, { 'X-Proxy-Cache': 'MISS' });
    } catch (err: any) {
      if (cached) return jsonResponse(cached.body, 200, maxAge, { 'X-Proxy-Cache': 'STALE' });
      return jsonResponse(JSON.stringify({ error: err?.message ?? 'Upstream error' }), 502, 0);
    } finally {
      clearTimeout(timeoutId);
    }
  };
}
