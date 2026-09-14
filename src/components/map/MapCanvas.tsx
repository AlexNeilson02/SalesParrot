"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_META, type ProspectStatusKey } from "@/lib/status";

export type MapPin = {
  id: string;
  name: string;
  address: string;
  status: ProspectStatusKey;
  latitude: number;
  longitude: number;
};

function pinIcon(status: ProspectStatusKey, selected: boolean) {
  const color = STATUS_META[status].pin;
  const scale = selected ? 1.25 : 1;
  const w = 26 * scale;
  const h = 34 * scale;
  return L.divIcon({
    className: "salesparrot-pin",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 11.6 20 12.1 20.5a1.3 1.3 0 0 0 1.8 0C14.4 33 26 22.2 26 13 26 5.8 20.2 0 13 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="13" cy="13" r="4.5" fill="#ffffff"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

const locationIcon = () =>
  L.divIcon({
    className: "salesparrot-here",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(37,99,235,0.25)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

/**
 * Centers on the rep's first GPS fix only. Re-centering on every position
 * update would yank the map back mid-pan while they're looking down the block.
 */
function CenterOnFirstFix({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (!position || centered.current) return;
    centered.current = true;
    map.setView(position, 17, { animate: true });
  }, [position, map]);
  return null;
}

/** Lifts a tapped pin clear of the disposition sheet covering the lower half. */
function RevealSelected({ pin }: { pin: MapPin | null }) {
  const map = useMap();
  useEffect(() => {
    if (!pin) return;
    map.setView([pin.latitude, pin.longitude], map.getZoom(), { animate: true });
    map.panBy([0, map.getSize().y * 0.2], { animate: true });
  }, [pin, map]);
  return null;
}

/** Recenters on demand, the way every map app's crosshair button does. */
function LocateButton({ position }: { position: [number, number] | null }) {
  const map = useMap();
  if (!position) return null;
  return (
    <button
      onClick={() => map.setView(position, 17, { animate: true })}
      aria-label="Center on my location"
      className="absolute bottom-5 left-4 z-[1000] rounded-full border border-border bg-card px-3.5 py-3 text-lg shadow-lg active:scale-95"
    >
      ◎
    </button>
  );
}

export function MapCanvas({
  pins,
  selectedId,
  onSelect,
  position,
  center,
}: {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  position: { latitude: number; longitude: number } | null;
  center: [number, number];
}) {
  const here = useMemo<[number, number] | null>(
    () => (position ? [position.latitude, position.longitude] : null),
    [position]
  );
  const selectedPin = pins.find((p) => p.id === selectedId) ?? null;

  return (
    <MapContainer
      center={center}
      zoom={16}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <CenterOnFirstFix position={here} />
      <RevealSelected pin={selectedPin} />
      <LocateButton position={here} />
      {here && <Marker position={here} icon={locationIcon()} />}
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.latitude, pin.longitude]}
          icon={pinIcon(pin.status, pin.id === selectedId)}
          eventHandlers={{ click: () => onSelect(pin.id) }}
        />
      ))}
    </MapContainer>
  );
}
