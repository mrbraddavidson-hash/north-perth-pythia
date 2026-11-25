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
  Thermometer,
  Activity,
  Calculator,
  Sun,
  MapPin,
  ExternalLink,
  Calendar,
  CloudSun,
  Waves,
  HeartPulse,
  CloudLightning,
  ChevronRight,
  ShieldAlert,
  Building2,
  Scale,
  Beef,
  Wheat,
  Clock,
} from 'lucide-react';
import {
  FlightData,
  RiverGaugeData,
  WeatherTelemetry,
} from '../services/types';
import { SchoolBusCard } from './SchoolBusCard';
import {
  getMvcaWatershedBulletin,
  getWeatherAlerts,
} from '../services/api';
import {
  calculateSprayWindow,
  fetchLiveSoilTelemetry,
  fetchLiveCommodities,
  getBurnPermitStatus,
  fetchLiveChuData,
  fetchLiveUsdCadRate,
  calculateCashGrain,
  calculateDairyHeatStress,
  ONTARIO_ELEVATOR_PRESETS,
  NORTH_PERTH_AGRI_HUBS,
  SprayCondition,
  SoilTelemetry,
  CommodityFuture,
  ChuSeasonSummary,
  OntarioElevatorPreset,
  LivestockStressTelemetry,
  AgriHubLocation,
} from '../services/agri';

export type RightPanelTab = 'agri' | 'markets' | 'weather' | 'hubs';

interface RightIntelPanelProps {
  weather: WeatherTelemetry | null;
  riverGauges: RiverGaugeData[];
  flights: FlightData[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData | null) => void;
  onOpenAgriModal?: () => void;
  vessels?: any[];
  selectedVessel?: any | null;
  onSelectVessel?: (vessel: any | null) => void;
  milFlights?: any[];
  earthquakes?: any[];
  onClose?: () => void;
  activeTab?: RightPanelTab;
  onChangeTab?: (tab: RightPanelTab) => void;
  onFlyToCoord?: (coords: [number, number], zoom?: number) => void;
  isDroughtLayerActive?: boolean;
  onToggleDroughtLayer?: () => void;
}

export const RightIntelPanel: React.FC<RightIntelPanelProps> = ({
  weather,
  riverGauges,
  flights,
  onOpenAgriModal,
  onClose,
  activeTab: controlledTab,
  onChangeTab,
  onFlyToCoord,
  isDroughtLayerActive = false,
  onToggleDroughtLayer,
}) => {
  const [internalTab, setInternalTab] = useState<RightPanelTab>('agri');
  const currentTab = controlledTab ?? internalTab;
  const setTab = (t: RightPanelTab) => {
    if (onChangeTab) onChangeTab(t);
    else setInternalTab(t);
  };

  // Agronomic live data states
  const [soil, setSoil] = useState<SoilTelemetry | null>(null);
  const [commodities, setCommodities] = useState<CommodityFuture[]>([]);
  const [chuData, setChuData] = useState<ChuSeasonSummary | null>(null);
  const [usdCadRate, setUsdCadRate] = useState<number>(1.40);
  const [plantingDate, setPlantingDate] = useState<string>(`${new Date().getFullYear()}-05-01`);

  // Calculator states
  const [selectedCrop, setSelectedCrop] = useState<'corn' | 'soy' | 'wheat'>('corn');
  const [selectedElevator, setSelectedElevator] = useState<OntarioElevatorPreset>(ONTARIO_ELEVATOR_PRESETS[0]);
  const [fieldAcres, setFieldAcres] = useState<number>(100);
  const [fieldYield, setFieldYield] = useState<number>(195); // bu/acre

  const [isLoadingAgri, setIsLoadingAgri] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setIsLoadingAgri(true);

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
      setIsLoadingAgri(false);
    });

    return () => {
      mounted = false;
    };
  }, [plantingDate]);

  // No live weather -> no spray/THI advice (never compute from placeholder values)
  const temp = weather?.temperatureC;
  const rh = weather?.humidityPercent;
  const wind = weather?.windSpeedKmh;

  const sprayInfo: SprayCondition | null = weather
    ? calculateSprayWindow(weather.temperatureC, weather.humidityPercent, weather.windSpeedKmh)
    : null;
  const dairyStress: LivestockStressTelemetry | null = weather
    ? calculateDairyHeatStress(weather.temperatureC, weather.humidityPercent)
    : null;
  const burnStatus = getBurnPermitStatus();
  const mvca = getMvcaWatershedBulletin(riverGauges);
  const weatherAlerts = getWeatherAlerts(weather);

  // Commodity futures lookup
  const cornFuture = commodities.find((c) => c.symbol === 'ZC=F');
  const soyFuture = commodities.find((c) => c.symbol === 'ZS=F');
  const wheatFuture = commodities.find((c) => c.symbol === 'ZW=F');
  const cattleFuture = commodities.find((c) => c.symbol === 'LE=F');
  const hogFuture = commodities.find((c) => c.symbol === 'HE=F');

  const activeCbotPrice =
    selectedCrop === 'corn'
      ? (cornFuture?.price ?? 4.45)
      : selectedCrop === 'soy'
      ? (soyFuture?.price ?? 10.25)
      : (wheatFuture?.price ?? 5.75);

  const activeBasis =
    selectedCrop === 'corn'
      ? selectedElevator.cornBasisCad
      : selectedCrop === 'soy'
      ? selectedElevator.soybeanBasisCad
      : selectedElevator.wheatBasisCad;

  const buPerTonne = selectedCrop === 'corn' ? 39.368 : selectedCrop === 'soy' ? 36.744 : 36.744;
  const cashPricing = calculateCashGrain(activeCbotPrice, activeBasis, usdCadRate, buPerTonne);
  const estimatedTotalBushels = fieldAcres * fieldYield;
  const estimatedRevenueCad = Math.round(estimatedTotalBushels * cashPricing.cashCadPerBu);

  return (
    <aside className="w-80 sm:w-96 flex-shrink-0 flex flex-col bg-slate-950/95 border-l border-emerald-500/25 backdrop-blur-md overflow-hidden z-20 shadow-2xl">
      {/* Header with Title and Close Button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-500/20 bg-slate-950">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-400" />
          <span className="font-tactical text-xs font-bold text-emerald-400 tracking-wider">
            AGRI-OPERATIONS // PERTH COUNTY
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer text-[9px] font-mono transition-colors"
            title="Collapse Sidebar"
          >
            <span>HIDE</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-emerald-500/20 bg-slate-900/60 font-tactical text-[10px]">
        <button
          onClick={() => setTab('agri')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'agri'
              ? 'border-emerald-400 text-emerald-300 bg-slate-900/90 shadow-[inset_0_-2px_6px_rgba(16,185,129,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          AGRI & SOIL
        </button>

        <button
          onClick={() => setTab('markets')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'markets'
              ? 'border-amber-400 text-amber-300 bg-slate-900/90 shadow-[inset_0_-2px_6px_rgba(245,158,11,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wheat className="w-3.5 h-3.5 text-amber-400" />
          GRAIN BIDS
        </button>

        <button
          onClick={() => setTab('weather')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'weather'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/90 shadow-[inset_0_-2px_6px_rgba(6,182,212,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
          WEATHER
        </button>

        <button
          onClick={() => setTab('hubs')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'hubs'
              ? 'border-indigo-400 text-indigo-300 bg-slate-900/90 shadow-[inset_0_-2px_6px_rgba(99,102,241,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          AG HUBS
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {/* ========================================================================= */}
        {/* TAB 1: AGRI & SOIL (SPRAY, SOIL PHYSICS, DAIRY HEAT STRESS, CHU) */}
        {/* ========================================================================= */}
        {currentTab === 'agri' && (
          <div className="space-y-3">
            {sprayInfo && dairyStress ? (
            <>
            {/* 1. Delta-T & Chemical Spray Window */}
            <div className="p-3 rounded bg-slate-900/90 border border-emerald-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  DELTA-T SPRAY WINDOW
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    sprayInfo.status === 'OPTIMAL'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : sprayInfo.status === 'DRIFT_RISK' || sprayInfo.status === 'INVERSION_RISK'
                      ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse'
                      : 'bg-amber-950/90 text-amber-300 border-amber-500'
                  }`}
                >
                  {sprayInfo.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400">WET-BULB DEPRESSION (ΔT)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {sprayInfo.deltaTCelsius}°C
                  </div>
                </div>
                <div className="text-right text-[10px] space-y-0.5">
                  <div className="text-slate-300">
                    Wind: <span className="text-white font-bold">{wind} km/h</span>
                  </div>
                  <div className="text-slate-300">
                    Humidity: <span className="text-white font-bold">{rh}%</span>
                  </div>
                  <div className="text-slate-300">
                    Ambient: <span className="text-white font-bold">{temp}°C</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-300 leading-relaxed bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                {sprayInfo.recommendation}
              </div>
            </div>

            {/* 2. Dairy & Livestock Heat Stress (THI) */}
            <div className="p-3 rounded bg-slate-900/90 border border-blue-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Beef className="w-3.5 h-3.5 text-blue-400" />
                  DAIRY & LIVESTOCK THI
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    dairyStress.level === 'COMFORT'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500'
                      : dairyStress.level === 'MILD_STRESS'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500'
                      : 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse'
                  }`}
                >
                  THI {dairyStress.thi} // {dairyStress.label}
                </span>
              </div>

              <div className="text-[10px] space-y-1 bg-slate-950/60 p-2 rounded border border-slate-800">
                <div className="text-slate-200">
                  <span className="text-blue-300 font-semibold">Milk Yield Impact:</span>{' '}
                  {dairyStress.milkYieldImpact}
                </div>
                <div className="text-slate-300 text-[9px] leading-relaxed">
                  <span className="text-slate-400 font-semibold">Barn Protocol:</span>{' '}
                  {dairyStress.barnVentilationAdvice}
                </div>
              </div>
            </div>

            </>
            ) : (
              <div className="p-3 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-slate-400">
                LIVE WEATHER FEED UNAVAILABLE // Delta-T spray window and dairy THI are paused until live readings return.
              </div>
            )}

            {/* 3. Soil Physics & Moisture Telemetry */}
            <div className="p-3 rounded bg-slate-900/90 border border-amber-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  SEEDBED & SOIL PHYSICS
                </span>
                <span className="text-[9px] text-amber-400 font-mono">LISTOWEL / ELMA</span>
              </div>

              {soil ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-400">SURFACE (0cm)</div>
                      <div className="text-sm font-bold text-amber-300">{soil.soilTemp0cm}°C</div>
                    </div>
                    <div className="bg-slate-950/80 p-1.5 rounded border border-emerald-500/40">
                      <div className="text-[9px] text-emerald-400 font-semibold">SEEDBED (6cm)</div>
                      <div className="text-sm font-bold text-emerald-300">{soil.soilTemp6cm}°C</div>
                    </div>
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-400">ROOTS (18cm)</div>
                      <div className="text-sm font-bold text-amber-300">{soil.soilTemp18cm}°C</div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-2 rounded border border-slate-800 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Topsoil Moisture (0-1cm):</span>
                      <span className="font-bold text-white">{soil.soilMoisture0to1cm}% vol</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-cyan-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, soil.soilMoisture0to1cm * 2)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 pt-1">
                      <span>Seedbed Moisture (1-3cm):</span>
                      <span className="font-bold text-emerald-400">{soil.soilMoisture1to3cm}% vol</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, soil.soilMoisture1to3cm * 2)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1 text-[9px]">
                      <span>VPD: {soil.vpdKpa} kPa</span>
                      <span>FAO-56 ET₀: {soil.et0Mm} mm/day</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-slate-500 text-[10px] animate-pulse">
                  Querying Open-Meteo Perth soil probes...
                </div>
              )}
            </div>

            {/* 4. Ontario Crop Heat Units (CHU) */}
            <div className="p-3 rounded bg-slate-900/90 border border-emerald-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sun className="w-3.5 h-3.5 text-yellow-400" />
                  ONTARIO CROP HEAT UNITS (CHU)
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">2,850 TARGET</span>
              </div>

              {chuData ? (
                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div>
                      <div className="text-[9px] text-slate-400">ACCUMULATED CHU</div>
                      <div className="text-lg font-bold text-yellow-400">
                        {chuData.accumulatedChu}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/ 2,850</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400">MATURITY</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {chuData.percentMaturity}%
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${chuData.percentMaturity}%` }}
                    ></div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800 space-y-0.5 text-[9px]">
                    <div className="text-white font-bold">{chuData.cropPhase}</div>
                    <div className="text-slate-300">{chuData.phaseDescription}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-slate-500 text-[10px] animate-pulse">
                  Calculating regional CHU thermal history...
                </div>
              )}
            </div>

            {/* 5. AAFC Canadian Drought Monitor Toggle */}
            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="text-[10px]">
                <div className="text-white font-semibold">AAFC Drought Monitor Overlay</div>
                <div className="text-slate-400 text-[9px]">Agriculture Canada soil deficit map</div>
              </div>
              {onToggleDroughtLayer && (
                <button
                  onClick={onToggleDroughtLayer}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    isDroughtLayerActive
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isDroughtLayerActive ? 'ACTIVE' : 'ENABLE'}
                </button>
              )}
            </div>

            {/* 6. Rural Open-Air Burn Permits */}
            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200">Rural Burn Permits (Elma & Wallace):</span>
              </div>
              <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                PERMITTED
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GRAIN MARKETS & LOCAL ELEVATOR CASH BIDS */}
        {/* ========================================================================= */}
        {currentTab === 'markets' && (
          <div className="space-y-3">
            {/* Currency FX Benchmark */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
              <span className="text-slate-400">BANK OF CANADA FX BENCHMARK:</span>
              <span className="font-bold text-emerald-400 font-mono">
                1 USD = ${usdCadRate.toFixed(4)} CAD
              </span>
            </div>

            {/* Local Elevator Cash Grain Calculator */}
            <div className="p-3 rounded bg-slate-900/90 border border-amber-500/40 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  ONTARIO ELEVATOR CASH BIDS
                </span>
                <span className="text-[9px] text-amber-300 font-mono">CAD / BU & TONNE</span>
              </div>

              {/* Crop Selector */}
              <div className="flex rounded border border-slate-800 overflow-hidden text-[10px] bg-slate-950">
                <button
                  onClick={() => setSelectedCrop('corn')}
                  className={`flex-1 py-1 font-bold transition-colors cursor-pointer ${
                    selectedCrop === 'corn' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CORN
                </button>
                <button
                  onClick={() => setSelectedCrop('soy')}
                  className={`flex-1 py-1 font-bold transition-colors cursor-pointer ${
                    selectedCrop === 'soy' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SOYBEANS
                </button>
                <button
                  onClick={() => setSelectedCrop('wheat')}
                  className={`flex-1 py-1 font-bold transition-colors cursor-pointer ${
                    selectedCrop === 'wheat' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SRW WHEAT
                </button>
              </div>

              {/* Elevator Selection */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase tracking-wider">Select Elevator Terminal:</label>
                <select
                  value={selectedElevator.name}
                  onChange={(e) => {
                    const found = ONTARIO_ELEVATOR_PRESETS.find((p) => p.name === e.target.value);
                    if (found) setSelectedElevator(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 font-mono focus:outline-none cursor-pointer"
                >
                  {ONTARIO_ELEVATOR_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Calculation Output */}
              <div className="p-2.5 rounded bg-slate-950/90 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">CBOT Futures (USD):</span>
                  <span className="font-bold text-white font-mono">${activeCbotPrice.toFixed(2)} / bu</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Elevator Basis (CAD):</span>
                  <span className="font-bold text-amber-300 font-mono">+${activeBasis.toFixed(2)} / bu</span>
                </div>
                <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">EST. CASH PRICE:</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-300 font-mono">
                      ${cashPricing.cashCadPerBu.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">CAD/bu</span>
                    </span>
                    <div className="text-[9px] text-slate-400">
                      ${cashPricing.cashCadPerTonne.toFixed(2)} CAD/tonne
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Field Revenue Estimator */}
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span>Field Revenue Estimator</span>
                  <span className="text-emerald-400 font-mono">${estimatedRevenueCad.toLocaleString()} CAD</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <label className="text-slate-400">Acres:</label>
                    <input
                      type="number"
                      value={fieldAcres}
                      onChange={(e) => setFieldAcres(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400">Est. Yield (bu/ac):</label>
                    <input
                      type="number"
                      value={fieldYield}
                      onChange={(e) => setFieldYield(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live CBOT / CME Commodity Futures */}
            <div className="p-3 rounded bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  CBOT / CME AGRICULTURAL FUTURES
                </span>
                <span className="text-[9px] text-slate-400">LIVE TICKER</span>
              </div>

              <div className="space-y-1.5">
                {commodities.length > 0 ? (
                  commodities.map((c) => (
                    <div
                      key={c.symbol}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-800 text-[10px]"
                    >
                      <div>
                        <div className="text-white font-bold">{c.name}</div>
                        <div className="text-[9px] text-slate-400">{c.exchange}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-200 font-mono">
                          ${c.price.toFixed(2)} <span className="text-[9px] text-slate-400">{c.unit}</span>
                        </div>
                        <div
                          className={`text-[9px] font-mono font-semibold ${
                            c.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {c.changePercent >= 0 ? '+' : ''}
                          {c.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-slate-500 text-[10px]">
                    Updating CME agricultural futures...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LOCAL WEATHER & MAITLAND RIVER DRAINAGE */}
        {/* ========================================================================= */}
        {currentTab === 'weather' && (
          <div className="space-y-3">
            {/* Weather Alerts if any */}
            {weatherAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-2.5 rounded border ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                    : 'bg-amber-950/50 border-amber-500/70 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                  <span className="flex items-center gap-1.5">
                    <CloudLightning className="w-3.5 h-3.5 text-cyan-400" />
                    {alert.title}
                  </span>
                  <span className="text-[9px] px-1 rounded bg-slate-950/80 border border-slate-700 font-mono">
                    {alert.issuedTime}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300/90 leading-relaxed">{alert.description}</p>
              </div>
            ))}

            {/* School bus delays/cancellations (HPSTS) — weather-driven, so it lives with the weather */}
            <SchoolBusCard />

            {/* Current Conditions Card */}
            {weather && (
              <div className="p-3 rounded bg-slate-900/90 border border-cyan-500/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">NORTH PERTH METEOROLOGY</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-300 font-mono">{weather.temperatureC}°C</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Wind & Gusts</div>
                    <div className="font-bold text-white font-mono">
                      {weather.windSpeedKmh} km/h (Gusts {weather.windGustsKmh} km/h)
                    </div>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Humidity & Dewpoint</div>
                    <div className="font-bold text-white font-mono">{weather.humidityPercent}%</div>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Barometer</div>
                    <div className="font-bold text-white font-mono">{weather.barometricPressureHpa} hPa</div>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Condition</div>
                    <div className="font-bold text-cyan-300">{weather.conditionLabel}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Next 12 Hours Forecast Timeline */}
            {weather?.hourlyForecast && weather.hourlyForecast.length > 0 && (
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  NEXT 12 HOURS FORECAST
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {weather.hourlyForecast.map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 flex flex-col items-center p-1.5 rounded bg-slate-950/80 border border-slate-800/80 min-w-[50px] text-center"
                    >
                      <span className="text-[9px] text-slate-400">{h.time}</span>
                      <span className="text-[11px] font-bold text-white my-0.5">{h.tempC}°</span>
                      <span className={`text-[8px] font-bold ${h.precipProb > 30 ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {h.precipProb}% rain
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-Day Outlook */}
            {weather?.dailyForecast && weather.dailyForecast.length > 0 && (
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Sun className="w-3 h-3 text-cyan-400" />
                  3-DAY METEOROLOGICAL OUTLOOK
                </div>
                <div className="space-y-1.5">
                  {weather.dailyForecast.map((day, i) => {
                    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day.date.substring(5);
                    return (
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px]"
                      >
                        <span className="font-semibold text-slate-200 w-16">{label}</span>
                        <span className="text-slate-400 truncate flex-1 px-2">{day.conditionLabel}</span>
                        <div className="font-mono text-right flex items-center gap-2">
                          <span className="text-rose-400 font-bold">{day.tempMaxC}°</span>
                          <span className="text-cyan-400 font-bold">{day.tempMinC}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Maitland Valley Watershed & Tile Drainage Gauge */}
            <div className="p-3 rounded bg-slate-900/90 border border-cyan-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MAITLAND VALLEY (MVCA)</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-emerald-950 text-emerald-400 border-emerald-500/40">
                  {mvca.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-cyan-300">{mvca.headline}</div>
              <p className="text-[10px] text-slate-300 leading-relaxed">{mvca.details}</p>

              {/* Water Levels for drainage monitoring */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80 text-[10px]">
                <div className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                  FIELD RUNOFF & GAUGES
                </div>
                {riverGauges.map((g) => (
                  <div key={g.stationId} className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-300 truncate max-w-[170px]" title={g.stationName}>
                      {g.stationName.replace('Middle Maitland River', 'Mid-Maitland').replace('Maitland River', 'Maitland')}
                    </span>
                    <span className="font-bold text-white font-mono">
                      {g.waterLevelMeters.toFixed(2)}m <span className="text-slate-400 font-normal">({g.dischargeM3s.toFixed(2)} m³/s)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NORTH PERTH AGRI HUBS & INFRASTRUCTURE */}
        {/* ========================================================================= */}
        {currentTab === 'hubs' && (
          <div className="space-y-2.5">
            <div className="text-[10px] text-slate-400 px-1">
              Agricultural elevators, feed mills, livestock auction, and agronomy centers in North Perth:
            </div>

            {NORTH_PERTH_AGRI_HUBS.map((hub) => (
              <div
                key={hub.id}
                className="p-2.5 rounded bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-colors space-y-1.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="text-white font-bold text-[11px]">{hub.name}</div>
                    <div className="text-[9px] text-emerald-400 font-mono">
                      {hub.category.replace('_', ' ')} // {hub.town}
                    </div>
                  </div>
                  {onFlyToCoord && (
                    <button
                      onClick={() => onFlyToCoord([hub.lat, hub.lng], 14)}
                      className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold cursor-pointer transition-colors"
                      title="Zoom to location on map"
                    >
                      LOCATE
                    </button>
                  )}
                </div>

                <p className="text-[9px] text-slate-300 leading-relaxed">{hub.description}</p>

                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                  {hub.services.map((svc) => (
                    <span
                      key={svc}
                      className="text-[8px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
