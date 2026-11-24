import React, { useEffect } from 'react';
import { Construction, ExternalLink, X } from 'lucide-react';
import { NORTH_PERTH_COORDS } from '../services/api';

// Municipal511 (Transnomis) official "Embed Current Map". Their terms don't allow reusing the data itself,
// but this embed is offered for any site (frame-ancestors *), so we show their live map as-is.
const MUNICIPAL511_STATE = {
  ActiveIssuesEnabled: true,
  FutureIssuesEnabled: true, // next 7 days
  Future30DaysEnabled: false,
  GoogleTrafficEnabled: false,
  EnabledCategories: [
    'Road Closures, Construction, Events',
    'Road Restrictions, Cautions (Truck, Bus, Farm, RV)',
    'Road Conditions',
    'Emergency Notices',
    'Cameras',
  ],
  DisabledCategories: [],
  EnabledSidebarOverlays: [],
  ActiveExclusiveFilter: null,
};
const embedUrl = (sidebarHidden: boolean) =>
  `https://www.municipal511.ca/TravelInfo?lat=${NORTH_PERTH_COORDS[0]}&lng=${NORTH_PERTH_COORDS[1]}&zoom=10` +
  `&sidebarState=${encodeURIComponent(btoa(JSON.stringify(MUNICIPAL511_STATE)))}` +
  `&sidebarHidden=${sidebarHidden}&language=en-us&enableNewCategories=false`;

interface MunicipalRoadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MunicipalRoadsModal: React.FC<MunicipalRoadsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 font-mono"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="municipal-roads-title"
        className="flex flex-col w-full max-w-6xl h-[90dvh] bg-slate-950 border border-amber-500/40 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-amber-500/30 bg-slate-900/80">
          <div className="flex items-center gap-2 min-w-0">
            <Construction className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <h2 id="municipal-roads-title" className="font-tactical text-sm font-bold text-white tracking-wider truncate">
                MUNICIPAL ROADS // CLOSURES, LOAD LIMITS & CAMS
              </h2>
              <p className="text-[10px] text-slate-400 truncate">
                Township & county closures, construction, truck/farm restrictions and road cams — live from Municipal511
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={embedUrl(false)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white text-[10px] font-bold no-underline"
            >
              FULL SITE <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <iframe
          title="Municipal511 road closures and restrictions around North Perth"
          src={embedUrl(true)}
          className="flex-1 w-full border-0 bg-slate-900"
          referrerPolicy="no-referrer-when-downgrade"
        />

        <div className="px-3 py-1 text-[9px] text-slate-500 border-t border-slate-800 bg-slate-950">
          Map and data © Municipal511 / Transnomis Solutions, shown via their official embed. Click an icon for details.
        </div>
      </div>
    </div>
  );
};
