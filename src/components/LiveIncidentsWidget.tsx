import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Construction, MapPin, RefreshCw, Car } from 'lucide-react';
import { LiveIncidentEvent } from '../services/types';

interface LiveIncidentsWidgetProps {
  incidents: LiveIncidentEvent[];
  onSelectIncident?: (incident: LiveIncidentEvent) => void;
  isLoading?: boolean;
}

export const LiveIncidentsWidget: React.FC<LiveIncidentsWidgetProps> = ({
  incidents,
  onSelectIncident,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'accidents' | 'closures'>('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === 'accidents') return inc.eventType === 'accident' || inc.eventType === 'hazard';
    if (filter === 'closures') return inc.isFullClosure || inc.eventType === 'closure';
    return true;
  });

  const accidentsCount = incidents.filter(
    (i) => i.eventType === 'accident' || i.eventType === 'hazard'
  ).length;
  const closuresCount = incidents.filter((i) => i.isFullClosure || i.eventType === 'closure').length;

  return (
    <div className="p-3 rounded bg-slate-950/90 border border-cyan-500/30 text-xs font-mono space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-rose-950/80 border border-rose-500/50 text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-tactical text-xs font-bold text-white tracking-wider">
                LIVE 511 INCIDENTS & CLOSURES
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-cyan-400 font-semibold">
              Official MTO & OPP Dispatch Telemetry
            </div>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
          {incidents.length} ACTIVE
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#00f2fe]'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          ALL ({incidents.length})
        </button>
        <button
          onClick={() => setFilter('accidents')}
          className={`flex-1 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
            filter === 'accidents'
              ? 'bg-rose-500 text-white shadow-[0_0_8px_#f43f5e]'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          HAZARDS ({accidentsCount})
        </button>
        <button
          onClick={() => setFilter('closures')}
          className={`flex-1 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
            filter === 'closures'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          CLOSURES ({closuresCount})
        </button>
      </div>

      {/* Incidents Scroll List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {filteredIncidents.length === 0 ? (
          <div className="p-3 text-center text-slate-400 bg-slate-900/40 rounded border border-slate-800">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Polling Ontario 511 Dispatch...</span>
              </div>
            ) : (
              <span>No active incidents matching current filter in sector.</span>
            )}
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isClosure = inc.isFullClosure || inc.eventType === 'closure';
            const isAccident = inc.eventType === 'accident' || inc.eventType === 'hazard';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident && onSelectIncident(inc)}
                className={`p-2 rounded border transition-all cursor-pointer hover:border-cyan-400 ${
                  isClosure
                    ? 'bg-rose-950/40 border-rose-500/40 hover:bg-rose-950/60'
                    : isAccident
                    ? 'bg-amber-950/40 border-amber-500/40 hover:bg-amber-950/60'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <div className="flex items-center gap-1.5">
                    {isClosure ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    ) : isAccident ? (
                      <Car className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <Construction className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    )}
                    <span className="text-white">{inc.road}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({inc.direction})
                    </span>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isClosure
                        ? 'bg-rose-900/80 text-rose-200 border border-rose-500/50'
                        : isAccident
                        ? 'bg-amber-900/80 text-amber-200 border border-amber-500/50'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isClosure ? 'FULL CLOSURE' : inc.eventType.toUpperCase()}
                  </span>
                </div>

                <div className="text-[10px] text-slate-300 leading-relaxed font-sans mb-1.5 line-clamp-3">
                  {inc.description}
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/80 pt-1">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {inc.distanceKmToListowel} km from Listowel
                  </span>
                  <span>{inc.lanesAffected}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-cyan-500/10">
        <span>Source: Ontario 511 Emergency Transport Network</span>
        <span>Radius: 75km Perth / Huron</span>
      </div>
    </div>
  );
};
