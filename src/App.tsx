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

export function App() {
  // 511 API Key state (defaults to user's registered key)
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem('ONTARIO_511_KEY') : null) ||
      DEFAULT_ONTARIO_511_KEY
    );
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

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
    // Fast telemetry poll for aircraft & weather every 20 seconds
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
    // Reload / trigger window dispatch for map reset if needed
    window.location.reload();
  };

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a11] text-slate-100 select-none">
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

      {/* Main Workspace: Left Layers | Central Map | Right Sitrep */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Layer Control */}
        <LayerControlPanel
          layers={layers}
          onToggleLayer={handleToggleLayer}
          radarOpacity={radarOpacity}
          onChangeRadarOpacity={setRadarOpacity}
          flightCount={flights.length}
        />

        {/* Central Tactical Map HUD */}
        <main className="flex-1 relative h-full overflow-hidden">
          <MapView
            layers={layers}
            flights={flights}
            riverGauges={riverGauges}
            cameras={cameras}
            roads={roads}
            outages={outages}
            selectedFlight={selectedFlight}
            onSelectFlight={setSelectedFlight}
            radarOpacity={radarOpacity}
          />

          {/* Quick Tactical Overlays */}
          <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center gap-2">
            <div className="px-2.5 py-1 rounded bg-slate-950/85 border border-cyan-500/30 font-mono text-[11px] text-cyan-300 backdrop-blur-sm">
              <span className="text-slate-500">SECTOR:</span> NORTH PERTH [LISTOWEL]
            </div>
            {layers.radar && (
              <div className="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 font-mono text-[10px] text-cyan-400 backdrop-blur-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                EXETER DOPPLER ACTIVE
              </div>
            )}
          </div>
        </main>

        {/* Right Intelligence Sitrep & Airspace Panel */}
        <RightIntelPanel
          weather={weather}
          riverGauges={riverGauges}
          flights={flights}
          outages={outages}
          dispatches={dispatches}
          buses={buses}
          selectedFlight={selectedFlight}
          onSelectFlight={setSelectedFlight}
        />
      </div>
    </div>
  );
}

export default App;
