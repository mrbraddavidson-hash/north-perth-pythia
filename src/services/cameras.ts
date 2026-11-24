// MTO 511 traffic cameras within 45 km of Listowel (snapshot of the 511on.ca camera list, Nov 2026).
// Snapshot images are public and need no API key; only the camera *list* does. This catalog keeps the
// Road Cams layer working without a key. If ONTARIO_511_KEY is set on the Pages proxy, the live list is used instead.
export interface BundledCamera {
  id: number;
  name: string;
  highway: string;
  latitude: number;
  longitude: number;
  direction: string;
  views: { id: number; description: string }[];
}

export const NORTH_PERTH_TRAFFIC_CAMERAS: BundledCamera[] = [
  {
    id: 99,
    name: "Highway 23 South of line 89",
    highway: "Highway 23",
    latitude: 43.79166,
    longitude: -80.90575,
    direction: "Unknown",
    views: [
      { id: 291, description: "Looking North" },
      { id: 292, description: "Looking Down" },
      { id: 293, description: "Looking South" },
    ],
  },
  {
    id: 1230,
    name: "Highway 23 North of 5th Line",
    highway: "Highway 23",
    latitude: 43.871655,
    longitude: -80.877379,
    direction: "Unknown",
    views: [
      { id: 2426, description: "Looking South" },
      { id: 2427, description: "Looking Down" },
      { id: 2428, description: "Looking North" },
    ],
  },
  {
    id: 638,
    name: "Highway 23 South of Line 60",
    highway: "Highway 23",
    latitude: 43.6022,
    longitude: -81.07004,
    direction: "Unknown",
    views: [
      { id: 1138, description: "Looking South" },
      { id: 1139, description: "Looking Down" },
      { id: 1140, description: "Looking North" },
    ],
  },
  {
    id: 632,
    name: "Highway 9 South of Ayton Road",
    highway: "Highway 9",
    latitude: 43.9294,
    longitude: -80.90243,
    direction: "Unknown",
    views: [
      { id: 1121, description: "Looking North" },
      { id: 1122, description: "Looking Down" },
      { id: 1123, description: "Looking South" },
    ],
  },
  {
    id: 14,
    name: "Highway 6 near Sideroad 3",
    highway: "Highway 6",
    latitude: 43.947872,
    longitude: -80.71581,
    direction: "Unknown",
    views: [
      { id: 40, description: "Looking South" },
      { id: 41, description: "Looking Down" },
      { id: 42, description: "Looking North" },
    ],
  },
  {
    id: 15,
    name: "Highway 6 near County Road 9",
    highway: "Highway 6",
    latitude: 44.05002,
    longitude: -80.79426,
    direction: "Unknown",
    views: [
      { id: 43, description: "Looking North" },
      { id: 44, description: "Looking Down" },
      { id: 45, description: "Looking South" },
    ],
  },
  {
    id: 626,
    name: "Highway 7/8 at Perth Road 107",
    highway: "Highway 7/8",
    latitude: 43.36968,
    longitude: -80.83715,
    direction: "Unknown",
    views: [
      { id: 1101, description: "Looking East" },
      { id: 1102, description: "Looking West" },
      { id: 1103, description: "Looking South" },
    ],
  },
  {
    id: 27,
    name: "Highway 8 near Division Line",
    highway: "Highway 8",
    latitude: 43.56605,
    longitude: -81.42234,
    direction: "Unknown",
    views: [
      { id: 77, description: "Looking West" },
      { id: 78, description: "Looking Down" },
      { id: 79, description: "Looking East" },
    ],
  },
  {
    id: 13,
    name: "Highway 6 near Sideroad 10",
    highway: "Highway 6",
    latitude: 43.735063,
    longitude: -80.420469,
    direction: "Unknown",
    views: [
      { id: 37, description: "Looking North" },
      { id: 38, description: "Looking Down" },
      { id: 39, description: "Looking South" },
    ],
  },
  {
    id: 1316,
    name: "Highway 89 at Grey Road 14",
    highway: "Highway 89",
    latitude: 43.998106,
    longitude: -80.56938,
    direction: "Unknown",
    views: [
      { id: 2640, description: "Looking West" },
    ],
  },
  {
    id: 628,
    name: "Highway 7/8 near Foundry Street",
    highway: "Highway 7/8",
    latitude: 43.3941,
    longitude: -80.65453,
    direction: "Unknown",
    views: [
      { id: 1108, description: "Looking East" },
      { id: 1109, description: "Looking Down" },
      { id: 1110, description: "Looking West" },
    ],
  },
  {
    id: 627,
    name: "Highway 7/8 at Peel Street",
    highway: "Highway 7/8",
    latitude: 43.37246,
    longitude: -80.7035,
    direction: "Unknown",
    views: [
      { id: 1104, description: "Looking West" },
      { id: 1105, description: "Looking Down" },
      { id: 1106, description: "Looking South" },
      { id: 1107, description: "Looking North" },
    ],
  },
];

const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

// MTO publishes still snapshots only (no video). We make them as live as the source allows:
// auto-refresh, show when the image was actually taken, and switch between the camera's angles.
const REFRESH_MS = 30_000;
const snapshotUrl = (viewId: number) => `/api/511/map/Cctv/${viewId}`;

// Popup markup shared by the 2D (Leaflet) and 3D (MapLibre) camera layers. Pair with attachLiveCamera().
export function cameraPopupHtml(cam: import('./types').TrafficCamera): string {
  const views = cam.views ?? [];
  const first = views[0];
  const angleButtons =
    views.length > 1
      ? `<div class="flex flex-wrap gap-1">${views
          .map(
            (v, i) =>
              `<button type="button" data-cam-view="${v.id}" class="px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer ${
                i === 0 ? 'bg-indigo-900 border-indigo-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'
              }">${escapeHtml(v.description.replace(/^Looking\s+/i, ''))}</button>`
          )
          .join('')}</div>`
      : '';
  return `
    <div class="p-2 space-y-2 text-xs font-mono w-[280px] text-slate-200" data-cam-popup>
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-1">
        <span class="font-bold text-indigo-300 text-sm">${escapeHtml(cam.highway)} CAM</span>
        <span class="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>AUTO-REFRESH 30s
        </span>
      </div>
      <div class="text-[11px] font-semibold text-white">${escapeHtml(cam.name)}</div>
      <div class="relative rounded overflow-hidden border border-slate-700 bg-slate-900 aspect-video">
        <img data-cam-img src="${first ? `${snapshotUrl(first.id)}?t=${Date.now()}` : ''}" alt="${escapeHtml(cam.name)}" class="w-full h-full object-cover" loading="eager" />
        ${cam.distanceKm !== undefined ? `<div class="absolute top-1 left-1 text-[9px] bg-slate-950/85 px-1.5 py-0.5 text-slate-300 rounded border border-slate-700">${cam.distanceKm} km from Listowel</div>` : ''}
        <div data-cam-age class="absolute bottom-1 right-1 text-[9px] bg-black/85 px-1.5 py-0.5 text-cyan-300 rounded">Checking image time…</div>
      </div>
      <div class="flex items-center justify-between text-[10px] text-slate-400">
        <span>View: <strong data-cam-dir class="text-white">${escapeHtml(first?.description ?? cam.direction)}</strong></span>
        ${views.length > 1 ? `<span class="text-indigo-300 font-semibold">${views.length} angles</span>` : ''}
      </div>
      ${angleButtons}
      <a data-cam-link href="https://511on.ca/map/Cctv/${first?.id ?? ''}" target="_blank" rel="noopener noreferrer"
         class="flex items-center justify-center w-full py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-bold no-underline">
        OPEN ON 511ON.CA ↗
      </a>
    </div>`;
}

function describeAge(lastModified: string | null): string {
  if (!lastModified) return 'LIVE MTO SNAPSHOT';
  const taken = new Date(lastModified);
  if (Number.isNaN(taken.getTime())) return 'LIVE MTO SNAPSHOT';
  const mins = Math.max(0, Math.round((Date.now() - taken.getTime()) / 60000));
  const clock = taken.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Taken ${clock} (${mins === 0 ? 'just now' : `${mins} min ago`})`;
}

// Wires up a rendered camera popup: angle switching, 30s auto-refresh and image-age label.
// Returns a cleanup function to call when the popup closes.
export function attachLiveCamera(root: HTMLElement | null | undefined, cam: import('./types').TrafficCamera): () => void {
  const container = root?.querySelector<HTMLElement>('[data-cam-popup]');
  const img = container?.querySelector<HTMLImageElement>('[data-cam-img]');
  const views = cam.views ?? [];
  if (!container || !img || views.length === 0) return () => {};

  const ageEl = container.querySelector<HTMLElement>('[data-cam-age]');
  const dirEl = container.querySelector<HTMLElement>('[data-cam-dir]');
  const linkEl = container.querySelector<HTMLAnchorElement>('[data-cam-link]');
  let viewId = views[0].id;
  let stopped = false;

  const refresh = async () => {
    const url = `${snapshotUrl(viewId)}?t=${Date.now()}`;
    // Preload, then swap, so the image never flashes blank between refreshes
    const next = new Image();
    next.onload = () => {
      if (!stopped) img.src = url;
    };
    next.src = url;
    try {
      const res = await fetch(snapshotUrl(viewId), { method: 'HEAD', cache: 'no-store' });
      if (!stopped && ageEl) ageEl.textContent = describeAge(res.headers.get('Last-Modified'));
    } catch {
      if (!stopped && ageEl) ageEl.textContent = 'LIVE MTO SNAPSHOT';
    }
  };

  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cam-view]');
    if (!btn) return;
    viewId = Number(btn.dataset.camView);
    const view = views.find((v) => v.id === viewId);
    container.querySelectorAll<HTMLElement>('[data-cam-view]').forEach((b) => {
      const active = b === btn;
      b.className = b.className
        .replace(/bg-\S+ border-\S+ text-\S+/, active ? 'bg-indigo-900 border-indigo-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400');
    });
    if (dirEl && view) dirEl.textContent = view.description;
    if (linkEl) linkEl.href = `https://511on.ca/map/Cctv/${viewId}`;
    if (ageEl) ageEl.textContent = 'Loading…';
    void refresh();
  };

  container.addEventListener('click', onClick);
  void refresh();
  const timer = window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, REFRESH_MS);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    container.removeEventListener('click', onClick);
  };
}
