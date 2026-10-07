import { useEffect, useState } from 'react';
import { BUS_HALTS } from '../data/route177';
import {
  advanceTracker,
  createTracker,
  estimateEtaMinutes,
  haversineKm,
  msToKmh,
  MOVING_THRESHOLD_KMH,
} from '../utils/geo';

/**
 * Derives transit info from the latest bus position:
 * speed (km/h), moving flag, upcoming halt, distance (km) and ETA (min).
 * `resetKey` restarts halt tracking (e.g. when role changes).
 */
export default function useTransitInfo(position, resetKey) {
  const [tracker, setTracker] = useState(createTracker);

  useEffect(() => {
    setTracker(createTracker());
  }, [resetKey]);

  useEffect(() => {
    if (position) setTracker((prev) => advanceTracker(prev, position));
  }, [position]);

  const speedKmh = position ? msToKmh(position.speed) : 0;
  const moving = speedKmh > MOVING_THRESHOLD_KMH;

  let nextHalt = null;
  let distanceKm = null;
  let etaMinutes = null;
  if (position && tracker.nextIndex !== null) {
    nextHalt = BUS_HALTS[tracker.nextIndex];
    distanceKm = haversineKm(position, nextHalt);
    etaMinutes = estimateEtaMinutes(distanceKm, speedKmh);
  }

  return { speedKmh, moving, nextHalt, distanceKm, etaMinutes, direction: tracker.direction };
}
