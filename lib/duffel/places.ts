import { duffelRequest } from "./client";

export type PlaceOption = {
  iata: string;
  label: string;
  subtitle?: string;
  type: "airport" | "city";
};

type DuffelAirportSnippet = {
  iata_code?: string;
  name?: string;
  iata_country_code?: string;
};

type DuffelPlaceSuggestion = {
  type?: "airport" | "city";
  name?: string;
  city_name?: string;
  iata_code?: string;
  iata_country_code?: string;
  airports?: DuffelAirportSnippet[];
  city?: { name?: string; airports?: DuffelAirportSnippet[] };
};

/** Turn Duffel place suggestions into selectable airport rows (cities expand to all airports). */
export function flattenPlaceSuggestions(places: DuffelPlaceSuggestion[]): PlaceOption[] {
  const seen = new Set<string>();
  const out: PlaceOption[] = [];

  const pushAirport = (ap: DuffelAirportSnippet, cityName: string) => {
    const iata = ap.iata_code?.trim().toUpperCase();
    if (!iata || !/^[A-Z]{3}$/.test(iata) || seen.has(iata)) return;
    seen.add(iata);
    const city = cityName.trim();
    const country = ap.iata_country_code?.trim();
    out.push({
      iata,
      label: city ? `${city} · ${iata}` : `${ap.name ?? iata} · ${iata}`,
      subtitle: [ap.name, country].filter(Boolean).join(" · ") || undefined,
      type: "airport",
    });
  };

  for (const place of places) {
    const cityName =
      place.city_name?.trim() ||
      place.city?.name?.trim() ||
      (place.type === "city" ? place.name?.trim() : "") ||
      "";

    if (place.type === "city") {
      const airports = place.airports ?? place.city?.airports ?? [];
      if (airports.length > 0) {
        for (const ap of airports) pushAirport(ap, cityName || place.name || "");
        continue;
      }
      const code = place.iata_code?.trim().toUpperCase();
      if (code && /^[A-Z]{3}$/.test(code) && !seen.has(code)) {
        seen.add(code);
        out.push({
          iata: code,
          label: place.name ?? code,
          subtitle: "City (all airports)",
          type: "city",
        });
      }
      continue;
    }

    if (place.airports?.length) {
      for (const ap of place.airports) pushAirport(ap, cityName);
      continue;
    }

    pushAirport(
      {
        iata_code: place.iata_code,
        name: place.name,
        iata_country_code: place.iata_country_code,
      },
      cityName,
    );
  }

  return out.slice(0, 15);
}

export async function searchPlaceSuggestions(query: string): Promise<PlaceOption[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const res = await duffelRequest<{ data?: DuffelPlaceSuggestion[] }>({
    path: "/places/suggestions",
    query: { query: q },
  });

  return flattenPlaceSuggestions(res.data ?? []);
}
