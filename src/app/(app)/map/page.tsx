import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { MapView } from "@/components/map/MapView";
import type { MapPin } from "@/components/map/MapCanvas";
import type { ProspectStatusKey } from "@/lib/status";

// Centered on Springfield, OH (the seed data) until the browser reports a
// real position, which it does within a second or two of loading.
const FALLBACK_CENTER: [number, number] = [39.9242, -83.8088];

export default async function MapPage() {
  const user = await requireCurrentUser();

  const prospects = await prisma.prospect.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const placed = prospects.filter(
    (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
  );

  const pins: MapPin[] = placed.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    status: p.status as ProspectStatusKey,
    latitude: p.latitude as number,
    longitude: p.longitude as number,
  }));

  const phones = Object.fromEntries(placed.map((p) => [p.id, p.phone]));

  const center: [number, number] = pins[0]
    ? [pins[0].latitude, pins[0].longitude]
    : FALLBACK_CENTER;

  return (
    <div className="-mx-4 -mb-4 -mt-6 h-[calc(100svh-3.6rem)]">
      <MapView
        initialPins={pins}
        phones={phones}
        fallbackCenter={center}
        unplacedCount={prospects.length - placed.length}
      />
    </div>
  );
}
