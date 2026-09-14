import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { StatusBadge } from "@/components/StatusBadge";
import { LocateMissingButton } from "@/components/LocateMissingButton";
import { STATUS_ORDER, type ProspectStatusKey } from "@/lib/status";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const statusFilter = params.status as ProspectStatusKey | undefined;
  const q = params.q?.trim();

  const prospects = await prisma.prospect.findMany({
    where: {
      ownerId: user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { address: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { followUps: { where: { status: "PENDING" }, orderBy: { dueAt: "asc" }, take: 1 } },
  });

  const unplacedCount = await prisma.prospect.count({
    where: { ownerId: user.id, latitude: null },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prospects</h1>
        <Link
          href="/prospects/new"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          + Add
        </Link>
      </div>

      <LocateMissingButton count={unplacedCount} />

      <form className="flex gap-2" action="/prospects">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or address…"
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/prospects"
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            !statusFilter ? "border-brand bg-brand-light text-brand-dark" : "border-border text-muted"
          }`}
        >
          All
        </Link>
        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/prospects?status=${s}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === s ? "border-brand bg-brand-light text-brand-dark" : "border-border text-muted"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {prospects.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 text-center text-muted">
          <span className="text-4xl">🏘️</span>
          <p className="font-medium">No prospects yet</p>
          <p className="text-sm">Add the first house on your route.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {prospects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/prospects/${p.id}`}
                className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted">{p.address}</p>
                  </div>
                  <StatusBadge status={p.status as ProspectStatusKey} />
                </div>
                {p.followUps[0] && (
                  <p className="text-xs font-medium text-accent">
                    ⏰ Follow up {p.followUps[0].dueAt.toLocaleDateString()}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
