import React from 'react';
import { Orbit, Sparkles, Compass } from 'lucide-react';
import { AuroraData, IssTelemetry } from '../services/space';

interface SpaceWeatherBarProps {
  aurora: AuroraData | null;
  iss: IssTelemetry | null;
  onTrackIss: () => void;
}

export const SpaceWeatherBar: React.FC<SpaceWeatherBarProps> = ({ aurora, iss, onTrackIss }) => {
  const kp = aurora?.kpIndex ?? 2.7;

  const kpColor =
    kp >= 6
      ? 'text-purple-400 bg-purple-950/80 border-purple-500'
      : kp >= 4
      ? 'text-amber-400 bg-amber-950/80 border-amber-500'
      : 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/90 border-b border-cyan-500/20 text-xs font-mono backdrop-blur-md">
      {/* Aurora Borealis Kp Meter */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-slate-400 hidden sm:inline">AURORA KP:</span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-bold ${kpColor}`}>
          <span>{kp} Kp</span>
          <span className="text-[9px] font-normal opacity-80">({aurora?.status ?? 'QUIET'})</span>
        </div>
        {kp >= 5 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-900 text-purple-200 border border-purple-400 animate-pulse">
            AURORA VISIBLE OVER PERTH CTY
          </span>
        )}
      </div>

      {/* ISS Real-time Telemetry */}
      {iss && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '40s' }} />
            <span className="text-cyan-300 font-bold">ISS ORBIT:</span>
            <span>{iss.altitudeKm} km alt</span>
            <span className="text-slate-500 hidden md:inline">|</span>
            <span className="hidden md:inline">{iss.velocityKmh.toLocaleString()} km/h</span>
            <span className="text-slate-500 hidden lg:inline">|</span>
            <span className="hidden lg:inline text-cyan-400">{iss.distanceKmToListowel} km out</span>
          </div>

          <button
            onClick={onTrackIss}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] cursor-pointer"
          >
            <Compass className="w-3 h-3" />
            <span>LOCATE ISS</span>
          </button>
        </div>
      )}
    </div>
  );
};
