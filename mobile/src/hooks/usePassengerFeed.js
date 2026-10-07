import { useEffect, useState } from 'react';
import { BUS_ID } from '../data/route177';
import { STALE_AFTER_MS } from '../config';

/**
 * Passenger mode: listens to `busLocation:<BUS_ID>`.
 * Returns { position, stale } — `stale` flips true when no update arrived recently.
 */
export default function usePassengerFeed({ socket, enabled }) {
  const [position, setPosition] = useState(null);
  const [lastReceived, setLastReceived] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!enabled || !socket) {
      setPosition(null);
      setLastReceived(0);
      return undefined;
    }
    const event = `busLocation:${BUS_ID}`;
    const handler = (data) => {
      if (!data || !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) return;
      setPosition({
        busId: data.busId,
        route: data.route,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: Number.isFinite(data.speed) ? data.speed : 0, // m/s
        heading: Number.isFinite(data.heading) ? data.heading : 0,
        timestamp: data.timestamp,
      });
      setLastReceived(Date.now());
    };
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [enabled]);

  const stale = !!position && now - lastReceived > STALE_AFTER_MS;
  return { position, stale };
}
