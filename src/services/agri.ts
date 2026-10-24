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
