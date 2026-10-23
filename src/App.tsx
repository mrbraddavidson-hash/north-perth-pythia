import React, { useState, useEffect, useCallback } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { LayerControlPanel } from './components/LayerControlPanel';
import { RightIntelPanel } from './components/RightIntelPanel';
import { MapView } from './components/Map';
import { KeySetupModal } from './components/KeySetupModal';
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
} from './services/types';
import {
  fetchLiveFlights,
  fetchRiverGauges,
  fetchWeatherTelemetry,
  fetchTrafficCameras,
  fetchRoadConditions,
  DEFAULT_ONTARIO_511_KEY,
  getHydroOutages,
  getEmergencyDispatches,
  getSchoolBusAlerts,
  NORTH_PERTH_COORDS,
} from './services/api';
import { Layers, Activity, X } from 'lucide-react';

export function App() {
  // 511 API Key state (defaults to user's registered key)
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem('ONTARIO_511_KEY') : null) ||
      DEFAULT_ONTARIO_511_KEY
    );
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  // Mobile drawer states: 'none' | 'layers' | 'intel'
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'layers' | 'intel'>('none');

  // Layer visibility state
  const [layers, setLayers] = useState<ActiveLayers>({
    towns: true,
    radar: true,
    flights: true,
    river: true,
    cams: true,
    roads: true,
    weather: true,
    hydro: true,
    dispatches: true,
    buses: true,
    satellites: false,
  });

  const [radarOpacity, setRadarOpacity] = useState<number>(0.65);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);

  // Data states
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [riverGauges, setRiverGauges] = useState<RiverGaugeData[]>([]);
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [cameras, setCameras] = useState<TrafficCamera[]>([]);
  const [roads, setRoads] = useState<RoadCondition[]>([]);
  const [outages, setOutages] = useState<HydroOutage[]>([]);
  const [dispatches, setDispatches] = useState<EmergencyDispatch[]>([]);
  const [buses, setBuses] = useState<SchoolBusAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load static & dynamic feeds
  const refreshAllFeeds = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [flightsData, riverData, weatherData, camsData, roadsData] = await Promise.all([
        fetchLiveFlights(),
        fetchRiverGauges(),
        fetchWeatherTelemetry(),
        fetchTrafficCameras(apiKey),
        fetchRoadConditions(apiKey),
      ]);

      setFlights(flightsData);
      setRiverGauges(riverData);
      setWeather(weatherData);
      setCameras(camsData);
      setRoads(roadsData);

      // Static / local municipal feeds
      setOutages(getHydroOutages());
      setDispatches(getEmergencyDispatches());
      setBuses(getSchoolBusAlerts());
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
    refreshAllFeeds();
    const interval = setInterval(refreshAllFeeds, 20000);
    return () => clearInterval(interval);
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
      // Close drawer on mobile so user sees the aircraft on map
      setMobileDrawer('none');
    }
  };

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

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
      />

      {/* Key Setup Modal */}
      <KeySetupModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaveKey={handleSaveApiKey}
        currentKey={apiKey}
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

        {/* Central Tactical Map (Full screen on mobile) */}
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
          />

          {/* Mobile Quick Floating Drawer Toggles (Top Corners) */}
          <div className="lg:hidden absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
            <button
              onClick={() => setMobileDrawer((prev) => (prev === 'layers' ? 'none' : 'layers'))}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs shadow-lg backdrop-blur-md active:scale-95 transition-transform"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Layers</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            </button>

            <button
              onClick={() => setMobileDrawer((prev) => (prev === 'intel' ? 'none' : 'intel'))}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/50 text-amber-300 font-mono text-xs shadow-lg backdrop-blur-md active:scale-95 transition-transform"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Sitrep / Planes ({flights.length})</span>
            </button>
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
            selectedFlight={selectedFlight}
            onSelectFlight={handleSelectFlight}
          />
        </div>

        {/* MOBILE Slide-out Overlay Drawer (Layers) */}
        {mobileDrawer === 'layers' && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div
              className="absolute inset-0"
              onClick={() => setMobileDrawer('none')}
            />
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

        {/* MOBILE Slide-out Overlay Drawer (Intel / Sitrep / Airspace) */}
        {mobileDrawer === 'intel' && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div
              className="absolute inset-0"
              onClick={() => setMobileDrawer('none')}
            />
            <div className="relative z-50 w-full max-h-[82dvh] flex flex-col bg-slate-950 border-t border-amber-500/40 shadow-2xl animate-slide-up rounded-t-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-amber-500/20 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="font-tactical text-sm font-bold text-white tracking-wider">
                    SITREP & AIRSPACE
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
                  selectedFlight={selectedFlight}
                  onSelectFlight={handleSelectFlight}
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
