// God's Eye (bilawalsidhu/gods-eye-view) Intelligence Services
// Localized for North Perth & Southwestern Ontario / Great Lakes Region

import { NORTH_PERTH_COORDS } from './api';

export interface MilitaryFlight {
  hex: string;
  callsign: string;
  registration?: string;
  aircraftType?: string;
  latitude: number;
  longitude: number;
  altitudeFeet: number | null;
  speedKnots: number | null;
  headingDeg: number | null;
  squawk?: string;
  distanceKmToListowel: number;
}

export interface MilitaryInstallation {
  id: string;
  name: string;
  type: 'BASE' | 'TRAINING_RANGE' | 'AMMUNITION_DEPOT' | 'NAVAL_RESERVE' | 'ARMOURY' | 'RADAR';
  command: string;
  latitude: number;
  longitude: number;
  distanceKmToListowel: number;
  description: string;
}

// Fixed Canadian Armed Forces (CAF / RCAF / DND) Facilities in Region
export const CANADIAN_MILITARY_INSTALLATIONS: MilitaryInstallation[] = [
  {
    id: 'cfb-borden',
    name: 'Canadian Forces Base Borden (CFB Borden)',
    type: 'BASE',
    command: 'Canadian Defence Academy / 16 Wing',
    latitude: 44.271,
    longitude: -79.914,
    distanceKmToListowel: 98,
    description: 'Major training installation, CFB Borden airfield, and headquarters for Canadian Forces support training.',
  },
  {
    id: 'meaford-range',
    name: '4th Canadian Division Training Centre (Meaford)',
    type: 'TRAINING_RANGE',
    command: '4th Canadian Division / Canadian Army',
    latitude: 44.686,
    longitude: -80.687,
    distanceKmToListowel: 108,
    description: 'Primary live-fire artillery, tank, and combined-arms training area on Cape Rich, Georgian Bay.',
  },
  {
    id: 'cfad-angus',
    name: 'Canadian Forces Ammunition Depot Angus (CFAD Angus)',
    type: 'AMMUNITION_DEPOT',
    command: 'Canadian Materiel Support Group',
    latitude: 44.321,
    longitude: -79.882,
    distanceKmToListowel: 101,
    description: 'Central munitions storage and strategic logistics depot supporting central Canadian forces.',
  },
  {
    id: 'wolseley-barracks',
    name: 'Wolseley Barracks (London, ON)',
    type: 'BASE',
    command: '31 Canadian Brigade Group HQ / 4 RCR',
    latitude: 43.003,
    longitude: -81.233,
    distanceKmToListowel: 84,
    description: 'Historic operational garrison hosting 31 CBG headquarters and 4th Battalion The Royal Canadian Regiment.',
  },
  {
    id: 'hmcs-prevost',
    name: 'HMCS Prevost (London, ON)',
    type: 'NAVAL_RESERVE',
    command: 'Royal Canadian Navy Reserve',
    latitude: 42.981,
    longitude: -81.258,
    distanceKmToListowel: 87,
    description: 'Royal Canadian Navy division training sailors for maritime coastal and Great Lakes security.',
  },
  {
    id: 'stratford-armoury',
    name: 'Stratford Garrison Detachment',
    type: 'ARMOURY',
    command: '31 CBG / 4 RCR Detachment',
    latitude: 43.372,
    longitude: -80.982,
    distanceKmToListowel: 40,
    description: 'Local primary reserve assembly garrison for Perth County / historical Perth Regiment.',
  },
  {
    id: 'cfb-trenton',
    name: 'CFB Trenton (8 Wing Trenton)',
    type: 'BASE',
    command: 'Royal Canadian Air Force (RCAF)',
    latitude: 44.119,
    longitude: -77.528,
    distanceKmToListowel: 275,
    description: 'Canada’s primary air mobility hub operating CC-130J Hercules, CC-177 Globemaster, and Search & Rescue.',
  },
];

// Distance helper
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// 1. Fetch live military aircraft from adsb.lol /v2/mil
export async function fetchLiveMilitaryFlights(): Promise<MilitaryFlight[]> {
  try {
    const res = await fetch('https://api.adsb.lol/v2/mil');
    if (!res.ok) return [];
    const data = await res.json();
    const acList: any[] = data.ac || [];

    const listowelLat = NORTH_PERTH_COORDS[0];
    const listowelLon = NORTH_PERTH_COORDS[1];

    // Filter for aircraft within Great Lakes / Ontario / Canadian airspace buffer
    // lat: 40 to 48, lon: -85 to -74
    const regionalFlights: MilitaryFlight[] = acList
      .filter((ac) => {
        const lat = ac.lat;
        const lon = ac.lon;
        return (
          typeof lat === 'number' &&
          typeof lon === 'number' &&
          lat >= 40.0 &&
          lat <= 48.0 &&
          lon >= -85.0 &&
          lon <= -74.0
        );
      })
      .map((ac) => ({
        hex: ac.hex,
        callsign: (ac.flight || ac.r || 'MIL-AIRCRAFT').trim(),
        registration: ac.r,
        aircraftType: ac.t,
        latitude: ac.lat,
        longitude: ac.lon,
        altitudeFeet: typeof ac.alt_baro === 'number' ? ac.alt_baro : null,
        speedKnots: typeof ac.gs === 'number' ? Math.round(ac.gs) : null,
        headingDeg: typeof ac.track === 'number' ? Math.round(ac.track) : null,
        squawk: ac.squawk,
        distanceKmToListowel: getDistanceKm(listowelLat, listowelLon, ac.lat, ac.lon),
      }))
      .sort((a, b) => a.distanceKmToListowel - b.distanceKmToListowel);

    return regionalFlights;
  } catch (err) {
    console.warn('Military flight feed unavailable:', err);
    return [];
  }
}

// 2. Optical Reconnaissance Metrics (NRO/NGA Standard as in bilawalsidhu/gods-eye-view)
export function calculateGsd(zoom: number, lat: number = 43.73): number {
  const earthCircumference = 40075016.686; // meters
  const latRad = (lat * Math.PI) / 180;
  const metersPerPixel = (earthCircumference * Math.cos(latRad)) / Math.pow(2, zoom + 8);
  return Math.round(metersPerPixel * 100) / 100;
}

export function calculateNiirs(gsdMeters: number): number {
  if (gsdMeters <= 0.1) return 9.0;
  if (gsdMeters <= 0.2) return 8.5;
  if (gsdMeters <= 0.4) return 7.8;
  if (gsdMeters <= 0.75) return 6.8;
  if (gsdMeters <= 1.2) return 5.7;
  if (gsdMeters <= 2.5) return 4.5;
  if (gsdMeters <= 4.5) return 3.4;
  if (gsdMeters <= 9.0) return 2.2;
  return 1.2;
}

// 3. Approximate MGRS military coordinate converter for Zone 17T (Perth County)
export function calculateMgrs(lat: number, lon: number): string {
  // Zone 17T for Southwestern Ontario
  const zone = '17T';
  // Central meridian for Zone 17 is -81.0 deg
  const dLon = lon - -81.0;
  const dLat = lat - 43.0;

  // Approximate easting & northing in meters
  const easting = Math.round(500000 + dLon * 80000);
  const northing = Math.round(4760000 + dLat * 111132);

  const e5 = Math.abs(easting % 100000).toString().padStart(5, '0');
  const n5 = Math.abs(northing % 100000).toString().padStart(5, '0');

  // 100km square designator for region is NJ
  return `${zone} NJ ${e5.substring(0, 4)} ${n5.substring(0, 4)}`;
}

export function toDms(lat: number, lon: number): string {
  const latH = lat >= 0 ? 'N' : 'S';
  const lonH = lon >= 0 ? 'E' : 'W';
  const aLat = Math.abs(lat);
  const aLon = Math.abs(lon);

  const latD = Math.floor(aLat);
  const latM = Math.floor((aLat - latD) * 60);
  const latS = Math.round(((aLat - latD) * 60 - latM) * 60);

  const lonD = Math.floor(aLon);
  const lonM = Math.floor((aLon - lonD) * 60);
  const lonS = Math.round(((aLon - lonD) * 60 - lonM) * 60);

  return `${latD}°${latM}'${latS}"${latH} ${lonD}°${lonM}'${lonS}"${lonH}`;
}
