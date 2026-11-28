export interface FlightData {
  icao24: string;
  callsign: string;
  originCountry: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  altitudeFeet: number | null;
  velocityKmh: number | null;
  trackHeading: number | null;
  verticalRate: number | null;
  onGround: boolean;
  squawk: string | null;
  distanceKmToListowel: number;
  aircraftType?: string;
  registration?: string;
}

export interface RiverGaugeData {
  stationId: string;
  stationName: string;
  timestamp: string;
  waterLevelMeters: number;
  dischargeM3s: number;
  floodStageAlert: 'NORMAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL';
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  conditionLabel: string;
  tempMaxC: number;
  tempMinC: number;
}

export interface HourlyForecastItem {
  time: string;
  tempC: number;
  precipProb: number;
  weatherCode: number;
}

export interface WeatherTelemetry {
  temperatureC: number;
  apparentTempC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windGustsKmh: number;
  weatherCode: number;
  conditionLabel: string;
  barometricPressureHpa: number;
  cloudCoverPercent: number;
  dailyForecast?: DailyForecast[];
  hourlyForecast?: HourlyForecastItem[];
}

export interface CameraViewItem {
  id: number;
  description: string;
  url: string;
}

export interface TrafficCamera {
  id: string;
  name: string;
  highway: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  lastUpdated: string;
  direction: string;
  views?: CameraViewItem[];
  distanceKm?: number;
}

export interface RoadCondition {
  id: string;
  highway: string;
  segment: string;
  status: 'BARE_DRY' | 'BARE_WET' | 'PARTLY_SNOW_COVERED' | 'SNOW_COVERED' | 'ICED' | 'CLOSED';
  visibility: 'GOOD' | 'FAIR' | 'POOR' | 'NEAR_ZERO';
  driftingSnow: boolean;
  lastUpdated: string;
  coords: [number, number][];
}

// One Hydro One outage (or group of outages at one spot) from the Storm Centre map, via /api/outages
export interface HydroOutage {
  latitude: number;
  longitude: number;
  customers: number;
  customersIsEstimate: boolean; // Hydro One shows small counts as "fewer than N"; customers is then N
  outageCount: number;
  status: string | null;
  cause: string | null;
  estimatedRestoration: string | null;
  startedAt: string | null;
}

export interface AirQualityReport {
  location: string; // AQHI location the readings are for
  current: number | null; // latest observed AQHI
  observedAt: string | null;
  specialNote: string | null;
  forecast: { label: string; aqhi: number; inSmoke: number | null }[]; // Today / Tonight / Tomorrow…
}

export interface HydroOutageReport {
  outages: HydroOutage[];
  updatedAt: string | null;
  checkedAt: string;
}

export interface LiveIncidentEvent {
  id: number;
  road: string;
  direction: string;
  description: string;
  lanesAffected: string;
  latitude: number;
  longitude: number;
  eventType: 'accident' | 'closure' | 'roadwork' | 'hazard' | 'other';
  isFullClosure: boolean;
  severity: string;
  lastUpdated: string;
  distanceKmToListowel: number;
}

export interface EmergencyDispatch {
  id: string;
  agency: 'OPP' | 'NP_FIRE' | 'PARAMEDIC';
  type: string;
  location: string;
  timestamp: string;
  status: 'ACTIVE' | 'EN_ROUTE' | 'CONTAINED' | 'RESOLVED';
  details: string;
}

// One row from Huron-Perth Student Transportation Services' live alerts (hpsts.mybusplanner.ca)
export interface SchoolBusAlert {
  kind: 'bus' | 'school';
  appliesTo: string; // YYYY-MM-DD
  title: string; // bus run (e.g. NEWRY_LDSS_12_AM) or school name
  operator: string; // bus company; '' for school notices
  status: string; // e.g. "Delayed 15 minutes", "Cancelled-All Day", "Closed"
  cancelled: boolean; // cancelled run or closed school
  schools: string[];
  reason: string;
  postedAt: string; // as displayed by HPSTS, e.g. "2026-11-25 6:53 AM"
  nearListowel: boolean;
}

export interface SchoolBusStatus {
  alerts: SchoolBusAlert[]; // near-Listowel first, then cancellations, then delays
  fetchedAt: Date;
}

export interface ActiveLayers {
  towns: boolean;
  agriHubs: boolean;
  cams: boolean;
  radar: boolean;
  squall: boolean;
  flights: boolean;
  military: boolean;
  river: boolean;
  weather: boolean;
  maritime: boolean;
  helipad: boolean;
  seismic: boolean;
  drought: boolean;
  satellites: boolean;
}

export type OpticMode = 'normal' | 'flir' | 'nvg' | 'crt';

// Latest Maitland Valley Conservation Authority flood message, via /api/mvca-notice
export interface MvcaNotice {
  title: string;
  level: 'FLOOD_WARNING' | 'FLOOD_WATCH' | 'CONDITIONS_STATEMENT' | 'NOTICE';
  link: string;
  date: string;
  expires: string | null;
  summary: string;
}

export interface MvcaNoticeReport {
  current: boolean; // the latest message is still in effect
  notice: MvcaNotice | null;
}

export interface WeatherAlert {
  id: string;
  type: 'WARNING' | 'WATCH' | 'SPECIAL_STATEMENT' | 'ADVISORY' | 'NORMAL';
  title: string;
  severity: 'CRITICAL' | 'ELEVATED' | 'INFO';
  issuedTime: string;
  description: string;
  source: 'ECCC' | 'LOCAL'; // Environment Canada alert, or this site's own estimate from readings
  link?: string;
}

// North Perth road / water / construction notice, via /api/municipal-notices
export interface MunicipalNotice {
  title: string;
  category: 'WATER' | 'ROAD' | 'CONSTRUCTION' | 'PUBLIC_WORKS';
  link: string;
  date: string;
  summary: string;
}

export interface MunicipalNoticesReport {
  notices: MunicipalNotice[];
  windowDays: number;
}
