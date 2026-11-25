import React, { useEffect, useMemo, useState } from 'react';
import { Bus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { fetchSchoolBusStatus } from '../services/api';
import { SchoolBusAlert, SchoolBusStatus } from '../services/types';

const REFRESH_MS = 5 * 60 * 1000;
const HPSTS_ALERTS_URL = 'https://hpsts.mybusplanner.ca/Alerts';

// Runs with the same status for the same schools (e.g. 14 cancelled Brookside runs) shown as one line.
interface AlertGroup {
  key: string;
  label: string;
  status: string;
  cancelled: boolean;
  isSchoolNotice: boolean;
  runs: SchoolBusAlert[];
  reason: string;
}

function groupAlerts(alerts: SchoolBusAlert[]): AlertGroup[] {
  const groups = new Map<string, AlertGroup>();
  for (const a of alerts) {
    const label = a.schools.join(', ') || a.title;
    const key = `${a.kind}|${a.status}|${label}`;
    const g = groups.get(key);
    if (g) g.runs.push(a);
    else
      groups.set(key, {
        key,
        label,
        status: a.status,
        cancelled: a.cancelled,
        isSchoolNotice: a.kind === 'school',
        runs: [a],
        reason: a.reason,
      });
  }
  return [...groups.values()]; // keeps the service's near-Listowel / cancelled-first order
}

const AlertRow: React.FC<{ g: AlertGroup }> = ({ g }) => (
  <div
    className={`px-2 py-1.5 rounded border text-[10px] ${
      g.cancelled ? 'bg-rose-950/40 border-rose-500/50' : 'bg-amber-950/30 border-amber-500/40'
    }`}
    title={g.runs.map((r) => `${r.title}${r.operator ? ` (${r.operator})` : ''} · posted ${r.postedAt}`).join('\n')}
  >
    <div className="flex items-start justify-between gap-2">
      <span className="font-bold text-white leading-snug">{g.label}</span>
      <span className={`flex-shrink-0 font-bold ${g.cancelled ? 'text-rose-300' : 'text-amber-300'}`}>
        {g.isSchoolNotice ? `SCHOOL ${g.status.toUpperCase()}` : g.status}
      </span>
    </div>
    <div className="text-slate-400">
      {g.isSchoolNotice
        ? g.reason
        : `${g.runs.length > 1 ? `${g.runs.length} runs` : g.runs[0].title} · ${g.runs[0].operator}${g.reason ? ` · ${g.reason}` : ''}`}
    </div>
  </div>
);

// Today's Huron-Perth school bus delays/cancellations and school closures, Listowel area first.
export const SchoolBusCard: React.FC = () => {
  const [status, setStatus] = useState<SchoolBusStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const s = await fetchSchoolBusStatus();
      if (cancelled) return;
      if (s) {
        setStatus(s);
        setFailed(false);
      } else setFailed(true); // keep showing the last good list if a refresh fails
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

  const { near, others, cancelledCount, delayedCount } = useMemo(() => {
    const alerts = status?.alerts ?? [];
    return {
      near: groupAlerts(alerts.filter((a) => a.nearListowel)),
      others: groupAlerts(alerts.filter((a) => !a.nearListowel)),
      cancelledCount: alerts.filter((a) => a.kind === 'bus' && a.cancelled).length,
      delayedCount: alerts.filter((a) => a.kind === 'bus' && !a.cancelled).length,
    };
  }, [status]);

  const total = near.length + others.length;

  return (
    <div className="p-3 rounded bg-slate-900/90 border border-yellow-500/40 shadow-sm space-y-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <Bus className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-white">SCHOOL BUSES // HURON-PERTH</span>
        </div>
        <a
          href={HPSTS_ALERTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-yellow-300"
          title="Official Huron-Perth Student Transportation Services alerts"
        >
          HPSTS <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {!status ? (
        <p className="text-[10px] text-slate-400">{failed ? 'Bus alerts unavailable right now. Check HPSTS directly.' : 'Loading today’s bus alerts…'}</p>
      ) : total === 0 ? (
        <p className="text-[10px] text-emerald-400 font-bold">NO DELAYS OR CANCELLATIONS POSTED TODAY</p>
      ) : (
        <>
          <p className="text-[10px] text-slate-400">
            {cancelledCount > 0 && <span className="text-rose-300 font-bold">{cancelledCount} cancelled</span>}
            {cancelledCount > 0 && delayedCount > 0 && ' · '}
            {delayedCount > 0 && <span className="text-amber-300 font-bold">{delayedCount} delayed</span>}
            {(cancelledCount > 0 || delayedCount > 0) && ' runs across Huron-Perth'}
          </p>

          <div className="space-y-1">
            <div className="text-[9px] text-slate-500 font-bold">LISTOWEL / NORTH PERTH AREA</div>
            {near.length === 0 ? (
              <p className="text-[10px] text-emerald-400">No alerts for Listowel-area schools.</p>
            ) : (
              near.map((g) => <AlertRow key={g.key} g={g} />)
            )}
          </div>

          {others.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
                className="flex w-full items-center justify-between text-[9px] text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                <span>REST OF HURON-PERTH ({others.length})</span>
                {showOthers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showOthers && others.map((g) => <AlertRow key={g.key} g={g} />)}
            </div>
          )}
        </>
      )}

      {status && (
        <p className="text-[9px] text-slate-500">
          Updated {status.fetchedAt.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })}
          {failed && ' · refresh failed, showing last list'}
        </p>
      )}
    </div>
  );
};
