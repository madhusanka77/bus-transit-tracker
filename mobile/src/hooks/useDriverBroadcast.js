import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { BROADCAST_INTERVAL_MS } from '../config';
import { BUS_ID, ROUTE_ID } from '../data/route177';

/**
 * Driver mode: streams GPS fixes (every ~3 s, BestForNavigation) and emits
 * `updateLocation` over Socket.io while `enabled` is true.
 *
 * Returns { position, error }. `position.speed` is in m/s (as reported by GPS).
 */
export default function useDriverBroadcast({ socket, enabled }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      return undefined;
    }

    let cancelled = false;
    let subscription = null;

    (async () => {
      try {
        setError(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          if (!cancelled) setError('Location permission denied. Enable it in Settings to broadcast.');
          return;
        }

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: BROADCAST_INTERVAL_MS,
            distanceInterval: 0,
          },
          (loc) => {
            const { latitude, longitude, speed, heading } = loc.coords;
            const fix = {
              busId: BUS_ID,
              route: ROUTE_ID,
              latitude,
              longitude,
              speed: speed != null && speed > 0 ? speed : 0, // m/s
              heading: heading != null && heading >= 0 ? heading : 0,
            };
            setPosition({ ...fix, timestamp: loc.timestamp });
            if (socket && socket.connected) socket.emit('updateLocation', fix);
          }
        );

        if (cancelled) sub.remove();
        else subscription = sub;
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Unable to start location updates.');
      }
    })();

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, [enabled, socket]);

  return { position, error };
}
