import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Backend URL. Local defaults are only used in development builds. */
export const DEFAULT_SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ||
  Constants.expoConfig?.extra?.serverUrl ||
  (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000') : '');

/** Driver GPS broadcast interval (ms). */
export const BROADCAST_INTERVAL_MS = 3000;

/** Passenger view shows "waiting" if no update arrived within this window. */
export const STALE_AFTER_MS = 15000;
