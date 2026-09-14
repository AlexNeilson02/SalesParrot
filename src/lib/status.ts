export const STATUS_META = {
  NEW: {
    label: "New",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    pin: "#64748b",
  },
  NOT_HOME: {
    label: "Not Home",
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    pin: "#a1a1aa",
  },
  INTERESTED: {
    label: "Interested",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    pin: "#2563eb",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    pin: "#f59e0b",
  },
  APPOINTMENT: {
    label: "Appointment",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    pin: "#9333ea",
  },
  SOLD: {
    label: "Sold",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    pin: "#059669",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    pin: "#dc2626",
  },
} as const;

export type ProspectStatusKey = keyof typeof STATUS_META;

export const STATUS_ORDER: ProspectStatusKey[] = [
  "NEW",
  "NOT_HOME",
  "INTERESTED",
  "FOLLOW_UP",
  "APPOINTMENT",
  "SOLD",
  "NOT_INTERESTED",
];
