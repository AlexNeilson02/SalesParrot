"use client";

import { useActionState } from "react";
import { createProspectAction, type ProspectFormState } from "@/lib/actions/prospects";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";

export function ProspectForm() {
  const [state, formAction, pending] = useActionState<ProspectFormState, FormData>(
    createProspectAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Name" name="name" required placeholder="Jordan Smith" />
      <Field label="Address" name="address" required placeholder="123 Main St" />
      <div className="grid grid-cols-3 gap-3">
        <Field label="City" name="city" placeholder="Springfield" />
        <Field label="State" name="state" placeholder="OH" />
        <Field label="Zip" name="zip" placeholder="45501" />
      </div>
      <Field label="Phone" name="phone" type="tel" placeholder="(555) 123-4567" />
      <Field label="Email" name="email" type="email" placeholder="jordan@example.com" />

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-medium text-foreground/80">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="NEW"
          className="rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-brand"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save prospect"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-foreground/80">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-brand"
      />
    </div>
  );
}
