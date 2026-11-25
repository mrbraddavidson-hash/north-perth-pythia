import React, { useEffect, useState } from 'react';
import { fetchEcccPrecipSummary, fetchEcccRadarTimes, PrecipSummary } from '../services/radar';

const REFRESH_MS = 6 * 60 * 1000; // ECCC publishes a scan every 6 minutes

interface RadarPrecipStatusProps {
  // ECCC scan time to summarise. Omit to track the latest scan automatically (2D map).
  time?: string;
  // Frame Listowel and the nearest precipitation in the host map.
  onShow?: (nearest: { lat: number; lon: number }) => void;
  className?: string;
}

// "CLEAR · NO PRECIP NEARBY" / "PRECIP 162 KM N  [SHOW]" — so an empty radar layer doesn't look broken.
export const RadarPrecipStatus: React.FC<RadarPrecipStatusProps> = ({ time, onShow, className = '' }) => {
  const [latestTime, setLatestTime] = useState<string | undefined>(undefined);
  const [precip, setPrecip] = useState<PrecipSummary | null>(null);

  // Without a time from the host, follow the latest ECCC scan ourselves
  useEffect(() => {
    if (time) return;
    let cancelled = false;
    const load = async () => {
      const times = await fetchEcccRadarTimes(1);
      if (!cancelled && times.length > 0) setLatestTime(times[times.length - 1]);
    };
    load();
    const timer = window.setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [time]);

  const scanTime = time ?? latestTime;
  useEffect(() => {
    if (!scanTime) return;
    let cancelled = false;
    fetchEcccPrecipSummary(scanTime).then((summary) => {
      if (!cancelled) setPrecip(summary);
    });
    return () => {
      cancelled = true;
    };
  }, [scanTime]);

  if (!precip) return null;

  return (
    <span className={`flex items-center gap-1.5 font-mono text-[10px] ${className}`}>
      {precip.hasPrecip ? (
        <>
          <span className="text-sky-300 font-bold">
            {precip.nearestKm !== null && precip.nearestKm < 3
              ? 'PRECIP OVERHEAD'
              : `PRECIP ${precip.nearestKm} KM ${precip.bearing ?? ''}`.trim()}
          </span>
          {onShow && precip.nearest && (precip.nearestKm ?? 0) > 10 && (
            <button
              type="button"
              onClick={() => precip.nearest && onShow(precip.nearest)}
              className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/50 text-sky-300 hover:text-white cursor-pointer"
              title="Zoom out to see the precipitation on radar"
            >
              SHOW
            </button>
          )}
        </>
      ) : (
        <span className="text-slate-400" title="Nothing on Environment Canada radar within ~250 km of Listowel in the latest scan">
          CLEAR · NO PRECIP NEARBY
        </span>
      )}
    </span>
  );
};
