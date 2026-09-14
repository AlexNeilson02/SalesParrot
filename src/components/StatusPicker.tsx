"use client";

import { useTransition } from "react";
import { updateProspectStatusAction } from "@/lib/actions/prospects";
import { STATUS_META, STATUS_ORDER, type ProspectStatusKey } from "@/lib/status";

export function StatusPicker({
  prospectId,
  status,
}: {
  prospectId: string;
  status: ProspectStatusKey;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          disabled={pending}
          onClick={() => startTransition(() => updateProspectStatusAction(prospectId, s))}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            status === s ? STATUS_META[s].color + " border-transparent" : "border-border text-muted"
          }`}
        >
          {STATUS_META[s].label}
        </button>
      ))}
    </div>
  );
}
