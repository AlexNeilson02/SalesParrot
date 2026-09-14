"use client";

import Link from "next/link";
import { STATUS_META, STATUS_ORDER, type ProspectStatusKey } from "@/lib/status";
import type { MapPin } from "./MapCanvas";

export function DispositionSheet({
  pin,
  onClose,
  onSetStatus,
  phone,
}: {
  pin: MapPin;
  onClose: () => void;
  onSetStatus: (status: ProspectStatusKey) => void;
  phone: string | null;
}) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-[1000] rounded-t-3xl border-t border-border bg-card p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{pin.name}</p>
          <p className="truncate text-sm text-muted">{pin.address}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-full border border-border px-3 py-1 text-sm text-muted"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {STATUS_ORDER.map((status) => {
          const active = pin.status === status;
          return (
            <button
              key={status}
              onClick={() => onSetStatus(status)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition active:scale-[0.97] ${
                active
                  ? "border-transparent text-white"
                  : "border-border bg-background text-foreground/80"
              }`}
              style={active ? { backgroundColor: STATUS_META[status].pin } : undefined}
            >
              {STATUS_META[status].label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link
          href={`/prospects/${pin.id}`}
          className="rounded-full bg-brand px-4 py-2 font-semibold text-white"
        >
          Notes &amp; follow-ups
        </Link>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="rounded-full border border-border px-4 py-2 font-semibold text-muted"
          >
            📞 Call
          </a>
        )}
        <a
          href={`https://maps.google.com/?q=${pin.latitude},${pin.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-4 py-2 font-semibold text-muted"
        >
          🧭 Directions
        </a>
      </div>
    </div>
  );
}
