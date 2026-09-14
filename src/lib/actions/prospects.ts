"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";
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

  const coords = await geocodeAddress({ address, city, state, zip });

  const prospect = await prisma.prospect.create({
    data: {
      ownerId: user.id,
      name,
      address,
      city,
      state,
      zip,
      phone,
      email,
      status,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      geocodedAt: coords ? new Date() : null,
    },
  });

  revalidatePath("/prospects");
  revalidatePath("/map");
  redirect(`/prospects/${prospect.id}`);
}

/**
 * Add a prospect at the rep's current GPS position — the primary canvassing
 * flow, where you're standing at the door and shouldn't have to type an
 * address. The address is filled in by reverse geocoding when available, but
 * the pin lands at the exact coordinates either way.
 */
export async function createProspectAtLocationAction(input: {
  name: string;
  latitude: number;
  longitude: number;
  status?: ProspectStatusKey;
}): Promise<{ id: string } | { error: string }> {
  const user = await requireCurrentUser();

  const name = input.name.trim();
  if (!name) return { error: "Give this door a name or label." };
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { error: "Couldn't read your location." };
  }

  const place = await reverseGeocode(input.latitude, input.longitude);

  const prospect = await prisma.prospect.create({
    data: {
      ownerId: user.id,
      name,
      address: place?.address ?? "Dropped pin",
      city: place?.city ?? null,
      state: place?.state ?? null,
      zip: place?.zip ?? null,
      status: input.status ?? "NEW",
      latitude: input.latitude,
      longitude: input.longitude,
      geocodedAt: new Date(),
    },
  });

  revalidatePath("/map");
  revalidatePath("/prospects");
  return { id: prospect.id };
}

/** Backfill coordinates for prospects saved while the geocoder was unreachable. */
export async function geocodeMissingProspectsAction(): Promise<{ located: number }> {
  const user = await requireCurrentUser();
  const pending = await prisma.prospect.findMany({
    where: { ownerId: user.id, latitude: null },
    take: 10,
  });

  let located = 0;
  for (const [index, prospect] of pending.entries()) {
    // Nominatim's usage policy caps this at one request per second; going
    // faster gets the deployment's IP blocked.
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1100));

    const coords = await geocodeAddress(prospect);
    if (!coords) continue;
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { ...coords, geocodedAt: new Date() },
    });
    located += 1;
  }

  revalidatePath("/map");
  return { located };
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
  revalidatePath("/map");
}

export async function deleteProspectAction(prospectId: string) {
  const user = await requireCurrentUser();
  await prisma.prospect.deleteMany({ where: { id: prospectId, ownerId: user.id } });
  revalidatePath("/prospects");
  redirect("/prospects");
}
