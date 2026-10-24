import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Flame,
  Wind,
  Droplets,
  DollarSign,
  TrendingUp,
  TrendingDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Thermometer,
  Activity,
} from 'lucide-react';
import {
  calculateSprayWindow,
  fetchLiveSoilTelemetry,
  fetchLiveCommodities,
  getBurnPermitStatus,
  SprayCondition,
  SoilTelemetry,
  CommodityFuture,
} from '../services/agri';
import { WeatherTelemetry } from '../services/types';

interface AgriFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherTelemetry | null;
}

export const AgriFuelModal: React.FC<AgriFuelModalProps> = ({ isOpen, onClose, weather }) => {
  const [activeTab, setActiveTab] = useState<'spray' | 'soil' | 'cbot'>('spray');
  const [soil, setSoil] = useState<SoilTelemetry | null>(null);
  const [commodities, setCommodities] = useState<CommodityFuture[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    Promise.allSettled([fetchLiveSoilTelemetry(), fetchLiveCommodities()]).then(([soilRes, commRes]) => {
      if (!mounted) return;
      if (soilRes.status === 'fulfilled' && soilRes.value) setSoil(soilRes.value);
      if (commRes.status === 'fulfilled' && commRes.value) setCommodities(commRes.value);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const temp = weather?.temperatureC ?? 16;
  const rh = weather?.humidityPercent ?? 54;
  const wind = weather?.windSpeedKmh ?? 14;

  const sprayInfo: SprayCondition = calculateSprayWindow(temp, rh, wind);
  const burnStatus = getBurnPermitStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono select-none">
      <div className="relative w-full max-w-xl rounded-lg bg-slate-950 border border-emerald-500/40 p-5 shadow-[0_0_35px_rgba(16,185,129,0.15)] text-slate-100 max-h-[85dvh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-tactical text-base font-bold text-white tracking-wider flex items-center gap-2">
              NORTH PERTH // LIVE AGRICULTURAL TELEMETRY
            </h2>
            <p className="text-[11px] text-slate-400">
              Delta-T Spraying • Open-Meteo Soil Moisture • CBOT Grain & Livestock
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 my-3">
          <button
            onClick={() => setActiveTab('spray')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'spray'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            DELTA-T SPRAY
          </button>
          <button
            onClick={() => setActiveTab('soil')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'soil'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            SOIL & MOISTURE
          </button>
          <button
            onClick={() => setActiveTab('cbot')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'cbot'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            CBOT / CME MARKETS
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
          {/* TAB 1: DELTA-T SPRAY WINDOW */}
          {activeTab === 'spray' && (
            <div className="space-y-3">
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded border ${
                  sprayInfo.status === 'OPTIMAL'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : sprayInfo.status === 'DRIFT_RISK' || sprayInfo.status === 'UNSUITABLE_EVAPORATION'
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span className="flex items-center gap-2">
                    {sprayInfo.status === 'OPTIMAL' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    DELTA-T: {sprayInfo.deltaTCelsius}°C
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 font-mono">
                    STATUS: {sprayInfo.status}
                  </span>
                </div>
                <p className="mt-2 text-slate-300 text-[11px] leading-relaxed">
                  {sprayInfo.recommendation}
                </p>
              </div>

              {/* Meter Bar */}
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0°C (Dew/Runoff)</span>
                  <span className="text-emerald-400 font-bold">2°C - 8°C (Ideal Window)</span>
                  <span>12°C (Evaporation)</span>
                </div>
                <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="w-[16%] bg-blue-500" title="Low / Runoff Risk"></div>
                  <div className="w-[50%] bg-emerald-500" title="Ideal Spray Window"></div>
                  <div className="w-[16%] bg-amber-500" title="Caution High"></div>
                  <div className="w-[18%] bg-rose-500" title="Extreme Evaporation"></div>
                </div>
              </div>

              {/* Agronomic Conditions Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">TEMPERATURE</div>
                  <div className="text-sm font-bold text-white mt-0.5">{temp}°C</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">HUMIDITY</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">{rh}%</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">WIND SPEED</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{wind} km/h</div>
                </div>
              </div>

              {/* Burn Permit Status */}
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-slate-200 text-xs">NORTH PERTH BURN STATUS</div>
                    <div className="text-[10px] text-slate-400">{burnStatus.message}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  {burnStatus.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SOIL & AGROMETEOROLOGY */}
          {activeTab === 'soil' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                <span>OPEN-METEO SOIL PHYSICS (NORTH PERTH)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE TELEMETRY
                </span>
              </div>

              {/* Soil Temperature by Depth */}
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                  Soil Temperature Profile (°C)
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Surface (0 cm)</span>
                    <div className="text-base font-bold text-white mt-0.5">{soil?.soilTemp0cm ?? '--'}°C</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Seedbed (6 cm)</span>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">{soil?.soilTemp6cm ?? '--'}°C</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Root Zone (18 cm)</span>
                    <div className="text-base font-bold text-slate-200 mt-0.5">{soil?.soilTemp18cm ?? '--'}°C</div>
                  </div>
                </div>
              </div>

              {/* Volumetric Soil Moisture by Depth */}
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  Volumetric Soil Water Content (%)
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Topsoil (0-1 cm)</span>
                    <div className="text-base font-bold text-white mt-0.5">{soil?.soilMoisture0to1cm ?? '--'}%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Shallow (1-3 cm)</span>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">{soil?.soilMoisture1to3cm ?? '--'}%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Subsurface (3-9 cm)</span>
                    <div className="text-base font-bold text-emerald-300 mt-0.5">{soil?.soilMoisture3to9cm ?? '--'}%</div>
                  </div>
                </div>
              </div>

              {/* Vapour Pressure Deficit & Evapotranspiration */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Vapour Pressure Deficit (VPD)</span>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">
                    {soil?.vpdKpa ?? '--'} <span className="text-[10px] font-normal text-slate-400">kPa</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Atmospheric drying demand</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Evapotranspiration (ET0)</span>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">
                    {soil?.et0Mm ?? '--'} <span className="text-[10px] font-normal text-slate-400">mm/hr</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">FAO-56 reference crop rate</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CBOT / CME AGRICULTURAL FUTURES */}
          {activeTab === 'cbot' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 pb-1 flex items-center justify-between border-b border-slate-800">
                <span>COMMODITY & ACTIVE CONTRACT</span>
                <span>CBOT SETTLEMENT RATE</span>
              </div>

              {loading && commodities.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Streaming live market data from Chicago Board of Trade...
                </div>
              ) : commodities.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Market session inactive or data feed reconnecting.
                </div>
              ) : (
                commodities.map((c) => (
                  <div
                    key={c.symbol}
                    className="p-2.5 rounded bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-100 text-xs">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.contract}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        ${c.price.toFixed(2)} <span className="text-white text-[10px]">{c.unit}</span>
                      </div>
                      <div
                        className={`text-[10px] flex items-center justify-end gap-0.5 font-mono ${
                          c.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {c.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span>
                          {c.changePercent >= 0 ? '+' : ''}
                          {c.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="text-[9px] text-slate-500 pt-2 border-t border-slate-800/80">
                • Ontario grain elevators (P&H Listowel, Hensall Co-op) peg daily cash purchase bids directly to CBOT futures plus regional basis.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
