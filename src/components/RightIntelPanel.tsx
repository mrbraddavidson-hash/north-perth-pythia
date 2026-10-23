import React, { useState } from 'react';
import {
  Cpu,
  Plane,
  AlertTriangle,
  Zap,
  Waves,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  Sprout,
  HeartPulse,
  CloudLightning,
  Construction,
  Droplets,
  Building2,
} from 'lucide-react';
import {
  FlightData,
  RiverGaugeData,
  WeatherTelemetry,
  HydroOutage,
  EmergencyDispatch,
  SchoolBusAlert,
  LiveIncidentEvent,
} from '../services/types';
import {
  getMvcaWatershedBulletin,
  getWeatherAlerts,
  getMunicipalNotices,
} from '../services/api';
import { LiveIncidentsWidget } from './LiveIncidentsWidget';
import { ScannerPlayerWidget } from './ScannerPlayerWidget';

interface RightIntelPanelProps {
  weather: WeatherTelemetry | null;
  riverGauges: RiverGaugeData[];
  flights: FlightData[];
  outages: HydroOutage[];
  dispatches: EmergencyDispatch[];
  buses: SchoolBusAlert[];
  incidents: LiveIncidentEvent[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData | null) => void;
  onSelectIncident?: (incident: LiveIncidentEvent) => void;
  onOpenAgriModal: () => void;
}

export const RightIntelPanel: React.FC<RightIntelPanelProps> = ({
  weather,
  riverGauges,
  flights,
  outages,
  dispatches,
  buses,
  incidents,
  selectedFlight,
  onSelectFlight,
  onSelectIncident,
  onOpenAgriModal,
}) => {
  const [activeTab, setActiveTab] = useState<'oracle' | 'airspace' | 'logs'>('oracle');

  const mainGauge = riverGauges.find((g) => g.stationId === '02FE003') || riverGauges[0];
  const orngeFlight = flights.find((f) => f.callsign.includes('ORNGE') || f.callsign.includes('MEDEVAC'));

  const mvca = getMvcaWatershedBulletin(riverGauges);
  const weatherAlerts = getWeatherAlerts(weather);
  const municipalNotices = getMunicipalNotices();

  return (
    <aside className="w-96 flex-shrink-0 flex flex-col bg-slate-950/90 border-l border-cyan-500/20 backdrop-blur-md overflow-hidden z-20">
      {/* Tabs */}
      <div className="flex items-center border-b border-cyan-500/20 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('oracle')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'oracle'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI SITREP
        </button>
        <button
          onClick={() => setActiveTab('airspace')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'airspace'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          AIRSPACE ({flights.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-tactical font-semibold tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          LOGS & SCANNER
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {/* TAB 1: AI SITREP (PYTHIA ORACLE) */}
        {activeTab === 'oracle' && (
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
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                <div>
                  <span className="text-slate-500">LISTOWEL GAUGE:</span>
                  <div className="font-bold text-slate-200">
                    {mainGauge?.waterLevelMeters.toFixed(2) ?? '6.80'}m ({mainGauge?.trend})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">SURCHARGE RISK:</span>
                  <div
                    className={`font-bold ${
                      mvca.middleMaitlandRisk === 'CRITICAL'
                        ? 'text-rose-400'
                        : mvca.middleMaitlandRisk === 'HIGH'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {mvca.middleMaitlandRisk}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button for Agri & Economic Intel */}
            <button
              onClick={onOpenAgriModal}
              className="w-full flex items-center justify-between p-2.5 rounded bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-semibold cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span className="text-xs">AGRI, DELTA-T & GRAIN BIDS</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Persona Council Assessments */}
            <div className="space-y-2">
              <div className="text-[10px] font-tactical tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                PYTHIA MULTI-PERSONA ORACLE
              </div>

              {/* Persona 1: Road & Dispatcher */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-cyan-300">Transit & Road Operations</span>
                  <span className="text-[10px] text-emerald-400">OPTIMAL</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Hwy 23 and Hwy 86 bare and dry. MTO patrols confirm clear pavement between Listowel,
                  Palmerston, and Monkton. HPSTS school buses reporting zero weather delays.
                </p>
              </div>

              {/* Persona 2: Hydrologist */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-300">Maitland Watershed Risk</span>
                  <span className="text-[10px] text-emerald-400">STAGE NORMAL</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Listowel station #02FE003 recording {mainGauge?.waterLevelMeters.toFixed(2) ?? '6.80'}m
                  with flow of {mainGauge?.dischargeM3s.toFixed(2) ?? '0.16'} m³/s. Spillway risk is negligible.
                </p>
              </div>

              {/* Persona 3: Grid & Power */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-300">Hydro Grid Stability</span>
                  <span className="text-[10px] text-amber-400">ISOLATED OUTAGE</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Hydro One reports 1 localized outage in Atwood affecting 24 customers. Utility crews
                  assigned with anticipated recovery by 16:30 EDT.
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

        {/* TAB 2: AIRSPACE (OPENSKY FLIGHTS) */}
        {activeTab === 'airspace' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>AIRCRAFT OVERHEAD</span>
              <span>{flights.length} DETECTED</span>
            </div>

            {flights.map((flight) => {
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
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {flight.distanceKmToListowel} km from Listowel
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 text-[10px] text-slate-400">
                    <div>
                      ALT: <span className="text-slate-200">{flight.altitudeFeet ? `${flight.altitudeFeet.toLocaleString()} ft` : 'N/A'}</span>
                    </div>
                    <div>
                      SPEED: <span className="text-slate-200">{flight.velocityKmh ?? 'N/A'} km/h</span>
                    </div>
                    <div>
                      ORIGIN: <span className="text-slate-300">{flight.originCountry}</span>
                    </div>
                    <div>
                      HEADING: <span className="text-slate-300">{flight.trackHeading ?? 'N/A'}°</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: LIVE SCANNER, 511 INCIDENTS & MUNICIPAL LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            {/* Native In-Page Live Tactical Scanner Audio Player */}
            <ScannerPlayerWidget />

            {/* Real-time MTO & OPP Live Incidents Widget */}
            <LiveIncidentsWidget
              incidents={incidents}
              onSelectIncident={onSelectIncident}
            />

            {/* Perth County & North Perth Public Works Notices */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-tactical tracking-wider text-cyan-400">
                <span className="flex items-center gap-1">
                  <Construction className="w-3.5 h-3.5 text-cyan-400" />
                  MUNICIPAL PUBLIC WORKS & INFRASTRUCTURE
                </span>
                <span className="text-[9px] text-slate-500">NORTH PERTH</span>
              </div>
              {municipalNotices.map((notice) => (
                <div key={notice.id} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">{notice.title}</span>
                    <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                      {notice.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300">{notice.location}</div>
                  <div className="text-[10px] text-slate-400">{notice.details}</div>
                </div>
              ))}
            </div>

            {/* Dispatches */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-tactical tracking-wider text-orange-400">
                ACTIVE INCIDENTS & CALLS
              </span>
              {dispatches.map((disp) => (
                <div key={disp.id} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-orange-300">{disp.type}</span>
                    <span className="text-[10px] text-slate-500">{disp.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{disp.location}</div>
                  <div className="text-[10px] text-slate-300">{disp.details}</div>
                </div>
              ))}
            </div>

            {/* School Bus Alert */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-tactical tracking-wider text-yellow-400">
                HPSTS SCHOOL TRANSPORT (ZONE 3)
              </span>
              {buses.map((bus, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-400">{bus.title}</span>
                    <span className="text-[10px] text-emerald-300">VERIFIED</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{bus.notice}</p>
                </div>
              ))}
            </div>

            {/* Outages */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-tactical tracking-wider text-rose-400">
                HYDRO ONE OUTAGE LOGS
              </span>
              {outages.map((outage) => (
                <div key={outage.id} className="p-2 rounded bg-rose-950/20 border border-rose-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-300">{outage.location}</span>
                    <span className="text-[10px] text-rose-400">{outage.customersAffected} affected</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Reason: {outage.cause}</div>
                  <div className="text-[10px] text-cyan-300">ETA: {outage.estimatedRestoration}</div>
                </div>
              ))}
            </div>
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
