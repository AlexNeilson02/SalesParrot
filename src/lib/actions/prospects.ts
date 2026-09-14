"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import type { ProspectStatusKey } from "@/lib/status";

export type ProspectFormState = { error?: string } | undefined;

export async function createProspectAction(
  _prevState: ProspectFormState,
  formData: FormData
): Promise<ProspectFormState> {
  const user = await requireCurrentUser();

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim() || null;
  const state = String(formData.get("state") || "").trim() || null;
  const zip = String(formData.get("zip") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const status = (String(formData.get("status") || "NEW") as ProspectStatusKey) || "NEW";

  if (!name || !address) {
    return { error: "Name and address are required." };
  }

  const prospect = await prisma.prospect.create({
    data: { ownerId: user.id, name, address, city, state, zip, phone, email, status },
  });

  revalidatePath("/prospects");
  redirect(`/prospects/${prospect.id}`);
}

export async function updateProspectStatusAction(prospectId: string, status: ProspectStatusKey) {
  const user = await requireCurrentUser();
  await prisma.prospect.updateMany({
    where: { id: prospectId, ownerId: user.id },
    data: { status },
  });
  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  revalidatePath("/dashboard");
}

export async function deleteProspectAction(prospectId: string) {
  const user = await requireCurrentUser();
  await prisma.prospect.deleteMany({ where: { id: prospectId, ownerId: user.id } });
  revalidatePath("/prospects");
  redirect("/prospects");
}
