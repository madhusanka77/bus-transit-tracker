import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { BROADCAST_INTERVAL_MS } from '../config';
import { BUS_ID, ROUTE_ID } from '../data/route177';

export default function useDriverBroadcast({ client, enabled }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    setPosition(null);
    setError(null);
    if (!enabled || !client) return undefined;
    let cancelled = false;
    let subscription;
    let timer;
    let latest;
    let sending = false;
    const send = async () => {
      if (cancelled || sending || !latest || Date.now() - latest.fixTime > 15000) return;
      sending = true;
      try {
        await client.publish(latest);
        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError('Location could not be sent. Check your internet connection.');
      } finally { sending = false; }
    };
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') throw new Error('Location permission denied. Enable it in Settings to broadcast.');
        const sub = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: BROADCAST_INTERVAL_MS, distanceInterval: 0,
        }, (loc) => {
          if (cancelled) return;
          const { latitude, longitude, speed, heading } = loc.coords;
          const first = !latest;
          latest = { busId: BUS_ID, route: ROUTE_ID, latitude, longitude,
            speed: speed > 0 ? speed : 0, heading: heading >= 0 ? heading : 0,
            fixTime: loc.timestamp };
          setPosition(latest);
          if (first) send();
        });
        if (cancelled) sub.remove();
        else { subscription = sub; timer = setInterval(send, BROADCAST_INTERVAL_MS); }
      } catch (e) { if (!cancelled) setError(e.message || 'Unable to start GPS.'); }
    })();
    return () => { cancelled = true; subscription?.remove(); clearInterval(timer); };
  }, [enabled, client]);
  return { position, error };
}

