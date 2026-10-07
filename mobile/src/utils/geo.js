import { BUS_HALTS, ROUTE_WAYPOINTS } from '../data/route177.js';

const EARTH_RADIUS_KM = 6371.0088;

/** Bus is considered to have "reached" a halt inside this radius. */
export const HALT_ARRIVAL_RADIUS_KM = 0.3; // 300 m
/** Below this speed the bus is considered stopped. */
export const MOVING_THRESHOLD_KMH = 2;
/** Assumed average city speed when the bus is stopped / too slow for a meaningful ETA. */
export const FALLBACK_SPEED_KMH = 20;
/** Floor for ETA speed so crawling traffic doesn't produce absurd ETAs. */
export const MIN_ETA_SPEED_KMH = 5;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Haversine great-circle distance in kilometres between two {latitude, longitude} points. */
export function haversineKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** m/s (as reported by GPS) -> km/h. Negative / invalid values clamp to 0. */
export function msToKmh(speedMs) {
  const v = Number(speedMs);
  return Number.isFinite(v) && v > 0 ? v * 3.6 : 0;
}

/**
 * ETA in whole minutes (rounded up) from distance and the live speed in km/h.
 * Stopped/very slow buses use FALLBACK_SPEED_KMH so the ETA stays meaningful.
 */
export function estimateEtaMinutes(distanceKm, speedKmh) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const effective =
    speedKmh >= MOVING_THRESHOLD_KMH ? Math.max(speedKmh, MIN_ETA_SPEED_KMH) : FALLBACK_SPEED_KMH;
  return Math.ceil((distanceKm / effective) * 60);
}

/** Index of the polyline waypoint closest to `position`. */
export function nearestWaypointIndex(position, waypoints = ROUTE_WAYPOINTS) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < waypoints.length; i++) {
    const d = haversineKm(position, waypoints[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** Initial compass bearing (deg 0-360) from a to b. */
export function bearingDeg(a, b) {
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/* ------------------------------------------------------------------ */
/*  Upcoming-halt tracker (pure reducer; no React / side effects)       */
/* ------------------------------------------------------------------ */

/**
 * Tracker state:
 *   direction  1 = Kaduwela -> Kollupitiya, -1 = reverse
 *   nextIndex  index into BUS_HALTS of the upcoming halt (null until first fix)
 *   anchor     furthest route progress seen in the current direction (hysteresis)
 */
export function createTracker() {
  return { direction: 1, nextIndex: null, anchor: null };
}

function firstHaltAhead(progress, direction, halts) {
  if (direction === 1) {
    const i = halts.findIndex((h) => h.routeIndex >= progress);
    return i === -1 ? halts.length - 1 : i;
  }
  for (let i = halts.length - 1; i >= 0; i--) {
    if (halts[i].routeIndex <= progress) return i;
  }
  return 0;
}

function directionFromHeading(position, progress, waypoints) {
  const heading = Number(position.heading);
  if (!Number.isFinite(heading) || heading < 0 || !(position.speed > 0.5)) return null;
  const from = Math.min(progress, waypoints.length - 2);
  const segment = bearingDeg(waypoints[from], waypoints[from + 1]);
  const diff = Math.abs(((heading - segment + 540) % 360) - 180); // 0..180
  return diff <= 90 ? 1 : -1;
}

/**
 * Advance the tracker with a new position fix.
 *  - Determines / updates travel direction.
 *  - Picks the upcoming halt.
 *  - Switches to the next halt once the bus is within 300 m of the current one.
 *  - Reverses direction at the terminus.
 */
export function advanceTracker(prev, position, halts = BUS_HALTS, waypoints = ROUTE_WAYPOINTS) {
  const progress = nearestWaypointIndex(position, waypoints);
  let { direction, nextIndex, anchor } = prev;

  if (nextIndex === null) {
    direction = directionFromHeading(position, progress, waypoints) ?? 1;
    anchor = progress;
    nextIndex = firstHaltAhead(progress, direction, halts);
  } else {
    // Hysteresis: flip direction only after the bus has moved >= 2 waypoints against it.
    const moved = progress - anchor;
    if ((direction === 1 && moved <= -2) || (direction === -1 && moved >= 2)) {
      direction = -direction;
      anchor = progress;
      nextIndex = firstHaltAhead(progress, direction, halts);
    } else if ((direction === 1 && moved > 0) || (direction === -1 && moved < 0)) {
      anchor = progress;
    }
  }

  // Auto-switch to the next halt when within 300 m of the current target.
  if (haversineKm(position, halts[nextIndex]) < HALT_ARRIVAL_RADIUS_KM) {
    const candidate = nextIndex + direction;
    if (candidate < 0 || candidate >= halts.length) {
      // Reached the terminus: the bus turns around.
      direction = -direction;
      nextIndex = Math.min(Math.max(nextIndex + direction, 0), halts.length - 1);
      anchor = progress;
    } else {
      nextIndex = candidate;
    }
  }

  return { direction, nextIndex, anchor };
}
