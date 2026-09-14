"use client";

import { useState } from "react";
import { STATUS_META, STATUS_ORDER, type ProspectStatusKey } from "@/lib/status";

export function DropPinSheet({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (
    name: string,
    status: ProspectStatusKey
  ) => Promise<{ id: string } | { error: string }>;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProspectStatusKey>("NOT_HOME");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const result = await onSubmit(name.trim() || "New door", status);
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] rounded-t-3xl border-t border-border bg-card p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
      <p className="text-lg font-bold">Drop a pin here</p>
      <p className="text-sm text-muted">
        Saves at your current location. The address fills itself in when it can be looked up.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name or label (e.g. blue house, corner lot)"
        autoFocus
        className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-brand"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        {STATUS_ORDER.map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
                active
                  ? "border-transparent text-white"
                  : "border-border bg-background text-foreground/80"
              }`}
              style={active ? { backgroundColor: STATUS_META[s].pin } : undefined}
            >
              {STATUS_META[s].label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-[2] rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save door"}
        </button>
      </div>
    </div>
  );
}
