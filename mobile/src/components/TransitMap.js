import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BUS_HALTS, ROUTE_REGION, ROUTE_WAYPOINTS } from '../data/route177';

/** Prevents a native map failure from taking down the entire app. */
class MapBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn('[TransitMap] render error:', error?.message);
  }
  render() {
    if (this.state.failed) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Text style={styles.fallbackText}>Map unavailable. Check the Google Maps API key.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const isValid = (p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude);

function BusMarker({ position }) {
  // Custom-view markers need tracksViewChanges for their first paint on Android
  // (and for the icon font to load); afterwards it is switched off to avoid
  // flicker and memory churn.
  const [track, setTrack] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTrack(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: position.latitude, longitude: position.longitude }}
      title="BUS-01"
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={track}
      zIndex={10}
    >
      <View style={styles.busMarker}>
        <Ionicons name="bus" size={18} color="#fff" />
      </View>
    </Marker>
  );
}

export default function TransitMap({ position, nextHalt, bottomInset = 0 }) {
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !isValid(position) || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center: { latitude: position.latitude, longitude: position.longitude } },
      { duration: 800 }
    );
  }, [ready, position?.latitude, position?.longitude]);

  return (
    <MapBoundary>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={ROUTE_REGION}
        onMapReady={() => setReady(true)}
        mapPadding={{ top: 0, right: 0, left: 0, bottom: bottomInset }}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        moveOnMarkerPress={false}
      >
        <Polyline
          coordinates={ROUTE_WAYPOINTS}
          strokeColor="#1E6BFF"
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />

        {BUS_HALTS.map((halt) => (
          <Marker
            key={halt.id}
            coordinate={{ latitude: halt.latitude, longitude: halt.longitude }}
            title={halt.name}
            description={nextHalt?.id === halt.id ? 'Next halt' : 'Bus halt'}
            pinColor={nextHalt?.id === halt.id ? '#FF9500' : '#34C759'}
            tracksViewChanges={false}
          />
        ))}

        {isValid(position) && <BusMarker position={position} />}
      </MapView>
    </MapBoundary>
  );
}

const styles = StyleSheet.create({
  busMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5322D',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: { backgroundColor: '#E8ECF2', alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackText: { color: '#555', textAlign: 'center' },
});
