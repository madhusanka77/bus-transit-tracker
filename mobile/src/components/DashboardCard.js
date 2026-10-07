import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTE_ID, ROUTE_NAME } from '../data/route177';

function RoleToggle({ role, onChange }) {
  return (
    <View style={styles.toggle}>
      {[
        { key: 'passenger', label: 'Passenger', icon: 'person' },
        { key: 'driver', label: 'Driver', icon: 'speedometer' },
      ].map((opt) => {
        const active = role === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.toggleBtn, active && styles.toggleBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={opt.icon} size={16} color={active ? '#fff' : '#4A5568'} />
            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color="#1E6BFF" />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardCard({
  role,
  onRoleChange,
  connected,
  broadcasting,
  onToggleBroadcast,
  error,
  hasPosition,
  stale,
  speedKmh,
  moving,
  nextHalt,
  distanceKm,
  etaMinutes,
  serverUrlDraft,
  onServerUrlChange,
  onServerUrlSubmit,
}) {
  const isDriver = role === 'driver';
  const live = hasPosition && !stale;

  const badge = !hasPosition
    ? { text: isDriver ? 'Not broadcasting' : 'Waiting for bus', color: '#8A94A6' }
    : stale
    ? { text: 'Signal lost', color: '#8A94A6' }
    : moving
    ? { text: 'Moving', color: '#1FA45B' }
    : { text: 'Stopped', color: '#E5322D' };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Route {ROUTE_ID}</Text>
          <Text style={styles.subtitle}>{ROUTE_NAME}</Text>
        </View>
        <View style={styles.connection}>
          <View style={[styles.dot, { backgroundColor: connected ? '#1FA45B' : '#E5322D' }]} />
          <Text style={styles.connectionText}>{connected ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <RoleToggle role={role} onChange={onRoleChange} />

      <View style={styles.mainRow}>
        <View style={[styles.speedo, { borderColor: badge.color }]}>
          <Text style={styles.speedValue}>{live ? Math.round(speedKmh) : '--'}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
          <Text style={styles.haltLabel}>Next halt</Text>
          <Text style={styles.haltName} numberOfLines={1}>
            {hasPosition && nextHalt ? nextHalt.name : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat
          icon="navigate"
          label="Distance"
          value={hasPosition && distanceKm != null ? `${distanceKm.toFixed(2)} km` : '--'}
        />
        <View style={styles.divider} />
        <Stat
          icon="time"
          label="ETA"
          value={hasPosition && etaMinutes != null ? (etaMinutes < 1 ? 'Arriving' : `${etaMinutes} min`) : '--'}
        />
      </View>

      {isDriver && (
        <Pressable
          onPress={onToggleBroadcast}
          style={[styles.broadcastBtn, broadcasting && styles.broadcastBtnStop]}
          accessibilityRole="button"
        >
          {broadcasting && !hasPosition ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={broadcasting ? 'stop-circle' : 'radio'} size={20} color="#fff" />
          )}
          <Text style={styles.broadcastText}>
            {broadcasting ? (hasPosition ? 'Stop Broadcast' : 'Acquiring GPS…') : 'Start Broadcast'}
          </Text>
        </Pressable>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.serverRow}>
        <Ionicons name="server" size={14} color="#8A94A6" />
        <TextInput
          style={styles.serverInput}
          value={serverUrlDraft}
          onChangeText={onServerUrlChange}
          onSubmitEditing={onServerUrlSubmit}
          onEndEditing={onServerUrlSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://your-backend.example.com"
          accessibilityLabel="Live tracking backend URL"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 22,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#101828' },
  subtitle: { fontSize: 13, color: '#667085', marginTop: 2 },
  connection: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  connectionText: { fontSize: 12, color: '#475467', fontWeight: '600' },

  toggle: { flexDirection: 'row', backgroundColor: '#EEF1F6', borderRadius: 12, padding: 4 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  toggleBtnActive: { backgroundColor: '#1E6BFF' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
  toggleTextActive: { color: '#fff' },

  mainRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  speedo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedValue: { fontSize: 32, fontWeight: '800', color: '#101828' },
  speedUnit: { fontSize: 12, color: '#667085', marginTop: -2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  haltLabel: { fontSize: 12, color: '#667085', marginTop: 12 },
  haltName: { fontSize: 22, fontWeight: '800', color: '#101828' },

  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#F6F8FB',
    borderRadius: 14,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#101828', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#667085' },
  divider: { width: 1, backgroundColor: '#DDE3EC' },

  broadcastBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E6BFF',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  broadcastBtnStop: { backgroundColor: '#E5322D' },
  broadcastText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  error: { marginTop: 10, color: '#B42318', fontSize: 13 },

  serverRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE3EC',
    paddingTop: 10,
    gap: 8,
  },
  serverInput: { flex: 1, fontSize: 12, color: '#475467', paddingVertical: 2 },
});
