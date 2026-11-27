import React, { useEffect, useState } from 'react';
import { Flame, ExternalLink } from 'lucide-react';
import {
  BurnBanStatus,
  fetchBurnBanStatus,
  NORTH_PERTH_BURN_PERMITS_URL,
  NORTH_PERTH_FIRE_PHONE,
} from '../services/agri';

const REFRESH_MS = 30 * 60 * 1000;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Toronto' });

// Open-air fire ban status from North Perth's posted notices. Never claims burning is allowed on its own:
// a permit (rural properties, 24 h notice) is always required, and the fire department has the final word.
export const BurnStatusCard: React.FC<{ variant?: 'row' | 'card' }> = ({ variant = 'row' }) => {
  const [status, setStatus] = useState<BurnBanStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const s = await fetchBurnBanStatus();
      if (cancelled) return;
      if (s) {
        setStatus(s);
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

  const ban = status?.status === 'BAN';
  const badge = !status
    ? { text: failed ? 'UNKNOWN' : 'CHECKING…', cls: 'text-slate-300 bg-slate-800 border-slate-600' }
    : ban
      ? { text: 'FIRE BAN', cls: 'text-rose-300 bg-rose-950/80 border-rose-500/60' }
      : { text: 'NO BAN POSTED', cls: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' };

  const detail = !status
    ? failed
      ? `Couldn't check North Perth's notices. Call the fire department (${NORTH_PERTH_FIRE_PHONE}) before burning.`
      : 'Checking North Perth fire ban notices…'
    : ban
      ? `Open-air fire ban in effect since ${formatDate(status.notice!.date)}. No burning, even with a permit.`
      : `${status.notice ? `Last ban lifted ${formatDate(status.notice.date)}. ` : ''}Rural burns over 3 m still need a North Perth permit (24 h notice).`;

  const links = (
    <span className="inline-flex flex-wrap gap-x-2">
      {status?.notice && (
        <a href={status.notice.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300">
          Notice <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
      <a href={NORTH_PERTH_BURN_PERMITS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300">
        Permits <ExternalLink className="w-2.5 h-2.5" />
      </a>
    </span>
  );

  if (variant === 'card') {
    return (
      <div className={`p-4 rounded border ${ban ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800 bg-slate-900/40'}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-2 text-xs font-tactical font-bold tracking-wider text-slate-300">
            <Flame className="w-4 h-4 text-amber-400" />
            NORTH PERTH // OPEN AIR FIRE BAN STATUS
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.cls}`}>{badge.text}</span>
        </div>
        <p className="text-xs text-slate-400 mb-2">{detail}</p>
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
          <span>Fire Dept: {NORTH_PERTH_FIRE_PHONE}</span>
          {links}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2.5 rounded border text-[10px] space-y-1 ${ban ? 'bg-rose-950/30 border-rose-500/60' : 'bg-slate-900/90 border-slate-800'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-slate-200">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          Open-Air Fire Ban (North Perth):
        </span>
        <span className={`font-bold px-2 py-0.5 rounded border ${badge.cls}`}>{badge.text}</span>
      </div>
      <p className="text-slate-400 leading-snug">
        {detail} {links}
      </p>
    </div>
  );
};
