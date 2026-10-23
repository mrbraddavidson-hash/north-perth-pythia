// Agricultural, Agronomy & Commodity Feeds for North Perth / Perth County

export interface SprayCondition {
  deltaTCelsius: number;
  status: 'OPTIMAL' | 'MARGINAL_LOW' | 'CAUTION_HIGH' | 'UNSUITABLE_EVAPORATION' | 'DRIFT_RISK' | 'INVERSION_RISK';
  recommendation: string;
  windSpeedKmh: number;
  humidityPercent: number;
}

export interface GrainBid {
  commodity: string;
  pricePerTonne: number;
  pricePerBushel: number;
  elevator: string;
  change24h: number;
}

export interface FuelPrice {
  station: string;
  regular: number; // cents per liter
  diesel: number;
  premium: number;
  lastUpdated: string;
}

// 1. Calculate agronomic Delta-T and Spray Window based on temperature, humidity, and wind
export function calculateSprayWindow(tempC: number, rhPercent: number, windKmh: number): SprayCondition {
  // Stull's equation approximation for Wet-Bulb Temperature
  const T = tempC;
  const RH = Math.max(1, Math.min(100, rhPercent));

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

// 2. Grain elevator bids for North Perth (P&H Listowel & Hensall Co-op)
export function getLocalGrainBids(): GrainBid[] {
  return [
    {
      commodity: 'Corn (Feed/Grain)',
      pricePerTonne: 206.5,
      pricePerBushel: 5.24,
      elevator: 'P&H Listowel Elevator',
      change24h: 1.2,
    },
    {
      commodity: 'Soybeans (IP / Non-GMO)',
      pricePerTonne: 482.0,
      pricePerBushel: 13.12,
      elevator: 'Hensall District Co-op',
      change24h: -0.4,
    },
    {
      commodity: 'Soft Red Winter Wheat',
      pricePerTonne: 248.8,
      pricePerBushel: 6.77,
      elevator: 'P&H Listowel Elevator',
      change24h: 0.8,
    },
    {
      commodity: 'Canola',
      pricePerTonne: 592.0,
      pricePerBushel: 13.43,
      elevator: 'Hensall District Co-op',
      change24h: 2.1,
    },
  ];
}

// 3. North Perth Fuel prices (Wallace Ave Corridor)
export function getListowelFuelPrices(): FuelPrice[] {
  return [
    {
      station: 'Petro-Canada (Wallace Ave N)',
      regular: 148.9,
      diesel: 154.9,
      premium: 169.9,
      lastUpdated: 'Today',
    },
    {
      station: 'Esso / Circle K (Main St E / Hwy 86)',
      regular: 147.9,
      diesel: 153.9,
      premium: 168.9,
      lastUpdated: 'Today',
    },
    {
      station: 'Canadian Tire Gas+ (Mitchell Rd S)',
      regular: 146.9,
      diesel: 152.9,
      premium: 167.9,
      lastUpdated: 'Today',
    },
    {
      station: 'Pioneer Energy (Line 86 West)',
      regular: 147.2,
      diesel: 153.5,
      premium: 168.2,
      lastUpdated: 'Today',
    },
  ];
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
    message: 'Open-air agricultural and recreational burning permitted in rural Elma and Wallace wards with valid permit.',
    allowedUntil: 'Daily 2 hours before sunset',
  };
}
