import React from 'react';
import { FlightData } from '../services/types';
import { MaritimeVessel } from '../services/maritime';

// Live details for the selected aircraft or vessel. Shared by the 2D map and the 3D globe tracking cards.
export const TargetSummary: React.FC<{
  flight: FlightData | null;
  vessel: MaritimeVessel | null;
}> = ({ flight, vessel }) => {
  if (flight) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-tactical font-black text-cyan-300">{flight.callsign}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 font-bold">
            {flight.originCountry || 'ADS-B'}
          </span>
        </div>
        <div className="text-[11px] text-slate-300 font-tactical">{flight.aircraftType || 'Airborne Transponder'}</div>

        <div className="grid grid-cols-2 gap-1.5 bg-black/60 p-2 rounded border border-slate-800 text-[10px]">
          <div>ALT: <span className="text-white font-bold">{flight.altitudeFeet?.toLocaleString() ?? 'Ground'} ft</span></div>
          <div>SPD: <span className="text-white font-bold">{flight.velocityKmh ?? 'N/A'} km/h</span></div>
          <div>HDG: <span className="text-white font-bold">{flight.trackHeading ?? 0}°</span></div>
          <div>SQUAWK: <span className="text-slate-400">{flight.squawk || 'AUTO'}</span></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-cyan-300 px-1">
          <span>
            RANGE: <span className="text-white font-bold">{flight.distanceKmToListowel} km</span> (
            {Math.round(flight.distanceKmToListowel * 0.54)} NM)
          </span>
          <span>REG: <span className="text-white font-bold">{flight.registration || flight.icao24.toUpperCase()}</span></span>
        </div>
      </div>
    );
  }

  if (vessel) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-tactical font-black text-cyan-300">{vessel.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-500/40 font-bold">
            {vessel.flag || 'AIS'}
          </span>
        </div>
        <div className="text-[11px] text-slate-300 font-tactical">{vessel.vesselType}</div>

        <div className="grid grid-cols-2 gap-1.5 bg-black/60 p-2 rounded border border-slate-800 text-[10px]">
          <div>SPD: <span className="text-white font-bold">{vessel.speedKnots} kts</span></div>
          <div>HDG: <span className="text-white font-bold">{vessel.headingDeg}°</span></div>
          <div>DEST: <span className="text-white font-bold truncate">{vessel.destination || 'LAKE HURON'}</span></div>
          <div>MMSI: <span className="text-slate-400">{vessel.mmsi}</span></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-teal-300 px-1">
          <span>
            RANGE: <span className="text-white font-bold">{vessel.distanceKmToListowel} km</span> (
            {Math.round(vessel.distanceKmToListowel * 0.54)} NM)
          </span>
          <span>BRG: <span className="text-white font-bold">{vessel.bearingFromListowelDeg}°</span></span>
        </div>
      </div>
    );
  }

  return null;
};
