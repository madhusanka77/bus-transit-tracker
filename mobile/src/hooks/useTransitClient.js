import { useEffect, useState } from 'react';

export default function useTransitClient(serverUrl) {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let active = true;
    const controllers = new Set();
    setConnected(false);
    if (!serverUrl) { setClient(null); return undefined; }
    const request = async (path, options = {}) => {
      const controller = new AbortController();
      controllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(serverUrl.replace(/\/$/, '') + '/api/' + path, {
          ...options, signal: controller.signal,
          headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) throw new Error('Tracking server returned ' + response.status);
        const data = await response.json();
        if (active) setConnected(true);
        return data;
      } catch (error) {
        if (active) setConnected(false);
        throw error;
      } finally { clearTimeout(timeout); controllers.delete(controller); }
    };
    setClient({
      latest: () => request('location'),
      publish: (fix) => request('location', { method: 'POST', body: JSON.stringify(fix) }),
    });
    request('health').catch(() => {});
    return () => { active = false; controllers.forEach((controller) => controller.abort()); };
  }, [serverUrl]);
  return { client, connected };
}

