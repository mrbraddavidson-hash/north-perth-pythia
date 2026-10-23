import React, { useState, useEffect } from 'react';
import {
  Compass,
  Radio,
  Clock,
  Wind,
  Gauge,
  Crosshair,
  Maximize2,
  RefreshCw,
  Activity,
  Layers,
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
      setTimeUtc(
        now.toISOString().substring(11, 19) + ' UTC'
      );
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
    <header className="relative z-20 flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/90 border-b border-cyan-500/25 backdrop-blur-md">
      {/* Title & Coordinates */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded bg-cyan-950/60 border border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]">
          <Crosshair className="w-5 h-5 animate-spin" style={{ animationDuration: '30s' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-tactical text-base md:text-lg font-bold tracking-wider text-slate-100 flex items-center gap-2">
              <span className="text-cyan-400">NORTH PERTH</span> // SITREP ORACLE
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE DISPATCH
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300/80">
              <Compass className="w-3 h-3 text-cyan-400" />
              43°43'54"N, 80°57'09"W
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">
              SECTOR: LISTOWEL / ATWOOD / MONKTON
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Ribbons */}
      <div className="flex items-center gap-2 md:gap-4 mt-2 sm:mt-0 font-mono text-xs">
        {weather && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
            <div className="flex items-center gap-1 text-cyan-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{weather.temperatureC}°C</span>
              <span className="text-[10px] text-slate-500">({weather.conditionLabel})</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Wind className="w-3.5 h-3.5 text-slate-500" />
              <span>{weather.windSpeedKmh} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-slate-500" />
              <span>{weather.barometricPressureHpa} hPa</span>
            </div>
          </div>
        )}

        {/* Clocks */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/30 text-slate-200">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-semibold">{timeLocal}</span>
          <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">({timeUtc})</span>
        </div>

        {/* 511 API Key Button */}
        <button
          onClick={onOpenKeyModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs transition-colors cursor-pointer ${
            hasApiKey
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/80'
          }`}
          title="Configure Ontario 511 Live CCTV API Key"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">511 CCTV:</span>
          <span className="font-bold">{hasApiKey ? 'LIVE' : 'KEY REQUIRED'}</span>
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRecenter}
            title="Recenter Map on Listowel"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={onRefresh}
            title="Refresh All Real-time Streams"
            className={`p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Tactical Fullscreen HUD"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
