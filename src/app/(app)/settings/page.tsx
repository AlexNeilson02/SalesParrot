import { requireCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted">Signed in as</p>
        <p className="mt-1 text-lg font-semibold">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Follow-up reminders</h2>
        <p className="mt-1 text-sm text-muted">
          SalesParrot reads your notes and automatically schedules a follow-up reminder when it
          spots timing language like &ldquo;come back in spring&rdquo;, &ldquo;call next week&rdquo;, or
          a specific date. Reminders show up on your Today dashboard when they&rsquo;re due &mdash;
          nothing is sent automatically. Use the call, text, or email shortcuts on each reminder to
          follow up straight from your phone.
        </p>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base font-semibold text-red-600 transition active:scale-[0.98]"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
