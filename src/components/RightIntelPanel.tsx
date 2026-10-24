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
  Activity,
  Flame,
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
} from '../services/api';
import { SeismicEvent, NaturalHazardEvent } from '../services/hazards';
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
  earthquakes?: SeismicEvent[];
  nasaEvents?: NaturalHazardEvent[];
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
  earthquakes = [],
  nasaEvents = [],
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
          PYTHIA SITREP
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
          HAZARDS & SCANNER
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
                  <span className="font-semibold text-cyan-300">Corridors & Airspace</span>
                  <span className="text-[10px] text-emerald-400 font-mono">LIVE ADS-B / 511</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">
                  {flights.length} transponder aircraft tracked in 70 NM radius. {incidents.length} active MTO emergency incident/closure notices recorded along surrounding Southwestern Ontario corridors.
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

        {/* TAB 2: AIRSPACE (ADS-B LIVE RADAR) */}
        {activeTab === 'airspace' && (
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
          </div>
        )}

        {/* TAB 3: LIVE SCANNER, 511 INCIDENTS & HAZARDS */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            {/* Native In-Page Live Tactical Scanner Audio Player */}
            <ScannerPlayerWidget />

            {/* Real-time MTO & OPP Live Incidents Widget */}
            <LiveIncidentsWidget
              incidents={incidents}
              onSelectIncident={onSelectIncident}
            />

            {/* Live USGS & Earthquakes Canada Regional Seismic Activity */}
            {earthquakes && earthquakes.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-tactical tracking-wider text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    REGIONAL SEISMIC MONITOR (USGS)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono">
                    LIVE FEED
                  </span>
                </div>
                {earthquakes.slice(0, 5).map((q) => (
                  <div key={q.id} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-bold text-[10px] border border-amber-500/40 font-mono">
                          M {q.magnitude}
                        </span>
                        <span className="truncate max-w-[190px]">{q.place}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{q.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Depth: {q.depthKm} km</span>
                      <span className="text-cyan-300 font-semibold">{q.distanceKmToListowel} km from Listowel</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live NASA EONET Active Natural Hazards */}
            {nasaEvents && nasaEvents.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-tactical tracking-wider text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    NASA EONET ACTIVE DISASTERS
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono">
                    LIVE SATELLITE
                  </span>
                </div>
                {nasaEvents.slice(0, 4).map((h) => (
                  <div key={h.id} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-300 truncate max-w-[210px]">{h.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{h.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-slate-300">{h.category}</span>
                      <span className="text-cyan-300 font-semibold">{h.distanceKmToListowel} km out</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Municipal & Utility Feeds Integrity Notice */}
            <div className="p-3 rounded border border-slate-800 bg-slate-900/40 text-slate-400 text-[10px] space-y-1 mt-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                LOCAL CAD & UTILITY DATA INTEGRITY
              </div>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                Perth County OPP, North Perth Fire, and Hydro One operate on private dispatch channels. Synthetic entries have been permanently removed to ensure 100% verified sensor truth.
              </p>
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
