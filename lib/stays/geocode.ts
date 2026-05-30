import { STAY_SEARCH_LOCATIONS } from "@/lib/stays/locations";

export type GeocodedPlace = {
  label: string;
  latitude: number;
  longitude: number;
};

/** Resolve a user query to coordinates (preset cities first, then Nominatim). */
export async function geocodeStayQuery(query: string): Promise<GeocodedPlace | null> {
  const q = query.trim();
  if (!q) return null;

  const lower = q.toLowerCase();
  const preset = STAY_SEARCH_LOCATIONS.find(
    (p) =>
      p.label.toLowerCase() === lower ||
      p.aliases.some((a) => a.toLowerCase() === lower) ||
      p.label.toLowerCase().includes(lower) ||
      lower.includes(p.label.toLowerCase()),
  );
  if (preset) {
    return { label: preset.label, latitude: preset.latitude, longitude: preset.longitude };
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "SkylineVoyager/1.0 (stays-search; contact@skylinevoyager.com)",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit.lon) return null;
    const latitude = Number.parseFloat(hit.lat);
    const longitude = Number.parseFloat(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
      label: hit.display_name?.split(",").slice(0, 2).join(", ").trim() || q,
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}
