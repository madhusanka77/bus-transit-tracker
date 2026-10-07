const headers = {
  'Content-Type': 'application/json', 'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

export function sanitizeLocation(data) {
  if (!data || data.busId !== 'BUS-01' || String(data.route) !== '177') return null;
  const { latitude, longitude, speed, heading } = data;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { busId: 'BUS-01', route: '177', latitude, longitude,
    speed: Number.isFinite(speed) && speed >= 0 ? speed : 0,
    heading: Number.isFinite(heading) && heading >= 0 && heading < 360 ? heading : 0 };
}

export function createHandler(getStore) {
  return async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    const action = url.pathname.split('/').filter(Boolean).at(-1);
    if (action === 'health' && request.method === 'GET') return json({ status: 'ok', transport: 'https-polling' });
    if (!['location', 'history'].includes(action)) return json({ error: 'Not found' }, 404);
    if (request.method !== 'GET' && !(request.method === 'POST' && action === 'location')) return json({ error: 'Method not allowed' }, 405);
    try {
      const store = getStore();
      const key = 'BUS-01';
      if (request.method === 'GET') {
        const snapshot = await store.get(key, { type: 'json' });
        if (action === 'history') {
          if (url.searchParams.has('busId') && url.searchParams.get('busId') !== key) return json([]);
          const limit = Number(url.searchParams.get('limit') || 100);
          if (!Number.isInteger(limit) || limit < 1 || limit > 1000) return json({ error: 'limit must be 1-1000' }, 400);
          return json((snapshot?.history || []).slice(-limit));
        }
        return json({ position: snapshot?.position || null });
      }
      const body = await request.text();
      if (body.length > 2048) return json({ error: 'Payload too large' }, 413);
      let parsed;
      try { parsed = JSON.parse(body); } catch { return json({ error: 'Invalid JSON' }, 400); }
      const fix = sanitizeLocation(parsed);
      if (!fix) return json({ error: 'Invalid Route 177 GPS location' }, 400);
      const record = { ...fix, timestamp: new Date().toISOString() };
      // Conditional writes prevent losing history to concurrent driver requests.
      for (let attempt = 0; attempt < 4; attempt++) {
        const prior = await store.getWithMetadata(key, { type: 'json' });
        if (prior?.data?.position?.timestamp > record.timestamp) return json({ position: prior.data.position });
        const history = [...(prior?.data?.history || []), record].slice(-1000);
        const result = await store.setJSON(key, { position: record, history },
          prior ? { onlyIfMatch: prior.etag } : { onlyIfNew: true });
        if (result.modified) return json({ position: record });
      }
      return json({ error: 'Concurrent update; retry shortly' }, 409);
    } catch (error) {
      console.error('Transit storage failed:', error.message);
      return json({ error: 'Tracking storage temporarily unavailable' }, 503);
    }
  };
}

