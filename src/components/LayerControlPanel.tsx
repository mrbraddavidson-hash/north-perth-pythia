import React from 'react';
import {
  Layers,
  MapPin,
  Plane,
  CloudRain,
  Waves,
  Camera,
  Navigation,
  Zap,
  ShieldAlert,
  Bus,
  Satellite,
  Sliders,
  Check,
  Wind,
  Crosshair,
} from 'lucide-react';
import { ActiveLayers } from '../services/types';

interface LayerControlPanelProps {
  layers: ActiveLayers;
  onToggleLayer: (key: keyof ActiveLayers) => void;
  radarOpacity: number;
  onChangeRadarOpacity: (val: number) => void;
  flightCount: number;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggleLayer,
  radarOpacity,
  onChangeRadarOpacity,
  flightCount,
}) => {
  const layerItems: {
    key: keyof ActiveLayers;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      key: 'towns',
      label: 'Town & Sector Badges',
      sublabel: 'Listowel, Atwood, Monkton, etc.',
      icon: <MapPin className="w-4 h-4" />,
      color: 'text-cyan-400',
      badge: '8 TOWNS',
    },
    {
      key: 'radar',
      label: 'Exeter Doppler Radar',
      sublabel: 'Environment Canada GeoMet WMS',
      icon: <CloudRain className="w-4 h-4" />,
      color: 'text-cyan-400',
      badge: 'LIVE WMS',
    },
    {
      key: 'squall',
      label: 'Huron Squall Streamers',
      sublabel: 'Lake Effect Vector Model',
      icon: <Wind className="w-4 h-4" />,
      color: 'text-blue-400',
      badge: 'SQUALL',
    },
    {
      key: 'flights',
      label: 'Airspace Overhead',
      sublabel: 'Live ADS-B Receiver Mesh',
      icon: <Plane className="w-4 h-4" />,
      color: 'text-amber-400',
      badge: `${flightCount} TRACKED`,
    },
    {
      key: 'helipad',
      label: 'LMH Hospital Helipad',
      sublabel: 'Listowel Memorial (CPN5)',
      icon: <Crosshair className="w-4 h-4" />,
      color: 'text-rose-400',
      badge: 'CPN5',
    },
    {
      key: 'river',
      label: 'Maitland River Gauges',
      sublabel: 'ECCC WaterOffice Stations',
      icon: <Waves className="w-4 h-4" />,
      color: 'text-emerald-400',
      badge: 'LIVE ECCC',
    },
    {
      key: 'cams',
      label: 'Highway CCTV Feeds',
      sublabel: 'MTO 511 Regional Corridors',
      icon: <Camera className="w-4 h-4" />,
      color: 'text-indigo-400',
      badge: '511 CCTV',
    },
    {
      key: 'dispatches',
      label: 'Highway Emergency Incidents',
      sublabel: 'Live MTO & OPP Closures',
      icon: <ShieldAlert className="w-4 h-4" />,
      color: 'text-rose-400',
      badge: 'LIVE 511',
    },
    {
      key: 'satellites',
      label: 'Orbital Overpasses',
      sublabel: 'Live ISS Space Station',
      icon: <Satellite className="w-4 h-4" />,
      color: 'text-purple-400',
      badge: 'ISS LIVE',
    },
  ];

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col bg-slate-950/90 border-r border-cyan-500/20 backdrop-blur-md overflow-hidden z-20">
      {/* Panel Title */}
      <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tactical text-xs tracking-wider font-semibold text-slate-200">
            INTELLIGENCE LAYERS
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
          PYTHIA V1.2
        </span>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layerItems.map((item) => {
          const isActive = layers[item.key];
          return (
            <div
              key={item.key}
              onClick={() => onToggleLayer(item.key)}
              className={`group flex items-center justify-between p-2.5 rounded cursor-pointer border transition-all ${
                isActive
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.1)]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded border transition-colors ${
                    isActive
                      ? `bg-slate-950 border-cyan-400 ${item.color}`
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold font-mono tracking-wide ${
                        isActive ? 'text-slate-100' : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">{item.sublabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <div
                  className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-cyan-400 border-cyan-300 text-slate-950'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Doppler Radar Opacity Controls */}
        {layers.radar && (
          <div className="mt-3 p-2.5 rounded bg-slate-900/60 border border-cyan-500/20 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-cyan-300">
                <Sliders className="w-3 h-3 text-cyan-400" />
                Radar Layer Opacity
              </span>
              <span className="text-cyan-400 font-bold">{Math.round(radarOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={radarOpacity}
              onChange={(e) => onChangeRadarOpacity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-cyan-500/20 bg-slate-900/60 font-mono text-[10px] text-slate-400 flex items-center justify-between">
        <span>BOUNDING: PERTH CTY</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          STREAMS SYNCED
        </span>
      </div>
    </aside>
  );
};
