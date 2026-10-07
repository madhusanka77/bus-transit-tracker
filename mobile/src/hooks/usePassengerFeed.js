import { useEffect, useState } from 'react';
import { STALE_AFTER_MS } from '../config';

export default function usePassengerFeed({ client, enabled }) {
  const [position, setPosition] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setPosition(null);
    if (!enabled || !client) return undefined;
    let cancelled = false;
    let timeout;
    const poll = async () => {
      try {
        const data = await client.latest();
        if (!cancelled) setPosition(data.position);
      } catch { /* Keep the last position; connection and timestamp show failure. */ }
      if (!cancelled) timeout = setTimeout(poll, 3000);
    };
    poll();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; clearTimeout(timeout); clearInterval(clock); };
  }, [client, enabled]);
  // Repeated polls must not make an old GPS fix look fresh.
  const stale = !!position && now - Date.parse(position.timestamp) > STALE_AFTER_MS;
  return { position, stale };
}

