// Real-Time Maritime AIS Vessel Tracking for Lake Huron & Southwestern Ontario
// Covers Goderich Salt Port, Georgian Bay, and St. Clair Marine Shipping Corridors
// Keyless Open-Source AIS data via OpenWaters network

import { NORTH_PERTH_COORDS } from './api';

export interface MaritimeVessel {
  mmsi: number;
  name: string;
  callsign?: string;
  flag?: string;
  latitude: number;
  longitude: number;
  speedKnots: number;
  headingDeg: number;
  courseDeg?: number;
  vesselType: string;
  vesselTypeCategory: 'CARGO' | 'TANKER' | 'TUG' | 'PASSENGER' | 'GOV_LAW' | 'FISHING' | 'OTHER';
  destination?: string;
  lengthMeters?: number;
  beamMeters?: number;
  draughtMeters?: number;
  distanceKmToListowel: number;
  bearingFromListowelDeg: number;
  lastSeen: string;
}

// Bounding box for Lake Huron, Georgian Bay, Goderich, and St. Clair waterway
// minLon: -83.5, minLat: 42.5, maxLon: -80.0, maxLat: 45.8
const LAKE_HURON_BBOX = '-83.5,42.5,-80.0,45.8';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

export function calculateBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

function classifyVesselType(typeCode?: number): {
  category: MaritimeVessel['vesselTypeCategory'];
  label: string;
} {
  if (!typeCode) return { category: 'OTHER', label: 'Vessel' };
  if (typeCode >= 70 && typeCode <= 79) return { category: 'CARGO', label: 'Bulk Cargo / Freighter' };
  if (typeCode >= 80 && typeCode <= 89) return { category: 'TANKER', label: 'Chemical / Oil Tanker' };
  if (typeCode >= 50 && typeCode <= 53) return { category: 'TUG', label: 'Tug / Pilot Boat' };
  if (typeCode >= 60 && typeCode <= 69) return { category: 'PASSENGER', label: 'Passenger Ferry' };
  if (typeCode === 55 || typeCode === 90) return { category: 'GOV_LAW', label: 'Coast Guard / Patrol Cutter' };
  if (typeCode === 30) return { category: 'FISHING', label: 'Commercial Fishing Vessel' };
  if (typeCode >= 36 && typeCode <= 37) return { category: 'OTHER', label: 'Pleasure Craft / Sailing' };
  return { category: 'OTHER', label: `Marine Vessel (${typeCode})` };
}

export async function fetchLiveLakeHuronVessels(): Promise<MaritimeVessel[]> {
  try {
    const url = `https://ais.openwaters.io/v1/vessels?bbox=${LAKE_HURON_BBOX}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const features: any[] = data.features || [];

    const listowelLat = NORTH_PERTH_COORDS[0];
    const listowelLon = NORTH_PERTH_COORDS[1];

    const rawList: (MaritimeVessel | null)[] = features.map((f) => {
      const coords = f.geometry?.coordinates;
      const props = f.properties || {};
      if (!coords || coords.length < 2) return null;

      const lon = coords[0];
      const lat = coords[1];
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;

      const { category, label } = classifyVesselType(props.type);
      const dist = calculateDistanceKm(listowelLat, listowelLon, lat, lon);
      const bearing = calculateBearingDeg(listowelLat, listowelLon, lat, lon);

      return {
        mmsi: props.mmsi || f.id,
        name: props.name?.trim() || `VESSEL ${props.mmsi || 'UNKNOWN'}`,
        callsign: props.callsign,
        flag: props.flag,
        latitude: lat,
        longitude: lon,
        speedKnots: Math.round((props.sog ?? 0) * 10) / 10,
        headingDeg: props.heading ?? props.cog ?? 0,
        courseDeg: props.cog,
        vesselType: label,
        vesselTypeCategory: category,
        destination: props.destination?.trim(),
        lengthMeters: props.length,
        beamMeters: props.beam,
        draughtMeters: props.draught,
        distanceKmToListowel: dist,
        bearingFromListowelDeg: bearing,
        lastSeen: props.seen || new Date().toISOString(),
      };
    });

    const vessels: MaritimeVessel[] = [];
    for (const v of rawList) {
      if (v) vessels.push(v);
    }
    vessels.sort((a, b) => a.distanceKmToListowel - b.distanceKmToListowel);

    return vessels;
  } catch (err) {
    console.warn('Maritime AIS stream unavailable:', err);
    return [];
  }
}
