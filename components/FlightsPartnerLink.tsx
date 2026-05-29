import type { ReactNode } from "react";
import Link from "next/link";
import { PartnerOutboundLink } from "@/components/PartnerOutboundLink";
import { shouldUseDuffelFlightSearch, FLIGHTS_SEARCH_PATH } from "@/lib/flights/links";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Outbound Google Flights (or affiliate) unless Duffel search is configured. */
export function FlightsPartnerLink({ children, className }: Props) {
  if (shouldUseDuffelFlightSearch()) {
    return (
      <Link href={FLIGHTS_SEARCH_PATH} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <PartnerOutboundLink partner="flights" className={className}>
      {children}
    </PartnerOutboundLink>
  );
}
