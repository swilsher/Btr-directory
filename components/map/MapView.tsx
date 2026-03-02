'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { getFriendlyStatus } from '@/lib/utils';
import MapPopupCard from './MapPopupCard';

// ----- Custom coloured markers -----

function createStatusIcon(status: string | undefined): L.DivIcon {
  const friendlyStatus = getFriendlyStatus(status);

  const colorMap: Record<string, { fill: string; stroke: string }> = {
    'In Planning': { fill: '#2563eb', stroke: '#1d4ed8' },
    'Under Construction': { fill: '#ea580c', stroke: '#c2410c' },
    'Operational': { fill: '#16a34a', stroke: '#15803d' },
  };

  const colors = colorMap[friendlyStatus] || colorMap['In Planning'];

  return L.divIcon({
    className: 'custom-marker',
    html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2" opacity="0.9"/>
      <circle cx="12" cy="12" r="4" fill="white" opacity="0.4"/>
    </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function createHighlightedIcon(status: string | undefined): L.DivIcon {
  const friendlyStatus = getFriendlyStatus(status);

  const colorMap: Record<string, { fill: string; stroke: string }> = {
    'In Planning': { fill: '#2563eb', stroke: '#1d4ed8' },
    'Under Construction': { fill: '#ea580c', stroke: '#c2410c' },
    'Operational': { fill: '#16a34a', stroke: '#15803d' },
  };

  const colors = colorMap[friendlyStatus] || colorMap['In Planning'];

  return L.divIcon({
    className: 'custom-marker-highlighted',
    html: `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${colors.fill}" stroke="white" stroke-width="3" opacity="0.95"/>
      <circle cx="16" cy="16" r="6" fill="white" opacity="0.5"/>
    </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

// ----- Cluster icon -----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  let size = 'small';
  let diameter = 36;

  if (count >= 50) {
    size = 'large';
    diameter = 50;
  } else if (count >= 10) {
    size = 'medium';
    diameter = 42;
  }

  return L.divIcon({
    html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
    className: 'custom-cluster',
    iconSize: L.point(diameter, diameter),
  });
}

// ----- Map controller (handles external commands) -----

interface MapDevelopment {
  id: string;
  name: string;
  slug: string;
  area?: string;
  region?: string;
  status?: string;
  number_of_units?: number;
  latitude?: number;
  longitude?: number;
  operator?: { name: string; slug: string } | null;
}

interface MapControllerProps {
  selectedId: string | null;
  developments: MapDevelopment[];
  onBoundsReady?: () => void;
}

function MapController({ selectedId, developments }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const dev = developments.find(d => d.id === selectedId);
      if (dev?.latitude && dev?.longitude) {
        const targetLatLng = L.latLng(dev.latitude, dev.longitude);
        if (!map.getBounds().contains(targetLatLng)) {
          map.flyTo([dev.latitude, dev.longitude], 14, { duration: 0.8 });
        }
      }
    }
  }, [selectedId, developments, map]);

  return null;
}

// ----- Fit bounds helper -----

interface FitBoundsProps {
  developments: MapDevelopment[];
}

function FitBounds({ developments }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (developments.length === 0) return;

    const bounds = L.latLngBounds(
      developments
        .filter(d => d.latitude && d.longitude)
        .map(d => [d.latitude!, d.longitude!] as [number, number])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [developments, map]);

  return null;
}

// ----- Main MapView -----

const UK_CENTER: [number, number] = [54.0, -2.0];
const UK_ZOOM = 6;

interface MapViewProps {
  developments: MapDevelopment[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelectDevelopment: (id: string) => void;
  fitBoundsKey?: number; // change to trigger re-fit
}

export default function MapView({
  developments,
  selectedId,
  hoveredId,
  onSelectDevelopment,
  fitBoundsKey,
}: MapViewProps) {
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  const setMarkerRef = useCallback((id: string, marker: L.Marker | null) => {
    if (marker) {
      markerRefs.current.set(id, marker);
    } else {
      markerRefs.current.delete(id);
    }
  }, []);

  // Open popup when selected via list card click
  useEffect(() => {
    if (selectedId) {
      const marker = markerRefs.current.get(selectedId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 300);
      }
    }
  }, [selectedId]);

  // Custom cluster click: spiderfy if all markers share same coords, otherwise zoom
  const handleClusterClick = useCallback((e: L.LeafletMouseEvent) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cluster = e.layer as any;
    const childMarkers = cluster.getAllChildMarkers();

    if (childMarkers.length < 2) return;

    // Check if all markers share identical coordinates (same outcode centroid)
    const firstLatLng = childMarkers[0].getLatLng();
    const allSamePosition = childMarkers.every((marker: L.Marker) => {
      const pos = marker.getLatLng();
      return pos.lat === firstLatLng.lat && pos.lng === firstLatLng.lng;
    });

    if (allSamePosition) {
      cluster.spiderfy();
    } else {
      cluster.zoomToBounds({ padding: [20, 20] });
    }
  }, []);

  return (
    <div className="relative rounded-lg overflow-hidden border border-border shadow-sm h-full">
      <MapContainer
        center={UK_CENTER}
        zoom={UK_ZOOM}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedId={selectedId}
          developments={developments}
        />

        {fitBoundsKey !== undefined && (
          <FitBounds
            key={fitBoundsKey}
            developments={developments}
          />
        )}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          zoomToBoundsOnClick={false}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
          onClick={handleClusterClick}
        >
          {developments.map((dev) => {
            if (!dev.latitude || !dev.longitude) return null;

            const isHighlighted = dev.id === hoveredId || dev.id === selectedId;
            const icon = isHighlighted
              ? createHighlightedIcon(dev.status)
              : createStatusIcon(dev.status);

            return (
              <Marker
                key={dev.id}
                position={[dev.latitude, dev.longitude]}
                icon={icon}
                ref={(ref) => setMarkerRef(dev.id, ref as unknown as L.Marker)}
                eventHandlers={{
                  click: () => onSelectDevelopment(dev.id),
                }}
              >
                <Popup maxWidth={300} minWidth={240}>
                  <MapPopupCard development={dev} />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Status Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg border border-border px-3 py-2 shadow-sm">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#2563eb"/></svg>
            Planning
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#ea580c"/></svg>
            Construction
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#16a34a"/></svg>
            Operational
          </span>
        </div>
      </div>
    </div>
  );
}
