import React from 'react';
import { ExternalLink, Waves } from 'lucide-react';
import { fetchMvcaNotice, MVCA_FLOOD_NOTICES_URL } from '../services/api';
import { usePolled } from '../hooks/usePolled';

const REFRESH_MS = 30 * 60 * 1000;

const LEVEL = {
  FLOOD_WARNING: { text: 'FLOOD WARNING', cls: 'bg-rose-950 text-rose-300 border-rose-500/60' },
  FLOOD_WATCH: { text: 'FLOOD WATCH', cls: 'bg-amber-950 text-amber-300 border-amber-500/60' },
  CONDITIONS_STATEMENT: { text: 'CONDITIONS STATEMENT', cls: 'bg-sky-950 text-sky-300 border-sky-500/50' },
  NOTICE: { text: 'NOTICE', cls: 'bg-sky-950 text-sky-300 border-sky-500/50' },
} as const;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Toronto' });

// Header and message for the MVCA card: MVCA's own latest flood message, never one inferred from gauges.
export const MvcaNoticeBlock: React.FC = () => {
  const { data, failed } = usePolled(fetchMvcaNotice, REFRESH_MS);
  const notice = data?.notice ?? null;
  const active = data?.current && notice ? LEVEL[notice.level] : null;

  const badge = !data
    ? { text: failed ? 'UNKNOWN' : 'CHECKING…', cls: 'bg-slate-800 text-slate-300 border-slate-600' }
    : active ?? { text: 'NO MESSAGE IN EFFECT', cls: 'bg-emerald-950 text-emerald-400 border-emerald-500/40' };

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>MAITLAND VALLEY (MVCA)</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="space-y-1">
        {!data ? (
          <p className="text-[10px] text-slate-400">
            {failed ? "Couldn't reach MVCA's flood notices. Check mvca.on.ca." : 'Checking MVCA flood messages…'}
          </p>
        ) : active && notice ? (
          <>
            <div className="text-[11px] font-semibold text-cyan-300">{notice.title}</div>
            <p className="text-[10px] text-slate-300 leading-relaxed">{notice.summary}</p>
            <p className="text-[9px] text-slate-500">
              Issued {formatDate(notice.date)}
              {notice.expires && ` · in effect until ${formatDate(new Date(Date.parse(notice.expires) - 86400_000).toISOString())}`}
            </p>
          </>
        ) : (
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Maitland Conservation has no flood message in effect.
            {notice && ` Last: "${notice.title}" (${formatDate(notice.date)}).`}
          </p>
        )}
        <a
          href={notice?.link && active ? notice.link : MVCA_FLOOD_NOTICES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[9px] text-cyan-400 hover:text-cyan-300"
        >
          {active ? 'Full message' : 'MVCA flood notices'} <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </>
  );
};
