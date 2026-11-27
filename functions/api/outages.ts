// Hydro One power outages around North Perth, read from the public data behind Hydro One's Storm Centre map
// (stormcentre.hydroone.com, hosted by Kubra). This is not a documented API: if Kubra changes it, this returns
// 502 and the site points people to the official map instead.
//
// The map data is a quadkey tile pyramid. Low-zoom tiles group nearby outages into clusters, so tiles are
// walked from zoom 9 down to zoom 14, only into tiles that cover North Perth and only where a cluster needs
// splitting. One result is cached per isolate for 5 minutes (Hydro One updates every 10), so visitors don't
// multiply requests to their map.

const STATE_URL =
  'https://kubra.io/stormcenter/api/v1/stormcenters/b8d8094c-3809-49e5-bf8b-1ddd27f6e12d/views/5c2283d7-eff9-4f7e-966b-3afd90d8a6b9/currentState?preview=false';
const LAYER = 'cluster-1';
// North Perth with a few km margin
const BBOX = { west: -81.2, east: -80.7, south: 43.55, north: 43.95 };
const START_ZOOM = 9;
const MAX_ZOOM = 14;
const MAX_TILE_FETCHES = 60;
const FRESH_MS = 5 * 60_000;

let cached: { at: number; body: string } | null = null;

const json = (body: string, status: number, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120',
      ...extra,
    },
  });

// Google encoded polyline, first point only (outage markers are single points)
function decodePoint(encoded: string): [number, number] | null {
  let index = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      if (index >= encoded.length) return null;
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  const lat = next();
  const lon = next();
  return lat === null || lon === null ? null : [lat / 1e5, lon / 1e5];
}

const tileXY = (lon: number, lat: number, z: number) => {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return {
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * n),
  };
};

const quadkey = (x: number, y: number, z: number) => {
  let q = '';
  for (let i = z; i > 0; i--) {
    const m = 1 << (i - 1);
    q += String((x & m ? 1 : 0) + (y & m ? 2 : 0));
  }
  return q;
};

const tileBounds = (q: string) => {
  let x = 0;
  let y = 0;
  for (const c of q) {
    x = x * 2 + (c === '1' || c === '3' ? 1 : 0);
    y = y * 2 + (c === '2' || c === '3' ? 1 : 0);
  }
  const n = 2 ** q.length;
  const lat = (t: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * t) / n))) * 180) / Math.PI;
  return { west: (x / n) * 360 - 180, east: ((x + 1) / n) * 360 - 180, north: lat(y), south: lat(y + 1) };
};

const intersectsBbox = (q: string) => {
  const b = tileBounds(q);
  return b.west < BBOX.east && b.east > BBOX.west && b.south < BBOX.north && b.north > BBOX.south;
};

const inBbox = ([lat, lon]: [number, number], margin = 0) =>
  lon >= BBOX.west - margin && lon <= BBOX.east + margin && lat >= BBOX.south - margin && lat <= BBOX.north + margin;

const english = (v: any): string | null => (v && typeof v === 'object' ? v['EN-US'] ?? null : null);

const isoOrNull = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

async function fetchJson(url: string, signal: AbortSignal): Promise<any | null> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (res.status === 404 || res.status === 403) return null; // no outages in that tile
  if (!res.ok) throw new Error(`Kubra HTTP ${res.status}`);
  return res.json();
}

async function collectOutages(signal: AbortSignal) {
  const state = await fetchJson(STATE_URL, signal);
  const dataPath: string | undefined = state?.data?.cluster_interval_generation_data;
  if (!dataPath) throw new Error('Storm Centre data path missing');

  const tileUrl = (q: string) =>
    `https://kubra.io/${dataPath.replace('{qkh}', q.slice(-3).split('').reverse().join(''))}/public/${LAYER}/${q}.json`;

  const start = new Set<string>();
  const nw = tileXY(BBOX.west, BBOX.north, START_ZOOM);
  const se = tileXY(BBOX.east, BBOX.south, START_ZOOM);
  for (let x = nw.x; x <= se.x; x++) for (let y = nw.y; y <= se.y; y++) start.add(quadkey(x, y, START_ZOOM));

  const queue = [...start];
  const seenTiles = new Set(queue);
  const outages = new Map<string, any>();
  let fetches = 0;

  while (queue.length) {
    const batch = queue.splice(0, 8);
    fetches += batch.length;
    if (fetches > MAX_TILE_FETCHES) throw new Error('Too many outage tiles');
    const results = await Promise.all(batch.map((q) => fetchJson(tileUrl(q), signal).then((d) => ({ q, d }))));

    for (const { q, d } of results) {
      for (const entry of d?.file_data ?? []) {
        const geom: string | undefined = entry?.geom?.p?.[0];
        const point = geom ? decodePoint(geom) : null;
        if (!point) continue;
        const desc = entry.desc ?? {};

        if (desc.cluster && q.length < MAX_ZOOM) {
          // A cluster's point is its centre; its members may sit a little way off, so allow a margin
          if (!inBbox(point, 0.15)) continue;
          for (const c of '0123') {
            const child = q + c;
            if (!seenTiles.has(child) && intersectsBbox(child)) {
              seenTiles.add(child);
              queue.push(child);
            }
          }
          continue;
        }

        if (!inBbox(point)) continue;
        // The same outage appears again in deeper tiles; key it by location
        outages.set(geom!, {
          latitude: point[0],
          longitude: point[1],
          // Small counts are masked ("fewer than 20"): report the mask, flagged as an upper bound
          customers: Number(desc.cust_a?.mask ?? desc.cust_a?.val) || 0,
          customersIsEstimate: desc.cust_a?.mask != null,
          outageCount: Number(desc.n_out) || 1,
          status: english(desc.crew_status),
          cause: english(desc.cause),
          estimatedRestoration: isoOrNull(desc.etr),
          startedAt: isoOrNull(desc.start_time),
        });
      }
    }
  }

  return {
    updatedAt: typeof state.updatedAt === 'number' ? new Date(state.updatedAt).toISOString() : null,
    outages: [...outages.values()].sort((a, b) => b.customers - a.customers),
  };
}

export const onRequestGet: PagesFunction = async () => {
  if (cached && Date.now() - cached.at < FRESH_MS) return json(cached.body, 200, { 'X-Proxy-Cache': 'HIT' });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const body = JSON.stringify({ ...(await collectOutages(controller.signal)), checkedAt: new Date().toISOString() });
    cached = { at: Date.now(), body };
    return json(body, 200, { 'X-Proxy-Cache': 'MISS' });
  } catch (err: any) {
    if (cached) return json(cached.body, 200, { 'X-Proxy-Cache': 'STALE' });
    return json(JSON.stringify({ error: err?.message ?? 'Upstream error' }), 502);
  } finally {
    clearTimeout(timeoutId);
  }
};
