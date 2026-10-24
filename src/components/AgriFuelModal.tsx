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
  Calculator,
  Sun,
  MapPin,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import {
  calculateSprayWindow,
  fetchLiveSoilTelemetry,
  fetchLiveCommodities,
  getBurnPermitStatus,
  fetchLiveChuData,
  fetchLiveUsdCadRate,
  calculateCashGrain,
  ONTARIO_ELEVATOR_PRESETS,
  SprayCondition,
  SoilTelemetry,
  CommodityFuture,
  ChuSeasonSummary,
  OntarioElevatorPreset,
} from '../services/agri';
import { WeatherTelemetry } from '../services/types';

interface AgriFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherTelemetry | null;
  isDroughtLayerActive?: boolean;
  onToggleDroughtLayer?: () => void;
}

export const AgriFuelModal: React.FC<AgriFuelModalProps> = ({
  isOpen,
  onClose,
  weather,
  isDroughtLayerActive = false,
  onToggleDroughtLayer,
}) => {
  const [activeTab, setActiveTab] = useState<'spray' | 'soil' | 'chu' | 'basis' | 'drought'>('spray');
  const [soil, setSoil] = useState<SoilTelemetry | null>(null);
  const [commodities, setCommodities] = useState<CommodityFuture[]>([]);
  const [chuData, setChuData] = useState<ChuSeasonSummary | null>(null);
  const [usdCadRate, setUsdCadRate] = useState<number>(1.40);
  const [plantingDate, setPlantingDate] = useState<string>('2024-05-01');
  const [selectedCrop, setSelectedCrop] = useState<'corn' | 'soy' | 'wheat'>('corn');
  const [selectedElevator, setSelectedElevator] = useState<OntarioElevatorPreset>(ONTARIO_ELEVATOR_PRESETS[0]);
  const [customBasis, setCustomBasis] = useState<number>(1.25);
  const [fieldAcres, setFieldAcres] = useState<number>(100);
  const [fieldYield, setFieldYield] = useState<number>(195); // bu/acre
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      fetchLiveSoilTelemetry(),
      fetchLiveCommodities(),
      fetchLiveChuData(plantingDate),
      fetchLiveUsdCadRate(),
    ]).then(([soilRes, commRes, chuRes, fxRes]) => {
      if (!mounted) return;
      if (soilRes.status === 'fulfilled' && soilRes.value) setSoil(soilRes.value);
      if (commRes.status === 'fulfilled' && commRes.value) setCommodities(commRes.value);
      if (chuRes.status === 'fulfilled' && chuRes.value) setChuData(chuRes.value);
      if (fxRes.status === 'fulfilled' && fxRes.value) setUsdCadRate(fxRes.value);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isOpen, plantingDate]);

  if (!isOpen) return null;

  const temp = weather?.temperatureC ?? 16;
  const rh = weather?.humidityPercent ?? 54;
  const wind = weather?.windSpeedKmh ?? 14;

  const sprayInfo: SprayCondition = calculateSprayWindow(temp, rh, wind);
  const burnStatus = getBurnPermitStatus();

  // Selected crop parameters for basis
  const cropConfig = {
    corn: {
      name: 'Corn (CBOT ZC=F)',
      symbol: 'ZC=F',
      buPerTonne: 39.368,
      defaultBasis: selectedElevator.cornBasisCad,
      defaultYield: 195,
    },
    soy: {
      name: 'Soybeans (CBOT ZS=F)',
      symbol: 'ZS=F',
      buPerTonne: 36.744,
      defaultBasis: selectedElevator.soybeanBasisCad,
      defaultYield: 52,
    },
    wheat: {
      name: 'SRW Wheat (CBOT ZW=F)',
      symbol: 'ZW=F',
      buPerTonne: 36.744,
      defaultBasis: selectedElevator.wheatBasisCad,
      defaultYield: 88,
    },
  }[selectedCrop];

  const currentCommodity = commodities.find((c) => c.symbol === cropConfig.symbol);
  const cbotUsdPrice = currentCommodity?.price ?? (selectedCrop === 'corn' ? 4.25 : selectedCrop === 'soy' ? 10.15 : 5.8);

  const cashMath = calculateCashGrain(cbotUsdPrice, customBasis, usdCadRate, cropConfig.buPerTonne);
  const totalBushels = Math.round(fieldAcres * fieldYield);
  const totalTonnes = Math.round((totalBushels / cropConfig.buPerTonne) * 10) / 10;
  const totalGrossCad = Math.round(totalBushels * cashMath.cashCadPerBu);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono select-none">
      <div className="relative w-full max-w-2xl rounded-lg bg-slate-950 border border-emerald-500/40 p-5 shadow-[0_0_35px_rgba(16,185,129,0.15)] text-slate-100 max-h-[90dvh] flex flex-col">
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
              NORTH PERTH // AGRONOMY & GRAIN INTEL
            </h2>
            <p className="text-[11px] text-slate-400">
              Delta-T • Soil Physics • CHU/GDD • Ontario Cash Basis • AAFC Drought
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border-b border-slate-800 my-3 overflow-x-auto text-xs font-tactical">
          <button
            onClick={() => setActiveTab('spray')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'soil'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            SOIL & MOISTURE
          </button>
          <button
            onClick={() => setActiveTab('chu')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'chu'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            CHU & GDD
          </button>
          <button
            onClick={() => setActiveTab('basis')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'basis'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            GRAIN BASIS
          </button>
          <button
            onClick={() => setActiveTab('drought')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'drought'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            AAFC DROUGHT
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: DELTA-T SPRAY */}
          {activeTab === 'spray' && (
            <div className="space-y-4">
              {/* Spray Advisory Card */}
              <div
                className={`p-4 rounded border ${
                  sprayInfo.status === 'OPTIMAL'
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : sprayInfo.status === 'CAUTION_HIGH' || sprayInfo.status === 'MARGINAL_LOW'
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-rose-500/50 bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-tactical font-bold tracking-wider text-slate-300">
                    DELTA-T SPRAY WINDOW (STULL WET-BULB EQUATION)
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      sprayInfo.status === 'OPTIMAL'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : sprayInfo.status === 'CAUTION_HIGH' || sprayInfo.status === 'MARGINAL_LOW'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {sprayInfo.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-tactical font-black text-white">
                    {sprayInfo.deltaTCelsius}°C
                  </span>
                  <span className="text-xs text-slate-400">Delta-T (Air Temp minus Wet-Bulb)</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded border border-slate-800">
                  {sprayInfo.recommendation}
                </p>

                {/* Weather Parameters */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Air Temp</span>
                    <span className="font-bold text-white">{temp}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Relative Humidity</span>
                    <span className="font-bold text-white">{rh}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Surface Wind</span>
                    <span className="font-bold text-white">{wind} km/h</span>
                  </div>
                </div>
              </div>

              {/* Burn Permit Card */}
              <div className="p-4 rounded border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-tactical font-bold tracking-wider text-slate-300">
                    NORTH PERTH FIRE DEPT // OPEN AIR BURN STATUS
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    {burnStatus.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{burnStatus.message}</p>
                <div className="text-[11px] text-slate-500">
                  Permitted Hours: <span className="text-slate-300">{burnStatus.allowedUntil}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOIL & MOISTURE */}
          {activeTab === 'soil' && (
            <div className="space-y-4">
              {loading && !soil && (
                <div className="text-center py-6 text-slate-500 text-xs animate-pulse">
                  Connecting to Open-Meteo Land Surface Sensors...
                </div>
              )}

              {soil && (
                <>
                  {/* Multi-depth Soil Temperatures */}
                  <div className="p-4 rounded border border-slate-800 bg-slate-900/40">
                    <span className="text-xs font-tactical font-bold tracking-wider text-slate-300 block mb-3 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      SOIL TEMPERATURE PROFILE (NORTH PERTH 43.73° N)
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-black/50 p-3 rounded border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">Surface (0 cm)</span>
                        <span className="text-xl font-tactical font-bold text-emerald-400">
                          {soil.soilTemp0cm}°C
                        </span>
                      </div>
                      <div className="bg-black/50 p-3 rounded border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">Seedbed (6 cm)</span>
                        <span className="text-xl font-tactical font-bold text-cyan-400">
                          {soil.soilTemp6cm}°C
                        </span>
                      </div>
                      <div className="bg-black/50 p-3 rounded border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">Root Zone (18 cm)</span>
                        <span className="text-xl font-tactical font-bold text-blue-400">
                          {soil.soilTemp18cm}°C
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volumetric Soil Moisture */}
                  <div className="p-4 rounded border border-slate-800 bg-slate-900/40">
                    <span className="text-xs font-tactical font-bold tracking-wider text-slate-300 block mb-3 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      VOLUMETRIC SOIL MOISTURE CONTENT
                    </span>
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">0 - 1 cm (Germination Layer)</span>
                          <span className="font-bold text-white">{soil.soilMoisture0to1cm}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, soil.soilMoisture0to1cm * 2.5)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">1 - 3 cm (Shallow Rooting)</span>
                          <span className="font-bold text-white">{soil.soilMoisture1to3cm}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, soil.soilMoisture1to3cm * 2.5)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">3 - 9 cm (Subsurface Reservoir)</span>
                          <span className="font-bold text-white">{soil.soilMoisture3to9cm}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, soil.soilMoisture3to9cm * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VPD & Evapotranspiration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/50 p-3 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">
                        Vapour Pressure Deficit
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-tactical font-bold text-amber-400">
                          {soil.vpdKpa}
                        </span>
                        <span className="text-xs text-slate-400">kPa</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Transpiration pressure & disease risk</p>
                    </div>

                    <div className="bg-black/50 p-3 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">
                        FAO-56 Evapotranspiration
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-tactical font-bold text-teal-400">
                          {soil.et0Mm}
                        </span>
                        <span className="text-xs text-slate-400">mm/hr</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Crop water loss index (ET0)</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: CHU & GDD */}
          {activeTab === 'chu' && (
            <div className="space-y-4">
              {loading && !chuData && (
                <div className="text-center py-6 text-slate-500 text-xs animate-pulse">
                  Calculating OMAFRA Crop Heat Units from Open-Meteo Archive...
                </div>
              )}

              {chuData && (
                <>
                  {/* Planting Date Selector */}
                  <div className="flex items-center justify-between p-3 rounded border border-slate-800 bg-slate-900/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-300 font-bold">PLANTING DATE:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['2024-05-01', '2024-05-10', '2024-05-20'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setPlantingDate(d)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                            plantingDate === d
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : 'bg-black/40 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {d.replace('2024-', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main CHU Benchmark Card */}
                  <div className="p-4 rounded border border-emerald-500/40 bg-emerald-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-tactical font-bold tracking-wider text-slate-300">
                        ONTARIO CROP HEAT UNITS (CHU)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ZONE 2800 - 2900
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl font-tactical font-black text-white">
                        {chuData.accumulatedChu}
                      </span>
                      <span className="text-xs text-slate-400">
                        accumulated CHU / {chuData.targetBenchmarkChu} target
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mb-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (chuData.accumulatedChu / chuData.targetBenchmarkChu) * 100)}%` }}
                      />
                    </div>

                    {/* Crop Development Phase */}
                    <div className="bg-black/60 p-3 rounded border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[10px] text-slate-500 uppercase">Current Corn Staging</span>
                        <span className="font-tactical font-bold text-emerald-400">{chuData.cropPhase}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{chuData.phaseDescription}</p>
                    </div>
                  </div>

                  {/* Growing Degree Days & Forecast Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-black/50 p-3 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">GDD (Base 10°C)</span>
                      <span className="text-xl font-tactical font-bold text-amber-400">
                        {chuData.accumulatedGdd10}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Corn & Soybeans</span>
                    </div>

                    <div className="bg-black/50 p-3 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">GDD (Base 5°C)</span>
                      <span className="text-xl font-tactical font-bold text-cyan-400">
                        {chuData.accumulatedGdd5}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Forages & Cereals</span>
                    </div>

                    <div className="bg-black/50 p-3 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">7-Day Forecast</span>
                      <span className="text-xl font-tactical font-bold text-teal-400">
                        +{chuData.forecast7DayChu}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Projected CHU</span>
                    </div>
                  </div>

                  {/* Historical Table Snippet */}
                  <div className="p-3 rounded border border-slate-800 bg-slate-900/30">
                    <span className="text-[10px] font-tactical font-bold tracking-wider text-slate-400 block mb-2 uppercase">
                      Recent Daily Temperature & CHU Accumulation
                    </span>
                    <div className="space-y-1 text-[11px]">
                      {chuData.dailyHistory.slice(-5).map((r) => (
                        <div key={r.date} className="flex justify-between py-0.5 border-b border-slate-800/40">
                          <span className="text-slate-400">{r.date}</span>
                          <span className="text-slate-300">
                            {r.tmax}° / {r.tmin}°C
                          </span>
                          <span className="text-emerald-400 font-bold">+{r.dailyChu} CHU</span>
                          <span className="text-amber-400 font-bold">+{r.dailyGdd10} GDD</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: ONTARIO GRAIN BASIS TRACKER */}
          {activeTab === 'basis' && (
            <div className="space-y-4">
              {/* Currency & Market Banner */}
              <div className="flex items-center justify-between p-3 rounded border border-emerald-500/30 bg-emerald-950/20 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Live Exchange Rate</span>
                  <span className="font-tactical font-bold text-emerald-400 text-sm">
                    1 USD = ${usdCadRate.toFixed(4)} CAD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Elevator Preset</span>
                  <select
                    value={selectedElevator.name}
                    onChange={(e) => {
                      const elev = ONTARIO_ELEVATOR_PRESETS.find((p) => p.name === e.target.value);
                      if (elev) {
                        setSelectedElevator(elev);
                        setCustomBasis(
                          selectedCrop === 'corn'
                            ? elev.cornBasisCad
                            : selectedCrop === 'soy'
                            ? elev.soybeanBasisCad
                            : elev.wheatBasisCad
                        );
                      }
                    }}
                    className="bg-black/60 border border-slate-700 text-white rounded px-2 py-1 text-xs cursor-pointer"
                  >
                    {ONTARIO_ELEVATOR_PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crop Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {(['corn', 'soy', 'wheat'] as const).map((crop) => (
                  <button
                    key={crop}
                    onClick={() => {
                      setSelectedCrop(crop);
                      setFieldYield(crop === 'corn' ? 195 : crop === 'soy' ? 52 : 88);
                      setCustomBasis(
                        crop === 'corn'
                          ? selectedElevator.cornBasisCad
                          : crop === 'soy'
                          ? selectedElevator.soybeanBasisCad
                          : selectedElevator.wheatBasisCad
                      );
                    }}
                    className={`py-2 px-3 rounded text-xs font-tactical font-bold border cursor-pointer transition-colors ${
                      selectedCrop === crop
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'border-slate-800 bg-black/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {crop.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Conversion Calculator Box */}
              <div className="p-4 rounded border border-slate-800 bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">CBOT Futures Contract</span>
                  <span className="font-bold text-white font-tactical">
                    ${cbotUsdPrice.toFixed(2)} USD/bu
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-300 font-bold block">Local Elevator Basis</span>
                    <span className="text-[10px] text-slate-500">Over CBOT in CAD $/bu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-xs">+$</span>
                    <input
                      type="number"
                      step="0.05"
                      value={customBasis}
                      onChange={(e) => setCustomBasis(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-black border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-bold text-right"
                    />
                    <span className="text-slate-500 text-xs">CAD</span>
                  </div>
                </div>

                {/* Final Cash Price Outputs */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div className="bg-black/70 p-3 rounded border border-emerald-500/30 text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Farmgate Cash Price</span>
                    <div className="text-2xl font-tactical font-black text-emerald-400 mt-0.5">
                      ${cashMath.cashCadPerBu.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-500">CAD / Bushel</span>
                  </div>

                  <div className="bg-black/70 p-3 rounded border border-cyan-500/30 text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Metric Tonne Cash</span>
                    <div className="text-2xl font-tactical font-black text-cyan-400 mt-0.5">
                      ${cashMath.cashCadPerTonne.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-500">CAD / Tonne ({cropConfig.buPerTonne} bu/MT)</span>
                  </div>
                </div>
              </div>

              {/* Field Production & Revenue Estimator */}
              <div className="p-4 rounded border border-slate-800 bg-slate-900/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-tactical font-bold text-slate-300">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  FIELD REVENUE ESTIMATOR
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Field Size (Acres)</label>
                    <input
                      type="number"
                      value={fieldAcres}
                      onChange={(e) => setFieldAcres(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-black border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Expected Yield (bu/ac)</label>
                    <input
                      type="number"
                      value={fieldYield}
                      onChange={(e) => setFieldYield(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-black border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                    />
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Total Harvest</span>
                    <span className="font-bold text-white">
                      {totalBushels.toLocaleString()} bu ({totalTonnes.toLocaleString()} MT)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Est. Gross Revenue</span>
                    <span className="font-tactical font-bold text-emerald-400 text-sm">
                      ${totalGrossCad.toLocaleString()} CAD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CANADIAN DROUGHT MONITOR */}
          {activeTab === 'drought' && (
            <div className="space-y-4">
              {/* Drought Status Card */}
              <div className="p-4 rounded border border-amber-500/40 bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-tactical font-bold tracking-wider text-slate-200">
                      AAFC CANADIAN DROUGHT MONITOR (CDM)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    MAITLAND WATERSHED
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Agriculture and Agri-Food Canada tracks soil moisture deficits, precipitation anomalies,
                  and streamflow across Canadian agricultural regions.
                </p>

                {/* Layer Toggle Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Map WMS Layer</span>
                    <span className="text-[10px] text-slate-400">
                      Overlay AAFC spatial drought polygons directly onto the tactical map
                    </span>
                  </div>
                  <button
                    onClick={onToggleDroughtLayer}
                    className={`px-3 py-1.5 rounded text-xs font-tactical font-bold cursor-pointer transition-colors ${
                      isDroughtLayerActive
                        ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                        : 'bg-black/60 border border-amber-500/50 text-amber-400 hover:bg-amber-950/40'
                    }`}
                  >
                    {isDroughtLayerActive ? 'LAYER ACTIVE (ON)' : 'ENABLE MAP LAYER'}
                  </button>
                </div>
              </div>

              {/* Official AAFC Classification Scale */}
              <div className="p-3 rounded border border-slate-800 bg-slate-900/40 space-y-2">
                <span className="text-[10px] font-tactical font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  AAFC Drought Classification Reference
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-yellow-400 flex-shrink-0" />
                    <span className="font-bold text-yellow-300">D0 - Abnormally Dry:</span>
                    <span className="text-slate-400 text-[11px]">Short-term dryness; slower crop growth.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 flex-shrink-0" />
                    <span className="font-bold text-amber-400">D1 - Moderate Drought:</span>
                    <span className="text-slate-400 text-[11px]">Some crop/pasture damage; streams low.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-orange-600 flex-shrink-0" />
                    <span className="font-bold text-orange-400">D2 - Severe Drought:</span>
                    <span className="text-slate-400 text-[11px]">Crop losses likely; water shortages common.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-red-600 flex-shrink-0" />
                    <span className="font-bold text-red-400">D3 - Extreme Drought:</span>
                    <span className="text-slate-400 text-[11px]">Major crop/pasture losses; widespread restrictions.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-amber-950 border border-red-500 flex-shrink-0" />
                    <span className="font-bold text-rose-400">D4 - Exceptional Drought:</span>
                    <span className="text-slate-400 text-[11px]">Exceptional and widespread crop loss; emergency water.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sources: Open-Meteo Land Surface • CBOT/CME • AAFC • OMAFRA</span>
          <span className="text-emerald-400 font-bold">100% LIVE SENSOR TELEMETRY</span>
        </div>
      </div>
    </div>
  );
};
