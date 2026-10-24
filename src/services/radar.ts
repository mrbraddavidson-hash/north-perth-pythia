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
