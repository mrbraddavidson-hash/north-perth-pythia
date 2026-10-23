// Lake Huron Snow Squall Trajectory & Hospital Helipad Telemetry

export interface SquallTrajectory {
  isActive: boolean;
  intensity: 'NONE' | 'MODERATE_STREAMER' | 'HEAVY_SQUALL_BAND' | 'SEVERE_WHITEOUT_ALERT';
  originShoreline: string;
  windHeading: number;
  windSpeedKmh: number;
  affectedCorridors: string[];
  streamerPolygon: [number, number][];
  summary: string;
}

export const LISTOWEL_HELIPAD_COORDS: [number, number] = [43.7372, -80.9568];

export function calculateSquallTrajectory(
  windDirectionDeg: number,
  windSpeedKmh: number,
  temperatureC: number
): SquallTrajectory {
  // Lake Huron squalls occur when wind blows across Lake Huron (typically 270° to 345°) in cold temperatures
  const isColdEnough = temperatureC <= 3.5;
  const isLakeHuronFetch = windDirectionDeg >= 270 && windDirectionDeg <= 345;
  const hasSufficientSpeed = windSpeedKmh >= 15;

  if (!isColdEnough || !isLakeHuronFetch || !hasSufficientSpeed) {
    return {
      isActive: false,
      intensity: 'NONE',
      originShoreline: 'Lake Huron (Goderich / Kincardine)',
      windHeading: windDirectionDeg,
      windSpeedKmh,
      affectedCorridors: [],
      streamerPolygon: [],
      summary: 'No active lake effect squall streamers. Wind direction or ambient temperature outside squall criteria.',
    };
  }

  // Calculate intensity based on wind speed
  let intensity: SquallTrajectory['intensity'] = 'MODERATE_STREAMER';
  if (windSpeedKmh >= 35) {
    intensity = 'SEVERE_WHITEOUT_ALERT';
  } else if (windSpeedKmh >= 24) {
    intensity = 'HEAVY_SQUALL_BAND';
  }

  // Project squall polygon originating from Goderich/Kincardine shoreline
  // Downwind vector: opposite of wind direction (+180 deg)
  const downwindAngle = (windDirectionDeg + 180) % 360;
  const rad = (downwindAngle * Math.PI) / 180;

  // Shoreline origin (Goderich / Port Albert)
  const shoreLat = 43.74;
  const shoreLon = -81.71;

  // Streamer width ~ 8-15km
  const spread = 0.08;
  const length = 0.85; // Reach across Perth County

  const p1: [number, number] = [shoreLat + spread, shoreLon - 0.05];
  const p2: [number, number] = [shoreLat - spread, shoreLon - 0.05];
  const p3: [number, number] = [shoreLat - spread + Math.cos(rad) * length, shoreLon + Math.sin(rad) * length];
  const p4: [number, number] = [shoreLat + spread + Math.cos(rad) * length, shoreLon + Math.sin(rad) * length];

  return {
    isActive: true,
    intensity,
    originShoreline: 'Lake Huron Shoreline (Goderich - Point Clark)',
    windHeading: windDirectionDeg,
    windSpeedKmh,
    affectedCorridors: ['Hwy 23 (Listowel - Palmerston)', 'Hwy 86 (Listowel - Molesworth)', 'Perth Line 86 / Line 84'],
    streamerPolygon: [p1, p2, p3, p4],
    summary: `${intensity.replace(/_/g, ' ')}: Lake Huron snow streamer propagating from shoreline across Highway 23 / 86 corridor at ${windSpeedKmh} km/h (Wind: ${windDirectionDeg}°). Rapid localized visibility drops expected.`,
  };
}
