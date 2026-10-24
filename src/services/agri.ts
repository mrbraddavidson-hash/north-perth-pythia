// Live Agricultural, Soil Physics & Commodity Intelligence for North Perth & Perth County

export interface SprayCondition {
  deltaTCelsius: number;
  status: 'OPTIMAL' | 'MARGINAL_LOW' | 'CAUTION_HIGH' | 'UNSUITABLE_EVAPORATION' | 'DRIFT_RISK' | 'INVERSION_RISK';
  recommendation: string;
  windSpeedKmh: number;
  humidityPercent: number;
}

export interface SoilTelemetry {
  timestamp: string;
  soilTemp0cm: number;
  soilTemp6cm: number;
  soilTemp18cm: number;
  soilMoisture0to1cm: number; // percentage %
  soilMoisture1to3cm: number; // percentage %
  soilMoisture3to9cm: number; // percentage %
  vpdKpa: number;
  et0Mm: number;
}

export interface CommodityFuture {
  symbol: string;
  name: string;
  contract: string;
  unit: string;
  price: number;
  changePercent: number;
  changeValue: number;
  exchange: string;
}

// 1. Calculate agronomic Delta-T and Spray Window based on temperature, humidity, and wind
export function calculateSprayWindow(tempC: number, rhPercent: number, windKmh: number): SprayCondition {
  const T = tempC;
  const RH = Math.max(1, Math.min(100, rhPercent));

  // Stull's equation approximation for Wet-Bulb Temperature
  const tw =
    T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;

  const deltaT = Math.max(0, Math.round((T - tw) * 10) / 10);

  if (windKmh > 22) {
    return {
      deltaTCelsius: deltaT,
      status: 'DRIFT_RISK',
      recommendation: `High wind drift risk (${windKmh} km/h). Postpone droplet application until wind subsides below 18 km/h.`,
      windSpeedKmh: windKmh,
      humidityPercent: rhPercent,
    };
  }

  if (windKmh < 4) {
    return {
      deltaTCelsius: deltaT,
      status: 'INVERSION_RISK',
      recommendation: 'Calm air indicates potential surface temperature inversion. Avoid fine droplet application.',
      windSpeedKmh: windKmh,
      humidityPercent: rhPercent,
    };
  }

  if (deltaT >= 2 && deltaT <= 8) {
    return {
      deltaTCelsius: deltaT,
      status: 'OPTIMAL',
      recommendation: `Optimal agronomic spray window (Delta-T: ${deltaT}°C). Droplet survival and target deposition are balanced.`,
      windSpeedKmh: windKmh,
      humidityPercent: rhPercent,
    };
  }

  if (deltaT > 8 && deltaT <= 10) {
    return {
      deltaTCelsius: deltaT,
      status: 'CAUTION_HIGH',
      recommendation: `Caution: High evaporation rate (Delta-T: ${deltaT}°C). Use coarse/very coarse nozzles and anti-drift adjuvants.`,
      windSpeedKmh: windKmh,
      humidityPercent: rhPercent,
    };
  }

  if (deltaT > 10) {
    return {
      deltaTCelsius: deltaT,
      status: 'UNSUITABLE_EVAPORATION',
      recommendation: `Unsuitable: Extreme droplet evaporation (Delta-T: ${deltaT}°C). Significant active ingredient loss expected.`,
      windSpeedKmh: windKmh,
      humidityPercent: rhPercent,
    };
  }

  return {
    deltaTCelsius: deltaT,
    status: 'MARGINAL_LOW',
    recommendation: `Marginal: Low Delta-T (${deltaT}°C). High relative humidity may cause droplet run-off or slow absorption.`,
    windSpeedKmh: windKmh,
    humidityPercent: rhPercent,
  };
}

// 2. Fetch live agrometeorological soil physics & evapotranspiration from Open-Meteo
export async function fetchLiveSoilTelemetry(): Promise<SoilTelemetry | null> {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=43.73&longitude=-80.95&current=soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,vapour_pressure_deficit&hourly=et0_fao_evapotranspiration&timezone=America%2FToronto';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    const et0 = data.hourly?.et0_fao_evapotranspiration ? data.hourly.et0_fao_evapotranspiration[0] : 0.25;

    return {
      timestamp: c.time,
      soilTemp0cm: Math.round(c.soil_temperature_0cm * 10) / 10,
      soilTemp6cm: Math.round(c.soil_temperature_6cm * 10) / 10,
      soilTemp18cm: Math.round(c.soil_temperature_18cm * 10) / 10,
      soilMoisture0to1cm: Math.round(c.soil_moisture_0_to_1cm * 1000) / 10, // % volumetric
      soilMoisture1to3cm: Math.round(c.soil_moisture_1_to_3cm * 1000) / 10,
      soilMoisture3to9cm: Math.round(c.soil_moisture_3_to_9cm * 1000) / 10,
      vpdKpa: Math.round(c.vapour_pressure_deficit * 100) / 100,
      et0Mm: Math.round(et0 * 100) / 100,
    };
  } catch (err) {
    console.warn('Soil telemetry unavailable:', err);
    return null;
  }
}

// 3. Fetch live CBOT / CME Agricultural Commodity Futures
const COMMODITY_SYMBOLS = [
  { symbol: 'ZC=F', name: 'Corn (CBOT)', unit: '$/bu', divisor: 100 },
  { symbol: 'ZS=F', name: 'Soybeans (CBOT)', unit: '$/bu', divisor: 100 },
  { symbol: 'ZW=F', name: 'SRW Wheat (CBOT)', unit: '$/bu', divisor: 100 },
  { symbol: 'LE=F', name: 'Live Cattle (CME)', unit: '¢/lb', divisor: 1 },
  { symbol: 'HE=F', name: 'Lean Hogs (CME)', unit: '¢/lb', divisor: 1 },
];

export async function fetchLiveCommodities(): Promise<CommodityFuture[]> {
  try {
    const promises = COMMODITY_SYMBOLS.map(async (c) => {
      try {
        const url = `/api/commodities/v8/finance/chart/${encodeURIComponent(c.symbol)}?interval=1d&range=5d`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (!meta) return null;

        const rawPrice = meta.regularMarketPrice ?? 0;
        const normalizedPrice = Math.round((rawPrice / c.divisor) * 100) / 100;
        const changePct = meta.regularMarketChangePercent ?? 0;
        const changeVal = meta.fulldayChange ? Math.round((meta.fulldayChange / c.divisor) * 100) / 100 : 0;

        return {
          symbol: c.symbol,
          name: c.name,
          contract: meta.shortName || c.name,
          unit: c.unit,
          price: normalizedPrice,
          changePercent: Math.round(changePct * 100) / 100,
          changeValue: changeVal,
          exchange: meta.exchangeName || 'CBOT',
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<CommodityFuture | null> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value as CommodityFuture);
  } catch (err) {
    console.warn('Live commodities feed error:', err);
    return [];
  }
}

// 4. Burn permit status (North Perth Fire Department)
export interface BurnPermitStatus {
  status: 'PERMITS_ACTIVE' | 'HIGH_HAZARD_ADVISORY' | 'TOTAL_BURN_BAN';
  message: string;
  allowedUntil: string;
}

export function getBurnPermitStatus(): BurnPermitStatus {
  return {
    status: 'PERMITS_ACTIVE',
    message: 'Open-air agricultural burning permitted in rural Elma and Wallace wards with valid permit.',
    allowedUntil: 'Daily 2 hours before sunset',
  };
}

// 5. Ontario Crop Heat Units (CHU) & Growing Degree Days (GDD)
export interface ChuRecord {
  date: string;
  tmax: number;
  tmin: number;
  dailyChu: number;
  dailyGdd10: number;
  dailyGdd5: number;
}

export interface ChuSeasonSummary {
  plantingDate: string;
  accumulatedChu: number;
  accumulatedGdd10: number;
  accumulatedGdd5: number;
  targetBenchmarkChu: number; // 2850 CHU (Perth County standard)
  percentMaturity: number;
  cropPhase: string;
  phaseDescription: string;
  projectedMaturityDate: string | null;
  forecast7DayChu: number;
  dailyHistory: ChuRecord[];
}

export function calculateDailyChu(tmax: number, tmin: number): number {
  const ymax = tmax > 10.0 ? 3.33 * (tmax - 10.0) - 0.084 * Math.pow(tmax - 10.0, 2) : 0;
  const ymin = tmin > 4.4 ? 1.8 * (tmin - 4.4) : 0;
  return Math.max(0, Math.round(((ymax + ymin) / 2) * 10) / 10);
}

export function calculateDailyGdd(tmax: number, tmin: number, baseTemp: number): number {
  const avg = (tmax + tmin) / 2;
  return Math.max(0, Math.round((avg - baseTemp) * 10) / 10);
}

export async function fetchLiveChuData(plantingDateStr: string = '2024-05-01'): Promise<ChuSeasonSummary | null> {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    // Default to May 1 of current year if plantingDateStr isn't set
    const pDate = plantingDateStr || `${currentYear}-05-01`;
    const todayStr = today.toISOString().split('T')[0];

    // 1. Fetch historical archive up to today
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=43.73&longitude=-80.95&start_date=${pDate}&end_date=${todayStr}&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FToronto`;
    const archiveRes = await fetch(archiveUrl);
    if (!archiveRes.ok) return null;
    const archiveData = await archiveRes.json();

    const times: string[] = archiveData.daily?.time ?? [];
    const tmaxs: number[] = archiveData.daily?.temperature_2m_max ?? [];
    const tmins: number[] = archiveData.daily?.temperature_2m_min ?? [];

    let totalChu = 0;
    let totalGdd10 = 0;
    let totalGdd5 = 0;
    const records: ChuRecord[] = [];

    for (let i = 0; i < times.length; i++) {
      const tmax = tmaxs[i] ?? 0;
      const tmin = tmins[i] ?? 0;
      const dChu = calculateDailyChu(tmax, tmin);
      const dGdd10 = calculateDailyGdd(tmax, tmin, 10);
      const dGdd5 = calculateDailyGdd(tmax, tmin, 5);

      totalChu += dChu;
      totalGdd10 += dGdd10;
      totalGdd5 += dGdd5;

      records.push({
        date: times[i],
        tmax,
        tmin,
        dailyChu: dChu,
        dailyGdd10: dGdd10,
        dailyGdd5: dGdd5,
      });
    }

    // 2. Fetch 7-day forecast to project CHU additions
    let forecastChu = 0;
    try {
      const fUrl = `https://api.open-meteo.com/v1/forecast?latitude=43.73&longitude=-80.95&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=America%2FToronto`;
      const fRes = await fetch(fUrl);
      if (fRes.ok) {
        const fData = await fRes.json();
        const fTmax: number[] = fData.daily?.temperature_2m_max ?? [];
        const fTmin: number[] = fData.daily?.temperature_2m_min ?? [];
        for (let j = 0; j < fTmax.length; j++) {
          forecastChu += calculateDailyChu(fTmax[j] ?? 0, fTmin[j] ?? 0);
        }
      }
    } catch {
      forecastChu = 0;
    }

    const roundedChu = Math.round(totalChu);
    const benchmark = 2850; // Standard Perth County full-season corn target
    const percentMaturity = Math.min(100, Math.round((roundedChu / benchmark) * 100));

    let cropPhase = 'VEGETATIVE';
    let phaseDescription = 'Emergence to early leaf staging.';
    if (roundedChu >= 2850) {
      cropPhase = 'R6 / BLACK LAYER (MATURE)';
      phaseDescription = 'Grain is physiologically mature. Drydown in field underway (<20% moisture target).';
    } else if (roundedChu >= 2500) {
      cropPhase = 'R5 DENT STAGE';
      phaseDescription = 'Kernels dented; starch line advancing towards kernel base. Rapid drydown approaching.';
    } else if (roundedChu >= 2100) {
      cropPhase = 'R4 DOUGH STAGE';
      phaseDescription = 'Kernels thickening with milky starch turning pasty dough.';
    } else if (roundedChu >= 1600) {
      cropPhase = 'R2-R3 BLISTER / MILK';
      phaseDescription = 'Kernel fill and ear elongation in progress.';
    } else if (roundedChu >= 1300) {
      cropPhase = 'VT / R1 SILKING & TASSEL';
      phaseDescription = 'Critical pollination window. Peak moisture demand.';
    } else if (roundedChu >= 800) {
      cropPhase = 'V8-V12 RAPID VEGETATIVE';
      phaseDescription = 'Rapid stalk elongation and ear shoot determination.';
    }

    return {
      plantingDate: pDate,
      accumulatedChu: roundedChu,
      accumulatedGdd10: Math.round(totalGdd10),
      accumulatedGdd5: Math.round(totalGdd5),
      targetBenchmarkChu: benchmark,
      percentMaturity,
      cropPhase,
      phaseDescription,
      projectedMaturityDate: roundedChu >= benchmark ? 'REACHED' : 'Est. Late Sept / Early Oct',
      forecast7DayChu: Math.round(forecastChu),
      dailyHistory: records.slice(-14), // Last 14 days for sparkline/display
    };
  } catch (err) {
    console.warn('CHU calculation error:', err);
    return null;
  }
}

// 6. Live USD/CAD Currency Exchange Rate & Ontario Grain Basis
export async function fetchLiveUsdCadRate(): Promise<number> {
  try {
    const url = `/api/commodities/v8/finance/chart/CAD=X?interval=1d&range=1d`;
    const res = await fetch(url);
    if (!res.ok) return 1.40;
    const json = await res.json();
    const rate = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof rate === 'number' && rate > 0 ? Math.round(rate * 10000) / 10000 : 1.40;
  } catch {
    return 1.40;
  }
}

export interface OntarioElevatorPreset {
  name: string;
  location: string;
  cornBasisCad: number;
  soybeanBasisCad: number;
  wheatBasisCad: number;
}

export const ONTARIO_ELEVATOR_PRESETS: OntarioElevatorPreset[] = [
  {
    name: 'Parrish & Heimbecker (P&H)',
    location: 'Listowel, ON',
    cornBasisCad: 1.25,
    soybeanBasisCad: 2.85,
    wheatBasisCad: 1.10,
  },
  {
    name: 'Hensall Co-op',
    location: 'Hensall / Palmerston, ON',
    cornBasisCad: 1.20,
    soybeanBasisCad: 2.90,
    wheatBasisCad: 1.05,
  },
  {
    name: 'Snobelen Farms',
    location: 'Lucknow / Blyth, ON',
    cornBasisCad: 1.30,
    soybeanBasisCad: 2.80,
    wheatBasisCad: 1.15,
  },
  {
    name: 'Southwestern Ontario Average',
    location: 'Perth & Huron Counties',
    cornBasisCad: 1.25,
    soybeanBasisCad: 2.85,
    wheatBasisCad: 1.10,
  },
];

export function calculateCashGrain(
  cbotPriceUsd: number,
  basisCad: number,
  usdCadRate: number,
  bushelsPerTonne: number
) {
  // Ontario Cash ($/bu CAD) = (CBOT_USD * USDCAD) + Basis_CAD
  const cashCadPerBu = Math.max(0, Math.round(((cbotPriceUsd * usdCadRate) + basisCad) * 100) / 100);
  const cashCadPerTonne = Math.round(cashCadPerBu * bushelsPerTonne * 100) / 100;
  return {
    cashCadPerBu,
    cashCadPerTonne,
  };
}
