// Live Keyless Hazard Intelligence Feeds (USGS Earthquakes & NASA EONET)

import { calculateDistanceKm, NORTH_PERTH_COORDS } from './api';

export interface SeismicEvent {
  id: string;
  title: string;
  place: string;
  magnitude: number;
  time: string;
  timestampMs: number;
  latitude: number;
  longitude: number;
  depthKm: number;
  distanceKmToListowel: number;
  url: string;
}

export interface NaturalHazardEvent {
  id: string;
  title: string;
  category: string;
  source: string;
  date: string;
  latitude: number;
  longitude: number;
  distanceKmToListowel: number;
  url?: string;
}

// 1. Fetch live regional and national seismic events from USGS
export async function fetchLiveEarthquakes(): Promise<SeismicEvent[]> {
  try {
    // Query Great Lakes / Ontario / Eastern Canada bounding box
    const url =
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-08-01&minmagnitude=1.2&minlatitude=41.0&maxlatitude=49.0&minlongitude=-85.0&maxlongitude=-74.0';
    const res = await fetch(url);
    if (!res.ok) throw new Error('USGS query failed');
    const data = await res.json();

    if (data && Array.isArray(data.features)) {
      const mapped: SeismicEvent[] = data.features
        .filter((f: any) => f.geometry && Array.isArray(f.geometry.coordinates))
        .map((f: any) => {
          const [lon, lat, depth] = f.geometry.coordinates;
          const p = f.properties || {};
          const dist = calculateDistanceKm(NORTH_PERTH_COORDS[0], NORTH_PERTH_COORDS[1], lat, lon);

          return {
            id: f.id,
            title: p.title || `M ${p.mag} - ${p.place}`,
            place: p.place || 'Ontario / Great Lakes Region',
            magnitude: typeof p.mag === 'number' ? Math.round(p.mag * 10) / 10 : 1.5,
            time: p.time ? new Date(p.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
            timestampMs: p.time || Date.now(),
            latitude: lat,
            longitude: lon,
            depthKm: Math.round(depth || 0),
            distanceKmToListowel: dist,
            url: p.url || '',
          };
        })
        .sort((a: SeismicEvent, b: SeismicEvent) => b.timestampMs - a.timestampMs);

      return mapped;
    }
  } catch (err) {
    console.warn('USGS live seismic feed unavailable:', err);
  }
  return [];
}

// 2. Fetch live natural hazards & wildfires from NASA EONET
export async function fetchLiveNASAEvents(): Promise<NaturalHazardEvent[]> {
  try {
    const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25';
    const res = await fetch(url);
    if (!res.ok) throw new Error('NASA EONET query failed');
    const data = await res.json();

    if (data && Array.isArray(data.events)) {
      const mapped: NaturalHazardEvent[] = [];

      data.events.forEach((e: any) => {
        if (!e.geometry || !Array.isArray(e.geometry) || e.geometry.length === 0) return;
        const latestGeo = e.geometry[e.geometry.length - 1];
        if (!latestGeo.coordinates) return;

        const [lon, lat] = latestGeo.coordinates;
        if (typeof lat !== 'number' || typeof lon !== 'number') return;

        const dist = calculateDistanceKm(NORTH_PERTH_COORDS[0], NORTH_PERTH_COORDS[1], lat, lon);
        const cat = e.categories && e.categories[0] ? e.categories[0].title : 'Natural Event';

        mapped.push({
          id: e.id,
          title: e.title,
          category: cat,
          source: e.sources && e.sources[0] ? e.sources[0].id : 'NASA',
          date: latestGeo.date ? new Date(latestGeo.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active',
          latitude: lat,
          longitude: lon,
          distanceKmToListowel: dist,
          url: e.link,
        });
      });

      return mapped.sort((a: NaturalHazardEvent, b: NaturalHazardEvent) => a.distanceKmToListowel - b.distanceKmToListowel);
    }
  } catch (err) {
    console.warn('NASA EONET feed unavailable:', err);
  }
  return [];
}
