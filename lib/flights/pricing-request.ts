import { getPublishedFlightMarkupPercent } from "@/lib/flights/published-markup-store";

/** Live service fee % — same for every guest and every checkout. */
export async function resolveLiveMarkupPercent(): Promise<number> {
  return getPublishedFlightMarkupPercent();
}
