import React from 'react';
import { Orbit, Sparkles } from 'lucide-react';
import { AuroraData, IssTelemetry } from '../services/space';

interface SpaceWeatherBarProps {
  aurora: AuroraData | null;
  iss: IssTelemetry | null;
  onTrackIss: () => void;
}

// Compact aurora Kp + ISS chips for the header (formerly a full-width strip under it).
export const SpaceWeatherBar: React.FC<SpaceWeatherBarProps> = ({ aurora, iss, onTrackIss }) => {
  const kp = aurora?.kpIndex ?? 0; // colour/alert only; label shows '--' when unavailable
  const kpColor =
    kp >= 6
      ? 'text-purple-300 bg-purple-950/80 border-purple-500'
      : kp >= 4
      ? 'text-amber-300 bg-amber-950/80 border-amber-500'
      : 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40';

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono">
      <span
        className={`flex items-center gap-1 px-1.5 py-1 rounded border font-bold ${kpColor} ${kp >= 5 ? 'animate-pulse' : ''}`}
        title={
          aurora
            ? `Aurora Kp ${aurora.kpIndex} (${aurora.status})${kp >= 5 ? ' — aurora may be visible over Perth County' : ''}`
            : 'Aurora Kp unavailable'
        }
      >
        <Sparkles className="w-3 h-3 text-purple-400" />
        {aurora ? `Kp ${aurora.kpIndex}` : 'Kp --'}
        {kp >= 5 && <span className="text-purple-200">AURORA</span>}
      </span>
      {iss && (
        <button
          type="button"
          onClick={onTrackIss}
          className="flex items-center gap-1 px-1.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 font-bold cursor-pointer"
          title={`ISS: ${iss.altitudeKm} km up, ${iss.velocityKmh.toLocaleString()} km/h, ${iss.distanceKmToListowel.toLocaleString()} km from Listowel. Click to locate.`}
        >
          <Orbit className="w-3 h-3 text-cyan-400" />
          ISS
        </button>
      )}
    </div>
  );
};
