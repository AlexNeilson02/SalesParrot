import { STATUS_META, type ProspectStatusKey } from "@/lib/status";

export function StatusBadge({ status }: { status: ProspectStatusKey }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}
