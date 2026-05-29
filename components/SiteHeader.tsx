import { HeaderBar } from "@/components/HeaderBar";
import { getFlightsNavHref } from "@/lib/flights/links";

export function SiteHeader() {
  return <HeaderBar flightsHref={getFlightsNavHref()} />;
}
