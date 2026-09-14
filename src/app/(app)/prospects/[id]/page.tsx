import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { StatusPicker } from "@/components/StatusPicker";
import { NoteComposer } from "@/components/NoteComposer";
import { FollowUpItem } from "@/components/FollowUpItem";
import { formatDateTime } from "@/lib/reminders";
import type { ProspectStatusKey } from "@/lib/status";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({
    where: { id, ownerId: user.id },
    include: {
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      followUps: { where: { status: "PENDING" }, orderBy: { dueAt: "asc" } },
    },
  });

  if (!prospect) notFound();

  // eslint-disable-next-line react-hooks/purity -- server component: computed once per request, not part of client render
  const nowMs = Date.now();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/prospects" className="text-muted">
        ← Back to prospects
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h1 className="text-2xl font-bold">{prospect.name}</h1>
        <p className="text-muted">
          {prospect.address}
          {prospect.city ? `, ${prospect.city}` : ""} {prospect.state} {prospect.zip}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {prospect.phone && (
            <a href={`tel:${prospect.phone}`} className="rounded-full bg-brand-light px-3 py-1.5 font-semibold text-brand-dark">
              📞 {prospect.phone}
            </a>
          )}
          {prospect.email && (
            <a href={`mailto:${prospect.email}`} className="rounded-full bg-brand-light px-3 py-1.5 font-semibold text-brand-dark">
              ✉️ {prospect.email}
            </a>
          )}
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              `${prospect.address} ${prospect.city ?? ""} ${prospect.state ?? ""}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-brand-light px-3 py-1.5 font-semibold text-brand-dark"
          >
            🧭 Directions
          </a>
        </div>

        <div className="mt-4">
          <StatusPicker prospectId={prospect.id} status={prospect.status as ProspectStatusKey} />
        </div>
      </div>

      {prospect.followUps.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted">Upcoming follow-ups</h2>
          {prospect.followUps.map((f) => (
            <FollowUpItem
              key={f.id}
              showProspect={false}
              item={{
                id: f.id,
                label: f.label,
                dueAt: f.dueAt,
                overdue: f.dueAt.getTime() < nowMs,
                method: f.method,
                prospect: {
                  id: prospect.id,
                  name: prospect.name,
                  address: prospect.address,
                  phone: prospect.phone,
                  email: prospect.email,
                },
              }}
            />
          ))}
        </div>
      )}

      <NoteComposer prospectId={prospect.id} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Notes</h2>
        {prospect.notes.length === 0 ? (
          <p className="text-sm text-muted">No notes yet — add one above.</p>
        ) : (
          prospect.notes.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
              <p className="mt-2 text-xs text-muted">
                {n.author.name} · {formatDateTime(n.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
