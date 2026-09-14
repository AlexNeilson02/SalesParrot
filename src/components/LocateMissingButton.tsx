"use client";

import { useState, useTransition } from "react";
import { geocodeMissingProspectsAction } from "@/lib/actions/prospects";

export function LocateMissingButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (count === 0) return null;

  return (
    <div className="rounded-2xl border border-dashed border-border p-3 text-sm">
      <p className="text-muted">
        {count} prospect{count === 1 ? " isn't" : "s aren't"} on the map yet — their address
        couldn&rsquo;t be looked up.
      </p>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const { located } = await geocodeMissingProspectsAction();
            setMessage(
              located > 0
                ? `Placed ${located} on the map.`
                : "Still couldn't look those up. Drop a pin from the map instead."
            );
          })
        }
        className="mt-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Locating…" : "Try locating them"}
      </button>
      {message && <p className="mt-2 text-xs text-muted">{message}</p>}
    </div>
  );
}
