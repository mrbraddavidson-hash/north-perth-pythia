import React, { useEffect, useState } from 'react';
import { Zap, ExternalLink, MapPin } from 'lucide-react';
import { fetchHydroOutages, HYDRO_ONE_OUTAGE_MAP_URL } from '../services/api';
import { HydroOutageReport } from '../services/types';

const REFRESH_MS = 5 * 60 * 1000;

const time = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' });

// Current Hydro One outages in and around North Perth.
export const PowerOutagesCard: React.FC<{ onFlyToCoord?: (coords: [number, number], zoom?: number) => void }> = ({
  onFlyToCoord,
}) => {
  const [report, setReport] = useState<HydroOutageReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await fetchHydroOutages();
      if (cancelled) return;
      if (r) {
        setReport(r);
        setFailed(false);
      } else setFailed(true); // keep the last good list if a refresh fails
    };
    load();
    const timer = window.setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const outages = report?.outages ?? [];
  const customers = outages.reduce((sum, o) => sum + o.customers, 0);
  const anyEstimate = outages.some((o) => o.customersIsEstimate);

  return (
    <div
      className={`p-3 rounded bg-slate-900/90 border shadow-sm space-y-2 font-mono ${
        outages.length ? 'border-amber-500/60' : 'border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">POWER OUTAGES // HYDRO ONE</span>
        </div>
        <a
          href={HYDRO_ONE_OUTAGE_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-amber-300"
          title="Hydro One Storm Centre outage map"
        >
          MAP <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {!report ? (
        <p className="text-[10px] text-slate-400">
          {failed ? 'Outage data unavailable right now. Check the Hydro One map.' : 'Checking Hydro One outages…'}
        </p>
      ) : outages.length === 0 ? (
        <p className="text-[10px] text-emerald-400 font-bold">NO OUTAGES REPORTED AROUND NORTH PERTH</p>
      ) : (
        <>
          <p className="text-[10px] text-amber-300 font-bold">
            {outages.length} {outages.length === 1 ? 'outage' : 'outages'} · {anyEstimate ? 'up to ' : ''}
            {customers.toLocaleString()} customers out
          </p>
          <div className="space-y-1">
            {outages.map((o) => (
              <div key={`${o.latitude},${o.longitude}`} className="px-2 py-1.5 rounded border border-amber-500/40 bg-amber-950/30 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">
                    {o.customersIsEstimate ? '< ' : ''}
                    {o.customers.toLocaleString()} customers
                    {o.outageCount > 1 ? ` · ${o.outageCount} outages` : ''}
                  </span>
                  {onFlyToCoord && (
                    <button
                      type="button"
                      onClick={() => onFlyToCoord([o.latitude, o.longitude], 13)}
                      className="flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      aria-label="Show outage on map"
                    >
                      <MapPin className="w-3 h-3" /> MAP
                    </button>
                  )}
                </div>
                <div className="text-slate-400">
                  {[o.status, o.cause].filter(Boolean).join(' · ') || 'Details pending'}
                  {o.estimatedRestoration ? ` · back by ${time(o.estimatedRestoration)}` : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {report && (
        <p className="text-[9px] text-slate-500">
          Hydro One data {report.updatedAt ? `as of ${time(report.updatedAt)}` : ''}
          {failed && ' · refresh failed, showing last list'}
        </p>
      )}
    </div>
  );
};
