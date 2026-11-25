import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Droplets } from 'lucide-react';
import { fetchDroughtMapDate } from '../services/agri';

// Official AAFC Canadian Drought Monitor legend colours (from the ImageServer legend).
const DROUGHT_CLASSES = [
  { code: 'D0', label: 'Abnormally dry', color: '#ffff00' },
  { code: 'D1', label: 'Moderate drought', color: '#ffd37f' },
  { code: 'D2', label: 'Severe drought', color: '#e69800' },
  { code: 'D3', label: 'Extreme drought', color: '#e60000' },
  { code: 'D4', label: 'Exceptional drought', color: '#730000' },
] as const;

export const DroughtLegend: React.FC = () => {
  const [mapDate, setMapDate] = useState<Date | null>(null);
  // Open on tablets/desktop; start collapsed on phones where map space is tight
  const [isOpen, setIsOpen] = useState<boolean>(() => typeof window === 'undefined' || window.innerWidth >= 640);

  useEffect(() => {
    let cancelled = false;
    fetchDroughtMapDate().then((d) => {
      if (!cancelled) setMapDate(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const asOf = mapDate
    ? mapDate.toLocaleDateString('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    : 'latest month';

  return (
    <div className="pointer-events-auto w-52 rounded-lg bg-slate-950/90 border border-yellow-500/40 font-mono text-[10px] text-slate-300 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 px-2 py-1.5 cursor-pointer"
        title="Canadian Drought Monitor legend"
      >
        <span className="flex items-center gap-1.5 font-bold text-yellow-300">
          <Droplets className="w-3 h-3 text-yellow-400" />
          DROUGHT · {asOf}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-2 pb-2 space-y-1">
          {DROUGHT_CLASSES.map((c) => (
            <div key={c.code} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm border border-black/40 flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-white font-bold w-5">{c.code}</span>
              <span>{c.label}</span>
            </div>
          ))}
          <div className="pt-1 mt-1 border-t border-slate-800 text-slate-500 leading-snug">
            Monthly map by Agriculture and Agri-Food Canada. Shown as a light tint; no colour = no drought.
          </div>
        </div>
      )}
    </div>
  );
};
