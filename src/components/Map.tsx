import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  FlightData,
  RiverGaugeData,
  TrafficCamera,
  RoadCondition,
  HydroOutage,
  ActiveLayers,
} from '../services/types';
import { NORTH_PERTH_COORDS, NORTH_PERTH_TOWNS, TownMarker } from '../services/api';
import { MapPin, Navigation2, Mountain, Layers, Eye } from 'lucide-react';

interface MapProps {
  layers: ActiveLayers;
  flights: FlightData[];
  riverGauges: RiverGaugeData[];
  cameras: TrafficCamera[];
  roads: RoadCondition[];
  outages: HydroOutage[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData | null) => void;
  radarOpacity: number;
}

type MapStyle = 'tactical' | 'streets' | 'satellite' | 'topo';

export const MapView: React.FC<MapProps> = ({
  layers,
  flights,
  riverGauges,
  cameras,
  roads,
  outages,
  selectedFlight,
  onSelectFlight,
  radarOpacity,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap style state
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');

  // Tile layers references
  const osmBaseRef = useRef<L.TileLayer | null>(null);
  const satBaseRef = useRef<L.TileLayer | null>(null);
  const satLabelsRef = useRef<L.TileLayer | null>(null);
  const satRoadsRef = useRef<L.TileLayer | null>(null);
  const topoBaseRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer.WMS | null>(null);

  // Layer groups
  const townsGroupRef = useRef<L.LayerGroup | null>(null);
  const flightsGroupRef = useRef<L.LayerGroup | null>(null);
  const riverGroupRef = useRef<L.LayerGroup | null>(null);
  const camsGroupRef = useRef<L.LayerGroup | null>(null);
  const roadsGroupRef = useRef<L.LayerGroup | null>(null);
  const outagesGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Tactical map centered on North Perth
    const map = L.map(mapContainerRef.current, {
      center: NORTH_PERTH_COORDS,
      zoom: 11,
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // 1. OpenStreetMap Standard (Full detail, every town, road & street name)
    const osmBase = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    });
    osmBaseRef.current = osmBase;

    // 2. Esri World Imagery (Satellite)
    const satBase = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    );
    satBaseRef.current = satBase;

    // 3. Satellite Place & Town Labels Overlay
    const satLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        zIndex: 14,
      }
    );
    satLabelsRef.current = satLabels;

    // 4. Satellite Transportation Roads Overlay
    const satRoads = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        zIndex: 13,
      }
    );
    satRoadsRef.current = satRoads;

    // 5. Esri World Topo Map (Elevation relief & rivers)
    const topoBase = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    );
    topoBaseRef.current = topoBase;

    // Add initial base layer
    osmBase.addTo(map);

    // Zoom control at bottom right
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Initialize Layer Groups
    townsGroupRef.current = L.layerGroup().addTo(map);
    flightsGroupRef.current = L.layerGroup().addTo(map);
    riverGroupRef.current = L.layerGroup().addTo(map);
    camsGroupRef.current = L.layerGroup().addTo(map);
    roadsGroupRef.current = L.layerGroup().addTo(map);
    outagesGroupRef.current = L.layerGroup().addTo(map);

    // Environment Canada GeoMet WMS Doppler Precipitation Radar
    const radarWms = L.tileLayer.wms('https://geo.weather.gc.ca/geomet', {
      layers: 'RADAR_1KM_RRAI',
      format: 'image/png',
      transparent: true,
      opacity: radarOpacity,
      zIndex: 20,
    });
    radarLayerRef.current = radarWms;
    if (layers.radar) {
      radarWms.addTo(map);
    }

    mapInstanceRef.current = map;

    // Ensure map tiles calculate correct pixel sizes on mobile and orientation changes
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Style switching
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !osmBaseRef.current ||
      !satBaseRef.current ||
      !satLabelsRef.current ||
      !satRoadsRef.current ||
      !topoBaseRef.current
    )
      return;

    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;

    // Remove existing tile layers
    [
      osmBaseRef.current,
      satBaseRef.current,
      satLabelsRef.current,
      satRoadsRef.current,
      topoBaseRef.current,
    ].forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    // Reset container filter class
    if (container) {
      container.classList.remove(
        'map-style-tactical',
        'map-style-streets',
        'map-style-satellite',
        'map-style-topo'
      );
    }

    if (mapStyle === 'tactical') {
      osmBaseRef.current.addTo(map);
      container?.classList.add('map-style-tactical');
    } else if (mapStyle === 'streets') {
      osmBaseRef.current.addTo(map);
      container?.classList.add('map-style-streets');
    } else if (mapStyle === 'satellite') {
      satBaseRef.current.addTo(map);
      satRoadsRef.current.addTo(map);
      satLabelsRef.current.addTo(map);
      container?.classList.add('map-style-satellite');
    } else if (mapStyle === 'topo') {
      topoBaseRef.current.addTo(map);
      container?.classList.add('map-style-topo');
    }
  }, [mapStyle]);

  // Update Radar Layer Visibility & Opacity
  useEffect(() => {
    if (!mapInstanceRef.current || !radarLayerRef.current) return;
    radarLayerRef.current.setOpacity(radarOpacity);
    if (layers.radar) {
      if (!mapInstanceRef.current.hasLayer(radarLayerRef.current)) {
        radarLayerRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(radarLayerRef.current)) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current);
      }
    }
  }, [layers.radar, radarOpacity]);

  // Handle flight selection: fly to coordinates
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedFlight) return;
    mapInstanceRef.current.flyTo([selectedFlight.latitude, selectedFlight.longitude], 12, {
      duration: 1.2,
    });
  }, [selectedFlight]);

  // Render North Perth Town & Sector Labels
  useEffect(() => {
    if (!townsGroupRef.current || !mapInstanceRef.current) return;
    townsGroupRef.current.clearLayers();

    if (!layers.towns) return;

    NORTH_PERTH_TOWNS.forEach((town) => {
      const isHQ = town.isHQ;

      const badgeHtml = isHQ
        ? `
          <div class="town-badge flex items-center gap-1.5 cursor-pointer pointer-events-auto select-none group">
            <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f2fe] ring-2 ring-cyan-400/30"></span>
            <span class="font-mono text-[11px] font-bold tracking-widest uppercase text-cyan-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] group-hover:text-cyan-300 transition-colors">
              ${town.name}
            </span>
          </div>
        `
        : `
          <div class="town-badge flex items-center gap-1.5 cursor-pointer pointer-events-auto select-none group opacity-85 hover:opacity-100 transition-opacity">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400/80 group-hover:bg-cyan-400 transition-colors"></span>
            <span class="font-mono text-[10px] font-medium tracking-wider text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] group-hover:text-white transition-colors">
              ${town.name}
            </span>
          </div>
        `;

      const icon = L.divIcon({
        className: 'town-marker-icon',
        html: badgeHtml,
        iconSize: [100, 20],
        iconAnchor: [4, 10],
      });

      const marker = L.marker(town.coords, { icon, zIndexOffset: isHQ ? 60 : 30 })
        .addTo(townsGroupRef.current!)
        .on('click', () => {
          mapInstanceRef.current?.flyTo(town.coords, 13, { duration: 1 });
        });

      marker.bindPopup(`
        <div class="p-2 space-y-1 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-cyan-500/30 pb-1">
            <span class="font-bold text-cyan-300 text-sm">${town.name}</span>
            <span class="text-[10px] text-slate-400 font-bold">${town.population ?? ''}</span>
          </div>
          <div class="text-[11px] text-slate-300 pt-1">Sector: <span class="text-white">${town.sector}</span></div>
          <div class="text-[10px] text-cyan-400 pt-1">Coordinates: ${town.coords[0].toFixed(4)}°N, ${Math.abs(town.coords[1]).toFixed(4)}°W</div>
        </div>
      `);
    });
  }, [layers.towns]);

  // Render Flights
  useEffect(() => {
    if (!flightsGroupRef.current || !mapInstanceRef.current) return;
    flightsGroupRef.current.clearLayers();

    if (!layers.flights) return;

    flights.forEach((flight) => {
      const heading = flight.trackHeading ?? 0;
      const isSelected = selectedFlight?.icao24 === flight.icao24;
      const isOrnge = flight.callsign.includes('ORNGE');

      const planeSvg = `
        <div class="relative group cursor-pointer pointer-events-auto">
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-amber-500/40 ring-2 ring-amber-400 shadow-[0_0_15px_#f59e0b]'
              : isOrnge
              ? 'bg-rose-500/40 ring-2 ring-rose-400 shadow-[0_0_15px_#ef4444]'
              : 'bg-cyan-500/30 ring-2 ring-cyan-400 shadow-[0_0_10px_#00f2fe]'
          }">
            <svg class="w-5 h-5 ${
              isSelected ? 'text-amber-200' : isOrnge ? 'text-rose-200' : 'text-cyan-200'
            }" style="transform: rotate(${heading}deg)" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <div class="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            isOrnge ? 'border-rose-500/60 text-rose-300' : 'border-cyan-500/50 text-cyan-300'
          }">
            ${flight.callsign} <span class="text-white font-bold">${flight.altitudeFeet ? `${Math.round(flight.altitudeFeet / 1000)}k'` : ''}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'flight-marker-icon',
        html: planeSvg,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([flight.latitude, flight.longitude], { icon, zIndexOffset: 80 })
        .addTo(flightsGroupRef.current!)
        .on('click', () => onSelectFlight(flight));

      marker.bindPopup(`
        <div class="p-2 space-y-1 text-xs font-mono">
          <div class="flex items-center justify-between border-b border-cyan-500/30 pb-1">
            <span class="font-bold text-cyan-400 text-sm">${flight.callsign}</span>
            <span class="text-[10px] text-slate-400">${flight.originCountry}</span>
          </div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-slate-300">
            <div>ALT: <span class="text-white font-bold">${flight.altitudeFeet?.toLocaleString() ?? 'N/A'} ft</span></div>
            <div>SPD: <span class="text-white font-bold">${flight.velocityKmh ?? 'N/A'} km/h</span></div>
            <div>HDG: <span class="text-white">${flight.trackHeading ?? 'N/A'}°</span></div>
            <div>SQUAWK: <span class="text-amber-400 font-bold">${flight.squawk ?? '1200'}</span></div>
            <div class="col-span-2 pt-1 border-t border-slate-800 text-cyan-300">
              DIST TO LISTOWEL: <span class="font-bold text-white">${flight.distanceKmToListowel} km</span>
            </div>
          </div>
        </div>
      `);
    });
  }, [flights, layers.flights, selectedFlight]);

  // Render River Gauges (Middle Maitland River)
  useEffect(() => {
    if (!riverGroupRef.current || !mapInstanceRef.current) return;
    riverGroupRef.current.clearLayers();

    if (!layers.river) return;

    riverGauges.forEach((gauge) => {
      const isListowel = gauge.stationId === '02FE003';
      const coords: [number, number] = isListowel ? [43.727, -80.972] : [43.91, -80.87];

      const icon = L.divIcon({
        className: 'river-marker-icon',
        html: `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/95 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-mono text-[11px] whitespace-nowrap cursor-pointer hover:scale-105 transition-transform pointer-events-auto">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>MAITLAND: ${gauge.waterLevelMeters.toFixed(2)}m</span>
          </div>
        `,
        iconSize: [110, 26],
        iconAnchor: [55, 13],
      });

      const marker = L.marker(coords, { icon, zIndexOffset: 70 }).addTo(riverGroupRef.current!);
      marker.bindPopup(`
        <div class="p-2 space-y-1 text-xs font-mono">
          <div class="font-bold text-emerald-400 text-sm border-b border-emerald-500/30 pb-1">
            ${gauge.stationName}
          </div>
          <div class="text-[11px] text-slate-300">Station ID: <span class="text-white">${gauge.stationId}</span></div>
          <div class="text-[11px] text-slate-300">Water Level: <span class="text-emerald-300 font-bold">${gauge.waterLevelMeters.toFixed(3)} m</span></div>
          <div class="text-[11px] text-slate-300">Discharge Flow: <span class="text-cyan-300 font-bold">${gauge.dischargeM3s.toFixed(3)} m³/s</span></div>
          <div class="text-[11px] text-slate-300">Status: <span class="text-emerald-400 font-semibold">${gauge.floodStageAlert}</span></div>
          <div class="text-[10px] text-slate-400 pt-1">WaterOffice Canada Live Station</div>
        </div>
      `);
    });
  }, [riverGauges, layers.river]);

  // Render Traffic Cameras
  useEffect(() => {
    if (!camsGroupRef.current || !mapInstanceRef.current) return;
    camsGroupRef.current.clearLayers();

    if (!layers.cams) return;

    cameras.forEach((cam) => {
      const icon = L.divIcon({
        className: 'camera-marker-icon',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-950/95 border-2 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.4)] cursor-pointer hover:scale-110 transition-transform pointer-events-auto">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cam.latitude, cam.longitude], { icon, zIndexOffset: 60 }).addTo(camsGroupRef.current!);
      const primaryViewId = cam.views && cam.views.length > 0 ? cam.views[0].id : '';
      const viewLink = primaryViewId ? `https://511on.ca/map/Cctv/${primaryViewId}` : 'https://511on.ca/map/Cctv';

      marker.bindPopup(`
        <div class="p-2 space-y-2 text-xs font-mono max-w-[320px]">
          <div class="flex items-center justify-between border-b border-indigo-500/30 pb-1">
            <span class="font-bold text-indigo-300 text-sm">${cam.highway} CCTV</span>
            <span class="text-[9px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE SNAPSHOT
            </span>
          </div>
          <div class="text-[11px] font-semibold text-white">${cam.name}</div>
          <div class="relative rounded overflow-hidden border border-slate-700 bg-slate-900 aspect-video">
            <img 
              src="${cam.imageUrl}" 
              alt="${cam.name}" 
              class="w-full h-full object-cover filter contrast-110 brightness-95" 
              loading="eager"
            />
            <div class="absolute bottom-1 right-1 text-[9px] bg-black/85 px-1.5 py-0.5 text-cyan-300 font-mono rounded">
              MTO LIVE // 60s
            </div>
            ${cam.distanceKm !== undefined ? `<div class="absolute top-1 left-1 text-[9px] bg-slate-950/85 px-1.5 py-0.5 text-slate-300 font-mono rounded border border-slate-700">${cam.distanceKm} km from Listowel</div>` : ''}
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Direction: <strong class="text-white">${cam.direction}</strong></span>
            ${cam.views ? `<span class="text-indigo-300 font-semibold">${cam.views.length} Angles</span>` : ''}
          </div>
          <a
            href="${viewLink}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-1.5 w-full mt-2 py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-bold transition-colors no-underline"
          >
            <span>OPEN 511 HIGH-RES STREAM ↗</span>
          </a>
        </div>
      `);
    });
  }, [cameras, layers.cams]);

  // Render Roads
  useEffect(() => {
    if (!roadsGroupRef.current || !mapInstanceRef.current) return;
    roadsGroupRef.current.clearLayers();

    if (!layers.roads) return;

    roads.forEach((road) => {
      const color =
        road.status === 'CLOSED'
          ? '#ef4444'
          : road.status === 'SNOW_COVERED'
          ? '#f59e0b'
          : '#10b981';

      const polyline = L.polyline(road.coords, {
        color,
        weight: 5,
        opacity: 0.9,
      }).addTo(roadsGroupRef.current!);

      polyline.bindPopup(`
        <div class="p-2 space-y-1 text-xs font-mono">
          <div class="font-bold text-cyan-400 text-sm border-b border-cyan-500/30 pb-1">
            ${road.highway} // ${road.segment}
          </div>
          <div class="text-[11px] text-slate-300">Condition: <span class="text-emerald-400 font-bold">${road.status}</span></div>
          <div class="text-[11px] text-slate-300">Visibility: <span class="text-white">${road.visibility}</span></div>
          <div class="text-[10px] text-slate-400">Patrol: ${road.lastUpdated}</div>
        </div>
      `);
    });
  }, [roads, layers.roads]);

  // Render Outages
  useEffect(() => {
    if (!outagesGroupRef.current || !mapInstanceRef.current) return;
    outagesGroupRef.current.clearLayers();

    if (!layers.hydro) return;

    outages.forEach((outage) => {
      const icon = L.divIcon({
        className: 'hydro-marker-icon',
        html: `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/95 border-2 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] font-mono text-[10px] whitespace-nowrap animate-pulse pointer-events-auto">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>OUTAGE: ${outage.customersAffected}</span>
          </div>
        `,
        iconSize: [95, 24],
        iconAnchor: [47, 12],
      });

      const marker = L.marker([outage.latitude, outage.longitude], { icon, zIndexOffset: 70 }).addTo(
        outagesGroupRef.current!
      );
      marker.bindPopup(`
        <div class="p-2 space-y-1 text-xs font-mono">
          <div class="font-bold text-rose-400 text-sm border-b border-rose-500/30 pb-1">
            HYDRO ONE OUTAGE // ${outage.location}
          </div>
          <div class="text-[11px] text-slate-300">Customers Affected: <span class="text-rose-300 font-bold">${outage.customersAffected}</span></div>
          <div class="text-[11px] text-slate-300">Status: <span class="text-amber-400 font-semibold">${outage.status}</span></div>
          <div class="text-[11px] text-slate-300">Cause: <span class="text-white">${outage.cause}</span></div>
          <div class="text-[11px] text-slate-300">ETA: <span class="text-cyan-300">${outage.estimatedRestoration}</span></div>
        </div>
      `);
    });
  }, [outages, layers.hydro]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Style Selector Bar */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:bottom-5 sm:left-5 z-20 flex flex-wrap items-center bg-slate-950/95 border border-cyan-500/40 rounded p-1 font-mono text-[10px] sm:text-xs backdrop-blur-md shadow-2xl gap-1 max-w-[calc(100vw-24px)] overflow-x-auto">
        <span className="text-[9px] text-slate-500 px-1.5 uppercase tracking-wider hidden md:inline">
          STYLE:
        </span>
        <button
          onClick={() => setMapStyle('streets')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded transition-all font-semibold whitespace-nowrap ${
            mapStyle === 'streets'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-3 h-3" />
          STREETS
        </button>
        <button
          onClick={() => setMapStyle('tactical')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded transition-all font-semibold whitespace-nowrap ${
            mapStyle === 'tactical'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3 h-3" />
          TACTICAL
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded transition-all font-semibold whitespace-nowrap ${
            mapStyle === 'satellite'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Navigation2 className="w-3 h-3" />
          SATELLITE
        </button>
        <button
          onClick={() => setMapStyle('topo')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded transition-all font-semibold whitespace-nowrap ${
            mapStyle === 'topo'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Mountain className="w-3 h-3" />
          TOPO
        </button>

        {/* Subtle Sector Selector */}
        <div className="h-3 w-px bg-slate-800 mx-0.5 hidden sm:block" />
        <select
          onChange={(e) => {
            const town = NORTH_PERTH_TOWNS.find((t) => t.id === e.target.value);
            if (town) mapInstanceRef.current?.flyTo(town.coords, 13, { duration: 1.2 });
            e.target.value = '';
          }}
          defaultValue=""
          className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-[10px] sm:text-[11px] text-slate-300 font-mono hover:border-cyan-500/50 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-none"
        >
          <option value="" disabled>
            SECTOR...
          </option>
          {NORTH_PERTH_TOWNS.map((town) => (
            <option key={town.id} value={town.id}>
              {town.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
