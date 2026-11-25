// Real-Time Doppler Weather Radar Service (Global & Canadian High-Res Composite)
// Feeds from Exeter (WSO), King City, and Great Lakes Doppler Radar Mesh via RainViewer API

export interface RadarFrame {
  time: number;
  path: string;
  formattedTime: string;
  isNowcast?: boolean;
}

export interface RadarData {
  host: string;
  frames: RadarFrame[];
  latestFrame: RadarFrame | null;
}

export async function fetchLiveRadarData(): Promise<RadarData | null> {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) return null;
    const json = await res.json();
    const host: string = json.host || 'https://tilecache.rainviewer.com';

    const pastFrames: { time: number; path: string }[] = json.radar?.past || [];
    const nowcastFrames: { time: number; path: string }[] = json.radar?.nowcast || [];

    const formatTimestamp = (unixSec: number) => {
      const d = new Date(unixSec * 1000);
      return d.toLocaleTimeString('en-CA', {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const frames: RadarFrame[] = [
      ...pastFrames.map((f) => ({
        time: f.time,
        path: f.path,
        formattedTime: formatTimestamp(f.time),
        isNowcast: false,
      })),
      ...nowcastFrames.map((f) => ({
        time: f.time,
        path: f.path,
        formattedTime: formatTimestamp(f.time) + ' (PROJ)',
        isNowcast: true,
      })),
    ];

    const latestFrame = frames.length > 0 ? frames[frames.length - 1] : null;

    return {
      host,
      frames,
      latestFrame,
    };
  } catch (err) {
    console.warn('Radar metadata fetch error:', err);
    return null;
  }
}

// Universal Blue / High-contrast Precipitation Radar Tile URL
export function getRadarTileUrl(host: string, path: string, colorScheme: number = 2): string {
  // colorScheme 2 = Universal Blue, 4 = Rainbow, 6 = TITAN, 8 = NEXRAD L3
  // 1_1 = smooth precipitation + snow colors
  return `${host}${path}/256/{z}/{x}/{y}/${colorScheme}/1_1.png`;
}

// Environment Canada (GeoMet) radar scan times, newest last.
// The WMS time dimension is "start/end/PT6M"; we take the latest `count` steps.
export async function fetchEcccRadarTimes(count = 8): Promise<string[]> {
  try {
    const res = await fetch(
      'https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetCapabilities&layer=RADAR_1KM_RRAI'
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const m = xml.match(/<Dimension name="time"[^>]*>\s*([^/<\s]+)\/([^/<\s]+)\/PT(\d+)M\s*<\/Dimension>/);
    if (!m) return [];
    const start = Date.parse(m[1]);
    const end = Date.parse(m[2]);
    const stepMs = Number(m[3]) * 60_000;
    if (!Number.isFinite(start) || !Number.isFinite(end) || !stepMs) return [];
    const times: string[] = [];
    for (let t = end; t >= start && times.length < count; t -= stepMs) {
      times.unshift(new Date(t).toISOString().replace('.000Z', 'Z'));
    }
    return times;
  } catch (err) {
    console.warn('ECCC radar times unavailable:', err);
    return [];
  }
}

// Is anything actually on the ECCC radar near North Perth? Renders the rain + snow layers for a
// ~250 km box at one scan time into a canvas and finds the nearest non-transparent pixel.
// (GeoMet sends Access-Control-Allow-Origin: *, so the canvas stays readable.)
export interface PrecipSummary {
  hasPrecip: boolean;
  nearestKm: number | null;
  bearing: string | null; // e.g. "NW", from Listowel
  nearest: { lat: number; lon: number } | null;
}

const PRECIP_BOX = { south: 41.5, north: 46.0, west: -84.0, east: -77.5 }; // lat/lon, EPSG:4326
const PRECIP_W = 260;
const PRECIP_H = 180;
const LISTOWEL = { lat: 43.7317, lon: -80.9525 };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function fetchEcccPrecipSummary(time: string): Promise<PrecipSummary | null> {
  try {
    const { south, north, west, east } = PRECIP_BOX;
    const url = (layer: string) =>
      `https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&layers=${layer}&styles=` +
      `&crs=EPSG:4326&bbox=${south},${west},${north},${east}&width=${PRECIP_W}&height=${PRECIP_H}` +
      `&format=image/png&transparent=true&time=${time}`;
    const images = await Promise.all(['RADAR_1KM_RRAI', 'RADAR_1KM_RSNO'].map((l) => loadImage(url(l))));

    const canvas = document.createElement('canvas');
    canvas.width = PRECIP_W;
    canvas.height = PRECIP_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    images.forEach((img) => ctx.drawImage(img, 0, 0));
    const { data } = ctx.getImageData(0, 0, PRECIP_W, PRECIP_H);

    let best: { km: number; dLat: number; dLon: number } | null = null;
    const cosLat = Math.cos((LISTOWEL.lat * Math.PI) / 180);
    for (let y = 0; y < PRECIP_H; y++) {
      for (let x = 0; x < PRECIP_W; x++) {
        if (data[(y * PRECIP_W + x) * 4 + 3] === 0) continue;
        const lat = north - ((y + 0.5) / PRECIP_H) * (north - south);
        const lon = west + ((x + 0.5) / PRECIP_W) * (east - west);
        const dLat = lat - LISTOWEL.lat;
        const dLon = lon - LISTOWEL.lon;
        const km = Math.hypot(dLat * 111.32, dLon * 111.32 * cosLat);
        if (!best || km < best.km) best = { km, dLat, dLon };
      }
    }
    if (!best) return { hasPrecip: false, nearestKm: null, bearing: null, nearest: null };

    const deg = ((Math.atan2(best.dLon * cosLat, best.dLat) * 180) / Math.PI + 360) % 360;
    const bearing = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
    return {
      hasPrecip: true,
      nearestKm: Math.round(best.km),
      bearing: best.km < 3 ? null : bearing,
      nearest: { lat: LISTOWEL.lat + best.dLat, lon: LISTOWEL.lon + best.dLon },
    };
  } catch {
    return null;
  }
}
