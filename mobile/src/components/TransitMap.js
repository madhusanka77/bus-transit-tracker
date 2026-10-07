import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { createMapHtml } from '../utils/mapHtml';
import { BUS_HALTS, ROUTE_REGION, ROUTE_WAYPOINTS } from '../data/route177';

const source = { html: createMapHtml(BUS_HALTS, ROUTE_WAYPOINTS, ROUTE_REGION),
  baseUrl: 'https://route177-bus-tracker.netlify.app/' };

export default function TransitMap({ position, nextHalt }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const message = JSON.stringify({ position, nextHaltId: nextHalt?.id }).replace(/</g, '\\u003c');
    ref.current?.injectJavaScript('window.updateTransit(' + message + '); true;');
  }, [ready, position, nextHalt?.id]);
  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView ref={ref} source={source} originWhitelist={['*']}
        style={{ flex: 1 }} javaScriptEnabled mixedContentMode="never"
        onLoadStart={() => { setReady(false); setFailed(false); }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'ready') setReady(true);
          if (event.nativeEvent.data === 'error') setFailed(true);
        }}
        onError={() => setFailed(true)}
        onShouldStartLoadWithRequest={(request) =>
          request.url === 'about:blank' || request.url === source.baseUrl ||
          request.url.startsWith('data:text/html')}
      />
      {failed && <View style={styles.error}><Text>Map could not load. Check your internet connection.</Text></View>}
    </View>
  );
}
const styles = StyleSheet.create({
  error: { ...StyleSheet.absoluteFillObject, padding: 24, backgroundColor: '#E8ECF2', alignItems: 'center', justifyContent: 'center' },
});

