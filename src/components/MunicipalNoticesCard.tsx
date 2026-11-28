import React from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { fetchMunicipalNotices, NORTH_PERTH_NEWS_URL } from '../services/api';
import { usePolled } from '../hooks/usePolled';

const REFRESH_MS = 30 * 60 * 1000;

const LABEL: Record<string, string> = { WATER: 'WATER', ROAD: 'ROAD', CONSTRUCTION: 'WORKS', PUBLIC_WORKS: 'NOTICE' };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'America/Toronto' });

// Recent North Perth notices about roads, water service and construction, from the municipality's news feed.
export const MunicipalNoticesCard: React.FC = () => {
  const { data, failed } = usePolled(fetchMunicipalNotices, REFRESH_MS);

  return (
    <div className="p-3 rounded bg-slate-900/90 border border-slate-700 shadow-sm space-y-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">NORTH PERTH // ROADS & WATER</span>
        </div>
        <a
          href={NORTH_PERTH_NEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-cyan-300"
          title="All North Perth news and notices"
        >
          ALL NEWS <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {!data ? (
        <p className="text-[10px] text-slate-400">{failed ? 'North Perth notices unavailable right now.' : 'Loading North Perth notices…'}</p>
      ) : data.notices.length === 0 ? (
        <p className="text-[10px] text-slate-400">No road, water or construction notices posted in the last {data.windowDays} days.</p>
      ) : (
        <div className="space-y-1">
          {data.notices.map((n) => (
            <a
              key={n.link}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1.5 rounded border border-slate-800 bg-black/30 hover:border-cyan-500/50 text-[10px]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-white font-bold leading-snug">{n.title}</span>
                <span className="shrink-0 text-[9px] text-slate-500">{formatDate(n.date)}</span>
              </div>
              <span className="text-[9px] text-cyan-400">{LABEL[n.category] ?? n.category}</span>
              {n.summary && <span className="text-slate-400"> · {n.summary}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
