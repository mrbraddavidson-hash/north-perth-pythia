// MTO 511 traffic cameras within 75 km of Listowel (snapshot of the 511on.ca camera list, Nov 2026).
// Snapshot images are public and need no API key; only the camera *list* does. This catalog keeps the
// Road Cams layer working without a key. If ONTARIO_511_KEY is set on the Pages proxy, the live list is used instead.
export const CAMERA_RADIUS_KM = 75;

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
  {
    id: 19,
    name: "Highway 7 near County Road 26",
    highway: "Highway 7",
    latitude: 43.328528,
    longitude: -81.019244,
    direction: "Unknown",
    views: [
      { id: 53, description: "Looking North" },
      { id: 54, description: "Looking Down" },
      { id: 55, description: "Looking South" },
    ],
  },
  {
    id: 1315,
    name: "Highway 85 at University Avenue East",
    highway: "Highway 85",
    latitude: 43.487233,
    longitude: -80.502129,
    direction: "Unknown",
    views: [
      { id: 2637, description: "Looking North" },
      { id: 2638, description: "Looking South" },
      { id: 2639, description: "Looking South" },
    ],
  },
  {
    id: 1308,
    name: "Highway 9 at Bruce Road 3",
    highway: "Highway 9",
    latitude: 44.1091,
    longitude: -81.199478,
    direction: "Unknown",
    views: [
      { id: 2617, description: "Looking North" },
      { id: 2618, description: "Looking North" },
      { id: 2619, description: "Looking West" },
    ],
  },
  {
    id: 625,
    name: "Highway 7 near Perth County Road 20",
    highway: "Highway 7",
    latitude: 43.3106,
    longitude: -81.034,
    direction: "Unknown",
    views: [
      { id: 1098, description: "Looking West" },
      { id: 1099, description: "Looking North" },
      { id: 1100, description: "Looking South" },
    ],
  },
  {
    id: 1397,
    name: "Highway 7/8 at Trussler Road",
    highway: "Highway 7/8",
    latitude: 43.408748,
    longitude: -80.551594,
    direction: "Unknown",
    views: [
      { id: 2810, description: "Looking West" },
      { id: 2811, description: "Looking East" },
      { id: 2812, description: "Looking Down" },
    ],
  },
  {
    id: 1309,
    name: "Highway 9 at Bruce Road 4 and 20",
    highway: "Highway 9",
    latitude: 44.092482,
    longitude: -81.311339,
    direction: "Unknown",
    views: [
      { id: 2620, description: "Looking West" },
      { id: 2621, description: "Looking East" },
      { id: 2622, description: "Looking Down" },
    ],
  },
  {
    id: 513,
    name: "Highway 7/8 at Fischer-Hallman Road",
    highway: "Highway 7/8",
    latitude: 43.418417,
    longitude: -80.5147,
    direction: "Unknown",
    views: [
      { id: 873, description: "Camera Angle" },
    ],
  },
  {
    id: 514,
    name: "Highway 7/8 at Homer Watson Boulevard",
    highway: "Highway 7/8",
    latitude: 43.4273,
    longitude: -80.486,
    direction: "Unknown",
    views: [
      { id: 874, description: "Camera Angle" },
    ],
  },
  {
    id: 28,
    name: "Highway 8 at Highway 7",
    highway: "Highway 8",
    latitude: 43.43561,
    longitude: -80.456521,
    direction: "Unknown",
    views: [
      { id: 2579, description: "Looking East" },
      { id: 2580, description: "Looking West" },
      { id: 2581, description: "Looking North" },
    ],
  },
  {
    id: 1311,
    name: "Highway 23 South of Perth Line 8",
    highway: "Highway 23",
    latitude: 43.319119,
    longitude: -81.317524,
    direction: "Unknown",
    views: [
      { id: 2626, description: "Looking North" },
      { id: 2627, description: "Looking Down" },
      { id: 2628, description: "Looking South" },
    ],
  },
  {
    id: 620,
    name: "Highway 6 at Marden Road",
    highway: "Highway 6",
    latitude: 43.5861,
    longitude: -80.29935,
    direction: "Unknown",
    views: [
      { id: 1079, description: "Looking East" },
      { id: 1080, description: "Looking North" },
      { id: 1081, description: "Looking South" },
      { id: 1082, description: "Looking West" },
    ],
  },
  {
    id: 631,
    name: "Highway 8 near Benmiller Line",
    highway: "Highway 8",
    latitude: 43.69542,
    longitude: -81.63816,
    direction: "Unknown",
    views: [
      { id: 1118, description: "Looking South" },
      { id: 1119, description: "Looking Down" },
      { id: 1120, description: "Looking North" },
    ],
  },
  {
    id: 1307,
    name: "Highway 9 at Bruce Road 1",
    highway: "Highway 9",
    latitude: 44.098162,
    longitude: -81.420999,
    direction: "Unknown",
    views: [
      { id: 2615, description: "Looking West" },
      { id: 2616, description: "Looking Down" },
      { id: 2781, description: "Looking East" },
    ],
  },
  {
    id: 619,
    name: "Highway 6 at Speedvale Avenue",
    highway: "Highway 6",
    latitude: 43.5436,
    longitude: -80.28886,
    direction: "Unknown",
    views: [
      { id: 1075, description: "Looking North" },
      { id: 1076, description: "Looking East" },
      { id: 1077, description: "Looking South" },
      { id: 1078, description: "Looking West" },
    ],
  },
  {
    id: 547,
    name: "Highway 401 at Homer Watson Blvd",
    highway: "Highway 401",
    latitude: 43.385032,
    longitude: -80.4048,
    direction: "Unknown",
    views: [
      { id: 907, description: "Camera Angle" },
    ],
  },
  {
    id: 148,
    name: "Highway 401 near Highway 8",
    highway: "Highway 401",
    latitude: 43.40299,
    longitude: -80.37574,
    direction: "Unknown",
    views: [
      { id: 427, description: "Looking East" },
      { id: 428, description: "Looking South" },
      { id: 429, description: "Looking West" },
    ],
  },
  {
    id: 624,
    name: "Highway 7 at Welburn Road",
    highway: "Highway 7",
    latitude: 43.22195,
    longitude: -81.16329,
    direction: "Unknown",
    views: [
      { id: 1095, description: "Looking West" },
      { id: 1096, description: "Looking South" },
      { id: 1097, description: "Looking East" },
    ],
  },
  {
    id: 548,
    name: "Highway 401 at Speedsville Road",
    highway: "Highway 401",
    latitude: 43.413191,
    longitude: -80.3507,
    direction: "Unknown",
    views: [
      { id: 908, description: "Camera Angle" },
    ],
  },
  {
    id: 94,
    name: "Highway 21 at County Road 25",
    highway: "Highway 21",
    latitude: 43.776384,
    longitude: -81.699507,
    direction: "Unknown",
    views: [
      { id: 276, description: "Looking South" },
      { id: 277, description: "Looking Down" },
      { id: 278, description: "Looking North" },
    ],
  },
  {
    id: 637,
    name: "Highway 21 near Nile Road",
    highway: "Highway 21",
    latitude: 43.837,
    longitude: -81.69986,
    direction: "Unknown",
    views: [
      { id: 1135, description: "Looking South" },
      { id: 1136, description: "Looking Down" },
      { id: 1137, description: "Looking North" },
    ],
  },
  {
    id: 1089,
    name: "Highway 401 at Oxford Road 29",
    highway: "Highway 401",
    latitude: 43.2256,
    longitude: -80.60278,
    direction: "Unknown",
    views: [
      { id: 2118, description: "Looking South" },
      { id: 2119, description: "Looking Down" },
      { id: 2120, description: "Looking North" },
    ],
  },
  {
    id: 629,
    name: "Highway 7 at Wellington County Road 29",
    highway: "Highway 7",
    latitude: 43.5903,
    longitude: -80.17751,
    direction: "Unknown",
    views: [
      { id: 1111, description: "Looking West" },
      { id: 1112, description: "Looking North" },
      { id: 1113, description: "Looking East" },
      { id: 1114, description: "Looking South" },
    ],
  },
  {
    id: 1324,
    name: "Highway 401 at Cambridge ONRoute",
    highway: "Highway 401",
    latitude: 43.43527,
    longitude: -80.242921,
    direction: "Unknown",
    views: [
      { id: 2663, description: "Looking East" },
      { id: 2664, description: "Looking West" },
    ],
  },
  {
    id: 635,
    name: "Highway 10 near County Road 9",
    highway: "Highway 10",
    latitude: 44.17907,
    longitude: -80.380567,
    direction: "Unknown",
    views: [
      { id: 1130, description: "Looking South" },
      { id: 1131, description: "Looking North" },
    ],
  },
  {
    id: 30,
    name: "Highway 10 near Regional Road 4",
    highway: "Highway 10",
    latitude: 44.289,
    longitude: -80.599,
    direction: "Unknown",
    views: [
      { id: 86, description: "Looking North" },
      { id: 87, description: "Looking Down" },
      { id: 88, description: "Looking South" },
    ],
  },
  {
    id: 95,
    name: "Highway 21 near Zion Road",
    highway: "Highway 21",
    latitude: 44.01407,
    longitude: -81.71066,
    direction: "Unknown",
    views: [
      { id: 279, description: "Looking South" },
      { id: 280, description: "Looking Down" },
      { id: 281, description: "Looking North" },
    ],
  },
  {
    id: 1450,
    name: "Highway 6 North at Wellington Road 53",
    highway: "Highway 6",
    latitude: 43.465185,
    longitude: -80.183556,
    direction: "Unknown",
    views: [
      { id: 2908, description: "Camera Angle" },
    ],
  },
  {
    id: 1449,
    name: "Highway 401 at Highway 6 North",
    highway: "Highway 401",
    latitude: 43.447446,
    longitude: -80.175146,
    direction: "Unknown",
    views: [
      { id: 2907, description: "Camera Angle" },
    ],
  },
  {
    id: 1302,
    name: "Highway 4 at Saintsbury Line",
    highway: "Highway 4",
    latitude: 43.185134,
    longitude: -81.397279,
    direction: "Unknown",
    views: [
      { id: 2602, description: "Looking North" },
      { id: 2603, description: "Looking South" },
    ],
  },
  {
    id: 147,
    name: "Highway 401 near Highway 403",
    highway: "Highway 401",
    latitude: 43.124,
    longitude: -80.69433,
    direction: "Unknown",
    views: [
      { id: 424, description: "Looking North" },
      { id: 425, description: "Looking Down" },
      { id: 426, description: "Looking South" },
    ],
  },
  {
    id: 546,
    name: "Highway 401 / Highway 403",
    highway: "Highway 401",
    latitude: 43.118,
    longitude: -80.7073,
    direction: "Unknown",
    views: [
      { id: 906, description: "Camera Angle" },
    ],
  },
  {
    id: 545,
    name: "Highway 401 at County Road 59",
    highway: "Highway 401",
    latitude: 43.10512,
    longitude: -80.7454,
    direction: "Unknown",
    views: [
      { id: 905, description: "Camera Angle" },
    ],
  },
  {
    id: 149,
    name: "Highway 401 East of Highway 6 North",
    highway: "Highway 401",
    latitude: 43.4499,
    longitude: -80.14992,
    direction: "Unknown",
    views: [
      { id: 430, description: "Looking East" },
      { id: 431, description: "Looking South" },
      { id: 432, description: "Looking West" },
    ],
  },
  {
    id: 667,
    name: "Highway 403 at Oxford Road 55",
    highway: "Highway 403",
    latitude: 43.12771,
    longitude: -80.63602,
    direction: "Unknown",
    views: [
      { id: 1216, description: "Looking West" },
      { id: 1217, description: "Looking Down" },
      { id: 1218, description: "Looking East" },
    ],
  },
  {
    id: 1383,
    name: "Highway 21 at Kincardine Avenue",
    highway: "Highway 21",
    latitude: 44.159073,
    longitude: -81.627213,
    direction: "Unknown",
    views: [
      { id: 2790, description: "Looking South" },
      { id: 2791, description: "Looking North" },
      { id: 2792, description: "Looking North" },
    ],
  },
  {
    id: 11,
    name: "Highway 4 near Fifteen Mile Road",
    highway: "Highway 4",
    latitude: 43.15078,
    longitude: -81.34683,
    direction: "Unknown",
    views: [
      { id: 31, description: "Looking South" },
      { id: 32, description: "Looking Down" },
      { id: 33, description: "Looking North" },
    ],
  },
  {
    id: 1398,
    name: "Highway 21 at Russel Street",
    highway: "Highway 21",
    latitude: 44.168306,
    longitude: -81.620058,
    direction: "Unknown",
    views: [
      { id: 2813, description: "Looking North" },
      { id: 2814, description: "Looking South" },
      { id: 2815, description: "Looking North" },
    ],
  },
  {
    id: 29,
    name: "Highway 10 near Regional Road 10",
    highway: "Highway 10",
    latitude: 43.97064,
    longitude: -80.11068,
    direction: "Unknown",
    views: [
      { id: 83, description: "Looking North" },
      { id: 84, description: "Looking Down" },
      { id: 85, description: "Looking South" },
    ],
  },
  {
    id: 633,
    name: "Highway 10 at Buena Vista Drive",
    highway: "Highway 10",
    latitude: 43.92193,
    longitude: -80.08331,
    direction: "Unknown",
    views: [
      { id: 1124, description: "Looking East" },
      { id: 1125, description: "Looking South" },
      { id: 1126, description: "Looking West" },
    ],
  },
];

export const escapeHtml = (v: unknown) =>
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
