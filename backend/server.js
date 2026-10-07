'use strict';

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { HistoryStore, defaultHistoryPath } = require('./historyStore');

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';
const MAX_HISTORY = Number(process.env.MAX_HISTORY) || 10000;

const store = new HistoryStore({ filePath: defaultHistoryPath(), maxEntries: MAX_HISTORY });
store.load();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/* ------------------------------ REST API ------------------------------ */

app.get('/', (_req, res) => res.json({ service: 'BusTransitTracker', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// GET /api/history?busId=BUS-01&limit=100
app.get('/api/history', (req, res) => {
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : undefined;
  if (req.query.limit !== undefined && !(limit > 0)) {
    return res.status(400).json({ error: '`limit` must be a positive integer' });
  }
  const data = store.query({ busId: req.query.busId, limit });
  res.json(data);
});

/* ----------------------------- Socket.io ------------------------------ */

/** Validate and normalise an incoming driver payload. Returns null if invalid. */
function sanitizeLocation(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const { busId, route } = payload;
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (typeof busId !== 'string' || !busId.trim() || busId.length > 64) return null;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  const speed = Number(payload.speed);
  const heading = Number(payload.heading);
  return {
    busId: busId.trim(),
    route: route == null ? null : String(route).slice(0, 32),
    latitude,
    longitude,
    speed: Number.isFinite(speed) && speed >= 0 ? speed : 0, // m/s
    heading: Number.isFinite(heading) && heading >= 0 ? heading : 0, // degrees
  };
}

io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`);

  socket.on('updateLocation', (payload) => {
    const data = sanitizeLocation(payload);
    if (!data) return; // ignore malformed packets

    const record = { ...data, timestamp: new Date().toISOString() };

    // 1. Broadcast immediately (never wait for disk I/O).
    io.emit(`busLocation:${record.busId}`, record);

    // 2. Persist asynchronously (serialized + atomic inside the store).
    store.add(record);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
  });
});

/* ------------------------------ Lifecycle ----------------------------- */

server.listen(PORT, HOST, () => {
  console.log(`BusTransitTracker backend listening on http://${HOST}:${PORT}`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[${signal}] shutting down, flushing history...`);
  io.close();
  server.close();
  try {
    await store.flush();
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
