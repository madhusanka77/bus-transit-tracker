import React, { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BUS_HALTS, ROUTE_REGION, ROUTE_WAYPOINTS } from '../data/route177';

const validPosition = (p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
const coordinates = (p) => [p.latitude, p.longitude];

function FollowBus({ position }) {
  const map = useMap();
  useEffect(() => {
    if (validPosition(position)) map.panTo(coordinates(position), { animate: true });
  }, [map, position?.latitude, position?.longitude]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

// Metro selects this file on web; Android keeps the native Google Maps component.
export default function TransitMap({ position, nextHalt }) {
  return (
    <MapContainer
      center={coordinates(ROUTE_REGION)}
      zoom={12}
      style={{ height: '100%', width: '100%', minHeight: 240, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Polyline positions={ROUTE_WAYPOINTS.map(coordinates)} pathOptions={{ color: '#1E6BFF', weight: 5 }} />
      {BUS_HALTS.map((halt) => (
        <CircleMarker
          key={halt.id}
          center={coordinates(halt)}
          radius={nextHalt?.id === halt.id ? 10 : 7}
          pathOptions={{ color: '#fff', weight: 2, fillColor: nextHalt?.id === halt.id ? '#FF9500' : '#34C759', fillOpacity: 1 }}
        >
          <Tooltip>{halt.name}{nextHalt?.id === halt.id ? ' — Next halt' : ''}</Tooltip>
        </CircleMarker>
      ))}
      {validPosition(position) && (
        <CircleMarker center={coordinates(position)} radius={12} pathOptions={{ color: '#fff', weight: 3, fillColor: '#E5322D', fillOpacity: 1 }}>
          <Tooltip permanent direction="top">BUS-01</Tooltip>
        </CircleMarker>
      )}
      <FollowBus position={position} />
    </MapContainer>
  );
}
