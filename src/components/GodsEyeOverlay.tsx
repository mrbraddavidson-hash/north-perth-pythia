import React, { useState, useEffect } from 'react';
import {
  calculateGsd,
  calculateNiirs,
  calculateMgrs,
  toDms,
} from '../services/godseye';
import {
  Crosshair,
  Shield,
  Eye,
  Radio,
  Maximize2,
  Minimize2,
  AlertOctagon,
  Radar,
  Compass,
} from 'lucide-react';

interface GodsEyeOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  centerLat: number;
  centerLon: number;
  zoom: number;
  milFlightCount: number;
  nearestBaseName?: string;
  nearestBaseDistanceKm?: number;
  targetName?: string;
  onLockListowel?: () => void;
}

export const GodsEyeOverlay: React.FC<GodsEyeOverlayProps> = ({
  isActive,
  onToggle,
  centerLat,
  centerLon,
  zoom,
  milFlightCount,
  nearestBaseName = 'Stratford Garrison (31 CBG)',
  nearestBaseDistanceKm = 40,
  targetName = 'NORTH PERTH CO-ORDINATION ZONE',
  onLockListowel,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  const gsd = calculateGsd(zoom, centerLat);
  const niirs = calculateNiirs(gsd);
  const mgrs = calculateMgrs(centerLat, centerLon);
  const dms = toDms(centerLat, centerLon);

  const formatRecTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${s}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[1000] overflow-hidden select-none font-mono">
      {/* 1. Tactical CRT Scanlines / Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,10,20,0.7)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,180,0.02)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      {/* 2. Top Classification Banner (Standard NRO/NGA bilawalsidhu/gods-eye-view Header) */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-red-950/80 border-b border-red-500/60 backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] md:text-xs font-black tracking-widest text-red-300">
            TOP SECRET // SI-TK // CANUKUS EYES ONLY
          </span>
          <span className="hidden sm:inline text-[9px] text-red-400/80 font-mono">
            [GEOINT TACTICAL FEEDS ACTIVE]
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-amber-300">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="font-bold">LIVE DOWNLINK</span>
            <span className="text-red-400 font-bold ml-1">● REC [{formatRecTime(elapsedSeconds)}]</span>
          </div>
          <button
            onClick={onToggle}
            className="px-2 py-0.5 text-[10px] font-bold text-red-200 bg-red-900/60 hover:bg-red-800 border border-red-500/50 rounded cursor-pointer transition-colors"
          >
            DISENGAGE
          </button>
        </div>
      </div>

      {/* 3. Corner Brackets (bilawalsidhu/gods-eye-view Optical Framing) */}
      <div className="absolute top-8 left-3 text-cyan-400/70 text-2xl font-light leading-none">
        ┌ <span className="text-[10px] font-mono tracking-wider ml-1 text-cyan-300 font-bold">OP: GODS-EYE-17T</span>
      </div>
      <div className="absolute top-8 right-3 text-cyan-400/70 text-2xl font-light leading-none text-right">
        <span className="text-[10px] font-mono tracking-wider mr-1 text-cyan-300 font-bold">MIL-SURV MESH</span> ┐
      </div>
      <div className="absolute bottom-10 left-3 text-cyan-400/70 text-2xl font-light leading-none">
        └ <span className="text-[10px] font-mono tracking-wider ml-1 text-cyan-300 font-bold">SW ONTARIO SECTOR</span>
      </div>
      <div className="absolute bottom-10 right-3 text-cyan-400/70 text-2xl font-light leading-none text-right">
        <span className="text-[10px] font-mono tracking-wider mr-1 text-cyan-300 font-bold">DND/CAF REGIONAL</span> ┘
      </div>

      {/* 4. Center Crosshairs and Sonar Sweep Ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Pulsing Sonar Sweep Ring */}
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border border-cyan-400/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full border border-dashed border-cyan-400/30" />
        <div className="absolute w-24 h-24 rounded-full border border-cyan-400/40" />

        {/* Tactical Crosshair Marks */}
        <div className="absolute w-12 h-px bg-cyan-400/80 -translate-x-10" />
        <div className="absolute w-12 h-px bg-cyan-400/80 translate-x-10" />
        <div className="absolute h-12 w-px bg-cyan-400/80 -translate-y-10" />
        <div className="absolute h-12 w-px bg-cyan-400/80 translate-y-10" />

        {/* Center reticle dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
      </div>

      {/* 5. Left Tactical Telemetry HUD Card */}
      <div className="absolute top-16 left-4 max-w-[260px] bg-slate-950/85 border border-cyan-500/40 rounded p-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)] pointer-events-auto">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold tracking-wider">
            <Eye className="w-3.5 h-3.5" />
            <span>GEOINT METRICS</span>
          </div>
          <span className="text-[9px] px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded">
            OPTIC: REAL
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div>
            <div className="text-[9px] text-slate-400 uppercase">MGRS Grid (Zone 17T)</div>
            <div className="font-mono font-bold text-amber-300 tracking-wider text-xs">{mgrs}</div>
          </div>

          <div>
            <div className="text-[9px] text-slate-400 uppercase">Target Coordinates (DMS)</div>
            <div className="font-mono text-cyan-300 text-[10px]">{dms}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            <div>
              <div className="text-[9px] text-slate-400 uppercase">Ground Res (GSD)</div>
              <div className="font-mono font-bold text-emerald-400 text-xs">{gsd} m/px</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase">NIIRS Rating</div>
              <div className="font-mono font-bold text-emerald-400 text-xs">
                {niirs.toFixed(1)} / 9.0
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800">
            <div className="text-[9px] text-slate-400 uppercase">Map Zoom Level</div>
            <div className="font-mono text-slate-200">ZOOM {zoom.toFixed(1)}x</div>
          </div>

          {onLockListowel && (
            <button
              onClick={onLockListowel}
              className="w-full mt-1.5 py-1 px-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 rounded text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-[0_0_8px_rgba(0,242,254,0.2)]"
            >
              <Crosshair className="w-3 h-3 text-cyan-400" />
              LOCK ON LISTOWEL CORE
            </button>
          )}
        </div>
      </div>

      {/* 6. Right Defense & Military Surveillance HUD Card */}
      <div className="absolute top-16 right-4 max-w-[270px] bg-slate-950/85 border border-amber-500/40 rounded p-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)] pointer-events-auto">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-1 mb-2">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>MIL RECON FEED</span>
          </div>
          <span className="text-[9px] px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/30 rounded animate-pulse">
            ADSB.LOL/MIL
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-400 uppercase">Active Mil Flights:</span>
            <span className="font-bold text-amber-300 font-mono">{milFlightCount} DETECTED</span>
          </div>

          <div>
            <div className="text-[9px] text-slate-400 uppercase">Nearest Defense Post:</div>
            <div className="font-mono text-amber-200 text-[10px] font-semibold">{nearestBaseName}</div>
            <div className="text-[9px] text-slate-400 font-mono">
              Distance: <span className="text-cyan-300">{nearestBaseDistanceKm} km</span> from Listowel
            </div>
          </div>

          <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 font-mono mt-1">
            <div className="text-cyan-400 font-bold mb-0.5">AIR DEFENCE SECTOR:</div>
            <div>NORAD Sector 17 / 1 Cdn Air Div</div>
            <div className="text-[9px] text-slate-400">CFB Borden / Meaford Live Range</div>
          </div>
        </div>
      </div>

      {/* 7. Bottom Central Tactical Reticle readout */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1 bg-slate-950/80 border border-cyan-500/30 rounded backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-1 text-[10px] text-cyan-300">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>LISTOWEL SECTOR: 43.73° N, 80.95° W</span>
        </div>
        <div className="h-3 w-px bg-cyan-500/30" />
        <div className="text-[10px] text-amber-300 font-bold tracking-wider">
          GOD'S EYE v2.0 ACTIVE
        </div>
      </div>
    </div>
  );
};
