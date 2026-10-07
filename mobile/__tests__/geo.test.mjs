import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineKm,
  msToKmh,
  estimateEtaMinutes,
  createTracker,
  advanceTracker,
} from '../src/utils/geo.js';
import { BUS_HALTS } from '../src/data/route177.js';

const halt = (id) => BUS_HALTS.find((h) => h.id === id);

test('haversine: zero distance and known distance', () => {
  const k = halt('kaduwela');
  assert.equal(haversineKm(k, k), 0);
  // 1 degree of latitude ~ 111.19 km
  const d = haversineKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
  assert.ok(Math.abs(d - 111.19) < 0.1);
});

test('speed conversion and ETA', () => {
  assert.equal(msToKmh(10), 36);
  assert.equal(msToKmh(-1), 0);
  assert.equal(estimateEtaMinutes(18, 36), 30); // 18 km @ 36 km/h
  assert.equal(estimateEtaMinutes(10, 0), 30); // stopped -> 20 km/h fallback
});

test('tracker picks upcoming halt and switches within 300 m', () => {
  let t = advanceTracker(createTracker(), { ...halt('kaduwela'), latitude: 6.9315, speed: 0, heading: 0 });
  assert.equal(BUS_HALTS[t.nextIndex].id, 'malabe'); // ~170 m from Kaduwela -> already onwards

  t = createTracker();
  // Midway between Malabe and Battaramulla heading outbound
  t = advanceTracker(t, { latitude: 6.901, longitude: 79.93, speed: 8, heading: 270 });
  assert.equal(BUS_HALTS[t.nextIndex].id, 'battaramulla');
  assert.equal(t.direction, 1);

  // Arrive at Battaramulla (<300 m) -> next is Rajagiriya
  t = advanceTracker(t, { ...halt('battaramulla'), speed: 5, heading: 270 });
  assert.equal(BUS_HALTS[t.nextIndex].id, 'rajagiriya');
});

test('tracker reverses at the terminus', () => {
  let t = advanceTracker(createTracker(), { latitude: 6.909, longitude: 79.855, speed: 8, heading: 270 });
  assert.equal(BUS_HALTS[t.nextIndex].id, 'kollupitiya');
  t = advanceTracker(t, { ...halt('kollupitiya'), speed: 0, heading: 0 });
  assert.equal(t.direction, -1);
  assert.equal(BUS_HALTS[t.nextIndex].id, 'borella');
});
