import { HeaderBar } from "@/components/HeaderBar";
import { getFlightsNavHref } from "@/lib/flights/links";
import { getStaysNavHref } from "@/lib/stays/links";

export function SiteHeader() {
  return (
    <HeaderBar flightsHref={getFlightsNavHref()} staysHref={getStaysNavHref()} />
  );
}
