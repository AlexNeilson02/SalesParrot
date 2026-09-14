"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";

export type PendingReminder = { label: string; dateIso: string };
export type NoteFormState = { error?: string } | undefined;

export async function addNoteAction(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const user = await requireCurrentUser();
  const prospectId = String(formData.get("prospectId") || "");
  const body = String(formData.get("body") || "").trim();
  const method = String(formData.get("method") || "IN_PERSON") as
    | "IN_PERSON"
    | "PHONE"
    | "EMAIL"
    | "TEXT";
  const remindersRaw = String(formData.get("reminders") || "[]");

  if (!body) return { error: "Note can't be empty." };

  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, ownerId: user.id },
  });
  if (!prospect) return { error: "Prospect not found." };

  let reminders: PendingReminder[] = [];
  try {
    reminders = JSON.parse(remindersRaw);
  } catch {
    reminders = [];
  }

  const note = await prisma.note.create({
    data: { prospectId, authorId: user.id, body },
  });

  if (reminders.length > 0) {
    await prisma.followUp.createMany({
      data: reminders.map((r) => ({
        prospectId,
        noteId: note.id,
        ownerId: user.id,
        dueAt: new Date(r.dateIso),
        label: r.label,
        method,
      })),
    });
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: prospect.status === "SOLD" ? "SOLD" : "FOLLOW_UP" },
    });
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
}

export async function completeFollowUpAction(followUpId: string) {
  const user = await requireCurrentUser();
  await prisma.followUp.updateMany({
    where: { id: followUpId, ownerId: user.id },
    data: { status: "DONE", completedAt: new Date() },
  });
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
}

export async function snoozeFollowUpAction(followUpId: string, days: number) {
  const user = await requireCurrentUser();
  const followUp = await prisma.followUp.findFirst({
    where: { id: followUpId, ownerId: user.id },
  });
  if (!followUp) return;
  const newDate = new Date(followUp.dueAt);
  newDate.setDate(newDate.getDate() + days);
  await prisma.followUp.update({
    where: { id: followUpId },
    data: { dueAt: newDate, status: "PENDING" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
}

export async function cancelFollowUpAction(followUpId: string) {
  const user = await requireCurrentUser();
  await prisma.followUp.updateMany({
    where: { id: followUpId, ownerId: user.id },
    data: { status: "CANCELED" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
}
