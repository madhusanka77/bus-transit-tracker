/**
 * Route 177: Kaduwela - Kollupitiya (Colombo, Sri Lanka)
 *
 * NOTE: Waypoints are approximate road-following coordinates suitable for
 * display + progress tracking. Replace with surveyed GPS traces for
 * higher fidelity; nothing else in the app needs to change.
 *
 * Ordered Kaduwela -> Kollupitiya (outbound direction).
 */

export const ROUTE_ID = '177';
export const ROUTE_NAME = 'Kaduwela - Kollupitiya';
export const BUS_ID = 'BUS-01';

const KADUWELA = { latitude: 6.933, longitude: 79.984 };
const MALABE = { latitude: 6.9065, longitude: 79.957 };
const BATTARAMULLA = { latitude: 6.8995, longitude: 79.918 };
const RAJAGIRIYA = { latitude: 6.9107, longitude: 79.8914 };
const BORELLA = { latitude: 6.9147, longitude: 79.8777 };
const KOLLUPITIYA = { latitude: 6.9112, longitude: 79.8493 };

export const ROUTE_WAYPOINTS = [
  KADUWELA,
  { latitude: 6.9278, longitude: 79.976 },
  { latitude: 6.92, longitude: 79.968 },
  { latitude: 6.912, longitude: 79.961 },
  MALABE,
  { latitude: 6.904, longitude: 79.942 },
  { latitude: 6.901, longitude: 79.93 },
  BATTARAMULLA,
  { latitude: 6.903, longitude: 79.906 },
  { latitude: 6.908, longitude: 79.896 },
  RAJAGIRIYA,
  { latitude: 6.913, longitude: 79.886 },
  BORELLA,
  { latitude: 6.913, longitude: 79.87 },
  { latitude: 6.911, longitude: 79.862 },
  { latitude: 6.909, longitude: 79.855 },
  KOLLUPITIYA,
];

const indexOfWaypoint = (p) => ROUTE_WAYPOINTS.indexOf(p);

/** Bus halts in outbound order. `routeIndex` = position in ROUTE_WAYPOINTS. */
export const BUS_HALTS = [
  { id: 'kaduwela', name: 'Kaduwela', ...KADUWELA, routeIndex: indexOfWaypoint(KADUWELA) },
  { id: 'malabe', name: 'Malabe', ...MALABE, routeIndex: indexOfWaypoint(MALABE) },
  { id: 'battaramulla', name: 'Battaramulla', ...BATTARAMULLA, routeIndex: indexOfWaypoint(BATTARAMULLA) },
  { id: 'rajagiriya', name: 'Rajagiriya', ...RAJAGIRIYA, routeIndex: indexOfWaypoint(RAJAGIRIYA) },
  { id: 'borella', name: 'Borella', ...BORELLA, routeIndex: indexOfWaypoint(BORELLA) },
  { id: 'kollupitiya', name: 'Kollupitiya', ...KOLLUPITIYA, routeIndex: indexOfWaypoint(KOLLUPITIYA) },
];

/** Initial map region covering the whole route. */
export const ROUTE_REGION = {
  latitude: 6.9215,
  longitude: 79.9165,
  latitudeDelta: 0.09,
  longitudeDelta: 0.17,
};
