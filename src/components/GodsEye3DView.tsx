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
import { NORTH_PERTH_AGRI_HUBS } from '../services/agri';
import { cameraPopupHtml, attachLiveCamera, escapeHtml } from '../services/cameras';
import { SquallTrajectory, LISTOWEL_HELIPAD_COORDS } from '../services/squall';
import { SeismicEvent } from '../services/hazards';
import { TargetSummary } from './TargetSummary';
import { fetchEcccRadarTimes } from '../services/radar';
import type { TrafficCamera } from '../services/types';
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
  Lock,
  Unlock,
} from 'lucide-react';

// Environment Canada 1 km radar, animated. Rain and snow are separate WMS layers (GeoMet allows one
// layer per request). Every frame is its own hidden raster layer so the loop swaps instantly once loaded.
const RADAR_PRODUCTS = [
  { key: 'rain', wms: 'RADAR_1KM_RRAI' },
  { key: 'snow', wms: 'RADAR_1KM_RSNO' },
] as const;
const RADAR_FRAME_COUNT = 8; // 8 scans x 6 min = ~45 min loop
const RADAR_REFRESH_MS = 6 * 60 * 1000; // ECCC publishes a scan every 6 minutes
const RADAR_FRAME_MS = 700;
const RADAR_LAST_FRAME_HOLD = 3; // linger on the latest scan for 3 ticks
const radarFrameId = (product: string, time: string) => `radar-${product}-${time}`;
const ecccRadarTiles = (wmsLayer: string, time: string) =>
  `https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&layers=${wmsLayer}&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true&time=${time}`;
// ---- GeoJSON overlay helpers (squall corridor, helipad approach ring, ISS footprint) ----
type Ring = [number, number][]; // [lon, lat]
const circleRing = (lat: number, lon: number, radiusKm: number, steps = 72): Ring => {
  const ring: Ring = [];
  const latR = (lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / 111.32) * Math.cos(a);
    const dLon = (radiusKm / (111.32 * Math.cos(latR))) * Math.sin(a);
    ring.push([lon + dLon, lat + dLat]);
  }
  return ring;
};
const polygonFC = (ring: Ring | null): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: ring ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }] : [],
});
// Create the source + fill/outline layers once, then just swap data (empty = hidden)
function setPolygonOverlay(map: maplibregl.Map, id: string, ring: Ring | null, color: string, fillOpacity: number, dashed = true) {
  const data = polygonFC(ring);
  const src = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData(data);
    return;
  }
  map.addSource(id, { type: 'geojson', data });
  map.addLayer({ id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': color, 'fill-opacity': fillOpacity } });
  map.addLayer({
    id: `${id}-line`,
    type: 'line',
    source: id,
    paint: { 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.8, ...(dashed ? { 'line-dasharray': [3, 3] } : {}) },
  });
}
const DROUGHT_TILES =
  'https://agriculture.canada.ca/imagery-images/services/canadian_drought_monitor/ImageServer/WMSServer?service=WMS&version=1.3.0&request=GetMap&layers=canadian_drought_monitor:canadian_drought_monitor&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true';

const markerHtmlPopup = (html: string) =>
  new maplibregl.Popup({ offset: 16, maxWidth: '300px', className: 'hud-popup' }).setHTML(html);

const formatRadarTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit' });

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
  cameras?: TrafficCamera[];
  squallTrajectory?: SquallTrajectory | null;
  earthquakes?: SeismicEvent[];
  onSwitchTo2D?: () => void;
}

export const GodsEye3DView: React.FC<GodsEye3DViewProps> = ({
  layers,
  flights,
  riverGauges,
  selectedFlight,
  onSelectFlight,
  radarOpacity,
  iss,
  vessels = [],
  opticMode = 'normal',
  selectedVessel = null,
  onSelectVessel,
  milFlights = [],
  cameras = [],
  squallTrajectory = null,
  earthquakes = [],
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
  const [radarTimes, setRadarTimes] = useState<string[]>([]);
  const [radarFrame, setRadarFrame] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const orbitReqRef = useRef<number | null>(null);

  // Markers cache
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});

  // Initialize MapLibre 3D Terrain & Globe
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Several data credits (imagery, ECCC radar, AAFC drought): keep them behind the ⓘ button
      attributionControl: { compact: true },
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
      // Markers belonged to the removed map; forget them so a re-created map gets fresh ones
      markersRef.current = {};
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

  // ---- Area overlays: drought, squall corridor, helipad approach ring, ISS footprint ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      // AAFC drought monitor raster (below radar, above imagery)
      if (!map.getSource('aafc-drought')) {
        map.addSource('aafc-drought', {
          type: 'raster',
          tiles: [DROUGHT_TILES],
          tileSize: 256,
          attribution: 'Drought © Agriculture and Agri-Food Canada',
        });
        const firstRadar = map.getStyle().layers.find((l) => l.id.startsWith('radar-'))?.id ?? 'roads-layer';
        map.addLayer(
          { id: 'aafc-drought-layer', type: 'raster', source: 'aafc-drought', paint: { 'raster-opacity': 0.3 } },
          firstRadar
        );
      }
      map.setLayoutProperty('aafc-drought-layer', 'visibility', layers.drought ? 'visible' : 'none');

      // Squall corridor only when the model says a squall is active (no placeholder corridor)
      const squallRing =
        layers.squall && squallTrajectory?.isActive && squallTrajectory.streamerPolygon.length >= 3
          ? ([...squallTrajectory.streamerPolygon, squallTrajectory.streamerPolygon[0]].map(([la, lo]) => [lo, la]) as Ring)
          : null;
      setPolygonOverlay(map, 'squall-corridor', squallRing, '#38bdf8', 0.18);
      setPolygonOverlay(
        map,
        'helipad-approach',
        layers.helipad ? circleRing(LISTOWEL_HELIPAD_COORDS[0], LISTOWEL_HELIPAD_COORDS[1], 1.2) : null,
        '#ef4444',
        0.06
      );
      setPolygonOverlay(
        map,
        'iss-footprint',
        layers.satellites && iss ? circleRing(iss.latitude, iss.longitude, 800) : null,
        '#c084fc',
        0.04,
        false
      );
    };
    if (map.getLayer('roads-layer')) apply();
    else map.once('load', apply);
    return () => {
      map.off('load', apply);
    };
  }, [layers.drought, layers.squall, layers.helipad, layers.satellites, squallTrajectory, iss]);

  // Follow the selected aircraft / vessel as its live position updates
  useEffect(() => {
    const map = mapRef.current;
    const target = selectedFlight ?? selectedVessel;
    if (!map || !isFollowing || !target) return;
    map.easeTo({ center: [target.longitude, target.latitude], duration: 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFollowing, selectedFlight?.latitude, selectedFlight?.longitude, selectedVessel?.latitude, selectedVessel?.longitude]);
  useEffect(() => {
    if (!selectedFlight && !selectedVessel) setIsFollowing(false);
  }, [selectedFlight, selectedVessel]);

  // ---- Animated Doppler radar ----
  // Keep the frame list fresh (latest 8 ECCC scans) while the radar layer is on
  useEffect(() => {
    if (!layers.radar) return;
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      const times = await fetchEcccRadarTimes(RADAR_FRAME_COUNT);
      if (!cancelled && times.length > 0) setRadarTimes(times);
    };
    load();
    const timer = window.setInterval(load, RADAR_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [layers.radar]);

  // Add one raster layer per scan (rain + snow) and drop scans that aged out
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => {
      const wanted = new Set(radarTimes.flatMap((t) => RADAR_PRODUCTS.map((p) => radarFrameId(p.key, t))));
      map.getStyle().layers
        .filter((l) => l.id.startsWith('radar-') && !wanted.has(l.id))
        .forEach((l) => {
          map.removeLayer(l.id);
          if (map.getSource(l.id)) map.removeSource(l.id);
        });
      radarTimes.forEach((t) =>
        RADAR_PRODUCTS.forEach((p) => {
          const id = radarFrameId(p.key, t);
          if (map.getLayer(id)) return;
          map.addSource(id, {
            type: 'raster',
            tiles: [ecccRadarTiles(p.wms, t)],
            tileSize: 256,
            attribution: 'Radar © Environment and Climate Change Canada',
          });
          // Below roads/labels so they stay readable; opacity 0 still preloads tiles
          map.addLayer(
            { id, type: 'raster', source: id, paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 } },
            'roads-layer'
          );
        })
      );
      setRadarFrame((f) => Math.min(f, Math.max(0, radarTimes.length - 1)));
    };
    if (map.getLayer('roads-layer')) sync();
    else map.once('load', sync);
    return () => {
      map.off('load', sync);
    };
  }, [radarTimes]);

  // Advance the loop (holding a moment on the latest scan)
  useEffect(() => {
    if (!layers.radar || !isRadarPlaying || radarTimes.length <= 1) return;
    let hold = 0;
    const timer = window.setInterval(() => {
      setRadarFrame((f) => {
        if (f === radarTimes.length - 1 && hold < RADAR_LAST_FRAME_HOLD) {
          hold += 1;
          return f;
        }
        hold = 0;
        return (f + 1) % radarTimes.length;
      });
    }, RADAR_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [layers.radar, isRadarPlaying, radarTimes.length]);

  // Show only the current scan, at the user's opacity; hide everything when the layer is off
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = radarTimes[radarFrame];
    radarTimes.forEach((t) =>
      RADAR_PRODUCTS.forEach((p) => {
        const id = radarFrameId(p.key, t);
        if (!map.getLayer(id)) return;
        map.setLayoutProperty(id, 'visibility', layers.radar ? 'visible' : 'none');
        map.setPaintProperty(id, 'raster-opacity', layers.radar && t === current ? radarOpacity : 0);
      })
    );
  }, [radarTimes, radarFrame, radarOpacity, layers.radar]);

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

    // 1b. North Perth Agricultural Hubs in 3D (Elevators, Auctions, Mills)
    if (layers.agriHubs) {
      NORTH_PERTH_AGRI_HUBS.forEach((hub) => {
        const id = `agri-${hub.id}`;
        activeIds.add(id);

        if (!currentMarkers[id]) {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none';
          el.innerHTML = `
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/90 border border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)] font-mono text-[9px] font-bold backdrop-blur-md hover:scale-110 transition-transform">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>${hub.name.split('(')[0].trim()}</span>
            </div>
          `;
          el.onclick = () => {
            map.flyTo({ center: [hub.lng, hub.lat], zoom: 14, pitch: 70, duration: 1200 });
          };

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([hub.lng, hub.lat])
            .addTo(map);
          currentMarkers[id] = marker;
        }
      });
    }

    // 1d. Listowel Memorial Hospital heliport (CPN5)
    if (layers.helipad) {
      const id = 'helipad-cpn5';
      activeIds.add(id);
      if (!currentMarkers[id]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950/95 border-2 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <span class="font-tactical font-black text-xs">H</span>
            <span class="absolute -bottom-4 whitespace-nowrap text-[8px] bg-slate-950/90 text-rose-300 px-1 rounded border border-rose-500/40 font-mono">LMH HELIPORT</span>
          </div>`;
        currentMarkers[id] = new maplibregl.Marker({ element: el })
          .setLngLat([LISTOWEL_HELIPAD_COORDS[1], LISTOWEL_HELIPAD_COORDS[0]])
          .setPopup(
            markerHtmlPopup(`
              <div class="p-2 space-y-1 text-xs font-mono">
                <div class="font-bold text-rose-400 text-sm border-b border-rose-500/30 pb-1">LISTOWEL MEMORIAL HOSPITAL · CPN5</div>
                <div class="text-[11px] text-slate-300">Primary operator: <span class="text-rose-300 font-semibold">Ornge Air Ambulance</span></div>
                <div class="text-[11px] text-slate-300">Coordinates: <span class="text-white">43.7372°N, 80.9568°W</span></div>
                <div class="text-[10px] text-slate-400 pt-1">Dashed ring: 1.2 km approach area</div>
              </div>`)
          )
          .addTo(map);
      }
    }

    // 1e. USGS earthquakes (Great Lakes / Eastern Canada)
    if (layers.seismic) {
      earthquakes.forEach((eq) => {
        const id = `quake-${eq.id}`;
        activeIds.add(id);
        if (currentMarkers[id]) return;
        const big = eq.magnitude >= 2.0;
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div class="flex items-center justify-center w-7 h-7 rounded-full ${
            big
              ? 'bg-rose-500/30 border-2 border-rose-400 shadow-[0_0_15px_#f43f5e] text-rose-200'
              : 'bg-amber-500/25 border-2 border-amber-400 shadow-[0_0_10px_#f59e0b] text-amber-200'
          } text-[9px] font-bold font-mono">${eq.magnitude}</div>`;
        currentMarkers[id] = new maplibregl.Marker({ element: el })
          .setLngLat([eq.longitude, eq.latitude])
          .setPopup(
            markerHtmlPopup(`
              <div class="p-2 space-y-1 text-xs font-mono">
                <div class="flex items-center justify-between border-b border-amber-500/40 pb-1">
                  <span class="font-bold text-amber-400 text-sm">M ${eq.magnitude} EARTHQUAKE</span>
                  <span class="text-[9px] text-slate-400 font-bold">USGS</span>
                </div>
                <div class="text-white font-semibold">${escapeHtml(eq.place)}</div>
                <div class="text-[11px] text-slate-300">Depth: <span class="text-white">${eq.depthKm} km</span> · ${escapeHtml(eq.time)}</div>
                <div class="text-[11px] text-cyan-300">Distance to Listowel: <span class="font-bold text-white">${eq.distanceKmToListowel} km</span></div>
              </div>`)
          )
          .addTo(map);
      });
    }

    // 1f. International Space Station (live position)
    if (layers.satellites && iss) {
      const id = 'iss';
      activeIds.add(id);
      const label = `ISS · ${iss.altitudeKm} km · ${Math.round(iss.distanceKmToListowel).toLocaleString()} km away`;
      if (!currentMarkers[id]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950/95 border-2 border-purple-400 text-purple-300 shadow-[0_0_15px_#c084fc]">
            <svg class="w-4 h-4 animate-spin" style="animation-duration: 30s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3"/></svg>
            <span data-iss-label class="absolute -bottom-4 whitespace-nowrap text-[8px] bg-slate-950/90 text-purple-300 px-1 rounded border border-purple-500/40 font-mono"></span>
          </div>`;
        el.onclick = () => {
          const pos = currentMarkers[id]?.getLngLat();
          if (pos) map.flyTo({ center: pos, zoom: 3.5, pitch: 40, duration: 1500 });
        };
        currentMarkers[id] = new maplibregl.Marker({ element: el }).setLngLat([iss.longitude, iss.latitude]).addTo(map);
      } else {
        currentMarkers[id].setLngLat([iss.longitude, iss.latitude]);
      }
      const labelEl = currentMarkers[id].getElement().querySelector('[data-iss-label]');
      if (labelEl) labelEl.textContent = label;
    }

    // 1c. MTO 511 Road Cameras (click for live snapshot)
    if (layers.cams) {
      cameras.forEach((cam) => {
        const id = `cam-${cam.id}`;
        activeIds.add(id);
        if (currentMarkers[id]) return;

        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.title = `${cam.highway} – ${cam.name}`;
        el.innerHTML = '<div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-950/95 border-2 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)] cursor-pointer hover:scale-110 transition-transform"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>';
        const popup = new maplibregl.Popup({ offset: 16, maxWidth: '300px', className: 'cam-popup' });
        // Rebuild on open (fresh snapshot) and keep it live until closed
        let stopLive = () => {};
        popup.on('open', () => {
          popup.setHTML(cameraPopupHtml(cam));
          stopLive = attachLiveCamera(popup.getElement(), cam);
        });
        popup.on('close', () => stopLive());
        currentMarkers[id] = new maplibregl.Marker({ element: el })
          .setLngLat([cam.longitude, cam.latitude])
          .setPopup(popup)
          .addTo(map);
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
  }, [layers, flights, milFlights, vessels, riverGauges, cameras, earthquakes, iss, onSelectFlight, onSelectVessel]);

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

      {/* TARGET TRACKING CARD (selected aircraft / vessel) */}
      {(selectedFlight || selectedVessel) && (
        <div className="absolute top-32 right-3 z-20 w-72 bg-slate-950/95 border border-cyan-400 rounded-lg p-3 font-mono text-xs shadow-[0_0_30px_rgba(0,242,254,0.25)] backdrop-blur-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30 mb-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="font-tactical font-bold text-white tracking-wider text-xs">TRACKING // LIVE TELEMETRY</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectFlight(null);
                onSelectVessel?.(null);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Clear target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <TargetSummary flight={selectedFlight} vessel={selectedVessel} />
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFollowing((f) => !f)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-tactical font-bold cursor-pointer transition-colors ${
                isFollowing
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_#00f2fe]'
                  : 'bg-black/60 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-950/40'
              }`}
            >
              {isFollowing ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {isFollowing ? 'FOLLOWING TARGET' : 'FOLLOW TARGET'}
            </button>
          </div>
        </div>
      )}

      {/* RADAR LOOP CONTROL (bottom right, above the map attribution) */}
      {layers.radar && radarTimes.length > 0 && (
        <div className="absolute bottom-10 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/95 border border-cyan-500/50 font-mono text-[10px] text-slate-300 shadow-[0_0_15px_rgba(0,242,254,0.15)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsRadarPlaying((p) => !p)}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 hover:text-white cursor-pointer"
            title={isRadarPlaying ? 'Pause radar loop' : 'Play radar loop'}
          >
            {isRadarPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <span className="text-cyan-300 font-bold">ECCC RADAR</span>
          <span className="text-white font-bold tabular-nums">{formatRadarTime(radarTimes[radarFrame] ?? radarTimes[radarTimes.length - 1])}</span>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {radarTimes.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setIsRadarPlaying(false);
                  setRadarFrame(i);
                }}
                className={`w-1.5 h-3 rounded-sm cursor-pointer ${i === radarFrame ? 'bg-cyan-400' : 'bg-slate-700 hover:bg-slate-500'}`}
                title={formatRadarTime(t)}
              />
            ))}
          </span>
          {radarFrame === radarTimes.length - 1 && <span className="text-emerald-400 font-bold">LATEST</span>}
        </div>
      )}

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
