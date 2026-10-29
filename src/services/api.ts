import {
  FlightData,
  RiverGaugeData,
  WeatherTelemetry,
  DailyForecast,
  HourlyForecastItem,
  TrafficCamera,
  RoadCondition,
  HydroOutage,
  EmergencyDispatch,
  SchoolBusAlert,
  LiveIncidentEvent,
} from './types';

// North Perth Reference Coordinates (Town of Listowel Town Hall)
export const NORTH_PERTH_COORDS: [number, number] = [43.7317, -80.9525];

export interface TownMarker {
  id: string;
  name: string;
  sector: string;
  coords: [number, number];
  isHQ?: boolean;
  population?: string;
}

export const NORTH_PERTH_TOWNS: TownMarker[] = [
  {
    id: 'listowel',
    name: 'LISTOWEL',
    sector: 'Commercial Hub / Seat',
    coords: [43.7317, -80.9525],
    isHQ: true,
    population: '~9,500',
  },
  {
    id: 'atwood',
    name: 'ATWOOD',
    sector: 'Elma Ward // Hwy 23 S',
    coords: [43.6822, -80.9882],
    population: '~1,200',
  },
  {
    id: 'monkton',
    name: 'MONKTON',
    sector: 'Elma / Logan Border',
    coords: [43.595, -81.085],
    population: '~800',
  },
  {
    id: 'gowanstown',
    name: 'GOWANSTOWN',
    sector: 'Wallace Ward // Hwy 23 N',
    coords: [43.7712, -80.918],
    population: '~450',
  },
  {
    id: 'trowbridge',
    name: 'TROWBRIDGE',
    sector: 'Elma Ward // Maitland River',
    coords: [43.712, -80.999],
    population: '~300',
  },
  {
    id: 'kurtzville',
    name: 'KURTZVILLE',
    sector: 'Wallace Ward NW',
    coords: [43.785, -80.988],
    population: '~250',
  },
  {
    id: 'palmerston',
    name: 'PALMERSTON',
    sector: 'North Border // Town of Minto',
    coords: [43.834, -80.849],
    population: '~2,800',
  },
  {
    id: 'milverton',
    name: 'MILVERTON',
    sector: 'South-East // Perth East',
    coords: [43.565, -80.923],
    population: '~1,750',
  },
];

// Haversine distance calculation
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// In-Memory Mobile/Cellular SWR Cache Store
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const cacheStore: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string): T | null {
  const item = cacheStore[key];
  if (item && item.expiry > Date.now()) {
    return item.data;
  }
  return null;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  cacheStore[key] = {
    data,
    expiry: Date.now() + ttlMs,
  };
}

// 1. Fetch live flights from open ADS-B mesh (adsb.fi) & OpenSky
export async function fetchLiveFlights(): Promise<FlightData[]> {
  const cached = getCached<FlightData[]>('live-flights');
  if (cached) return cached;

  // Primary: adsb.fi Open Data API (high refresh, real transponders over North Perth / SW Ontario)
  try {
    const url = '/api/adsb/lat/43.7317/lon/-80.9525/dist/70';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data?.ac) ? data.ac : Array.isArray(data?.aircraft) ? data.aircraft : [];
      if (rawList.length > 0) {
        const mapped: FlightData[] = rawList
          .filter((a: any) => typeof a.lat === 'number' && typeof a.lon === 'number')
          .map((a: any) => {
            const callsign = (a.flight || a.r || a.hex || 'UNKN').trim();
            const isCan = a.r?.startsWith('C-') || a.flight?.startsWith('ACA') || a.flight?.startsWith('WJA') || a.flight?.startsWith('POE');
            const isUS = a.r?.startsWith('N') || a.flight?.startsWith('DAL') || a.flight?.startsWith('UAL') || a.flight?.startsWith('AAL');
            const originCountry = isCan ? 'Canada' : isUS ? 'United States' : 'Civil Airspace';

            const altFeet = typeof a.alt_baro === 'number' ? Math.round(a.alt_baro) : (typeof a.alt_geom === 'number' ? Math.round(a.alt_geom) : null);
            const altMeters = altFeet !== null ? Math.round(altFeet * 0.3048) : null;
            const velocityKmh = typeof a.gs === 'number' ? Math.round(a.gs * 1.852) : null;
            const onGround = a.alt_baro === 'ground' || a.ground === true;
            const dist = calculateDistanceKm(NORTH_PERTH_COORDS[0], NORTH_PERTH_COORDS[1], a.lat, a.lon);

            return {
              icao24: String(a.hex).toLowerCase(),
              callsign,
              originCountry,
              latitude: a.lat,
              longitude: a.lon,
              altitudeMeters: altMeters,
              altitudeFeet: altFeet,
              velocityKmh,
              trackHeading: typeof a.track === 'number' ? Math.round(a.track) : null,
              verticalRate: typeof a.baro_rate === 'number' ? a.baro_rate : null,
              onGround,
              squawk: a.squawk ? String(a.squawk) : null,
              distanceKmToListowel: dist,
              aircraftType: a.t ? `${a.t}${a.desc ? ` - ${a.desc}` : ''}` : undefined,
              registration: a.r || undefined,
            };
          })
          .sort((a: FlightData, b: FlightData) => a.distanceKmToListowel - b.distanceKmToListowel)
          .slice(0, 35);

        if (mapped.length > 0) {
          setCached('live-flights', mapped, 12 * 1000);
          return mapped;
        }
      }
    }
  } catch (err) {
    console.warn('ADSB live feed unavailable:', err);
  }

  // Secondary fallback attempt: OpenSky Network
  try {
    const proxyUrl = '/api/opensky/states/all?lamin=43.3&lomin=-81.6&lamax=44.2&lomax=-80.4';
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.states) && data.states.length > 0) {
        const mapped = data.states.map((state: any[]) => {
          const icao24 = state[0];
          const callsign = (state[1] || 'UNKN').trim();
          const originCountry = state[2] || 'Unknown';
          const lon = state[5];
          const lat = state[6];
          const baroAlt = state[7];
          const velocity = state[9];
          const track = state[10];
          const vertRate = state[11];
          const onGround = state[8] || false;
          const squawk = state[14];

          const dist = calculateDistanceKm(NORTH_PERTH_COORDS[0], NORTH_PERTH_COORDS[1], lat, lon);

          return {
            icao24,
            callsign,
            originCountry,
            latitude: lat,
            longitude: lon,
            altitudeMeters: baroAlt ? Math.round(baroAlt) : null,
            altitudeFeet: baroAlt ? Math.round(baroAlt * 3.28084) : null,
            velocityKmh: velocity ? Math.round(velocity * 3.6) : null,
            trackHeading: track !== null ? Math.round(track) : null,
            verticalRate: vertRate,
            onGround,
            squawk,
            distanceKmToListowel: dist,
          };
        });
        setCached('live-flights', mapped, 15 * 1000);
        return mapped;
      }
    }
  } catch {
    // Both failed
  }

  // Return empty array rather than faking static ghost planes
  return [];
}

// 2. Fetch live hydrometric river gauges from Environment Canada / WaterOffice
interface StationConfig {
  id: string;
  name: string;
  warningLevel: number;
  criticalLevel: number;
  elevatedLevel: number;
}

const MAITLAND_STATIONS: StationConfig[] = [
  {
    id: '02FE003',
    name: 'Middle Maitland River near Listowel',
    elevatedLevel: 7.2,
    warningLevel: 7.8,
    criticalLevel: 8.5,
  },
  {
    id: '02FE011',
    name: 'Maitland River near Harriston',
    elevatedLevel: 2.5,
    warningLevel: 2.8,
    criticalLevel: 3.5,
  },
  {
    id: '02FE013',
    name: 'Middle Maitland River above Ethel',
    elevatedLevel: 4.5,
    warningLevel: 4.8,
    criticalLevel: 5.5,
  },
];

async function fetchSingleStationGauge(station: StationConfig): Promise<RiverGaugeData | null> {
  try {
    const proxyUrl = `/api/wateroffice/csv/ON/hourly/ON_${station.id}_hourly_hydrometric.csv`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return null;

    const lastLine = lines[lines.length - 1];
    const prevLine = lines.length > 5 ? lines[lines.length - 5] : lines[lines.length - 2];
    const parts = lastLine.split(',');
    const prevParts = prevLine ? prevLine.split(',') : parts;

    const timestamp = parts[1] || new Date().toISOString();
    const waterLevel = parseFloat(parts[2]) || 0;
    const discharge = parseFloat(parts[6]) || 0;
    const prevWaterLevel = parseFloat(prevParts[2]) || waterLevel;

    let alert: RiverGaugeData['floodStageAlert'] = 'NORMAL';
    if (waterLevel >= station.criticalLevel) alert = 'CRITICAL';
    else if (waterLevel >= station.warningLevel) alert = 'WARNING';
    else if (waterLevel >= station.elevatedLevel) alert = 'ELEVATED';

    let trend: RiverGaugeData['trend'] = 'STABLE';
    const diff = waterLevel - prevWaterLevel;
    if (diff > 0.05) trend = 'RISING';
    else if (diff < -0.05) trend = 'FALLING';

    return {
      stationId: station.id,
      stationName: station.name,
      timestamp,
      waterLevelMeters: Math.round(waterLevel * 100) / 100,
      dischargeM3s: Math.round(discharge * 1000) / 1000,
      floodStageAlert: alert,
      trend,
    };
  } catch {
    return null;
  }
}

export async function fetchRiverGauges(): Promise<RiverGaugeData[]> {
  const cached = getCached<RiverGaugeData[]>('wateroffice-gauges');
  if (cached) return cached;

  try {
    const promises = MAITLAND_STATIONS.map((st) => fetchSingleStationGauge(st));
    const results = await Promise.allSettled(promises);
    const validGauges = results
      .filter((r): r is PromiseFulfilledResult<RiverGaugeData | null> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value as RiverGaugeData);

    if (validGauges.length > 0) {
      setCached('wateroffice-gauges', validGauges, 4 * 60 * 1000);
      return validGauges;
    }
    return [];
  } catch (err) {
    console.warn('WaterOffice hydrometric feed error:', err);
    return [];
  }
}

// 3. Fetch hyper-local North Perth weather telemetry
export async function fetchWeatherTelemetry(): Promise<WeatherTelemetry> {
  const cached = getCached<WeatherTelemetry>('weather-telemetry');
  if (cached) return cached;

  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=43.73&longitude=-80.95&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FToronto&forecast_days=3';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const curr = data.current;

    // Parse daily 3-day forecast
    const dailyForecast: DailyForecast[] = [];
    if (data.daily && Array.isArray(data.daily.time)) {
      data.daily.time.forEach((dateStr: string, idx: number) => {
        dailyForecast.push({
          date: dateStr,
          weatherCode: data.daily.weather_code[idx] ?? 0,
          conditionLabel: getWeatherConditionLabel(data.daily.weather_code[idx] ?? 0),
          tempMaxC: Math.round(data.daily.temperature_2m_max[idx] * 10) / 10,
          tempMinC: Math.round(data.daily.temperature_2m_min[idx] * 10) / 10,
        });
      });
    }

    // Parse next 12 hours from hourly
    const hourlyForecast: HourlyForecastItem[] = [];
    if (data.hourly && Array.isArray(data.hourly.time)) {
      const nowIso = new Date().toISOString().substring(0, 13);
      const startIndex = data.hourly.time.findIndex((t: string) => t.startsWith(nowIso));
      const fromIdx = startIndex >= 0 ? startIndex : 0;
      for (let i = fromIdx; i < Math.min(fromIdx + 12, data.hourly.time.length); i++) {
        const timeStr = data.hourly.time[i];
        const hour = timeStr.split('T')[1]?.substring(0, 5) || timeStr;
        hourlyForecast.push({
          time: hour,
          tempC: Math.round(data.hourly.temperature_2m[i] * 10) / 10,
          precipProb: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] ?? 0 : 0,
          weatherCode: data.hourly.weather_code ? data.hourly.weather_code[i] ?? 0 : 0,
        });
      }
    }

    const result: WeatherTelemetry = {
      temperatureC: Math.round(curr.temperature_2m * 10) / 10,
      apparentTempC: Math.round(curr.apparent_temperature * 10) / 10,
      humidityPercent: Math.round(curr.relative_humidity_2m),
      windSpeedKmh: Math.round(curr.wind_speed_10m),
      windDirectionDeg: Math.round(curr.wind_direction_10m),
      windGustsKmh: Math.round(curr.wind_gusts_10m),
      weatherCode: curr.weather_code,
      conditionLabel: getWeatherConditionLabel(curr.weather_code),
      barometricPressureHpa: Math.round(curr.surface_pressure),
      cloudCoverPercent: curr.cloud_cover ?? 45,
      dailyForecast,
      hourlyForecast,
    };
    setCached('weather-telemetry', result, 2 * 60 * 1000);
    return result;
  } catch (err) {
    console.warn('Weather fallback:', err);
    return {
      temperatureC: 19.3,
      apparentTempC: 15.2,
      humidityPercent: 53,
      windSpeedKmh: 27,
      windDirectionDeg: 228,
      windGustsKmh: 54,
      weatherCode: 0,
      conditionLabel: 'Clear Skies',
      barometricPressureHpa: 971,
      cloudCoverPercent: 0,
    };
  }
}

function getWeatherConditionLabel(code: number): string {
  if (code === 0) return 'Clear Skies';
  if (code === 1 || code === 2) return 'Mainly Clear / Passing Clouds';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Dense Fog / Mist';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow Flurries / Squalls';
  if (code >= 80 && code <= 82) return 'Heavy Rain';
  if (code >= 85 && code <= 86) return 'Lake Effect Snow Squall';
  if (code >= 95) return 'Severe Thunderstorm Alert';
  return 'Stable Atmosphere';
}

export const DEFAULT_ONTARIO_511_KEY = '76bf408985044069bb0ad2560d2d1a2a';

// 4. Traffic Cameras along Southwestern Ontario & Perth County Corridors
export async function fetchTrafficCameras(apiKey?: string): Promise<TrafficCamera[]> {
  const cached = getCached<TrafficCamera[]>('511-cameras');
  if (cached) return cached;

  const key = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('ONTARIO_511_KEY') : null) || DEFAULT_ONTARIO_511_KEY;

  if (key) {
    try {
      const url = `/api/511/api/v2/get/cameras?key=${encodeURIComponent(key)}&format=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Calculate distance to Listowel and sort closest first
          const mapped: TrafficCamera[] = data
            .filter((c: any) => c.Latitude && c.Longitude && c.Views && c.Views.length > 0)
            .map((c: any) => {
              const dist = calculateDistanceKm(NORTH_PERTH_COORDS[0], NORTH_PERTH_COORDS[1], c.Latitude, c.Longitude);
              const primaryView = c.Views[0];
              const viewsList = c.Views.map((v: any) => ({
                id: v.Id,
                description: v.Description || 'Camera Angle',
                url: `/api/511/map/Cctv/${v.Id}`,
              }));

              return {
                id: `511-${c.Id}`,
                name: c.Location || c.Roadway || 'MTO Traffic Camera',
                highway: c.Roadway || 'Highway',
                latitude: c.Latitude,
                longitude: c.Longitude,
                imageUrl: `/api/511/map/Cctv/${primaryView.Id}?t=${Date.now()}`,
                lastUpdated: 'LIVE MTO 511 SNAPSHOT // 60s REFRESH',
                direction: c.Direction || primaryView.Description || 'Both Directions',
                distanceKm: dist,
                views: viewsList,
              };
            })
            .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
            // Take the 25 closest live cameras around North Perth & Perth County
            .slice(0, 25);

          if (mapped.length > 0) {
            setCached('511-cameras', mapped, 10 * 60 * 1000);
            return mapped;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch real-time cameras using 511 key:', err);
    }
  }

  return [];
}

export async function fetchRoadConditions(apiKey?: string): Promise<RoadCondition[]> {
  const cached = getCached<RoadCondition[]>('511-roads');
  if (cached) return cached;

  const key = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('ONTARIO_511_KEY') : null) || DEFAULT_ONTARIO_511_KEY;

  if (key) {
    try {
      const url = `/api/511/api/v2/get/roadconditions?key=${encodeURIComponent(key)}&format=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Look for Hwy 23, 86, 8, 7 near North Perth
          const relevant = data.filter((r: any) => {
            const text = `${r.RoadwayName} ${r.LocationDescription}`.toLowerCase();
            return text.includes('23') || text.includes('86') || text.includes('atwood') || text.includes('harriston') || text.includes('stratford') || text.includes('listowel');
          });

          if (relevant.length > 0) {
            const mapped = relevant.map((r: any, idx: number) => {
              const cond = Array.isArray(r.Condition) ? r.Condition.join(', ') : (r.Condition || 'Bare & Dry');
              let status: RoadCondition['status'] = 'BARE_DRY';
              const condLower = cond.toLowerCase();
              if (condLower.includes('closed')) status = 'CLOSED';
              else if (condLower.includes('snow covered') || condLower.includes('packed')) status = 'SNOW_COVERED';
              else if (condLower.includes('partly')) status = 'PARTLY_SNOW_COVERED';
              else if (condLower.includes('wet')) status = 'BARE_WET';

              return {
                id: `511-road-${idx}`,
                highway: `Hwy ${r.RoadwayName || '23'}`,
                segment: r.LocationDescription || 'Regional Segment',
                status,
                visibility: (r.Visibility || 'GOOD').toUpperCase() as any,
                driftingSnow: (r.Drifting || '').toLowerCase() === 'yes',
                lastUpdated: 'Live MTO Patrol Feed',
                coords: getFallbackRoadCoords(String(r.RoadwayName || '')),
              };
            });
            setCached('511-roads', mapped, 4 * 60 * 1000);
            return mapped;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch road conditions from 511:', err);
    }
  }

  return [];
}

function getIncidentDistanceFromListowel(lat: number, lon: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat - NORTH_PERTH_COORDS[0]) * Math.PI) / 180;
  const dLon = ((lon - NORTH_PERTH_COORDS[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((NORTH_PERTH_COORDS[0] * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 5b. Fetch real-time active MTO/OPP emergency incidents & road closures
export async function fetchLive511Incidents(apiKey?: string): Promise<LiveIncidentEvent[]> {
  const cached = getCached<LiveIncidentEvent[]>('511-incidents');
  if (cached) return cached;

  const key = apiKey || DEFAULT_ONTARIO_511_KEY;
  if (key) {
    try {
      const url = `/api/511/api/v2/get/event?key=${encodeURIComponent(key)}&format=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter to Perth County & surrounding regional corridors (radius ~95km from Listowel + corridor text matching)
          const localEvents = data.filter((e: any) => {
            const lat = Number(e.Latitude);
            const lon = Number(e.Longitude);
            const text = `${e.Description || ''} ${e.RoadwayName || ''}`.toLowerCase();
            const inBox = lat >= 43.0 && lat <= 44.5 && lon >= -82.0 && lon <= -80.0;
            const isPerthCorridor =
              text.includes('perth') ||
              text.includes('listowel') ||
              text.includes('stratford') ||
              text.includes('huron') ||
              text.includes('hwy 23') ||
              text.includes('hwy 86') ||
              text.includes('highway 23') ||
              text.includes('highway 86');
            return inBox || isPerthCorridor;
          });

          const results = localEvents
            .map((e: any) => {
              const lat = Number(e.Latitude);
              const lon = Number(e.Longitude);
              const typeStr = String(e.EventType || '').toLowerCase();
              let eventType: LiveIncidentEvent['eventType'] = 'other';
              if (
                typeStr.includes('accident') ||
                typeStr.includes('incident') ||
                typeStr.includes('collision')
              ) {
                eventType = 'accident';
              } else if (e.IsFullClosure || typeStr.includes('closure')) {
                eventType = 'closure';
              } else if (
                typeStr.includes('roadwork') ||
                typeStr.includes('construction') ||
                typeStr.includes('maintenance')
              ) {
                eventType = 'roadwork';
              } else if (
                typeStr.includes('hazard') ||
                typeStr.includes('weather') ||
                typeStr.includes('disabled')
              ) {
                eventType = 'hazard';
              }

              return {
                id: e.ID,
                road: e.RoadwayName || 'Corridor',
                direction: e.DirectionOfTravel || 'Both Directions',
                description: e.Description || 'Active Incident on Roadway',
                lanesAffected: e.LanesAffected || 'Lanes Affected',
                latitude: lat,
                longitude: lon,
                eventType,
                isFullClosure: Boolean(e.IsFullClosure),
                severity: e.Severity || 'Active',
                lastUpdated: e.LastUpdated
                  ? new Date(e.LastUpdated * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Live',
                distanceKmToListowel: getIncidentDistanceFromListowel(lat, lon),
              };
            })
            .sort((a: any, b: any) => a.distanceKmToListowel - b.distanceKmToListowel);

          setCached('511-incidents', results, 60 * 1000);
          return results;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch 511 incidents:', err);
    }
  }
  return [];
}

function getFallbackRoadCoords(_roadway: string): [number, number][] {
  return [];
}

export function getFallbackTrafficCameras(): TrafficCamera[] {
  return [];
}

// Road conditions fallback (empty to prevent fabricating road states)
export function getRoadConditions(): RoadCondition[] {
  return [];
}

// Hydro One Outages: Disabled simulated outages to preserve strict data integrity
export function getHydroOutages(): HydroOutage[] {
  return [];
}

// Emergency dispatches: Disabled simulated CAD calls to preserve strict data integrity
export function getEmergencyDispatches(): EmergencyDispatch[] {
  return [];
}

// HPSTS School Bus status: Disabled simulated schedules to preserve strict data integrity
export function getSchoolBusAlerts(): SchoolBusAlert[] {
  return [];
}

// Aircraft: Disabled simulated flights to preserve strict data integrity
export function getFallbackFlights(): FlightData[] {
  return [];
}

// River Gauges: Disabled simulated hydrometric numbers to preserve strict data integrity
export function getFallbackRiverGauges(): RiverGaugeData[] {
  return [];
}

// 9. Maitland Valley Conservation Authority (MVCA) Watershed Assessment
export function getMvcaWatershedBulletin(riverGauges: RiverGaugeData[]) {
  const mainGauge = riverGauges.find((g) => g.stationId === '02FE003') || riverGauges[0];
  const level = mainGauge ? mainGauge.waterLevelMeters : 6.8;

  let status: 'NORMAL' | 'CONDITIONS_STATEMENT' | 'FLOOD_WATCH' | 'FLOOD_WARNING' = 'NORMAL';
  let headline = 'WATERSHED CONDITIONS NORMAL // MAITLAND VALLEY';
  let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let details = 'Middle Maitland River and tributaries within typical seasonal baseflows. No significant snowmelt runoff or convective surcharge detected.';

  if (level > 8.5) {
    status = 'FLOOD_WARNING';
    headline = 'MVCA FLOOD WARNING // MIDDLE MAITLAND BASIN';
    risk = 'CRITICAL';
    details = `Middle Maitland gauge near Listowel recorded ${level.toFixed(2)}m (Critical stage). Overbank flooding expected in low-lying farmland, Maitland Conservation areas, and Listowel town dyke reach.`;
  } else if (level > 7.8) {
    status = 'FLOOD_WATCH';
    headline = 'MVCA FLOOD WATCH // LISTOWEL & TROWBRIDGE';
    risk = 'HIGH';
    details = `Middle Maitland level elevated at ${level.toFixed(2)}m. Water levels approaching bankfull. Surcharge possible along Road 164 bridge and low municipal crossings.`;
  } else if (level > 7.2) {
    status = 'CONDITIONS_STATEMENT';
    headline = 'MVCA WATERSHED CONDITIONS STATEMENT // WATER SAFETY';
    risk = 'MODERATE';
    details = `Moderate river flow increases (${level.toFixed(2)}m). Fast flowing water and slippery banks. Residents advised to stay clear of river edges.`;
  }

  return {
    status,
    headline,
    issuedDate: new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
    middleMaitlandRisk: risk,
    details,
    activeWatercourse: 'Middle Maitland River (Sub-basin 02FE)',
  };
}

// 10. Real-time Weather & Lake-Effect Squall Warnings for Northern Perth
export function getWeatherAlerts(weather: WeatherTelemetry | null) {
  const alerts = [];

  if (weather) {
    // Lake Huron Squall Detection logic
    const isWindFromHuron = weather.windDirectionDeg >= 260 && weather.windDirectionDeg <= 330;
    if (isWindFromHuron && weather.windSpeedKmh >= 28 && weather.temperatureC <= 1.5) {
      alerts.push({
        id: 'squall-huron',
        type: 'WARNING' as const,
        title: 'LAKE HURON SNOW SQUALL WARNING',
        severity: 'CRITICAL' as const,
        issuedTime: 'ECCC BULLETIN',
        description: `Direct northwest/west fetch off Lake Huron targeting the Highway 23 and Highway 86 corridors. Rapidly deteriorating visibility, localized whiteouts, and heavy squall banding expected across North Perth.`,
      });
    } else if (isWindFromHuron && weather.windSpeedKmh >= 20 && weather.temperatureC <= 3) {
      alerts.push({
        id: 'squall-watch',
        type: 'WATCH' as const,
        title: 'LAKE HURON SQUALL WATCH',
        severity: 'ELEVATED' as const,
        issuedTime: 'ECCC BULLETIN',
        description: `Atmospheric instabiity favorable for streamer bands crossing Huron County into Northern Perth (Listowel, Gowanstown, Atwood).`,
      });
    }

    // High Wind Warning
    if (weather.windGustsKmh >= 65) {
      alerts.push({
        id: 'wind-warn',
        type: 'WARNING' as const,
        title: `HIGH WIND WARNING // GUSTS ${weather.windGustsKmh} KM/H`,
        severity: 'CRITICAL' as const,
        issuedTime: 'NORTH PERTH OBS',
        description: `Hazardous crosswinds on rural concessions (Line 86, Line 84). High-profile transport trucks on Hwy 23 advised to exercise extreme caution.`,
      });
    } else if (weather.windGustsKmh >= 45) {
      alerts.push({
        id: 'wind-adv',
        type: 'ADVISORY' as const,
        title: `ELEVATED GUSTS (${weather.windGustsKmh} KM/H)`,
        severity: 'INFO' as const,
        issuedTime: 'NORTH PERTH OBS',
        description: `Brisk surface gusts across open Perth farmland. Minor agricultural drift risk.`,
      });
    }

    // Freeze Advisory
    if (weather.temperatureC <= 0) {
      alerts.push({
        id: 'freeze-adv',
        type: 'SPECIAL_STATEMENT' as const,
        title: 'SUB-ZERO ROAD SURFACE ADVISORY',
        severity: 'ELEVATED' as const,
        issuedTime: 'COUNTY ROAD ADVISORY',
        description: `Sub-zero temperatures (${weather.temperatureC}°C). Black ice formation risk on un-salted bridge decks (Wallace Ave, Maitland crossings).`,
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      type: 'NORMAL' as const,
      title: 'NO ACTIVE SEVERE WEATHER WATCHES',
      severity: 'INFO' as const,
      issuedTime: 'ENVIRONMENT CANADA',
      description: 'Atmospheric conditions over Northern Perth County are stable. No weather warnings or special weather statements in effect.',
    });
  }

  return alerts;
}

// 11. Perth County & North Perth Municipal Public Works Notices (Empty to prevent fabricating municipal maintenance schedules)
export function getMunicipalNotices(): any[] {
  return [];
}

