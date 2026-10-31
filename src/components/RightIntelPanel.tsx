import React, { useState } from 'react';
import {
  Cpu,
  Plane,
  Waves,
  ChevronRight,
  Sparkles,
  Sprout,
  HeartPulse,
  CloudLightning,
  Activity,
  Ship,
  Anchor,
  Shield,
  Clock,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  Compass,
  Sun,
  X,
} from 'lucide-react';
import {
  FlightData,
  RiverGaugeData,
  WeatherTelemetry,
} from '../services/types';
import {
  getMvcaWatershedBulletin,
  getWeatherAlerts,
} from '../services/api';
import { SeismicEvent } from '../services/hazards';
import { MaritimeVessel } from '../services/maritime';
import { MilitaryFlight } from '../services/godseye';

interface RightIntelPanelProps {
  weather: WeatherTelemetry | null;
  riverGauges: RiverGaugeData[];
  flights: FlightData[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData | null) => void;
  onOpenAgriModal: () => void;
  vessels?: MaritimeVessel[];
  selectedVessel?: MaritimeVessel | null;
  onSelectVessel?: (vessel: MaritimeVessel | null) => void;
  milFlights?: MilitaryFlight[];
  earthquakes?: SeismicEvent[];
  onClose?: () => void;
  activeTab?: 'oracle' | 'weather' | 'airspace' | 'seismic';
  onChangeTab?: (tab: 'oracle' | 'weather' | 'airspace' | 'seismic') => void;
}

export const RightIntelPanel: React.FC<RightIntelPanelProps> = ({
  weather,
  riverGauges,
  flights,
  selectedFlight,
  onSelectFlight,
  onOpenAgriModal,
  vessels = [],
  selectedVessel = null,
  onSelectVessel,
  milFlights = [],
  earthquakes = [],
  onClose,
  activeTab: controlledTab,
  onChangeTab,
}) => {
  const [internalTab, setInternalTab] = useState<'oracle' | 'weather' | 'airspace' | 'seismic'>('weather');
  const currentTab = controlledTab ?? internalTab;
  const setTab = onChangeTab ?? setInternalTab;

  const mainGauge = riverGauges.find((g) => g.stationId === '02FE003') || riverGauges[0];
  const orngeFlight = flights.find((f) => f.callsign.includes('ORNGE') || f.callsign.includes('MEDEVAC'));

  const mvca = getMvcaWatershedBulletin(riverGauges);
  const weatherAlerts = getWeatherAlerts(weather);

  return (
    <aside className="w-72 sm:w-84 flex-shrink-0 flex flex-col bg-slate-950/95 border-l border-cyan-500/20 backdrop-blur-md overflow-hidden z-20 shadow-2xl">
      {/* Header with Close / Hide Button */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-cyan-500/20 bg-slate-950">
        <span className="font-tactical text-[10px] font-bold text-cyan-400 tracking-wider">
          INTEL & METEOROLOGY
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer text-[9px] font-mono transition-colors"
            title="Collapse Sidebar (Full Map View)"
          >
            <span>HIDE</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-cyan-500/20 bg-slate-900/50">
        <button
          onClick={() => setTab('weather')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'weather'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudSun className="w-3 h-3" />
          WEATHER {weather ? `(${weather.temperatureC}°)` : ''}
        </button>
        <button
          onClick={() => setTab('oracle')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'oracle'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          SITREP
        </button>
        <button
          onClick={() => setTab('airspace')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'airspace'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plane className="w-3 h-3" />
          AIR ({flights.length + milFlights.length})
        </button>
        <button
          onClick={() => setTab('seismic')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            currentTab === 'seismic'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3 h-3" />
          SEISMIC ({earthquakes.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {/* TAB 1: AI SITREP (PYTHIA ORACLE) */}
        {currentTab === 'oracle' && (
          <div className="space-y-3">
            {/* Ornge Medevac Priority Banner if detected */}
            {orngeFlight && (
              <div className="p-2.5 rounded bg-rose-950/70 border border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    ORNGE MEDEVAC INBOUND // LMH
                  </span>
                  <span className="text-[10px] bg-rose-900 px-1.5 py-0.5 rounded text-white font-bold">
                    {orngeFlight.distanceKmToListowel} km out
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  Air Ambulance {orngeFlight.callsign} entering North Perth airspace. Listowel Memorial Hospital (CPN5) helipad active.
                </div>
              </div>
            )}

            {/* Weather Alert Card */}
            {weatherAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-2.5 rounded border ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                    : alert.severity === 'ELEVATED'
                    ? 'bg-amber-950/50 border-amber-500/70 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
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

            {/* MVCA Maitland Valley Watershed Bulletin */}
            <div className="p-3 rounded bg-slate-900/80 border border-cyan-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MAITLAND VALLEY (MVCA)</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    mvca.status === 'FLOOD_WARNING'
                      ? 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse'
                      : mvca.status === 'FLOOD_WATCH'
                      ? 'bg-amber-950 text-amber-400 border-amber-500 animate-pulse'
                      : mvca.status === 'CONDITIONS_STATEMENT'
                      ? 'bg-yellow-950 text-yellow-300 border-yellow-500/60'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {mvca.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-cyan-300">{mvca.headline}</div>
              <p className="text-[10px] text-slate-300 leading-relaxed">{mvca.details}</p>
              
              {/* Real-time Environment Canada hydrometric stations */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80 text-[10px]">
                <div className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider flex items-center justify-between">
                  <span>LIVE ECCC WATEROFFICE TELEMETRY</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE
                  </span>
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

            {/* Quick Action Button for Agri & Economic Intel */}
            <button
              onClick={onOpenAgriModal}
              className="w-full flex items-center justify-between p-2.5 rounded bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-semibold cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span className="text-xs">AGRONOMY // LIVE DELTA-T SPRAY WINDOW</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Live Synthesis Telemetry Grid */}
            <div className="space-y-2">
              <div className="text-[10px] font-tactical tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                TACTICAL SECTOR SUMMARY (LIVE TELEMETRY)
              </div>

              {/* Weather & Atmosphere */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-cyan-300">Surface Atmosphere</span>
                  <span className="text-[10px] text-emerald-400 font-mono">LIVE ECCC/METEO</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">
                  Listowel station reporting {weather?.temperatureC ?? '--'}°C (feels like {weather?.apparentTempC ?? '--'}°C), {weather?.humidityPercent ?? '--'}% humidity. Barometer: {weather?.barometricPressureHpa ?? '--'} hPa. Winds: {weather?.windSpeedKmh ?? '--'} km/h with peak gusts to {weather?.windGustsKmh ?? '--'} km/h.
                </p>
              </div>

              {/* Hydrology & River Flow */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-300">Maitland Watershed Status</span>
                  <span className="text-[10px] text-emerald-400 font-mono">LIVE 02FE003</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">
                  Middle Maitland River gauge near Listowel recording {mainGauge?.waterLevelMeters.toFixed(2) ?? '6.80'}m at {mainGauge?.dischargeM3s.toFixed(2) ?? '0.16'} m³/s. River stage is {mainGauge?.floodStageAlert ?? 'NORMAL'} with a {mainGauge?.trend.toLowerCase() ?? 'stable'} baseflow trend.
                </p>
              </div>

              {/* Airspace & Transport Corridors */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-cyan-300">Overhead Airspace</span>
                  <span className="text-[10px] text-emerald-400 font-mono">LIVE ADS-B MESH</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">
                  {flights.length + milFlights.length} transponder aircraft tracked across Southwestern Ontario airspace ({flights.length} civilian, {milFlights.length} military).
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-400">TEMP / APPARENT</span>
                <div className="text-sm font-bold text-white">
                  {weather?.temperatureC}°C <span className="text-[11px] text-slate-400">({weather?.apparentTempC}°C)</span>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-400">WIND GUSTS</span>
                <div className="text-sm font-bold text-cyan-300">
                  {weather?.windGustsKmh} km/h
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEATHER & RADAR METEOROLOGY */}
        {currentTab === 'weather' && (
          <div className="space-y-3">
            {/* Header / Current Station */}
            <div className="p-3 rounded bg-slate-900/80 border border-cyan-500/40 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <CloudSun className="w-4 h-4 text-cyan-400" />
                  <span>NORTH PERTH METEOROLOGY</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* Big Temp & Condition */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-tactical font-black text-white tracking-tight">
                    {weather?.temperatureC ?? '--'}°C
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5 font-semibold">
                    <span>{weather?.conditionLabel ?? 'Stable Atmosphere'}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Feels {weather?.apparentTempC ?? '--'}°C</span>
                  </div>
                </div>
                {weather?.dailyForecast?.[0] && (
                  <div className="text-right text-[11px] font-mono bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <div className="text-rose-400 font-bold">▲ {weather.dailyForecast[0].tempMaxC}°C</div>
                    <div className="text-cyan-400 font-bold">▼ {weather.dailyForecast[0].tempMinC}°C</div>
                  </div>
                )}
              </div>

              {/* 4-Grid Meteorological Telemetry */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    SURFACE WINDS
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {weather?.windSpeedKmh ?? '--'} km/h <span className="text-slate-400 text-[10px]">({weather?.windDirectionDeg ?? 0}°)</span>
                  </div>
                  <div className="text-[9px] text-amber-300/90 mt-0.5">
                    Gusts to {weather?.windGustsKmh ?? '--'} km/h
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    HUMIDITY
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {weather?.humidityPercent ?? '--'}%
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    Cloud Cover: {weather?.cloudCoverPercent ?? 0}%
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    BAROMETER
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {weather?.barometricPressureHpa ?? '--'} hPa
                  </div>
                  <div className="text-[9px] text-emerald-400 mt-0.5">
                    {((weather?.barometricPressureHpa ?? 1013) >= 1013) ? 'High Pressure' : 'Low Pressure System'}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-cyan-400" />
                    PRECIPITATION
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {weather?.weatherCode === 0 ? '0.0 mm/h' : 'Active'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {weather?.weatherCode === 0 ? 'Clear Skies' : weather?.conditionLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Doppler Weather Radar Status Card */}
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                  DOPPLER RADAR NETWORK
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                  EXETER WSO MESH
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Continuous high-resolution Doppler reflectivity loop buffered from Exeter (WSO) and Great Lakes composite radar.
              </p>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">North Perth Status:</span>
                  <span className="text-emerald-400 font-bold">0.0 mm/h (Zero Radar Echoes)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Precipitation Buffer:</span>
                  <span className="text-cyan-300 font-mono">13 Frames Pre-Buffered (Auto-Loop)</span>
                </div>
              </div>
            </div>

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
          </div>
        )}

        {/* TAB 3: AIRSPACE (ADS-B LIVE RADAR) */}
        {currentTab === 'airspace' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">LIVE ADS-B RADAR</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">{flights.length} DETECTED</span>
            </div>

            {flights.length === 0 ? (
              <div className="p-5 rounded border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs space-y-1.5">
                <Plane className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <div className="font-semibold text-slate-300">NO TRANSPONDERS IN RANGE</div>
                <div className="text-[10px] text-slate-500">Live receiver mesh listening (70 NM around Listowel)...</div>
              </div>
            ) : (
              flights.map((flight) => {
                const isSelected = selectedFlight?.icao24 === flight.icao24;
                const isOrnge = flight.callsign.includes('ORNGE') || flight.callsign.includes('MEDEVAC');

                return (
                  <div
                    key={flight.icao24}
                    onClick={() => onSelectFlight(isSelected ? null : flight)}
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                        : isOrnge
                        ? 'bg-rose-950/40 border-rose-500/60 text-slate-200 hover:border-rose-400'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Plane className={`w-3.5 h-3.5 ${isOrnge ? 'text-rose-400' : 'text-cyan-400'}`} />
                        {flight.callsign}
                        {flight.registration && flight.registration !== flight.callsign && (
                          <span className="text-[9px] text-slate-400 font-normal">[{flight.registration}]</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {flight.distanceKmToListowel} km out
                      </span>
                    </div>
                    {flight.aircraftType && (
                      <div className="text-[10px] text-cyan-400/90 truncate mt-0.5 font-mono">
                        {flight.aircraftType}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 text-[10px] text-slate-400">
                      <div>
                        ALT: <span className="text-slate-200">{flight.altitudeFeet ? `${flight.altitudeFeet.toLocaleString()} ft` : 'Ground'}</span>
                      </div>
                      <div>
                        SPEED: <span className="text-slate-200">{flight.velocityKmh ? `${flight.velocityKmh} km/h` : 'N/A'}</span>
                      </div>
                      <div>
                        ORIGIN: <span className="text-slate-300">{flight.originCountry}</span>
                      </div>
                      <div>
                        HEADING: <span className="text-slate-300">{flight.trackHeading ? `${flight.trackHeading}°` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Maritime AIS Section (Lake Huron & Goderich Salt Port) */}
            {vessels.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-tactical font-bold text-teal-400">
                    <Ship className="w-3.5 h-3.5 text-teal-400" />
                    LAKE HURON & GODERICH VESSELS (AIS)
                  </span>
                  <span className="text-[10px] font-mono text-teal-300">{vessels.length} SHIPS</span>
                </div>

                {vessels.slice(0, 8).map((vessel) => {
                  const isSelected = selectedVessel?.mmsi === vessel.mmsi;
                  return (
                    <div
                      key={vessel.mmsi}
                      onClick={() => {
                        if (onSelectVessel) onSelectVessel(isSelected ? null : vessel);
                      }}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-950/80 border-teal-400 text-teal-100 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-teal-300 truncate max-w-[170px]">
                          <Anchor className="w-3 h-3 text-teal-400 flex-shrink-0" />
                          {vessel.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {vessel.distanceKmToListowel} km
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {vessel.vesselType} • {vessel.destination || 'LAKE HURON'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">
                        <span>SPD: <span className="text-white font-bold">{vessel.speedKnots} kts</span></span>
                        <span>HDG: <span className="text-white font-bold">{vessel.headingDeg}°</span></span>
                        <span>FLAG: <span className="text-slate-300">{vessel.flag || 'AIS'}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Military Flights Section (api.adsb.lol/v2/mil) */}
            {milFlights.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-tactical font-bold text-red-400">
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    MILITARY AIR TRAFFIC (LIVE ADS-B)
                  </span>
                  <span className="text-[10px] font-mono text-red-300 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-500/40">
                    {milFlights.length} ACTIVE
                  </span>
                </div>

                {milFlights.slice(0, 8).map((ac) => {
                  const isSelected = selectedFlight?.icao24 === ac.hex;
                  return (
                    <div
                      key={ac.hex}
                      onClick={() => {
                        onSelectFlight(
                          isSelected
                            ? null
                            : {
                                icao24: ac.hex,
                                callsign: ac.callsign,
                                originCountry: 'MILITARY / DND',
                                latitude: ac.latitude,
                                longitude: ac.longitude,
                                altitudeMeters: ac.altitudeFeet ? Math.round(ac.altitudeFeet * 0.3048) : null,
                                altitudeFeet: ac.altitudeFeet,
                                velocityKmh: ac.speedKnots ? Math.round(ac.speedKnots * 1.852) : null,
                                trackHeading: ac.headingDeg,
                                verticalRate: null,
                                onGround: false,
                                squawk: ac.squawk || null,
                                distanceKmToListowel: ac.distanceKmToListowel,
                                aircraftType: ac.aircraftType || 'Military Airframe',
                                registration: ac.registration,
                              }
                        );
                      }}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/80 border-red-400 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-red-300 truncate max-w-[170px]">
                          <Plane className="w-3 h-3 text-red-400 flex-shrink-0" />
                          {ac.callsign}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {ac.distanceKmToListowel} km out
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {ac.aircraftType || 'Transponder Hex: ' + ac.hex}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">
                        <span>ALT: <span className="text-white font-bold">{ac.altitudeFeet ? ac.altitudeFeet.toLocaleString() + ' ft' : 'N/A'}</span></span>
                        <span>SPD: <span className="text-white font-bold">{ac.speedKnots ? ac.speedKnots + ' kts' : 'N/A'}</span></span>
                        <span>SQK: <span className="text-amber-300 font-bold">{ac.squawk || 'AUTO'}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REGIONAL SEISMIC ACTIVITY (USGS LIVE) */}
        {currentTab === 'seismic' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                REGIONAL SEISMIC MONITOR (USGS)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                {earthquakes.length} RECORDED (M2.0+)
              </span>
            </div>

            {earthquakes && earthquakes.length > 0 ? (
              <div className="space-y-2">
                {earthquakes.map((q) => (
                  <div key={q.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 font-bold text-[10px] border border-amber-500/40 font-mono">
                          M {q.magnitude}
                        </span>
                        <span className="truncate max-w-[210px]">{q.place}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                      <div>DEPTH: <span className="text-white font-semibold">{q.depthKm} km</span></div>
                      <div>TIME: <span className="text-slate-300">{q.time}</span></div>
                      <div className="col-span-2 text-cyan-300 font-semibold">
                        RANGE: <span className="text-white font-bold">{q.distanceKmToListowel} km</span> from Listowel
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs space-y-1.5">
                <Activity className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <div className="font-semibold text-slate-300">NO RECENT REGIONAL EVENTS</div>
                <div className="text-[10px] text-slate-500">USGS seismometer network reporting quiet baseline across Great Lakes basin (M2.0+).</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status bar */}
      <div className="p-2 border-t border-cyan-500/20 bg-slate-900/70 font-mono text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          AUTO-REFRESH: 15s
        </span>
        <span className="text-cyan-400">NORTH PERTH NET // ACTIVE</span>
      </div>
    </aside>
  );
};
