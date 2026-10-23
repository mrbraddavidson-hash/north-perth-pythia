import React, { useState } from 'react';
import {
  Sprout,
  Fuel,
  Flame,
  Wind,
  Droplets,
  DollarSign,
  TrendingUp,
  TrendingDown,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateSprayWindow,
  getLocalGrainBids,
  getListowelFuelPrices,
  getBurnPermitStatus,
  GrainBid,
  FuelPrice,
  SprayCondition,
} from '../services/agri';
import { WeatherTelemetry } from '../services/types';

interface AgriFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherTelemetry | null;
}

export const AgriFuelModal: React.FC<AgriFuelModalProps> = ({ isOpen, onClose, weather }) => {
  const [activeTab, setActiveTab] = useState<'spray' | 'grain' | 'fuel'>('spray');

  if (!isOpen) return null;

  const temp = weather?.temperatureC ?? 16;
  const rh = weather?.humidityPercent ?? 54;
  const wind = weather?.windSpeedKmh ?? 14;

  const sprayInfo: SprayCondition = calculateSprayWindow(temp, rh, wind);
  const grainBids: GrainBid[] = getLocalGrainBids();
  const fuelPrices: FuelPrice[] = getListowelFuelPrices();
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
              NORTH PERTH // AGRI & ECONOMIC INTEL
            </h2>
            <p className="text-[11px] text-slate-400">
              Spray Windows • P&H Grain Bids • Wallace Ave Fuel • Burn Permits
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
            DELTA-T SPRAY WINDOW
          </button>
          <button
            onClick={() => setActiveTab('grain')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'grain'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            GRAIN BIDS (LISTOWEL)
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'fuel'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            LOCAL FUEL
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

          {/* TAB 2: GRAIN COMMODITY BIDS */}
          {activeTab === 'grain' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 pb-1 flex items-center justify-between">
                <span>COMMODITY & ELEVATOR</span>
                <span>CASH BID ($/TONNE & $/BU)</span>
              </div>
              {grainBids.map((bid, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100 text-xs">{bid.commodity}</div>
                    <div className="text-[10px] text-slate-400">{bid.elevator}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">
                      ${bid.pricePerTonne.toFixed(2)} / t{' '}
                      <span className="text-white">(${bid.pricePerBushel.toFixed(2)}/bu)</span>
                    </div>
                    <div
                      className={`text-[10px] flex items-center justify-end gap-0.5 ${
                        bid.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {bid.change24h >= 0 ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span>
                        {bid.change24h >= 0 ? '+' : ''}
                        {bid.change24h}% 24h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: LISTOWEL FUEL PRICES */}
          {activeTab === 'fuel' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 pb-1 flex items-center justify-between">
                <span>STATION (WALLACE AVE / LINE 86)</span>
                <span>REGULAR / DIESEL</span>
              </div>
              {fuelPrices.map((station, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100 text-xs">{station.station}</div>
                    <div className="text-[10px] text-slate-500">Updated: {station.lastUpdated}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-300">
                      REG: <span className="text-white">{station.regular}¢</span> / L
                    </div>
                    <div className="text-[11px] text-slate-300">
                      DIESEL: <span className="text-amber-400 font-semibold">{station.diesel}¢</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
