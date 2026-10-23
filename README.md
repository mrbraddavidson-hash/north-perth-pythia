# NORTH PERTH // TACTICAL SITREP & INTELLIGENCE HUD
> Hyper-local situational awareness dashboard and forecasting oracle inspired by **Project Pythia / Osiris**, centered on **North Perth, Ontario** (`43°43'54"N, 80°57'09"W`).

---

## 🛰️ Overview

While global Pythia tracks global conflicts, intercontinental flights, and satellites, **North Perth Pythia** translates that exact same tactical HUD command-center aesthetic to the high-stakes, day-to-day realities of Southwestern Ontario (Listowel, Atwood, Monkton, and Perth County):

* **Live OpenSky ADS-B Airspace Tracking:** Real-time aircraft passing directly overhead in the Listowel airspace (commercial flights inbound to Pearson, London/Waterloo regional traffic, and Ornge Air Ambulance transfers from Listowel Memorial Hospital).
* **Environment Canada Exeter Doppler Radar (WMS):** Live composite precipitation radar overlay from the nearby MSC Exeter radar station (`RADAR_1KM_RRAI`), complete with live opacity slider controls.
* **Middle Maitland River Hydrometric Station (#02FE003):** Direct real-time river level (meters) and water discharge (m³/s) monitoring at Listowel from WaterOffice Canada to track flood and runoff stages.
* **Hyper-Local Weather Telemetry:** Real-time temperature, wind vectors, gusts, barometric pressure, and cloud cover over North Perth via Open-Meteo.
* **Ontario 511 Traffic & Highway Cams:** Highway 23 (Wallace Ave, Palmerston, Monkton/Mitchell) and Highway 86 corridors with highway pavement surface conditions (Bare & Dry, Snow-Packed, Closed).
* **Hydro One Power Grid Status:** Local outage polygon tracker with customer impact and restoration ETAs.
* **Emergency Dispatch / Public Safety Logs:** OPP Perth County, North Perth Fire Services (Listowel, Atwood, Monkton stations), and Paramedic call logs.
* **HPSTS School Bus Alerts:** Zone 3 (North Perth) morning and afternoon bus status.
* **Pythia AI Sitrep Oracle:** Multi-persona synthesized local assessment (Transit & Road Operations, Maitland Watershed Risk, Hydro Grid Stability).

---

## ⚡ Quick Start

### 1. Development Server
```bash
npm install
npm run dev
```
Open **[http://127.0.0.1:3000](http://127.0.0.1:3000)** in your browser.

### 2. Production Build
```bash
npm run build
npm run preview
```

---

## 🎛️ Layer Controls

Use the left sidebar to toggle any layer on or off in real time:
- **Exeter Doppler Radar** (with adjustable opacity)
- **Airspace Overhead** (interactive aircraft markers with altitude, speed, and heading)
- **Maitland River Gauge** (real-time WaterOffice Canada telemetry)
- **Traffic CCTV Cams** (click markers to view live camera snapshots)
- **Road Surface & Plows** (color-coded highway segments)
- **Hydro One Outages**
- **Emergency / OPP Logs**
- **School Bus Status (HPSTS Zone 3)**
- **Orbital Overpasses**

---

## 🖥️ Recommended Deployment

* **Homelab / Wall-mounted Display:** Press the **Fullscreen button** (top right) to enter borderless tactical kiosk mode.
* **Desktop Command Station:** Designed for dual monitors with dark mode and scanline HUD styling.
