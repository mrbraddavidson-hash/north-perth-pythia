import type * as maplibregl from 'maplibre-gl';

// Google Photorealistic 3D Tiles (Map Tiles API) drawn over the MapLibre 3D view with deck.gl.
// The key is a browser key: restrict it in Google Cloud to this site's referrers and to the Map Tiles API.
// Set VITE_GOOGLE_MAPS_KEY in Cloudflare Pages (build variable) or .env.local; without it the option stays hidden.
export const GOOGLE_MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_KEY || undefined;

const ROOT_TILESET_URL = 'https://tile.googleapis.com/v1/3dtiles/root.json';

// Google's tiles sit at their true height above the WGS84 ellipsoid, but with MapLibre terrain off the map's
// ground is height 0, so the camera would end up inside the hills when zoomed in. Lower the whole tileset by
// the ground's ellipsoid height around Listowel (~380 m above sea level, geoid ~36 m below the ellipsoid).
const LISTOWEL_GROUND_ELLIPSOID_HEIGHT_M = 345;
const LISTOWEL_LON_LAT: [number, number] = [-80.9525, 43.7317];

export interface Google3DTilesHandle {
  detach: () => void;
}

/**
 * Loads deck.gl on demand (it's large) and adds the Google 3D tileset to the map.
 * `onCredits` receives the data providers of the tiles currently on screen, which Google requires to be shown.
 */
export async function attachGoogle3DTiles(
  map: maplibregl.Map,
  apiKey: string,
  onCredits: (credits: string[]) => void,
  onError: (message: string) => void
): Promise<Google3DTilesHandle> {
  const [{ MapboxOverlay }, { Tile3DLayer }, { Matrix4 }] = await Promise.all([
    import('@deck.gl/mapbox'),
    import('@deck.gl/geo-layers'),
    import('@math.gl/core'),
  ]);

  // Translate the tileset down along the local "up" direction (ECEF) at Listowel
  const lon = (LISTOWEL_LON_LAT[0] * Math.PI) / 180;
  const lat = (LISTOWEL_LON_LAT[1] * Math.PI) / 180;
  const up = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const modelMatrix = new Matrix4().translate(up.map((u) => -u * LISTOWEL_GROUND_ELLIPSOID_HEIGHT_M));

  let lastCredits = '';
  let reportedError = false;
  const overlay = new MapboxOverlay({
    layers: [
      new Tile3DLayer({
        id: 'google-photorealistic-3d-tiles',
        data: ROOT_TILESET_URL,
        loadOptions: {
          // Key in a header (not the URL) for the root and every child tile request
          core: { fetch: { headers: { 'X-GOOG-API-KEY': apiKey } } },
          tileset: { modelMatrix },
        },
        onTilesetLoad: (tileset3d: any) => {
          tileset3d.options.onTraversalComplete = (selectedTiles: any[]) => {
            const credits = new Set<string>();
            for (const tile of selectedTiles) {
              const copyright: string | undefined = tile.content?.gltf?.asset?.copyright;
              copyright?.split(';').forEach((c) => c.trim() && credits.add(c.trim()));
            }
            const sorted = [...credits].sort();
            const key = sorted.join('; ');
            if (key !== lastCredits) {
              lastCredits = key;
              onCredits(sorted);
            }
            return selectedTiles;
          };
        },
        onTileError: (_tile: unknown, _url: string, message: string) => {
          if (reportedError) return;
          reportedError = true;
          onError(message || 'Google 3D tiles failed to load');
        },
      }),
    ],
  });

  // deck.gl doesn't route a failed root tileset request (bad key, quota, billing off) to onTileError;
  // it surfaces as an unhandled rejection. Catch just that one so the UI can say what went wrong.
  const onRootFailure = (e: PromiseRejectionEvent) => {
    const message = String(e.reason?.message ?? '');
    if (!message.includes(ROOT_TILESET_URL)) return;
    e.preventDefault();
    const status = message.match(/\((\d{3})\)/)?.[1];
    reportedError = true;
    onError(
      status === '400' || status === '403'
        ? `Google rejected the key (HTTP ${status}); check the key, its restrictions and billing`
        : `could not reach Google${status ? ` (HTTP ${status})` : ''}`
    );
  };
  window.addEventListener('unhandledrejection', onRootFailure);

  map.addControl(overlay as unknown as maplibregl.IControl);
  return {
    detach: () => {
      window.removeEventListener('unhandledrejection', onRootFailure);
      // If the map was already removed, it took the overlay with it
      if ((map as any)._removed) return;
      map.removeControl(overlay as unknown as maplibregl.IControl);
    },
  };
}
