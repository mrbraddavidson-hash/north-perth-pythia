import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { LayerControlPanel } from './components/LayerControlPanel';
import { RightIntelPanel } from './components/RightIntelPanel';
import { MapView } from './components/Map';
import { SpaceWeatherBar } from './components/SpaceWeatherBar';
import { AgriFuelModal } from './components/AgriFuelModal';
import {
  ActiveLayers,
  FlightData,
  RiverGaugeData,
  WeatherTelemetry,
  OpticMode,
} from './services/types';
import { fetchLiveLakeHuronVessels, MaritimeVessel } from './services/maritime';
import {
  fetchLiveFlights,
  fetchRiverGauges,
  fetchWeatherTelemetry,
  NORTH_PERTH_COORDS,
} from './services/api';
import { fetchAuroraKp, fetchLiveIss, AuroraData, IssTelemetry } from './services/space';
import { calculateSquallTrajectory, SquallTrajectory } from './services/squall';
import {
  fetchLiveEarthquakes,
  SeismicEvent,
} from './services/hazards';
import { fetchLiveMilitaryFlights, MilitaryFlight } from './services/godseye';
import { Layers, Activity, X, Sprout, CloudSun } from 'lucide-react';

export function App() {
  const [isAgriModalOpen, setIsAgriModalOpen] = useState<boolean>(false);

  // Desktop sidebars visibility state (Default to false so the map takes up 100% of the screen!)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [rightPanelTab, setRightPanelTab] = useState<'oracle' | 'weather' | 'airspace' | 'seismic'>('weather');

  // Trigger map canvas resize recalculation when panels open or close
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    return () => clearTimeout(timer);
  }, [isLeftPanelOpen, isRightPanelOpen]);

  // Mobile drawer states: 'none' | 'layers' | 'intel'
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'layers' | 'intel'>('none');

  // Layer visibility state - ONLY verified functioning live feeds
  const [layers, setLayers] = useState<ActiveLayers>({
    towns: true,
    radar: true,
    squall: true,
    flights: true,
    military: true,
    river: true,
    weather: true,
    maritime: true,
    helipad: true,
    seismic: true,
    drought: false,
    satellites: true,
  });

  const [radarOpacity, setRadarOpacity] = useState<number>(0.65);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<MaritimeVessel | null>(null);
  const [opticMode, setOpticMode] = useState<OpticMode>('normal');

  // Live Data states (empty initial state - strictly no simulated baseline)
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [vessels, setVessels] = useState<MaritimeVessel[]>([]);
  const [milFlights, setMilFlights] = useState<MilitaryFlight[]>([]);
  const [riverGauges, setRiverGauges] = useState<RiverGaugeData[]>([]);
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [aurora, setAurora] = useState<AuroraData | null>(null);
  const [iss, setIss] = useState<IssTelemetry | null>(null);
  const [squallTrajectory, setSquallTrajectory] = useState<SquallTrajectory | null>(null);
  const [earthquakes, setEarthquakes] = useState<SeismicEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load all live feeds
  const refreshAllFeeds = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        fetchLiveFlights(),
        fetchRiverGauges(),
        fetchWeatherTelemetry(),
        fetchAuroraKp(),
        fetchLiveIss(),
        fetchLiveEarthquakes(),
        fetchLiveLakeHuronVessels(),
        fetchLiveMilitaryFlights(),
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
      if (results[3].status === 'fulfilled') setAurora(results[3].value);
      if (results[4].status === 'fulfilled') setIss(results[4].value);
      if (results[5].status === 'fulfilled') setEarthquakes(results[5].value);
      if (results[6].status === 'fulfilled') setVessels(results[6].value);
      if (results[7].status === 'fulfilled') setMilFlights(results[7].value);

    } catch (err) {
      console.error('Error refreshing feeds:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshAllFeeds();
    const interval = setInterval(() => {
      if (!document.hidden) refreshAllFeeds();
    }, 20000);
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
      setMobileDrawer('none');
    }
  };

  const handleTrackIss = () => {
    if (iss) {
      setLayers((prev) => ({ ...prev, satellites: true }));
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
    const mainRiver = riverGauges.find((g) => g.stationId === '02FE003');
    if (mainRiver && mainRiver.floodStageAlert !== 'NORMAL') {
      return `MAITLAND RIVER ${mainRiver.floodStageAlert} // ${mainRiver.waterLevelMeters.toFixed(2)}M`;
    }
    if (weather && weather.windGustsKmh >= 60) {
      return `HIGH WIND GUSTS: ${weather.windGustsKmh} KM/H`;
    }
    return null;
  }, [flights, riverGauges, weather]);

  const handleApplyPreset = (preset: 'all' | 'weather' | 'rivers' | 'airspace') => {
    if (preset === 'all') {
      setLayers({
        towns: true,
        radar: true,
        squall: true,
        flights: true,
        military: true,
        river: true,
        weather: true,
        maritime: true,
        helipad: true,
        seismic: true,
        drought: false,
        satellites: true,
      });
    } else if (preset === 'weather') {
      setLayers({
        towns: true,
        radar: true,
        squall: true,
        flights: false,
        military: false,
        river: true,
        weather: true,
        maritime: false,
        helipad: false,
        seismic: false,
        drought: true,
        satellites: false,
      });
    } else if (preset === 'rivers') {
      setLayers({
        towns: true,
        radar: true,
        squall: false,
        flights: false,
        military: false,
        river: true,
        weather: true,
        maritime: false,
        helipad: true,
        seismic: false,
        drought: true,
        satellites: false,
      });
    } else if (preset === 'airspace') {
      setLayers({
        towns: true,
        radar: false,
        squall: false,
        flights: true,
        military: true,
        river: false,
        weather: false,
        maritime: true,
        helipad: true,
        seismic: false,
        drought: false,
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
        criticalAlert={criticalAlert}
        opticMode={opticMode}
        onChangeOpticMode={setOpticMode}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleLeftPanel={() => setIsLeftPanelOpen((prev) => !prev)}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={(tab) => {
          if (tab) {
            setRightPanelTab(tab);
            setIsRightPanelOpen(true);
          } else {
            setIsRightPanelOpen((prev) => !prev);
          }
        }}
        rightPanelTab={rightPanelTab}
        onCollapseAllPanels={() => {
          setIsLeftPanelOpen(false);
          setIsRightPanelOpen(false);
        }}
      />

      {/* Space Weather & Aurora Kp Ticker */}
      <SpaceWeatherBar aurora={aurora} iss={iss} onTrackIss={handleTrackIss} />

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
        {/* DESKTOP Left Layer Control (Collapsible for Full Map Clarity) */}
        {isLeftPanelOpen && (
          <div className="hidden lg:flex flex-shrink-0 animate-slide-right transition-all">
            <LayerControlPanel
              layers={layers}
              onToggleLayer={handleToggleLayer}
              radarOpacity={radarOpacity}
              onChangeRadarOpacity={setRadarOpacity}
              flightCount={flights.length}
              vesselCount={vessels.length}
              milFlightCount={milFlights.length}
              onClose={() => setIsLeftPanelOpen(false)}
            />
          </div>
        )}

        {/* Central Tactical Map HUD */}
        <main className="flex-1 relative h-full w-full overflow-hidden">
          <MapView
            layers={layers}
            flights={flights}
            riverGauges={riverGauges}
            selectedFlight={selectedFlight}
            onSelectFlight={handleSelectFlight}
            radarOpacity={radarOpacity}
            squallTrajectory={squallTrajectory}
            iss={iss}
            earthquakes={earthquakes}
            onApplyPreset={handleApplyPreset}
            vessels={vessels}
            opticMode={opticMode}
            onChangeOpticMode={setOpticMode}
            selectedVessel={selectedVessel}
            onSelectVessel={setSelectedVessel}
            milFlights={milFlights}
          />

          {/* Quick Floating Toggles (Desktop & Mobile) */}
          <div className="absolute top-12 sm:top-14 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
            {/* Left Buttons: Layers + Agri Modal Trigger */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {!isLeftPanelOpen && (
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setMobileDrawer('layers');
                    } else {
                      setIsLeftPanelOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/50 text-cyan-300 font-mono text-xs shadow-xl backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                  title="Open Map Layers Control"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LAYERS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                </button>
              )}

              <button
                onClick={() => setIsAgriModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-mono text-xs shadow-xl backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                title="Open Delta-T Spraying Window & Grain Bids"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Delta-T / Agri</span>
                <span className="sm:hidden">Agri</span>
              </button>
            </div>

            {/* Right Buttons: Floating Weather & Sitrep Trigger */}
            <div className="pointer-events-auto">
              {!isRightPanelOpen && (
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setMobileDrawer('intel');
                    } else {
                      setRightPanelTab('weather');
                      setIsRightPanelOpen(true);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/50 text-slate-200 font-mono text-xs shadow-xl backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                  title="Open Live Weather & Telemetry Sidebar"
                >
                  <CloudSun className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-cyan-300 font-bold">{weather?.temperatureC ?? '--'}°C</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">{weather?.conditionLabel ?? 'Weather'}</span>
                  <span className="text-[10px] text-cyan-400 font-bold">◀ INTEL</span>
                </button>
              )}
            </div>
          </div>
        </main>

        {/* DESKTOP Right Intel Panel (Collapsible for Full Map Clarity) */}
        {isRightPanelOpen && (
          <div className="hidden lg:flex flex-shrink-0 animate-slide-left transition-all">
            <RightIntelPanel
              weather={weather}
              riverGauges={riverGauges}
              flights={flights}
              earthquakes={earthquakes}
              selectedFlight={selectedFlight}
              onSelectFlight={handleSelectFlight}
              onOpenAgriModal={() => setIsAgriModalOpen(true)}
              vessels={vessels}
              selectedVessel={selectedVessel}
              onSelectVessel={setSelectedVessel}
              milFlights={milFlights}
              onClose={() => setIsRightPanelOpen(false)}
              activeTab={rightPanelTab}
              onChangeTab={setRightPanelTab}
            />
          </div>
        )}

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
                  vesselCount={vessels.length}
                  milFlightCount={milFlights.length}
                  onClose={() => setMobileDrawer('none')}
                />
              </div>
            </div>
          </div>
        )}

        {/* MOBILE Slide-out Drawer: Intel & Airspace */}
        {mobileDrawer === 'intel' && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setMobileDrawer('none')} />
            <div className="relative z-50 w-full max-h-[82dvh] flex flex-col bg-slate-950 border-t border-amber-500/40 shadow-2xl animate-slide-up rounded-t-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-amber-500/20 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="font-tactical text-sm font-bold text-white tracking-wider">
                    SITREP, AIRSPACE & SEISMIC
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
                  earthquakes={earthquakes}
                  selectedFlight={selectedFlight}
                  onSelectFlight={handleSelectFlight}
                  onOpenAgriModal={() => {
                    setMobileDrawer('none');
                    setIsAgriModalOpen(true);
                  }}
                  vessels={vessels}
                  selectedVessel={selectedVessel}
                  onSelectVessel={setSelectedVessel}
                  milFlights={milFlights}
                  onClose={() => setMobileDrawer('none')}
                  activeTab={rightPanelTab}
                  onChangeTab={setRightPanelTab}
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
