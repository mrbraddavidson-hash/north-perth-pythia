import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  Wind,
  Gauge,
  Crosshair,
  Maximize2,
  RefreshCw,
  Activity,
  Key,
} from 'lucide-react';
import { WeatherTelemetry } from '../services/types';

interface HeaderHUDProps {
  weather: WeatherTelemetry | null;
  onRecenter: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeLayersCount: number;
  hasApiKey: boolean;
  onOpenKeyModal: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  weather,
  onRecenter,
  onRefresh,
  isRefreshing,
  activeLayersCount,
  hasApiKey,
  onOpenKeyModal,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().substring(11, 19) + ' UTC');
      setTimeLocal(
        now.toLocaleTimeString('en-US', {
          timeZone: 'America/Toronto',
          hour12: false,
        }) + ' EDT'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="relative z-20 flex items-center justify-between px-3 md:px-4 py-2 bg-slate-950/95 border-b border-cyan-500/25 backdrop-blur-md h-12 md:h-14 flex-shrink-0 select-none">
      {/* Title & Coordinates */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)] flex-shrink-0">
          <Crosshair className="w-4 h-4 md:w-5 md:h-5 animate-spin" style={{ animationDuration: '30s' }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <h1 className="font-tactical text-xs sm:text-sm md:text-base font-bold tracking-wider text-slate-100 truncate">
              <span className="text-cyan-400">NORTH PERTH</span>
              <span className="hidden sm:inline"> // SITREP</span>
            </h1>
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono tracking-widest bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300/80">
              <Compass className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              43°43'N, 80°57'W
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400 truncate">
              SECTOR: LISTOWEL / ATWOOD / MONKTON
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-1.5 md:gap-3 font-mono text-xs flex-shrink-0">
        {/* Weather on Desktop & Mobile */}
        {weather && (
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px]">
            <span className="text-cyan-300 font-bold">{weather.temperatureC}°C</span>
            <div className="hidden xl:flex items-center gap-2 text-slate-400 border-l border-slate-800 pl-2">
              <span className="text-[10px] text-slate-500">{weather.conditionLabel}</span>
              <span className="flex items-center gap-0.5"><Wind className="w-3 h-3 text-slate-500" />{weather.windSpeedKmh}km/h</span>
              <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3 text-slate-500" />{weather.barometricPressureHpa}hPa</span>
            </div>
          </div>
        )}

        {/* Local Clock (Hidden on very small screens) */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/90 border border-cyan-500/30 text-slate-200 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-semibold">{timeLocal}</span>
        </div>

        {/* 511 API Key Indicator Button */}
        <button
          onClick={onOpenKeyModal}
          className={`flex items-center gap-1 px-2 py-1 rounded border font-mono text-[10px] md:text-xs transition-colors cursor-pointer min-h-[32px] ${
            hasApiKey
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/80'
          }`}
          title="Ontario 511 Live CCTV Stream Key"
        >
          <Key className="w-3 h-3" />
          <span className="hidden sm:inline">511:</span>
          <span className="font-bold">{hasApiKey ? 'LIVE' : 'KEY'}</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRecenter}
            title="Recenter Map on Listowel"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <Crosshair className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={onRefresh}
            title="Refresh Real-time Telemetry"
            className={`p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Tactical Fullscreen HUD"
            className="hidden sm:flex p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors min-h-[32px] min-w-[32px] items-center justify-center"
          >
            <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
