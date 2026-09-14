"use client";

import { useActionState, useMemo, useState } from "react";
import { addNoteAction, type NoteFormState } from "@/lib/actions/notes";
import { detectReminders, formatDate, QUICK_REMINDER_OPTIONS } from "@/lib/reminders";

type SelectedReminder = { key: string; label: string; dateIso: string };

const METHODS = [
  { value: "IN_PERSON", label: "In person" },
  { value: "PHONE", label: "Call" },
  { value: "TEXT", label: "Text" },
  { value: "EMAIL", label: "Email" },
] as const;

export function NoteComposer({ prospectId }: { prospectId: string }) {
  const [state, formAction, pending] = useActionState<NoteFormState, FormData>(
    addNoteAction,
    undefined
  );
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<SelectedReminder[]>([]);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("IN_PERSON");

  const detected = useMemo(() => {
    if (!body.trim()) return [];
    return detectReminders(body);
  }, [body]);

  function toggleDetected(text: string, date: Date, label: string) {
    const key = `d:${text}`;
    setSelected((prev) => {
      const exists = prev.find((r) => r.key === key);
      if (exists) return prev.filter((r) => r.key !== key);
      return [...prev, { key, label: `${text} → ${label}`, dateIso: date.toISOString() }];
    });
  }

  function toggleQuick(optKey: string, label: string, date: Date) {
    const key = `q:${optKey}`;
    setSelected((prev) => {
      const exists = prev.find((r) => r.key === key);
      if (exists) return prev.filter((r) => r.key !== key);
      return [...prev, { key, label: `${label} → ${formatDate(date)}`, dateIso: date.toISOString() }];
    });
  }

  const now = new Date();

  return (
    <form
      action={formAction}
      onSubmit={() => {
        setBody("");
        setSelected([]);
      }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <input type="hidden" name="prospectId" value={prospectId} />
      <input
        type="hidden"
        name="reminders"
        value={JSON.stringify(selected.map((r) => ({ label: r.label, dateIso: r.dateIso })))}
      />
      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note… try &quot;not home, come back in spring&quot; or &quot;call next Tuesday&quot;"
        rows={3}
        className="resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
      />

      {detected.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-muted">Detected follow-up timing — tap to add</p>
          <div className="flex flex-wrap gap-1.5">
            {detected.map((r) => {
              const key = `d:${r.text}`;
              const active = selected.some((s) => s.key === key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleDetected(r.text, r.date, r.label)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-brand/40 bg-brand-light text-brand-dark"
                  }`}
                >
                  {active ? "✓ " : "＋ "}
                  &ldquo;{r.text}&rdquo; → {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-muted">Or set a reminder manually</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REMINDER_OPTIONS.map((opt) => {
            const date = opt.getDate(now);
            const key = `q:${opt.key}`;
            const active = selected.some((s) => s.key === key);
            return (
              <button
                type="button"
                key={opt.key}
                onClick={() => toggleQuick(opt.key, opt.label, date)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-border text-muted"
                }`}
              >
                {active ? "✓ " : ""}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted">Follow up via</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <input type="hidden" name="method" value={method} />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="self-end rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Saving…" : selected.length > 0 ? `Save note + ${selected.length} reminder(s)` : "Save note"}
      </button>
    </form>
  );
}
