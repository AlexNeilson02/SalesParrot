import "server-only";

export type GeocodeResult = { latitude: number; longitude: number };
export type ReverseGeocodeResult = {
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
};

const BASE_URL = process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org";
// Nominatim's usage policy requires an identifying User-Agent.
const USER_AGENT =
  process.env.GEOCODER_USER_AGENT || "SalesParrot/0.1 (door-to-door sales app)";
const TIMEOUT_MS = 8000;

async function request<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Geocoding is a convenience, never a hard requirement: a prospect still
    // saves (and can be placed by dropping a pin) when the geocoder is
    // unreachable, rate-limited, or slow.
    return null;
  }
}

/** Turn a street address into coordinates. Returns null if it can't be resolved. */
export async function geocodeAddress(parts: {
  address: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): Promise<GeocodeResult | null> {
  const query = [parts.address, parts.city, parts.state, parts.zip]
    .filter(Boolean)
    .join(", ");
  if (!query.trim()) return null;

  const results = await request<Array<{ lat: string; lon: string }>>("/search", {
    q: query,
    format: "json",
    limit: "1",
  });

  const hit = results?.[0];
  if (!hit) return null;

  const latitude = Number.parseFloat(hit.lat);
  const longitude = Number.parseFloat(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

type NominatimReverse = {
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
};

/** Turn coordinates into a street address, for dropping a pin where you stand. */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const result = await request<NominatimReverse>("/reverse", {
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
  });

  const address = result?.address;
  if (!address) return null;

  const street = [address.house_number, address.road].filter(Boolean).join(" ");
  if (!street) return null;

  return {
    address: street,
    city: address.city || address.town || address.village || null,
    state: address.state || null,
    zip: address.postcode || null,
  };
}
