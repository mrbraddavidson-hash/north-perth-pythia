import React, { useEffect, useState } from 'react';
import { Wind, ExternalLink } from 'lucide-react';
import { fetchAirQuality } from '../services/api';
import { AirQualityReport } from '../services/types';

const REFRESH_MS = 30 * 60 * 1000;
const AQHI_INFO_URL = 'https://weather.gc.ca/airquality/pages/onaq-030_e.html'; // Kitchener

// Environment Canada AQHI risk bands and their general-population advice
function band(aqhi: number) {
  if (aqhi > 10) return { label: 'VERY HIGH RISK', cls: 'text-fuchsia-300', advice: 'Avoid strenuous outdoor work; reduce time outside if you have symptoms.' };
  if (aqhi >= 7) return { label: 'HIGH RISK', cls: 'text-rose-300', advice: 'Consider reducing or rescheduling strenuous outdoor work, especially with symptoms.' };
  if (aqhi >= 4) return { label: 'MODERATE RISK', cls: 'text-amber-300', advice: 'Fine for most outdoor work; people with heart or lung conditions should take it easier.' };
  return { label: 'LOW RISK', cls: 'text-emerald-400', advice: 'Good air for outdoor work.' };
}

const fmt = (n: number) => (n > 10 ? '10+' : String(Math.round(n)));

// Air Quality Health Index (smoke, ozone, fine particles) for the nearest Environment Canada AQHI location.
export const AirQualityCard: React.FC = () => {
  const [report, setReport] = useState<AirQualityReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await fetchAirQuality();
      if (cancelled) return;
      if (r) {
        setReport(r);
        setFailed(false);
      } else setFailed(true);
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

  const headline = report?.current ?? report?.forecast[0]?.aqhi ?? null;
  const b = headline !== null ? band(headline) : null;

  return (
    <div className="p-3 rounded bg-slate-900/90 border border-slate-700 shadow-sm space-y-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white">AIR QUALITY // AQHI</span>
        </div>
        <a
          href={AQHI_INFO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-sky-300"
          title="Environment Canada air quality for Ontario"
        >
          ECCC <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {!report || headline === null || !b ? (
        <p className="text-[10px] text-slate-400">{failed ? 'Air quality data unavailable right now.' : 'Loading air quality…'}</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-lg font-bold ${b.cls}`}>{fmt(headline)}</span>
            <span className={`text-[10px] font-bold ${b.cls}`}>{b.label}</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">{b.advice}</p>
          {report.specialNote && <p className="text-[10px] text-amber-300 leading-snug">{report.specialNote}</p>}
          {report.forecast.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {report.forecast.map((p) => (
                <span key={p.label} className="px-1.5 py-0.5 rounded bg-black/40 border border-slate-800 text-[9px] text-slate-400">
                  {p.label}: <span className={`font-bold ${band(p.aqhi).cls}`}>{fmt(p.aqhi)}</span>
                  {p.inSmoke !== null && <span className="text-rose-300"> (smoke {fmt(p.inSmoke)})</span>}
                </span>
              ))}
            </div>
          )}
          <p className="text-[9px] text-slate-500">
            {report.current !== null ? 'Observed' : 'Forecast'} at {report.location}, nearest AQHI station (~50 km)
            {report.observedAt &&
              ` · ${new Date(report.observedAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })}`}
          </p>
        </>
      )}
    </div>
  );
};
