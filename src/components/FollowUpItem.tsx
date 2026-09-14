"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  cancelFollowUpAction,
  completeFollowUpAction,
  snoozeFollowUpAction,
} from "@/lib/actions/notes";
import { formatDateTime } from "@/lib/reminders";

export type FollowUpItemData = {
  id: string;
  label: string;
  dueAt: Date;
  overdue: boolean;
  method: "IN_PERSON" | "PHONE" | "EMAIL" | "TEXT";
  prospect: { id: string; name: string; address: string; phone: string | null; email: string | null };
};

const METHOD_META: Record<FollowUpItemData["method"], { icon: string; text: string }> = {
  IN_PERSON: { icon: "🚪", text: "Go to their door" },
  PHONE: { icon: "📞", text: "Give them a call" },
  TEXT: { icon: "💬", text: "Send a text" },
  EMAIL: { icon: "✉️", text: "Send an email" },
};

export function FollowUpItem({ item, showProspect = true }: { item: FollowUpItemData; showProspect?: boolean }) {
  const [pending, startTransition] = useTransition();
  const meta = METHOD_META[item.method];
  const overdue = item.overdue;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          {showProspect && (
            <Link href={`/prospects/${item.prospect.id}`} className="font-semibold underline-offset-2 hover:underline">
              {item.prospect.name}
            </Link>
          )}
          <p className="text-sm text-muted">{item.prospect.address}</p>
          <p className="mt-1 text-sm">{item.label}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            overdue ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-brand-light text-brand-dark"
          }`}
        >
          {overdue ? "Overdue" : formatDateTime(item.dueAt)}
        </span>
      </div>

      <p className="text-xs font-medium text-muted">
        {meta.icon} {meta.text}
        {item.method === "IN_PERSON" && ` — ${item.prospect.address}`}
      </p>

      <div className="flex flex-wrap gap-2 text-xs">
        {item.method === "PHONE" && item.prospect.phone && (
          <a href={`tel:${item.prospect.phone}`} className="rounded-full bg-brand px-3 py-1.5 font-semibold text-white">
            Call {item.prospect.phone}
          </a>
        )}
        {item.method === "TEXT" && item.prospect.phone && (
          <a href={`sms:${item.prospect.phone}`} className="rounded-full bg-brand px-3 py-1.5 font-semibold text-white">
            Text {item.prospect.phone}
          </a>
        )}
        {item.method === "EMAIL" && item.prospect.email && (
          <a href={`mailto:${item.prospect.email}`} className="rounded-full bg-brand px-3 py-1.5 font-semibold text-white">
            Email {item.prospect.email}
          </a>
        )}
        {item.method === "IN_PERSON" && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(item.prospect.address)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-brand px-3 py-1.5 font-semibold text-white"
          >
            Directions
          </a>
        )}

        <button
          disabled={pending}
          onClick={() => startTransition(() => completeFollowUpAction(item.id))}
          className="rounded-full border border-border px-3 py-1.5 font-semibold text-muted disabled:opacity-50"
        >
          ✓ Done
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(() => snoozeFollowUpAction(item.id, 7))}
          className="rounded-full border border-border px-3 py-1.5 font-semibold text-muted disabled:opacity-50"
        >
          Snooze 1wk
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(() => cancelFollowUpAction(item.id))}
          className="rounded-full border border-border px-3 py-1.5 font-semibold text-muted disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
