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

export interface HydroOutage {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  customersAffected: number;
  status: 'INVESTIGATING' | 'CREW_ASSIGNED' | 'CREW_ON_SITE' | 'RESOLVED';
  cause: string;
  estimatedRestoration: string;
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

export interface SchoolBusAlert {
  zone: string;
  title: string;
  status: 'RUNNING_ON_TIME' | 'DELAYS_REPORTED' | 'ALL_ROUTES_CANCELLED' | 'FOG_HOLD';
  affectedSchools: string[];
  notice: string;
}

export interface ActiveLayers {
  towns: boolean;
  radar: boolean;
  squall: boolean;
  flights: boolean;
  helipad: boolean;
  river: boolean;
  cams: boolean;
  roads: boolean;
  weather: boolean;
  hydro: boolean;
  dispatches: boolean;
  buses: boolean;
  satellites: boolean;
  seismic?: boolean;
  hazards?: boolean;
}

export interface MvcaWatershedBulletin {
  status: 'NORMAL' | 'CONDITIONS_STATEMENT' | 'FLOOD_WATCH' | 'FLOOD_WARNING';
  headline: string;
  issuedDate: string;
  middleMaitlandRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  details: string;
  activeWatercourse: string;
}

export interface WeatherAlert {
  id: string;
  type: 'WARNING' | 'WATCH' | 'SPECIAL_STATEMENT' | 'ADVISORY' | 'NORMAL';
  title: string;
  severity: 'CRITICAL' | 'ELEVATED' | 'INFO';
  issuedTime: string;
  description: string;
}

export interface MunicipalNotice {
  id: string;
  category: 'INFRASTRUCTURE' | 'ROAD_CLOSURE' | 'WATER_WORKS' | 'WINTER_PATROL';
  title: string;
  location: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'ADVISORY';
  date: string;
  details: string;
}

