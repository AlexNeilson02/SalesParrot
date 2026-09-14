"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  createProspectAtLocationAction,
  updateProspectStatusAction,
} from "@/lib/actions/prospects";
import { STATUS_META, STATUS_ORDER, type ProspectStatusKey } from "@/lib/status";
import type { MapPin } from "./MapCanvas";
import { DispositionSheet } from "./DispositionSheet";
import { DropPinSheet } from "./DropPinSheet";

// Leaflet touches `window` on import, so the canvas is client-only.
const MapCanvas = dynamic(() => import("./MapCanvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted">
      Loading map…
    </div>
  ),
});

type Position = { latitude: number; longitude: number };

export function MapView({
  initialPins,
  phones,
  fallbackCenter,
  unplacedCount,
}: {
  initialPins: MapPin[];
  phones: Record<string, string | null>;
  fallbackCenter: [number, number];
  unplacedCount: number;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [filter, setFilter] = useState<ProspectStatusKey | null>(null);
  // Dispositions tapped on this device, layered over server data so a pin
  // recolors instantly and doesn't flicker back when the route revalidates.
  const [pendingStatus, setPendingStatus] = useState<Record<string, ProspectStatusKey>>({});
  const [droppedPins, setDroppedPins] = useState<MapPin[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocationError("Location is off — turn it on to drop pins where you stand."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const pins = useMemo(() => {
    const known = new Set(initialPins.map((p) => p.id));
    const merged = initialPins.map((p) =>
      pendingStatus[p.id] ? { ...p, status: pendingStatus[p.id] } : p
    );
    // Keep a just-dropped pin visible until the server render catches up.
    return [...merged, ...droppedPins.filter((p) => !known.has(p.id))];
  }, [initialPins, pendingStatus, droppedPins]);

  const visiblePins = useMemo(
    () => (filter ? pins.filter((p) => p.status === filter) : pins),
    [pins, filter]
  );

  const selected = pins.find((p) => p.id === selectedId) ?? null;

  function setStatus(id: string, status: ProspectStatusKey) {
    // Recolor the pin straight away — a rep taps this at the door and walks on
    // before the round trip finishes.
    setPendingStatus((prev) => ({ ...prev, [id]: status }));
    startTransition(() => updateProspectStatusAction(id, status));
  }

  async function dropPin(name: string, status: ProspectStatusKey) {
    if (!position) return { error: "No location yet." };
    const result = await createProspectAtLocationAction({
      name,
      latitude: position.latitude,
      longitude: position.longitude,
      status,
    });
    if ("error" in result) return result;

    setDroppedPins((prev) => [
      ...prev,
      {
        id: result.id,
        name,
        address: "Dropped pin",
        status,
        latitude: position.latitude,
        longitude: position.longitude,
      },
    ]);
    setDropping(false);
    router.refresh();
    return result;
  }

  const center = position
    ? ([position.latitude, position.longitude] as [number, number])
    : fallbackCenter;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapCanvas
        pins={visiblePins}
        selectedId={selectedId}
        onSelect={setSelectedId}
        position={position}
        center={center}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex gap-1.5 overflow-x-auto p-3">
        <button
          onClick={() => setFilter(null)}
          className={`pointer-events-auto shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${
            filter === null
              ? "border-transparent bg-brand text-white"
              : "border-border bg-card text-muted"
          }`}
        >
          All ({pins.length})
        </button>
        {STATUS_ORDER.map((status) => {
          const count = pins.filter((p) => p.status === status).length;
          if (count === 0) return null;
          const active = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilter(active ? null : status)}
              className={`pointer-events-auto shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${
                active ? "border-transparent text-white" : "border-border bg-card text-muted"
              }`}
              style={active ? { backgroundColor: STATUS_META[status].pin } : undefined}
            >
              {STATUS_META[status].label} ({count})
            </button>
          );
        })}
      </div>

      {(locationError || unplacedCount > 0) && !selected && !dropping && (
        <div className="pointer-events-none absolute inset-x-3 top-16 z-[1000] flex flex-col gap-2">
          {locationError && (
            <p className="pointer-events-auto rounded-xl bg-card/95 px-3 py-2 text-xs text-muted shadow-sm">
              {locationError}
            </p>
          )}
          {unplacedCount > 0 && (
            <p className="pointer-events-auto rounded-xl bg-card/95 px-3 py-2 text-xs text-muted shadow-sm">
              {unplacedCount} prospect{unplacedCount === 1 ? "" : "s"} couldn&rsquo;t be placed on
              the map yet — open Prospects to retry locating them.
            </p>
          )}
        </div>
      )}

      {!selected && !dropping && (
        <button
          onClick={() => setDropping(true)}
          disabled={!position}
          className="absolute bottom-5 right-4 z-[1000] rounded-full bg-brand px-5 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          📍 Drop pin here
        </button>
      )}

      {selected && (
        <DispositionSheet
          pin={selected}
          phone={phones[selected.id] ?? null}
          onClose={() => setSelectedId(null)}
          onSetStatus={(status) => setStatus(selected.id, status)}
        />
      )}

      {dropping && position && (
        <DropPinSheet onCancel={() => setDropping(false)} onSubmit={dropPin} />
      )}
    </div>
  );
}
