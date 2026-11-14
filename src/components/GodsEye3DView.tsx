import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

if (typeof window !== 'undefined' && (maplibregl as any).setWorkerUrl) {
  (maplibregl as any).setWorkerUrl(maplibreWorkerUrl);
}
import {
  FlightData,
  RiverGaugeData,
  ActiveLayers,
  OpticMode,
} from '../services/types';
import { NORTH_PERTH_COORDS, NORTH_PERTH_TOWNS } from '../services/api';
import { MilitaryFlight, CANADIAN_MILITARY_INSTALLATIONS } from '../services/godseye';
import { MaritimeVessel } from '../services/maritime';
import { IssTelemetry } from '../services/space';
import {
  RotateCw,
  Compass,
  Plane,
  Ship,
  Crosshair,
  Target,
  X,
  Orbit,
  ArrowUpRight,
  Eye,
  MapPin,
  Waves,
  Shield,
  Layers,
  Play,
  Pause,
} from 'lucide-react';

interface GodsEye3DViewProps {
  layers: ActiveLayers;
  flights: FlightData[];
  riverGauges: RiverGaugeData[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData | null) => void;
  radarOpacity: number;
  iss?: IssTelemetry | null;
  vessels?: MaritimeVessel[];
  opticMode?: OpticMode;
  selectedVessel?: MaritimeVessel | null;
  onSelectVessel?: (vessel: MaritimeVessel | null) => void;
  milFlights?: MilitaryFlight[];
  onSwitchTo2D?: () => void;
}

export const GodsEye3DView: React.FC<GodsEye3DViewProps> = ({
  layers,
  flights,
  riverGauges,
  selectedFlight,
  onSelectFlight,
  iss,
  vessels = [],
  opticMode = 'normal',
  selectedVessel = null,
  onSelectVessel,
  milFlights = [],
  onSwitchTo2D,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Live Camera Telemetry
  const [pitch, setPitch] = useState<number>(62);
  const [bearing, setBearing] = useState<number>(-25);
  const [zoom, setZoom] = useState<number>(11.5);
  const [center, setCenter] = useState<[number, number]>([NORTH_PERTH_COORDS[1], NORTH_PERTH_COORDS[0]]);

  // Auto-Orbit Recon State
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const orbitReqRef = useRef<number | null>(null);

  // Markers cache
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});

  // Initialize MapLibre 3D Terrain & Globe
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [NORTH_PERTH_COORDS[1], NORTH_PERTH_COORDS[0]], // [lon, lat]
      zoom: 11.5,
      pitch: 62,
      bearing: -25,
      maxPitch: 85,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
            attribution: 'Esri World Imagery',
          },
          'esri-roads': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          'esri-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          'dem-terrain': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
            ],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15,
          },
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22,
          },
          {
            id: 'roads-layer',
            type: 'raster',
            source: 'esri-roads',
            minzoom: 6,
            maxzoom: 22,
            paint: { 'raster-opacity': 0.75 },
          },
          {
            id: 'labels-layer',
            type: 'raster',
            source: 'esri-labels',
            minzoom: 6,
            maxzoom: 22,
            paint: { 'raster-opacity': 0.85 },
          },
        ],
        terrain: {
          source: 'dem-terrain',
          exaggeration: 1.6,
        },
        sky: {
          'sky-color': '#070a11',
          'sky-horizon-blend': 0.6,
          'horizon-color': '#002b3d',
          'horizon-fog-blend': 0.8,
          'fog-color': '#050c18',
          'fog-ground-blend': 0.5,
        },
      },
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    const updateCameraState = () => {
      setPitch(Math.round(map.getPitch()));
      setBearing(Math.round(map.getBearing()));
      setZoom(Math.round(map.getZoom() * 10) / 10);
      const c = map.getCenter();
      setCenter([Math.round(c.lng * 1000) / 1000, Math.round(c.lat * 1000) / 1000]);
    };

    map.on('pitch', updateCameraState);
    map.on('rotate', updateCameraState);
    map.on('zoom', updateCameraState);
    map.on('move', updateCameraState);

    mapRef.current = map;

    return () => {
      if (orbitReqRef.current) cancelAnimationFrame(orbitReqRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Continuous 360° Recon Orbit Loop
  useEffect(() => {
    if (!isOrbiting || !mapRef.current) {
      if (orbitReqRef.current) cancelAnimationFrame(orbitReqRef.current);
      return;
    }

    const orbitStep = () => {
      if (!mapRef.current) return;
      const currentBearing = mapRef.current.getBearing();
      mapRef.current.setBearing((currentBearing + 0.18) % 360);
      orbitReqRef.current = requestAnimationFrame(orbitStep);
    };

    orbitReqRef.current = requestAnimationFrame(orbitStep);
    return () => {
      if (orbitReqRef.current) cancelAnimationFrame(orbitReqRef.current);
    };
  }, [isOrbiting]);

  // Apply God's Eye Optic Shader (FLIR/NVG/CRT)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove('optic-flir', 'optic-nvg', 'optic-crt');
    if (opticMode === 'flir') el.classList.add('optic-flir');
    else if (opticMode === 'nvg') el.classList.add('optic-nvg');
    else if (opticMode === 'crt') el.classList.add('optic-crt');
  }, [opticMode]);

  // Sync 3D Markers (Aircraft, Military, Ships, Towns, River Gauges)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const activeIds = new Set<string>();

    // 1. Towns & Sectors (North Perth)
    if (layers.towns) {
      NORTH_PERTH_TOWNS.forEach((town) => {
        const id = `town-${town.id}`;
        activeIds.add(id);

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none';
          el.innerHTML = `
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border ${
              town.isHQ ? 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_#00f2fe]' : 'border-slate-700 text-slate-300'
            } font-mono text-[9px] font-bold backdrop-blur-md">
              <span class="w-1.5 h-1.5 rounded-full ${town.isHQ ? 'bg-cyan-400 animate-ping' : 'bg-slate-400'}"></span>
              <span>${town.name}</span>
            </div>
          `;
          el.onclick = () => {
            map.flyTo({ center: [town.coords[1], town.coords[0]], zoom: 13, pitch: 65, duration: 1200 });
          };

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([town.coords[1], town.coords[0]])
            .addTo(map);
          currentMarkers[id] = marker;
        }
      });
    }

    // 2. Civilian ADS-B Aircraft in 3D
    if (layers.flights) {
      flights.forEach((flight) => {
        const id = `flight-${flight.icao24}`;
        activeIds.add(id);

        const heading = flight.trackHeading ?? 0;
        const altFt = flight.altitudeFeet ? `${flight.altitudeFeet.toLocaleString()}ft` : 'GND';

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none group';
          el.innerHTML = `
            <div class="flex flex-col items-center">
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-950/80 border border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] transform hover:scale-125 transition-transform" style="transform: rotate(${heading}deg);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
              </div>
              <div class="px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-500/40 text-[8px] font-mono font-bold text-amber-200 mt-0.5 whitespace-nowrap shadow-md">
                ${flight.callsign} <span class="text-amber-400 font-normal">(${altFt})</span>
              </div>
            </div>
          `;
          el.onclick = () => {
            onSelectFlight(flight);
            map.flyTo({ center: [flight.longitude, flight.latitude], zoom: 12.5, pitch: 70, duration: 1200 });
          };

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([flight.longitude, flight.latitude])
            .addTo(map);
          currentMarkers[id] = marker;
        } else {
          currentMarkers[id].setLngLat([flight.longitude, flight.latitude]);
        }
      });
    }

    // 3. Military Airspace & Aircraft (God's Eye DND/CAF Mesh)
    if (layers.military) {
      milFlights.forEach((mil) => {
        const id = `mil-${mil.hex}`;
        activeIds.add(id);

        const heading = mil.headingDeg ?? 0;
        const altFt = mil.altitudeFeet ? `${mil.altitudeFeet.toLocaleString()}ft` : 'MIL';

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none group';
          el.innerHTML = `
            <div class="flex flex-col items-center">
              <div class="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_#00f2fe] transform hover:scale-125 transition-transform" style="transform: rotate(${heading}deg);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="px-1.5 py-0.5 rounded bg-slate-950 border border-cyan-400 text-[8px] font-mono font-bold text-cyan-200 mt-0.5 whitespace-nowrap shadow-[0_0_10px_rgba(0,242,254,0.4)]">
                MIL: ${mil.callsign} <span class="text-white">(${altFt})</span>
              </div>
            </div>
          `;
          el.onclick = () => {
            map.flyTo({ center: [mil.longitude, mil.latitude], zoom: 12.5, pitch: 72, duration: 1200 });
          };

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([mil.longitude, mil.latitude])
            .addTo(map);
          currentMarkers[id] = marker;
        } else {
          currentMarkers[id].setLngLat([mil.longitude, mil.latitude]);
        }
      });

      // Military Bases
      CANADIAN_MILITARY_INSTALLATIONS.forEach((base) => {
        const id = `base-${base.id}`;
        activeIds.add(id);

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none';
          el.innerHTML = `
            <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-500 text-cyan-300 text-[8px] font-mono font-bold shadow-[0_0_8px_rgba(0,242,254,0.3)]">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>${base.name.split('(')[0].trim()}</span>
            </div>
          `;
          el.onclick = () => {
            map.flyTo({ center: [base.longitude, base.latitude], zoom: 12, pitch: 65, duration: 1200 });
          };
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([base.longitude, base.latitude])
            .addTo(map);
          currentMarkers[id] = marker;
        }
      });
    }

    // 4. Lake Huron Maritime Ships
    if (layers.maritime) {
      vessels.forEach((v) => {
        const id = `vessel-${v.mmsi}`;
        activeIds.add(id);

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none';
          el.innerHTML = `
            <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-950/90 border border-teal-400 text-teal-200 text-[8px] font-mono font-bold shadow-md">
              <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <span>${v.name} (${v.speedKnots ?? 0}kn)</span>
            </div>
          `;
          el.onclick = () => {
            if (onSelectVessel) onSelectVessel(v);
            map.flyTo({ center: [v.longitude, v.latitude], zoom: 11, pitch: 60, duration: 1200 });
          };
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([v.longitude, v.latitude])
            .addTo(map);
          currentMarkers[id] = marker;
        } else {
          currentMarkers[id].setLngLat([v.longitude, v.latitude]);
        }
      });
    }

    // 5. Maitland River Gauges
    if (layers.river) {
      riverGauges.forEach((gauge) => {
        const id = `gauge-${gauge.stationId}`;
        activeIds.add(id);

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none';
          el.innerHTML = `
            <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-[8px] font-mono font-bold shadow-md">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>${gauge.waterLevelMeters.toFixed(2)}m</span>
            </div>
          `;
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([-80.95, 43.73]) // Approx gauge location
            .addTo(map);
          currentMarkers[id] = marker;
        }
      });
    }

    // Clean up dead markers
    Object.keys(currentMarkers).forEach((id) => {
      if (!activeIds.has(id)) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }
    });
  }, [layers, flights, milFlights, vessels, riverGauges, onSelectFlight, onSelectVessel]);

  // Camera presets
  const flyToPreset = (target: 'north-perth' | 'theater' | 'high-orbit' | 'top-down') => {
    const map = mapRef.current;
    if (!map) return;
    setIsOrbiting(false);

    if (target === 'north-perth') {
      map.flyTo({ center: [-80.9525, 43.7317], zoom: 12, pitch: 65, bearing: -25, duration: 1500 });
    } else if (target === 'theater') {
      map.flyTo({ center: [-81.2, 44.0], zoom: 8, pitch: 58, bearing: -10, duration: 1500 });
    } else if (target === 'high-orbit') {
      map.flyTo({ center: [-80.9525, 43.7317], zoom: 4.5, pitch: 72, bearing: 0, duration: 1800 });
    } else if (target === 'top-down') {
      map.flyTo({ center: [-80.9525, 43.7317], zoom: 12, pitch: 0, bearing: 0, duration: 1200 });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050c18]">
      {/* MapLibre 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* GOD'S EYE 3D RECON RETICLE & RANGE RINGS */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-60">
        <div className="w-32 h-32 rounded-full border border-cyan-500/20 target-lock-ring flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-cyan-400/40" />
        </div>
        <div className="absolute w-6 h-0.5 bg-cyan-400/60" />
        <div className="absolute h-6 w-0.5 bg-cyan-400/60" />
      </div>

      {/* TOP FLOATING RECON BAR & 2D SWITCHER */}
      <div className="absolute top-3 left-3 sm:left-4 z-20 flex flex-wrap items-center gap-1.5 p-1 rounded bg-slate-950/90 border border-cyan-500/50 backdrop-blur-md font-mono text-[10px] shadow-2xl">
        <div className="flex items-center gap-1 px-1.5 text-cyan-400 font-bold tracking-wider">
          <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '30s' }} />
          <span>GOD'S EYE 3D GLOBE</span>
        </div>

        <div className="h-3 w-px bg-slate-800 mx-0.5" />

        {/* 3D Presets */}
        <button
          onClick={() => flyToPreset('north-perth')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 hover:border-cyan-500/50 cursor-pointer font-semibold transition-all"
        >
          LISTOWEL 3D
        </button>
        <button
          onClick={() => flyToPreset('theater')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/50 cursor-pointer font-semibold transition-all"
        >
          THEATER (REGIONAL)
        </button>
        <button
          onClick={() => flyToPreset('high-orbit')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/50 cursor-pointer font-semibold transition-all"
        >
          ORBITAL GLOBE
        </button>
        <button
          onClick={() => flyToPreset('top-down')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/50 cursor-pointer font-semibold transition-all"
        >
          TOP DOWN
        </button>

        <div className="h-3 w-px bg-slate-800 mx-0.5" />

        {/* Orbit Sweep Toggle */}
        <button
          onClick={() => setIsOrbiting(!isOrbiting)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
            isOrbiting
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800'
          }`}
          title="Auto-rotate camera 360° continuously around target"
        >
          <RotateCw className={`w-3 h-3 ${isOrbiting ? 'animate-spin' : ''}`} />
          <span>{isOrbiting ? 'ORBITING 360°' : 'ORBIT 360°'}</span>
        </button>

        {/* 2D Tactical View Switcher */}
        {onSwitchTo2D && (
          <button
            onClick={onSwitchTo2D}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer transition-all ml-1"
            title="Switch back to standard 2D Leaflet Tactical Map"
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>SWITCH TO 2D MAP</span>
          </button>
        )}
      </div>

      {/* BOTTOM-LEFT 3D SENSOR TELEMETRY HUD */}
      <div className="absolute bottom-4 left-3 sm:left-4 z-20 bg-slate-950/95 border border-cyan-500/50 rounded-lg p-2 font-mono text-[10px] shadow-[0_0_25px_rgba(0,242,254,0.15)] backdrop-blur-md max-w-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>GOD'S EYE 3D RECON TELEMETRY</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded border border-emerald-500/30">
            WEBGL2 3D DEM
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-slate-300 text-[9px]">
          <div className="p-1 rounded bg-black/50 border border-slate-800">
            <span className="text-slate-500">PITCH:</span> <span className="text-white font-bold">{pitch}°</span>
          </div>
          <div className="p-1 rounded bg-black/50 border border-slate-800">
            <span className="text-slate-500">BEARING:</span> <span className="text-white font-bold">{bearing}°</span>
          </div>
          <div className="p-1 rounded bg-black/50 border border-slate-800">
            <span className="text-slate-500">ZOOM:</span> <span className="text-white font-bold">{zoom}</span>
          </div>
          <div className="p-1 rounded bg-black/50 border border-slate-800">
            <span className="text-slate-500">MODE:</span> <span className="text-cyan-400 font-bold uppercase">{opticMode}</span>
          </div>
        </div>

        <div className="text-[8px] text-slate-500 pt-1 mt-1 border-t border-slate-800/60 flex items-center justify-between">
          <span>CENTER: {center[1]}°N, {Math.abs(center[0])}°W</span>
          <span className="text-slate-400">HOLD RIGHT-CLICK TO TILT / ROTATE 3D</span>
        </div>
      </div>
    </div>
  );
};
