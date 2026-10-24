import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { LayerControlPanel } from './components/LayerControlPanel';
import { RightIntelPanel } from './components/RightIntelPanel';
import { MapView } from './components/Map';
import { KeySetupModal } from './components/KeySetupModal';
import { SpaceWeatherBar } from './components/SpaceWeatherBar';
import { AgriFuelModal } from './components/AgriFuelModal';
import {
  ActiveLayers,
  FlightData,
  RiverGaugeData,
  WeatherTelemetry,
  TrafficCamera,
  RoadCondition,
  HydroOutage,
  EmergencyDispatch,
  SchoolBusAlert,
  LiveIncidentEvent,
} from './services/types';
import {
  fetchLiveFlights,
  fetchRiverGauges,
  fetchWeatherTelemetry,
  fetchTrafficCameras,
  fetchRoadConditions,
  fetchLive511Incidents,
  DEFAULT_ONTARIO_511_KEY,
  NORTH_PERTH_COORDS,
} from './services/api';
import { fetchAuroraKp, fetchLiveIss, AuroraData, IssTelemetry } from './services/space';
import { calculateSquallTrajectory, SquallTrajectory } from './services/squall';
import {
  fetchLiveEarthquakes,
  fetchLiveNASAEvents,
  SeismicEvent,
  NaturalHazardEvent,
} from './services/hazards';
import { Layers, Activity, X, Sprout } from 'lucide-react';

export function App() {
  // 511 API Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem('ONTARIO_511_KEY') : null) ||
      DEFAULT_ONTARIO_511_KEY
    );
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isAgriModalOpen, setIsAgriModalOpen] = useState<boolean>(false);

  // Mobile drawer states: 'none' | 'layers' | 'intel'
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'layers' | 'intel'>('none');

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Layer visibility state
  const [layers, setLayers] = useState<ActiveLayers>({
    towns: true,
    radar: true,
    squall: true,
    flights: true,
    helipad: true,
    river: true,
    cams: true,
    roads: true,
    weather: true,
    hydro: false,
    dispatches: true,
    buses: false,
    satellites: true,
    seismic: true,
    hazards: true,
    drought: false,
  });

  const [radarOpacity, setRadarOpacity] = useState<number>(0.65);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);

  // Live Data states (empty initial state - strictly no simulated baseline)
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [riverGauges, setRiverGauges] = useState<RiverGaugeData[]>([]);
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [cameras, setCameras] = useState<TrafficCamera[]>([]);
  const [roads, setRoads] = useState<RoadCondition[]>([]);
  const [outages, setOutages] = useState<HydroOutage[]>([]);
  const [dispatches, setDispatches] = useState<EmergencyDispatch[]>([]);
  const [buses, setBuses] = useState<SchoolBusAlert[]>([]);
  const [aurora, setAurora] = useState<AuroraData | null>(null);
  const [iss, setIss] = useState<IssTelemetry | null>(null);
  const [squallTrajectory, setSquallTrajectory] = useState<SquallTrajectory | null>(null);
  const [incidents, setIncidents] = useState<LiveIncidentEvent[]>([]);
  const [earthquakes, setEarthquakes] = useState<SeismicEvent[]>([]);
  const [nasaEvents, setNasaEvents] = useState<NaturalHazardEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load all live feeds
  const refreshAllFeeds = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        fetchLiveFlights(),
        fetchRiverGauges(),
        fetchWeatherTelemetry(),
        fetchTrafficCameras(apiKey),
        fetchRoadConditions(apiKey),
        fetchAuroraKp(),
        fetchLiveIss(),
        fetchLive511Incidents(apiKey),
        fetchLiveEarthquakes(),
        fetchLiveNASAEvents(),
      ]);

      if (results[0].status === 'fulfilled') setFlights(results[0].value);
      if (results[1].status === 'fulfilled') setRiverGauges(results[1].value);
      if (results[2].status === 'fulfilled') {
        const weatherData = results[2].value;
        setWeather(weatherData);
        if (weatherData) {
          const squall = calculateSquallTrajectory(
            weatherData.windDirectionDeg,
            weatherData.windSpeedKmh,
            weatherData.temperatureC
          );
          setSquallTrajectory(squall);
        }
      }
      if (results[3].status === 'fulfilled') setCameras(results[3].value);
      if (results[4].status === 'fulfilled') setRoads(results[4].value);
      if (results[5].status === 'fulfilled') setAurora(results[5].value);
      if (results[6].status === 'fulfilled') setIss(results[6].value);
      if (results[7].status === 'fulfilled') setIncidents(results[7].value);
      if (results[8].status === 'fulfilled') setEarthquakes(results[8].value);
      if (results[9].status === 'fulfilled') setNasaEvents(results[9].value);


    } catch (err) {
      console.error('Error refreshing feeds:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [apiKey]);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('ONTARIO_511_KEY', newKey);
    } else {
      localStorage.removeItem('ONTARIO_511_KEY');
    }
    setTimeout(() => refreshAllFeeds(), 100);
  };

  useEffect(() => {
    // Initial fetch in background
    refreshAllFeeds();

    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
    // 45s on mobile / cellular to conserve data & battery, 20s on desktop
    const pollIntervalMs = isMobileDevice ? 45000 : 20000;

    let intervalId: any = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (!document.hidden) {
            refreshAllFeeds();
          }
        }, pollIntervalMs);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        refreshAllFeeds();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshAllFeeds]);

  const handleToggleLayer = (key: keyof ActiveLayers) => {
    setLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRecenter = () => {
    window.location.reload();
  };

  const handleSelectFlight = (flight: FlightData | null) => {
    setSelectedFlight(flight);
    if (flight) {
      setMobileDrawer('none');
    }
  };

  const handleTrackIss = () => {
    if (iss) {
      setLayers((prev) => ({ ...prev, satellites: true }));
      // Focus map on ISS coordinates
      window.dispatchEvent(
        new CustomEvent('focus-coordinates', {
          detail: { coords: [iss.latitude, iss.longitude], zoom: 4 },
        })
      );
    }
  };

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  const criticalAlert = useMemo(() => {
    const ornge = flights.find((f) => f.callsign.includes('ORNGE') || f.callsign.includes('MEDEVAC'));
    if (ornge && ornge.distanceKmToListowel < 25) {
      return `ORNGE MEDEVAC INBOUND // ${ornge.distanceKmToListowel}KM`;
    }
    const closure = incidents.find((i) => i.isFullClosure);
    if (closure) {
      return `HIGHWAY CLOSURE: ${closure.road.toUpperCase()}`;
    }
    const mainRiver = riverGauges.find((g) => g.stationId === '02FE003');
    if (mainRiver && mainRiver.floodStageAlert !== 'NORMAL') {
      return `MAITLAND RIVER ${mainRiver.floodStageAlert} // ${mainRiver.waterLevelMeters.toFixed(2)}M`;
    }
    if (weather && weather.windGustsKmh >= 60) {
      return `HIGH WIND GUSTS: ${weather.windGustsKmh} KM/H`;
    }
    return null;
  }, [flights, incidents, riverGauges, weather]);

  const handleApplyPreset = (preset: 'all' | 'weather' | 'corridors' | 'airspace') => {
    if (preset === 'all') {
      setLayers({
        towns: true,
        radar: true,
        squall: true,
        flights: true,
        helipad: true,
        river: true,
        cams: true,
        roads: true,
        weather: true,
        hydro: true,
        dispatches: true,
        buses: true,
        satellites: true,
      });
    } else if (preset === 'weather') {
      setLayers({
        towns: true,
        radar: true,
        squall: true,
        flights: false,
        helipad: false,
        river: true,
        cams: false,
        roads: false,
        weather: true,
        hydro: false,
        dispatches: false,
        buses: false,
        satellites: false,
      });
    } else if (preset === 'corridors') {
      setLayers({
        towns: true,
        radar: false,
        squall: false,
        flights: false,
        helipad: false,
        river: false,
        cams: true,
        roads: true,
        weather: false,
        hydro: true,
        dispatches: true,
        buses: true,
        satellites: false,
      });
    } else if (preset === 'airspace') {
      setLayers({
        towns: true,
        radar: false,
        squall: false,
        flights: true,
        helipad: true,
        river: false,
        cams: false,
        roads: false,
        weather: false,
        hydro: false,
        dispatches: false,
        buses: false,
        satellites: true,
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#070a11] text-slate-100 select-none">
      {/* Top HUD Bar */}
      <HeaderHUD
        weather={weather}
        onRecenter={handleRecenter}
        onRefresh={refreshAllFeeds}
        isRefreshing={isRefreshing}
        activeLayersCount={activeLayersCount}
        hasApiKey={Boolean(apiKey)}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        criticalAlert={criticalAlert}
      />

      {/* Space Weather & Aurora Kp Ticker */}
      <SpaceWeatherBar aurora={aurora} iss={iss} onTrackIss={handleTrackIss} />

      {/* Key Setup Modal */}
      <KeySetupModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaveKey={handleSaveApiKey}
        currentKey={apiKey}
      />

      {/* Agri & Fuel Intel Modal */}
      <AgriFuelModal
        isOpen={isAgriModalOpen}
        onClose={() => setIsAgriModalOpen(false)}
        weather={weather}
        isDroughtLayerActive={Boolean(layers.drought)}
        onToggleDroughtLayer={() => handleToggleLayer('drought')}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP Left Layer Control */}
        <div className="hidden lg:flex flex-shrink-0">
          <LayerControlPanel
            layers={layers}
            onToggleLayer={handleToggleLayer}
            radarOpacity={radarOpacity}
            onChangeRadarOpacity={setRadarOpacity}
            flightCount={flights.length}
          />
        </div>

        {/* Central Tactical Map HUD */}
        <main className="flex-1 relative h-full w-full overflow-hidden">
          <MapView
            layers={layers}
            flights={flights}
            riverGauges={riverGauges}
            cameras={cameras}
            roads={roads}
            outages={outages}
            selectedFlight={selectedFlight}
            onSelectFlight={handleSelectFlight}
            radarOpacity={radarOpacity}
            squallTrajectory={squallTrajectory}
            iss={iss}
            incidents={incidents}
            earthquakes={earthquakes}
            onApplyPreset={handleApplyPreset}
          />

          {/* Quick Floating Toggles (Desktop & Mobile) */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
            {/* Left Buttons: Mobile Drawer + Agri Modal Trigger */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setMobileDrawer((prev) => (prev === 'layers' ? 'none' : 'layers'))}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs shadow-lg backdrop-blur-md active:scale-95 transition-transform cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Layers</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              </button>

              <button
                onClick={() => setIsAgriModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-mono text-xs shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                title="Open Delta-T Spraying Window & Grain Bids"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Delta-T / Agri</span>
                <span className="sm:hidden">Agri</span>
              </button>
            </div>

            {/* Right Buttons: Mobile Sitrep Drawer */}
            <div className="lg:hidden pointer-events-auto">
              <button
                onClick={() => setMobileDrawer((prev) => (prev === 'intel' ? 'none' : 'intel'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/50 text-amber-300 font-mono text-xs shadow-lg backdrop-blur-md active:scale-95 transition-transform cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Sitrep ({flights.length})</span>
              </button>
            </div>
          </div>
        </main>

        {/* DESKTOP Right Intel Panel */}
        <div className="hidden lg:flex flex-shrink-0">
          <RightIntelPanel
            weather={weather}
            riverGauges={riverGauges}
            flights={flights}
            outages={outages}
            dispatches={dispatches}
            buses={buses}
            incidents={incidents}
            earthquakes={earthquakes}
            nasaEvents={nasaEvents}
            selectedFlight={selectedFlight}
            onSelectFlight={handleSelectFlight}
            onOpenAgriModal={() => setIsAgriModalOpen(true)}
          />
        </div>

        {/* MOBILE Slide-out Drawer: Layers */}
        {mobileDrawer === 'layers' && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setMobileDrawer('none')} />
            <div className="relative z-50 w-full max-h-[80dvh] flex flex-col bg-slate-950 border-t border-cyan-500/40 shadow-2xl animate-slide-up rounded-t-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-tactical text-sm font-bold text-white tracking-wider">
                    INTELLIGENCE LAYERS
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawer('none')}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LayerControlPanel
                  layers={layers}
                  onToggleLayer={handleToggleLayer}
                  radarOpacity={radarOpacity}
                  onChangeRadarOpacity={setRadarOpacity}
                  flightCount={flights.length}
                />
              </div>
            </div>
          </div>
        )}

        {/* MOBILE Slide-out Drawer: Intel & Radio Scanner */}
        {mobileDrawer === 'intel' && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setMobileDrawer('none')} />
            <div className="relative z-50 w-full max-h-[82dvh] flex flex-col bg-slate-950 border-t border-amber-500/40 shadow-2xl animate-slide-up rounded-t-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-amber-500/20 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="font-tactical text-sm font-bold text-white tracking-wider">
                    SITREP, INCIDENTS & AIRSPACE
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawer('none')}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <RightIntelPanel
                  weather={weather}
                  riverGauges={riverGauges}
                  flights={flights}
                  outages={outages}
                  dispatches={dispatches}
                  buses={buses}
                  incidents={incidents}
                  earthquakes={earthquakes}
                  nasaEvents={nasaEvents}
                  selectedFlight={selectedFlight}
                  onSelectFlight={handleSelectFlight}
                  onOpenAgriModal={() => {
                    setMobileDrawer('none');
                    setIsAgriModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
