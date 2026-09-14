import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { FollowUpItem } from "@/components/FollowUpItem";

function endOfDay(d: Date) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfDay(d: Date) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  const now = new Date();
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7));

  const rows = await prisma.followUp.findMany({
    where: { ownerId: user.id, status: "PENDING" },
    orderBy: { dueAt: "asc" },
    include: { prospect: true },
  });
  const pending = rows.map((f) => ({ ...f, overdue: f.dueAt < startOfDay(now) }));

  const overdue = pending.filter((f) => f.dueAt < startOfDay(now));
  const today = pending.filter((f) => f.dueAt >= startOfDay(now) && f.dueAt <= todayEnd);
  const thisWeek = pending.filter((f) => f.dueAt > todayEnd && f.dueAt <= weekEnd);
  const later = pending.filter((f) => f.dueAt > weekEnd);

  const [prospectCount, soldCount] = await Promise.all([
    prisma.prospect.count({ where: { ownerId: user.id } }),
    prisma.prospect.count({ where: { ownerId: user.id, status: "SOLD" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Hey {user.name.split(" ")[0]} 👋</h1>
        <p className="text-muted">Here&rsquo;s what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{prospectCount}</p>
          <p className="text-sm text-muted">Total prospects</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{soldCount}</p>
          <p className="text-sm text-muted">Sold</p>
        </div>
      </div>

      {pending.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          <span className="text-4xl">🎉</span>
          <p className="font-medium">No follow-ups on your plate</p>
          <p className="text-sm">
            Add a{" "}
            <Link href="/prospects/new" className="font-semibold text-brand-dark underline">
              prospect
            </Link>{" "}
            and jot a note — SalesParrot will pick up on any follow-up timing you mention.
          </p>
        </div>
      )}

      <Section title={`Overdue (${overdue.length})`} items={overdue} tone="danger" />
      <Section title={`Due today (${today.length})`} items={today} tone="brand" />
      <Section title={`This week (${thisWeek.length})`} items={thisWeek} />
      <Section title={`Later (${later.length})`} items={later} />
    </div>
  );
}

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{
    id: string;
    label: string;
    dueAt: Date;
    overdue: boolean;
    method: "IN_PERSON" | "PHONE" | "EMAIL" | "TEXT";
    prospect: { id: string; name: string; address: string; phone: string | null; email: string | null };
  }>;
  tone?: "danger" | "brand";
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2
        className={`text-sm font-semibold ${
          tone === "danger" ? "text-red-600" : tone === "brand" ? "text-brand-dark" : "text-muted"
        }`}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((f) => (
          <FollowUpItem key={f.id} item={f} />
        ))}
      </div>
    </div>
  );
}
