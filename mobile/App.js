import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TransitMap from './src/components/TransitMap';
import DashboardCard from './src/components/DashboardCard';
import useTransitClient from './src/hooks/useTransitClient';
import useDriverBroadcast from './src/hooks/useDriverBroadcast';
import usePassengerFeed from './src/hooks/usePassengerFeed';
import useTransitInfo from './src/hooks/useTransitInfo';
import { DEFAULT_SERVER_URL } from './src/config';

const normalizeUrl = (value) => {
  const v = (value || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `${__DEV__ ? 'http' : 'https'}://${v}`;
};

export default function App() {
  const [role, setRole] = useState('passenger');
  const [broadcasting, setBroadcasting] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [serverUrlDraft, setServerUrlDraft] = useState(DEFAULT_SERVER_URL);
  const [serverError, setServerError] = useState(null);

  const isDriver = role === 'driver';
  const { client, connected } = useTransitClient(serverUrl);

  const driver = useDriverBroadcast({ client, enabled: isDriver && broadcasting });
  const passenger = usePassengerFeed({ client, enabled: !isDriver });

  const position = isDriver ? driver.position : passenger.position;
  const stale = !isDriver && passenger.stale;
  const error = serverError || (!serverUrl ? 'Live tracking needs a backend URL. Enter its HTTPS address below.' : null) || (isDriver ? driver.error : null);

  const info = useTransitInfo(position, role);

  const handleRoleChange = useCallback((next) => {
    setRole(next);
    setBroadcasting(false); // never keep broadcasting in the background of a role switch
  }, []);

  const handleServerUrlSubmit = useCallback(() => {
    const url = normalizeUrl(serverUrlDraft);
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error();
      if (!__DEV__ && parsed.protocol !== 'https:') {
        setServerError('Use an HTTPS backend URL for the hosted website and APK.');
        return;
      }
    } catch {
      setServerError('Enter a valid backend URL, such as https://your-server.example.com.');
      return;
    }
    setServerError(null);
    if (url && url !== serverUrl) {
      setServerUrl(url);
      setServerUrlDraft(url);
    }
  }, [serverUrlDraft, serverUrl]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.mapWrap}>
          <TransitMap position={position} nextHalt={info.nextHalt} bottomInset={120} />
        </View>

        <DashboardCard
          role={role}
          onRoleChange={handleRoleChange}
          connected={connected}
          broadcasting={broadcasting}
          onToggleBroadcast={() => setBroadcasting((b) => !b)}
          error={error}
          hasPosition={!!position}
          stale={stale}
          speedKmh={info.speedKmh}
          moving={info.moving}
          nextHalt={info.nextHalt}
          distanceKm={info.distanceKm}
          etaMinutes={info.etaMinutes}
          serverUrlDraft={serverUrlDraft}
          onServerUrlChange={setServerUrlDraft}
          onServerUrlSubmit={handleServerUrlSubmit}
        />
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', ...(Platform.OS === 'web' ? { minHeight: 760 } : {}) },
  mapWrap: { flex: 1 },
});
