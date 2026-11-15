import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Clock,
  Wind,
  Gauge,
  Crosshair,
  Maximize2,
  Minimize2,
  RefreshCw,
  Activity,
  Key,
  Tv,
  AlertTriangle,
  Eye,
  CloudSun,
  Layers,
  Map as MapIcon,
  Orbit,
  Sprout,
  Wheat,
} from 'lucide-react';
import { WeatherTelemetry, OpticMode } from '../services/types';
import { calculateSprayWindow, SprayCondition } from '../services/agri';

export type RightPanelTab = 'agri' | 'markets' | 'weather' | 'hubs';

interface HeaderHUDProps {
  weather: WeatherTelemetry | null;
  onRecenter: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeLayersCount: number;
  criticalAlert?: string | null;
  opticMode?: OpticMode;
  onChangeOpticMode?: (mode: OpticMode) => void;
  isLeftPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: (tab?: RightPanelTab) => void;
  rightPanelTab?: RightPanelTab;
  onCollapseAllPanels?: () => void;
  viewDimension?: '2d' | '3d';
  onToggleViewDimension?: (dim: '2d' | '3d') => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  weather,
  onRecenter,
  onRefresh,
  isRefreshing,
  activeLayersCount,
  criticalAlert,
  opticMode = 'normal',
  onChangeOpticMode,
  isLeftPanelOpen = false,
  onToggleLeftPanel,
  isRightPanelOpen = false,
  onToggleRightPanel,
  rightPanelTab = 'weather',
  onCollapseAllPanels,
  viewDimension = '2d',
  onToggleViewDimension,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');
  const [isKiosk, setIsKiosk] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  const spray: SprayCondition | null = weather
    ? calculateSprayWindow(weather.temperatureC, weather.humidityPercent, weather.windSpeedKmh)
    : null;

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

  // Screen Wake Lock API for Wall Mount / Kiosk Mode
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFs = !!document.fullscreenElement;
      setIsKiosk(isFs);
      if (isFs) {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          }
        } catch (e) {
          console.warn('Wake Lock request failed:', e);
        }
      } else {
        if (wakeLockRef.current) {
          try {
            await wakeLockRef.current.release();
          } catch {}
          wakeLockRef.current = null;
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
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
              <span className="text-emerald-400">NORTH PERTH</span>
              <span className="hidden sm:inline text-slate-300"> // AGRI-OPERATIONS</span>
            </h1>
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono tracking-widest bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE
            </span>
            {isKiosk && (
              <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_#00f2fe]">
                <Tv className="w-2.5 h-2.5 text-cyan-400" />
                KIOSK (WAKELOCK)
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-300/80">
              <Compass className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              43°43'N, 80°57'W
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400 truncate">
              LISTOWEL / ATWOOD / MONKTON / WALLACE
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alert Bar in Center if active */}
      {criticalAlert && (
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/70 text-rose-300 text-[11px] font-mono shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-bold tracking-wider">{criticalAlert}</span>
        </div>
      )}

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-1.5 md:gap-3 font-mono text-xs flex-shrink-0">
        {/* Prominent Delta-T Spraying Window Badge */}
        {spray && (
          <button
            onClick={() => onToggleRightPanel?.('agri')}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded border text-[11px] font-mono cursor-pointer transition-all active:scale-95 ${
              spray.status === 'OPTIMAL'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : spray.status === 'DRIFT_RISK' || spray.status === 'INVERSION_RISK'
                ? 'bg-rose-950/90 border-rose-500/70 text-rose-300 animate-pulse'
                : 'bg-amber-950/90 border-amber-500/60 text-amber-300'
            }`}
            title={`Delta-T: ${spray.deltaTCelsius}°C. Click to open full Agri Intel.`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold hidden sm:inline">SPRAY:</span>
            <span className="font-bold">{spray.status.replace('_', ' ')}</span>
            <span className="hidden md:inline text-[10px] text-slate-300 border-l border-emerald-500/30 pl-1.5 font-medium">
              {spray.deltaTCelsius}°C ΔT
            </span>
          </button>
        )}

        {/* Weather on Desktop & Mobile */}
        {weather && (
          <button
            onClick={() => {
              if (isRightPanelOpen && rightPanelTab === 'weather') {
                onToggleRightPanel?.();
              } else {
                onToggleRightPanel?.('weather');
              }
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-all active:scale-95 ${
              isRightPanelOpen && rightPanelTab === 'weather'
                ? 'bg-cyan-950 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-cyan-500/50 text-slate-300'
            }`}
            title="Toggle Live North Perth Weather & 3-Day Forecast Panel"
          >
            <CloudSun className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
            <span className="text-cyan-300 font-bold">{weather.temperatureC}°C</span>
            <span className="text-[10px] text-slate-300 hidden xl:inline border-l border-slate-800 pl-1.5 font-medium">
              {weather.conditionLabel}
            </span>
            <div className="hidden 2xl:flex items-center gap-2 text-slate-400 border-l border-slate-800 pl-2">
              <span className="flex items-center gap-0.5">
                <Wind className="w-3 h-3 text-slate-500" />
                {weather.windSpeedKmh}km/h
              </span>
              <span className="flex items-center gap-0.5">
                <Gauge className="w-3 h-3 text-slate-500" />
                {weather.barometricPressureHpa}hPa
              </span>
            </div>
          </button>
        )}

        {/* Desktop Interface Layout Toggles (Layers, Agri, Grain Bids, Full Map) */}
        <div className="hidden lg:flex items-center gap-1 bg-black/60 p-0.5 rounded border border-slate-800 text-[10px]">
          <button
            onClick={onToggleLeftPanel}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors font-semibold cursor-pointer ${
              isLeftPanelOpen
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title={isLeftPanelOpen ? 'Hide Layers Sidebar' : 'Show Layers Sidebar'}
          >
            <Layers className="w-3 h-3" />
            <span>LAYERS</span>
          </button>

          <button
            onClick={() => onToggleRightPanel?.('agri')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors font-semibold cursor-pointer ${
              isRightPanelOpen && rightPanelTab === 'agri'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Open Agri & Soil Intel"
          >
            <Sprout className="w-3 h-3 text-emerald-400" />
            <span>AGRI</span>
          </button>

          <button
            onClick={() => onToggleRightPanel?.('markets')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors font-semibold cursor-pointer ${
              isRightPanelOpen && rightPanelTab === 'markets'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Open Grain Elevator Bids & Futures"
          >
            <Wheat className="w-3 h-3 text-amber-400" />
            <span>GRAIN BIDS</span>
          </button>

          {(isLeftPanelOpen || isRightPanelOpen) && onCollapseAllPanels && (
            <button
              onClick={onCollapseAllPanels}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors font-bold cursor-pointer"
              title="Collapse all side panels for 100% full map view"
            >
              <MapIcon className="w-3 h-3" />
              <span>FULL MAP</span>
            </button>
          )}
        </div>

        {/* 2D / 3D God's Eye Globe Viewport Toggle */}
        {onToggleViewDimension && (
          <div className="flex items-center bg-black/80 rounded border border-cyan-500/50 p-0.5 text-[10px] font-mono shadow-[0_0_12px_rgba(0,242,254,0.25)]">
            <button
              onClick={() => onToggleViewDimension('2d')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                viewDimension === '2d'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f2fe]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Standard 2D Tactical Leaflet Map"
            >
              2D
            </button>
            <button
              onClick={() => onToggleViewDimension('3d')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                viewDimension === '3d'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f2fe]'
                  : 'text-cyan-300 hover:text-white hover:bg-slate-900'
              }`}
              title="Switch to 3D God's Eye Globe & Terrain View"
            >
              <Orbit className="w-3 h-3 text-cyan-400" />
              <span>3D GLOBE</span>
            </button>
          </div>
        )}

        {/* God's Eye Sensor Shader Optics (bilawalsidhu/gods-eye-view) */}
        {onChangeOpticMode && (
          <div className="hidden sm:flex items-center bg-black/70 rounded border border-cyan-500/40 p-0.5 text-[10px] font-mono shadow-[0_0_12px_rgba(0,242,254,0.1)]">
            <span className="text-[9px] text-slate-400 px-1.5 uppercase tracking-wider flex items-center gap-1 font-bold">
              <Eye className="w-3 h-3 text-cyan-400" />
              OPTIC:
            </span>
            <button
              onClick={() => onChangeOpticMode('normal')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                opticMode === 'normal'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f2fe]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Standard High-Clarity Optical"
            >
              STD
            </button>
            <button
              onClick={() => onChangeOpticMode('flir')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                opticMode === 'flir'
                  ? 'bg-rose-500 text-black shadow-[0_0_8px_#f43f5e]'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
              title="FLIR Thermal (White Hot Infrared Simulation)"
            >
              FLIR
            </button>
            <button
              onClick={() => onChangeOpticMode('nvg')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                opticMode === 'nvg'
                  ? 'bg-emerald-400 text-black shadow-[0_0_8px_#34d399]'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="Night Vision Goggles (Green Phosphor Matrix)"
            >
              NVG
            </button>
            <button
              onClick={() => onChangeOpticMode('crt')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                opticMode === 'crt'
                  ? 'bg-cyan-400 text-black shadow-[0_0_8px_#22d3ee]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="CRT Surveillance Monitor (Raster Scanline Recon)"
            >
              CRT
            </button>
          </div>
        )}

        {/* Local Clock (Hidden on very small screens) */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/90 border border-cyan-500/30 text-slate-200 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-semibold">{timeLocal}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRecenter}
            title="Recenter Map on Listowel"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={onRefresh}
            title="Refresh Real-time Telemetry"
            className={`p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isKiosk ? 'Exit Fullscreen Kiosk' : 'Enter Tactical Kiosk Mode (Screen WakeLock Active)'}
            className={`hidden sm:flex p-1.5 rounded transition-colors min-h-[32px] min-w-[32px] items-center justify-center cursor-pointer ${
              isKiosk
                ? 'bg-cyan-500 text-slate-950 border border-cyan-400 shadow-[0_0_12px_#00f2fe]'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            {isKiosk ? (
              <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
