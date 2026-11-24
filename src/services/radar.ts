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
